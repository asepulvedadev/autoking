# Adaptador de Kapso para Hermes Agent

WhatsApp Business API oficial de Meta, vía Kapso, como plataforma nativa de Hermes.

> **Estado: instalado y funcionando en el VPS. Camino de ENTRADA probado end-to-end.**
> Falta el camino de SALIDA (envío real contra Kapso con la API key de producción) y
> conectarlo a un agente. Ver "Qué falta" al final.

---

## Por qué es una subclase de 400 líneas y no un adaptador de 2.000

Kapso expone un **passthrough que espeja la Graph API de Meta v24.0**:

```
https://api.kapso.ai/meta/whatsapp/v24.0/{phone_number_id}/messages
```

Los cuerpos son idénticos a los de Meta. Entonces `gateway/platforms/whatsapp_cloud.py` — las
2.097 líneas de Nous que ya resuelven media, notas de voz en opus, botones, listas, respuestas
citadas y todo el gating del `WhatsAppBehaviorMixin` — sirve tal cual.

Solo cambian tres cosas, y son las tres que este archivo sobreescribe:

| | Meta directo | Kapso |
|---|---|---|
| URL base | `graph.facebook.com` | `api.kapso.ai/meta/whatsapp` |
| Auth | `Authorization: Bearer <token>` | `X-API-Key: <key>` |
| Webhook | `X-Hub-Signature-256`, `sha256=<hex>`, sobre `entry[].changes[]` | `X-Webhook-Signature`, hex plano, evento plano |

Reescribir el resto sería duplicar código que Nous mantiene, y quedarse afuera de cada arreglo
que ellos hagan.

## Dos decisiones de diseño que vale explicar

**El header de auth se inyecta con un `event_hook` de httpx, no parcheando los call sites.**
El padre escribe `"Authorization": f"Bearer {...}"` en **seis** lugares inline. Sobrescribir los
seis sería frágil: en cuanto Nous agregue un séptimo, ese request sale sin autenticar y falla en
producción sin aviso. El event hook corre sobre **cada** request del cliente, incluidos los que
todavía no existen.

**El gating se configura sembrando `extra`, no reasignando atributos privados.** El
`WhatsAppBehaviorMixin` lee `_allow_from` y `_dm_policy`, que el padre arma leyendo primero
`config.extra` y recién después las env `WHATSAPP_CLOUD_*`. Sembrando `extra` en el `__init__`
antes del `super()`, la política sale de las variables `KAPSO_*` sin tocar nada privado — que es
lo que se rompería en cuanto cambien cómo las calculan.

## Lo que agrega y Hermes no tiene: `send_template`

El docstring de `whatsapp_cloud.py` anuncia *"Phase 5 — 24-hour conversation window + template
fallback"*, pero **no existe un solo payload `"type": "template"` en todo `gateway/`**. Está
declarado, no implementado.

AutoKing lo necesita sí o sí: fuera de la ventana de 24 horas WhatsApp no acepta texto libre,
solo plantillas aprobadas. Los **recordatorios de cita** y los **seguimientos de venta** son
mensajes que inicia el negocio, casi siempre fuera de esa ventana.

```python
await adapter.send_template(
    chat_id="573001112233",
    template_name="recordatorio_cita",
    language_code="es",
    body_params=["María", "mañana a las 10:00"],   # {{1}}, {{2}} — POSICIONALES
)
```

⚠️ Cada envío de plantilla **abre una conversación paga con Meta**. No es una llamada gratis.

---

## Instalación

```bash
# 1 · Copiar el plugin donde Hermes lo busca
cp -r hermes/plugins/kapso ~/.hermes/plugins/kapso

# 2 · Configurar
cat >> ~/.hermes/.env <<'EOF'
KAPSO_ENABLED=true
KAPSO_API_KEY=<la key hex, SIN el prefijo kapso_>
KAPSO_PHONE_NUMBER_ID=744911478716558
KAPSO_WEBHOOK_SECRET=<el secret_key del webhook>
KAPSO_WEBHOOK_PORT=8091
KAPSO_WEBHOOK_PATH=/kapso/webhook
KAPSO_ALLOW_ALL_USERS=true
EOF

# 3 · Registrar el webhook en Kapso
curl -X POST https://api.kapso.ai/platform/v1/whatsapp/webhooks \
  -H "X-API-Key: $KAPSO_API_KEY" -H "Content-Type: application/json" \
  -d '{"whatsapp_webhook":{
        "url":"https://TU-DOMINIO/kapso/webhook",
        "phone_number_id":"744911478716558",
        "secret_key":"<el mismo de KAPSO_WEBHOOK_SECRET>",
        "events":["whatsapp.message.received"]}}'

# 4 · Arrancar
hermes gateway start
hermes gateway status      # debe listar "kapso"
```

**No pongas `KAPSO_WEBHOOK_HOST=0.0.0.0`.** Vacío bindea IPv4 **e** IPv6; `0.0.0.0` bindea solo
IPv4 y queda inalcanzable en redes IPv6-only. El adaptador omite la variable a propósito cuando
está vacía.

