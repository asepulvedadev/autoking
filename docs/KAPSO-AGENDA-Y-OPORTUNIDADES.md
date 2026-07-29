# Kapso — Agenda, recordatorios y oportunidades sin explotar

> Análisis de la documentación de Kapso aplicada al negocio de AutoKing, y el
> cierre del hueco entre lo que vendemos y lo que podemos entregar.

**Estado:** agenda y recordatorios **construidos y probados** · template en revisión de Meta

---

## Contexto — por qué se hizo esto

Revisando la documentación de Kapso (integración OpenClaw y personal agents) apareció
un problema que no era técnico sino **de negocio**: el plan **Pro "Agenda"
($690.000 COP/mes, el que recomendamos por defecto)** promete *agendar citas y
recordatorios*, y **ninguna de las dos cosas existía**.

- `CalendarPort` devolvía `notImplemented` (placeholder honesto, pero vacío).
- No había ningún template de recordatorio aprobado en Meta.

Ese segundo punto es el grave, y conviene entenderlo bien:

> **WhatsApp solo permite mensajes libres dentro de las 24h desde el último mensaje
> del cliente. Un recordatorio para mañana SIEMPRE cae fuera de esa ventana. Sin un
> template aprobado por Meta, el recordatorio no es "peor" — es imposible.**

Si se cerraba un Pro, no se podía cumplir.

---

## Lo que se construyó

### 1. Agenda multi-tenant en Supabase

| Tabla | Para qué |
|---|---|
| `servicios` | Qué se agenda y cuánto dura (`duracion_min`) |
| `horarios_atencion` | Cuándo atiende el negocio, por día de semana |
| `citas` | Los turnos, con estado y origen |

Todas con `tenant_id`, RLS `tenant_rw` y `force row level security`, igual que el resto.

**`tenants.timezone`** (default `America/Bogota`): el horario se escribe en hora local
del negocio pero las citas se guardan en `timestamptz`. Sin la zona, el cálculo de
turnos da mal **y da mal en silencio**.

#### El anti-solapamiento vive en la base de datos

```sql
exclude using gist (
  tenant_id with =,
  (coalesce(recurso,'')) with =,
  tstzrange(inicio, fin) with &&
) where (estado in ('pendiente','confirmada'))
```

**Por qué en la DB y no en el código:** dos pedidos de turno simultáneos pueden pasar
los dos por una validación en la aplicación y escribir igual — condición de carrera
clásica. Postgres lo resuelve de verdad: el segundo INSERT **siempre** falla.
Nunca se sobrevende un turno.

El campo `recurso` (silla, sala, profesional) permite turnos paralelos legítimos:
dos personas a las 10:00 en sillas distintas **sí** se puede.

#### Disponibilidad calculada en la DB

`public.turnos_libres(tenant, servicio, fecha, recurso)` genera los turnos a partir
del horario, la duración del servicio y las citas existentes. Va en la DB porque
depende de datos que ya están ahí, y así el cálculo es atómico respecto de las citas.

### 2. `CalendarPort` real — `adapters/calendar.mjs`

Reemplaza a `calendarNotConfigured`. Implementa `booking.checkAvailability`,
`booking.create` y `booking.cancel`.

Detalles que importan:
- **Resuelve servicios por nombre**, no solo por UUID: el agente habla de "masaje",
  no de `a3f9-...`. Si no encuentra, devuelve "no ofrecemos eso" en vez de agendar
  cualquier cosa.
- **Etiquetas legibles** (`"3 de agosto a las 09:00 a. m."`) para que el modelo se las
  lea al cliente tal cual.
- **Atrapa la carrera**: si el turno se ocupó entre que se mostró y se confirmó,
  devuelve `ocupado` con "ofrecele otro" en vez de reventar.
- **Fail-closed** sin `tenantId`; rechaza horarios pasados.

> `booking.cancel` estaba declarado en `permissions.yaml` del template pero **no en
> `catalog.yaml`** — y el router rechaza en el paso 1 toda tool ausente del catálogo.
> O sea que cancelar una cita **fallaba siempre**, sin importar los permisos. Corregido.

### 3. Template `recordatorio_cita`

Creado en la WABA de AutoKing (`1298958754960816`), categoría `UTILITY`, idioma `es_CO`,
con botones de respuesta rápida **Confirmar / Reagendar / Cancelar**.

```
Hola {{nombre}} 👋 Te recordamos tu cita de {{servicio}} el {{fecha}}
a las {{hora}}. ¿Nos confirmás que venís?
```

**Estado: `submitted`** — Meta revisa normalmente en menos de un día.

> ⚠️ **Los templates son POR WABA.** El de AutoKing sirve para demos y para clientes
> que operen bajo nuestro número. Cuando un cliente conecte **su propia** cuenta
> (setup links), el provisioning debe crear y someter **su** template. Hay que
> incluirlo en la factory.

### 4. Job de recordatorios — `scripts/enviar-recordatorios.mjs`

- **Dry-run por defecto**; manda de verdad solo con `--enviar`.
- Lee de la vista `citas_para_recordar`, que resuelve todo de una: qué citas tocan,
  **por qué número sale cada una** (el `kapso_phone_number_id` del agente de ESE
  negocio, vía la tabla `agentes`) y los textos ya armados en español.
- **Marca `recordatorio_enviado_at` solo si el envío salió bien.** Al revés se
  perderían recordatorios en silencio.
- `tenants.recordatorio_horas_antes` (default 24) configura la anticipación por negocio.

---

## Verificación

Test end-to-end del `CalendarPort` (`9/9`, se limpia solo):

| Test | Resultado |
|---|---|
| Disponibilidad: 3 turnos de 60min entre 9 y 12 | ✅ |
| Resuelve el servicio por nombre aproximado | ✅ |
| Agenda y devuelve etiqueta legible | ✅ |
| **Doble reserva del mismo turno → `ocupado`** | ✅ |
| Tras agendar quedan 2 turnos | ✅ |
| Cancelar libera el turno (vuelve a 3) | ✅ |
| Sin `tenantId` → excepción (fail-closed) | ✅ |
| Horario pasado → rechazado | ✅ |
| Job detecta la cita y arma el texto en español | ✅ |

Regresión de King tras tocar `adapters/index.mjs`: RAG 3127 chars ✅ · CRM ✅

---

## Onboarding automático de clientes — plan Pro activado ✅

Con el plan Pro de Kapso activo, los endpoints están disponibles y **la cadena
completa quedó probada end-to-end**.

### La ruta real de la API

Los setup links **cuelgan de un customer** (no son un recurso de primer nivel):

```
POST /platform/v1/customers                       → crear customer
POST /platform/v1/customers/{id}/setup_links      → generar el link
GET  /platform/v1/whatsapp/phone_numbers?customer_id={id}  → ver si ya conectó
```

### La config correcta para Colombia (y por qué)

```json
{ "setup_link": {
    "meta_billing_mode": "partner_managed",
    "allowed_connection_types": ["coexistence"],
    "provision_phone_number": false,
    "language": "es",
    "success_redirect_url": "https://www.autoking.pro/onboarding/listo",
    "failure_redirect_url": "https://www.autoking.pro/onboarding/error" } }
```

- **`coexistence`** — el cliente conecta el número que YA usa y sigue con su app de
  WhatsApp Business. Es literalmente el argumento de venta: *"se conecta al WhatsApp
  que ya usás, no cambiás de número"*.
- **`provision_phone_number: false`** — no hay alternativa para Colombia. La API
  responde textual:
  > `Custom Twilio credentials are required to set non-US phone_number_country_isos`

  El pool instantáneo de Kapso es **solo EEUU**. Provisionar números CO exige traer
  credenciales propias de Twilio. Con coexistence **no hace falta Twilio**.
- **`partner_managed`** — AutoKing le paga a Meta las conversaciones y le cobra al
  cliente la mensualidad fija. Coherente con los límites por plan
  ("hasta 3.000 mensajes/mes"). El default de la API es `customer_managed`.
- **`language: "es"`** — sin esto el cliente ve la pantalla de conexión en inglés.

El link **expira a los 30 días** y **crear uno nuevo revoca el anterior** (uno activo
por cliente).

### 🐛 Bug que rompía todo el onboarding

`verificarConexionAction` consultaba el **customer** buscando `phone_number_id`.
Ese campo **no existe en el customer**: la relación vive del otro lado, en
`whatsapp/phone_numbers.customer_id`.

Resultado: el cliente conectaba su WhatsApp y **el panel nunca se enteraba**.
Corregido con `getKapsoConnectedNumber()`, que consulta el lado correcto y además
guarda el **WABA**, el número visible y si es coexistence.