### Varios números (King y Mayand)

Un adaptador = un `phone_number_id`. Para dos agentes hay que correr **multi-gateway**: un
proceso por perfil, cada uno con su `.env` y su puerto de webhook. Y en todos menos uno:

```yaml
kanban:
  dispatch_in_gateway: false
```

Si no, cada gateway abre conexiones SQLite por tablero y se pelean por el WAL.

---

## El parseo del webhook: verificado, no supuesto

La primera versión de este adaptador asumía la forma del payload leyendo documentación. **Estaba
mal en cosas que importan.** La forma real se sacó del parser **oficial** de Kapso para OpenClaw
(`/root/.openclaw/extensions/kapso-whatsapp/dist/webhook.js`) — el mismo código que hoy atiende
a King y Mayand en producción.

Lo que la suposición no contemplaba:

| | asumido | real |
|---|---|---|
| **Lotes** | un evento por webhook | `data` puede ser un **array** de eventos — tratarlo como uno pierde mensajes en silencio |
| **Remitente** | solo `message.from` | `message.from` **o** `conversation.phone_number` |
| **Notas de voz** | media sin texto | Kapso **ya las transcribe**: `kapso.transcript`, o embebido tras `Transcript:` en `kapso.content` |
| **URL del adjunto** | `message.image.url` | `kapso.mediaUrl` → `kapso.mediaData.download_url` → `message[tipo].link` |
| **Texto** | 3 formas | **6**: texto, botón de plantilla, botón interactivo, lista, reacción, epígrafe, pedido de catálogo |
| **Validación** | cualquier dict | `id` + `type` + `timestamp`, los tres string, o es un acuse disfrazado |

Todo eso está cubierto por 21 pruebas que corren **sin Hermes instalado** (extraen la clase con
AST y ejecutan solo los métodos de parseo):

```bash
python3 test_parser.py     # 21 casos, sin dependencias
```

## Qué está probado (contra el Hermes instalado, no en un mock)

Hermes **v0.19.0** está instalado en el VPS (`/usr/local/lib/hermes-agent`), el plugin en
`~/.hermes/plugins/kapso/` y aparece como `enabled`, origen `user`.

| | |
|---|---|
| `hermes plugins list` lo descubre | ✅ `kapso-platform 0.1.0 · user` |
| `Platform("kapso")` | ✅ `<Platform.KAPSO: 'kapso'>` |
| El **registry** construye el adaptador | ✅ `KapsoAdapter`, `platform=kapso` |
| URL de envío | ✅ `api.kapso.ai/meta/whatsapp/v24.0/…/messages` |
| Markdown de WhatsApp (herencia del mixin) | ✅ `**hola**` → `*hola*` |
| Firma HMAC válida | ✅ HTTP 200 |
| Firma inválida | ✅ HTTP 401 |
| Reintento de Kapso con la misma clave | ✅ 200 `duplicado`, no reprocesa |
| Lote de 3 eventos | ✅ entrega 2, ignora el `.delivered` |
| Nota de voz | ✅ entrega **la transcripción**, no `[mensaje de audio]` |

El último es el que más valor da: con un payload real de audio, el agente recibe
`'cuanto sale el plan pro'` con su URL de media, en vez de un marcador inútil.

## Tres bugs que solo aparecieron al correrlo

Ninguno se veía leyendo el código. Valen como advertencia para el próximo plugin:

**1 · Faltaba `__init__.py`.** Sin él, el cargador descarta el directorio con
`No __init__.py in ...`. Lo insidioso: el plugin **igual aparece** en `hermes plugins list` y
se deja marcar como `enabled`, porque esa lista lee el `plugin.yaml`. Se ve instalado y activo
mientras nunca se carga.

**2 · `validate_config` devuelve BOOL, no el motivo del error.** El registry hace
`if not entry.validate_config(config): return None`. La primera versión devolvía `None` cuando
estaba todo bien (falsy → rechazaba configs buenas) y un string con el motivo cuando fallaba
(truthy → **aceptaba configs rotas**). Las dos al revés, y el único síntoma era un
`config validation failed` en el log.

**3 · `ctx` no es el `platform_registry`.** La guía dice "registers via `ctx.register_platform()`",
pero el registry expone `register(entry)`. `ctx` es el contexto del plugin, que lo envuelve.

## Qué falta

**1 · El camino de salida.** Todo lo probado es entrada. Falta enviar de verdad contra Kapso con
la API key de producción. Hoy el `.env` del VPS tiene una key **dummy** a propósito: el plugin
está instalado pero no puede mandar nada.

**2 · Conectarlo a un agente.** Falta el perfil, el modelo y el `SOUL.md` — o migrar los de King
con `hermes claw migrate`.

**3 · `send_template` contra una plantilla real.** Cada envío es una conversación **paga**.

**4 · Media sin URL.** Cuando Kapso manda solo un id de Meta sin URL descargable, hoy el adjunto
se pierde (queda el texto). Resolverlo requiere una llamada extra al passthrough.

**Nada de esto toca a King ni a Mayand: siguen en OpenClaw, verificado después de instalar.**