### Provisioning: qué se guarda al conectar

| Campo en `clientes` | De dónde sale |
|---|---|
| `kapso_phone_number_id` | para enviar mensajes |
| `kapso_business_account_id` | **el WABA — necesario para su template** |
| `kapso_display_phone` | mostrarlo en el panel |
| `kapso_es_coexistence` | define el throughput (5 vs 1000 msg/s) |

Y apenas conecta se dispara `crearTemplateRecordatorio(waba)`: como Meta tarda ~1 día
en aprobar, conviene someterlo al conectar y no el día que el cliente quiera su primer
recordatorio.

### Verificación de la cadena

| Paso | Resultado |
|---|---|
| Crear customer con `external_customer_id` | ✅ |
| Setup link coexistence + es + partner_managed | ✅ `app.kapso.ai/whatsapp/setup/{token}?lang=es` |
| Números de un customer recién creado | ✅ 0 (correcto: falta que entre al link) |
| Números de un customer conectado | ✅ `phone_number_id` + `waba` + `CONNECTED` + `coexistence=true` |
| Borrar customer de prueba | ✅ 204 |

---

## Oportunidades que siguen sin implementar

### 🟠 King no entiende notas de voz

El plugin `kapso-whatsapp` **soporta** `transcription` (verificado en el código
compilado), pero no está configurado: `channels["kapso-whatsapp"]` solo tiene
`enabled, apiKey, phoneNumberId, webhookSecret, webhookPath, defaultTo, dmSecurity`.

En LatAm buena parte de WhatsApp son audios. Hoy un lead manda una nota de voz y
King no la entiende. Se resuelve con un proveedor de transcripción
(`gpt-4o-transcribe` o `whisper-1`). **No requiere plan pago.**

### 🟠 King solo manda texto

WhatsApp soporta **botones** (máx 3) y **listas** (hasta 10 filas). Un mensaje con
*"Agendar / Ver precios / Hablar con alguien"* sube conversión, baja tokens y
elimina malentendidos. El `id` del botón vuelve por webhook. **No requiere plan pago.**

### 🟢 WhatsApp Flows — el verdadero diferenciador del Pro

Formularios nativos multi-pantalla dentro del chat: el cliente agenda sin salir de
WhatsApp. Requiere **Meta Business Portfolio verificado**. Con la agenda ya construida,
el Flow es la capa de presentación encima.

### 🟢 Multi-cuenta confirmado (la doc pública no lo menciona)

El plugin tiene `accounts`, `defaultAccountId`, `resolveKapsoAccount`,
`listKapsoAccountIds` en su config compilada, aunque
[docs.kapso.ai/docs/whatsapp/openclaw](https://docs.kapso.ai/docs/whatsapp/openclaw)
no lo documenta. **Confirma que el diseño de la Fase 4 multi-tenant es viable.**

---

## Qué se puede hacer en plan free vs pago

| Mejora | ¿Plan pago? |
|---|---|
| Template `recordatorio_cita` | ❌ No — es de Meta |
| Agenda + `CalendarPort` | ❌ No |
| Transcripción de audios | ❌ No — config de OpenClaw + OpenAI |
| Botones y listas interactivas | ❌ No |
| WhatsApp Flows | ❌ No (sí Meta Portfolio verificado) |
| **Setup links / customers** | ✅ **Sí** |

---

## Próximos pasos

1. **Esperar la aprobación del template** (< 1 día típico) y correr
   `node scripts/enviar-recordatorios.mjs` en dry-run para confirmar.
2. **Agendar el cron** del job (cada 30 min) una vez aprobado.
3. **Cerrar el ciclo del botón**: cuando el cliente toca *Confirmar* / *Reagendar* /
   *Cancelar*, el webhook trae el payload → actualizar `citas.estado`.
4. **UI de agenda en el panel**: servicios, horarios y citas por cliente.
5. **Sumar el template a la factory**: cada cliente nuevo necesita el suyo en su WABA.

## Archivos

`adapters/calendar.mjs` · `scripts/enviar-recordatorios.mjs` · `tools/catalog.yaml`
(`booking.cancel`) · `adapters/index.mjs` (registro del port) · DB: `servicios`,
`horarios_atencion`, `citas`, `turnos_libres()`, `citas_para_recordar`
