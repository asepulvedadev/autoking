# Arquitectura Multi-Tenant — AutoKing

> Plan de migración de AutoKing a una plataforma multi-tenant real, donde cada
> empresa cliente es un tenant aislado con sus propios agentes, datos, roles y
> política de tratamiento de datos.

**Estado:** planificado · **Fase 0 ejecutada** (fuga de datos cerrada)
**Decisiones tomadas:** self-service completo · `tenants` + `tenant_id` · fuga tapada de inmediato

---

## Contexto — por qué hacemos esto

AutoKing pasa de "una agencia con un agente" a **plataforma multi-tenant**: cada
empresa cliente tendrá su propio agente en su propia cuenta de WhatsApp (Kapso),
con sus roles, sus clientes, sus leads y sus funciones según el plan contratado.

El requisito duro: **los datos de AutoKing (a los que accede King) no se pueden
mezclar con los de ningún otro cliente**, y cada agente necesita su propia política
de tratamiento de datos.

Como se optó por **self-service completo** (los dueños de cada empresa se loguean
al panel), el aislamiento deja de ser una buena práctica y pasa a ser **lo único
que separa legalmente a una empresa de otra**. Un `.eq()` olvidado = fuga entre
clientes. Por eso el plan se apoya en defensa en profundidad, no en disciplina.

---

## Estado actual — hallazgos verificados

Todo lo que sigue fue **comprobado**, no asumido.

### 🔴 RLS está roto, no débil

Todas las políticas chequean `profiles.role = 'admin'`, pero el CHECK real de la
tabla es `('administrador','dev','vendedor')`. **El valor `admin` nunca existió.**
Las políticas evalúan `FALSE` siempre.

Consecuencia: la app funciona **solo** porque usa `service_role`
([`lib/supabase/admin.ts`](../apps/web/src/lib/supabase/admin.ts)), que bypassea RLS.
Hoy RLS es decorativo.

### ✅ Fuga de `knowledge_base` — CERRADA (Fase 0)

La política `knowledge_public_read` daba `SELECT` al rol `public` (que incluye
`anon`) sobre todas las filas con `activo = true`. La anon key viaja en el bundle
del browser: **cualquiera podía descargar el conocimiento de los 3 clientes.**

Verificado con `curl` antes: `http=200`, 3 filas con contenido real.
Reemplazada por `knowledge_staff_read` / `knowledge_staff_write` con los roles
reales. Verificado después: **anon → 0 filas**, service role → intacto, RAG de King
funcionando.

### 🟠 Otros agujeros abiertos (pendientes)

| Dónde | Problema |
|---|---|
| `agente_assets` | `assets_public_read` → `TO public USING (true)`: tabla legible por internet. `assets_admin_write` → `TO authenticated USING (true)`: **cualquier usuario logueado puede borrar todos los assets** |
| `/onboarding/[token]` | Ruta **pública sin auth** que usa `service_role`; el token de la URL es la única autorización |
| Resto de tablas | Mismo mismatch `role='admin'` → deny-all efectivo; funcionan solo vía service role |

### 🟠 El aislamiento de la plataforma es por convención

`CRMPort` ([`adapters/crm.mjs`]) llama `requireTenant(ctx)` pero **ninguna query
filtra por tenant**: `leads?whatsapp=eq.X`, `clientes?whatsapp=eq.X` son globales.
`KnowledgePort` y `ChannelPort` sí filtran. Todos los adapters usan `service_role`.

### 🟠 El MCP es global

`mcp.servers.autoking-tools` no inyecta `env`, así que **todo agente resuelve a
`AGENT=king` / `TENANT=autoking`** y se evalúa contra las policies de King. El
propio código lo documenta como "bug real" en un comentario.

### ✅ Lo que SÍ está bien y reutilizamos

- **Policy Engine** (`core/policy-engine.mjs`): default-deny real, gana el más
  estricto entre `permissions.yaml` y `confirmation.yaml`, `scope=tenant` sin
  `ctx.tenantId` → denegado. **Es la pieza mejor construida del sistema.**
- **Kapso multi-cuenta nativo**: `channels["kapso-whatsapp"].accounts` con
  `apiKey`/`phoneNumberId`/`webhookSecret` por cuenta, y ruteo
  `phoneNumberId → accountId → bindings[].match.accountId → agentId`.
- **Factory de agentes** (`scripts/agent-create.mjs` + `lib-factory.mjs`): genera
  el AgentPackage desde template y parchea `tenantId`.
- **Catálogo de planes** en DB (`planes`, `plan_precios`, `plan_features`).

---

## Modelo de datos

### Principio rector: AutoKing es el tenant #1

**Sin casos especiales.** King es el agente del tenant `autoking`, igual que
cualquier otro. Un solo código, un solo camino. En el momento que AutoKing es "la
excepción", aparece el bug donde la excepción filtra.

### Tablas nuevas

```sql
tenants (
  id uuid pk, slug text unique,          -- 'autoking', 'spa-aurora'
  nombre text, plan_slug → planes(slug),
  estado text,                            -- activo|prueba|suspendido
  -- Responsable del tratamiento (Ley 1581)
  responsable_razon_social, responsable_nit,
  responsable_email_datos,                -- canal de habeas data
  politica_datos_url, politica_datos_version
)

agentes (
  id uuid pk, tenant_id → tenants,
  slug text, openclaw_agent_id text unique,
  kapso_account_id text unique,
  kapso_phone_number_id text unique,      -- discriminador del webhook
  estado text,                            -- borrador|activo|pausado
  unique (tenant_id, slug)
)

memberships (
  user_id → auth.users, tenant_id → tenants,
  rol text,                               -- propietario|admin|vendedor|soporte
  primary key (user_id, tenant_id)
)
```

> **Decisión de modelado — `tenant 1..N agentes`, no 1:1.**
> Pediste "cada agente es una empresa". Hoy es cierto, pero una empresa va a
> querer dos agentes (ventas + soporte, o dos sedes con números distintos).
> Modelarlo 1:N **no cuesta nada ahora** y evita una migración dolorosa después.
> La regla queda: un agente pertenece a exactamente un tenant.

### Tablas existentes → ganan `tenant_id not null`

`clientes`, `leads`, `knowledge_base`, `agente_assets`, `prospects`,
`prospect_outreach`, `equipo`, `testimonios`.

**Semántica uniforme de `clientes`**: "los clientes DE este tenant".
Para `autoking` son las empresas que compran; para `spa-aurora` son sus pacientes.
Misma tabla, mismo significado, cero casos especiales.
Se agrega `clientes.tenant_hijo_id` (nullable) para enlazar un cliente de AutoKing
con el tenant que se le provisiona.

**Globales (sin `tenant_id`)**: `planes`, `plan_precios`, `plan_features` (catálogo
compartido) y `profiles` (identidad; la pertenencia vive en `memberships`).

**Backfill**: todo lo existente → `tenant_id = <autoking>`. Nada se rompe porque
hay un solo tenant hasta la Fase 4.

---

## Las tres capas de aislamiento

> **El concepto que hay que entender:** el filtro en la aplicación es la cerradura
> de la puerta. RLS es la pared alrededor de la casa. Las cerraduras se olvidan;
> la pared te salva cuando te olvidaste. Con self-service, necesitás las dos.

### Capa 1 — RLS (la pared)

Helpers `SECURITY DEFINER` (para no recursar en la propia RLS de `memberships`):

```sql
create function app.tenant_ids() returns setof uuid
  language sql stable security definer set search_path = public
  as $$ select tenant_id from memberships where user_id = auth.uid() $$;

create function app.es_staff() returns boolean ...  -- break-glass de AutoKing
```

Política **idéntica** en cada tabla con tenant:

```sql
alter table leads enable row level security;
alter table leads force row level security;      -- ni el owner la esquiva

create policy tenant_rw on leads for all to authenticated
  using      (tenant_id in (select app.tenant_ids()) or app.es_staff())
  with check (tenant_id in (select app.tenant_ids()) or app.es_staff());
```

Y se **corrigen los `role='admin'`** de todas las políticas restantes, igual que
ya se hizo en `knowledge_base`.

### Capa 2 — Acceso de máquina sin `service_role` suelto

`service_role` bypassea RLS: con 50 tenants es inaceptable como default.

- **Web app**: el default pasa a ser el cliente de sesión (respeta RLS).
  `createAdminClient` queda solo para operaciones genuinamente administrativas
  (crear usuarios), siempre detrás de un guard.
- **`/onboarding/[token]`**: deja de usar service role crudo. Pasa a una función
  Postgres `security definer` que recibe el token, resuelve el tenant y **solo
  puede tocar las filas de ese tenant**.
- **Adapters de la plataforma**: se prohíbe importar el cliente crudo. Único
  acceso vía `supabaseForTenant(tenantId)`, que **inyecta `tenant_id=eq.<uuid>`
  en toda query** y se niega a construirse sin tenantId.
  *Objetivo final*: JWT de corta vida con claim `tenant_id`, para que **RLS
  aplique también al acceso de máquina**. Ahí las tres capas se cierran.
- **Test de CI**: falla si algún adapter importa el cliente sin scope.

### Capa 3 — Auditoría

El event bus (`core/events.yaml`) existe pero **no tiene listeners**: hoy no hay
rastro de nada. Se persiste en `auditoria(tenant_id, actor, actor_tipo, accion,
recurso, at, meta)`. Es seguridad **y** evidencia legal.

---

## Runtime — cómo un mensaje llega al tenant correcto

Cadena verificada:

```
Kapso phoneNumberId → accounts[].phoneNumberId → accountId
  → bindings[].match.accountId → agentId → agentes.tenant_id
```

Cambios necesarios:

1. **Un MCP server por agente**: `autoking-tools-<agentId>` con
   `env: { AUTOKING_AGENT_ID, AUTOKING_AGENT_DIR, AUTOKING_TENANT_ID }`.
2. **`tools.allow` por agente** restringido a su propio prefijo: el agente A no
   ve ni siquiera las tools del agente B.
3. **`openclaw.json` generado desde la DB**, nunca editado a mano
   (`scripts/sync-openclaw-config.mjs` renderiza desde `tenants` + `agentes`).
4. **Fail-closed en el arranque del MCP**: leer `agent.yaml.metadata.tenantId` y
   comparar contra `AUTOKING_TENANT_ID`. Si no coinciden → **no arranca**.
5. **Arreglar `CRMPort`**: toda query filtrada por `tenant_id`.

---

## Planes → capacidades

Hoy `permissions.yaml` se escribe a mano por agente. Pasa a **generarse desde la DB**:

```sql
plan_tools (plan_slug, tool, allow, confirmation, scope)   -- qué da cada plan
tenant_tool_overrides (tenant_id, tool, allow, confirmation) -- excepciones puntuales
```

La factory renderiza `policies/permissions.yaml` desde `plan_tools + overrides`.
**La DB es la fuente de verdad; el YAML es un artefacto de build.**

Efecto directo: cambiar de plan regenera permisos. Un downgrade **le saca las tools
al agente automáticamente**, sin tocar archivos.

| Plan | Tools |
|---|---|
| Básico "Recepción" | `knowledge.search`, `lead.create`, `contact.identify` |
| Pro "Agenda" | + `booking.checkAvailability`, `booking.create`, `customer.*` |
| Imperio "Ventas" | + multicanal (Instagram), `asset.*`, reportes, `humanHandoff.create` |

> Nota: `booking.cancel` está en el `permissions.yaml` del template pero **no existe
> en `catalog.yaml`** → hoy siempre se rechaza. Se agrega al catálogo.

---

## Protección de datos personales

Marco legal: **Ley 1581/2012 + Decreto 1377** (Colombia) y **LFPDPPP** (México).

### Los roles legales importan

- La **empresa cliente** es el **Responsable del tratamiento** (dueña de los datos
  de sus clientes).
- **AutoKing** es el **Encargado del tratamiento** (los procesa por cuenta del
  responsable).
- Eso exige un **contrato de encargo firmado por tenant**. No es opcional.

### Implementación

```sql
consentimientos (tenant_id, canal, identificador, politica_version,
                 otorgado_at, evidencia jsonb, revocado_at)

solicitudes_datos (tenant_id, identificador, tipo, recibida_at,
                   resuelta_at, resultado, sla_vence_at)
  -- tipo: consulta|actualizacion|rectificacion|supresion|revocacion

retencion_politica (tenant_id, entidad, meses)   -- + job de purga
```

**SLA Colombia**: consultas **10 días hábiles**, reclamos **15 días hábiles**.
Se codifica en `sla_vence_at` con alerta automática.

### Del lado del agente

`policies/privacy.yaml` por agente, **generado por tenant**:
- Registrar consentimiento en el primer contacto de WhatsApp.
- Nunca revelar datos asociados a otro identificador.
- Honrar `supresion` (job de purga que borra en DB **y** en el RAG).

### Pendiente legal (no es código)

Evaluar inscripción en el **RNBD** ante la SIC, para AutoKing y para cada
responsable según su nivel de activos.

---

## Fases de implementación

| # | Fase | Qué entrega | Riesgo |
|---|---|---|---|
| **0** | ✅ **Tapar la fuga** | `knowledge_base` cerrada a anon + escrituras del panel reparadas | — hecho |
| **1** | ✅ **Cimientos de datos** | `tenants`, `agentes`, `memberships` + `tenant_id` en 8 tablas + backfill `autoking` | — hecho |
| **2** | ✅ **RLS real** | Helpers `app.*`, política `tenant_rw` uniforme, `force row level security` en 11 tablas, corregidos todos los `role='admin'` | — hecho |
| **3** | ✅ **App scoped** | `tenant_id` en sesión, `app.tenant_actual()` como default fail-closed, `service_role` de 7 a 4 archivos, `agente_assets` cerrado | — hecho |
| **4** | 🟡 **Runtime** | `CRMPort`/`HandoffPort`/`KnowledgePort` filtrados de verdad, `filter_tenant` obligatorio en el RAG, MCP con `env` explícito, `tenant-guard` fail-closed | — hecho lo crítico; falta Kapso multi-cuenta y generar config desde DB (no hace falta hasta el 2º agente) |
| **5** | Planes → permisos | `plan_tools`, generación de `permissions.yaml` | Bajo |
| **6** | Datos personales | Consentimientos, auditoría, retención, políticas por tenant | Bajo |
| **7** | Factory end-to-end | Un botón: tenant → agente → cuenta Kapso → MCP → policies → link de onboarding. Panel del cliente | Medio |

**El orden no es negociable.** Las fases 1 y 2 son los cimientos: si se construye
la 4 antes que la 2, se está montando multi-tenancy sobre RLS roto — que es
exactamente el escenario donde una empresa ve los datos de otra.

---

## Verificación

Cada fase se valida contra un **tenant señuelo** (`tenant-canario`) que existe solo
para probar que **no ve nada**.

**Fase 2 — test de aislamiento (el que importa):**
```
1. Crear tenant-canario + un usuario miembro solo de ese tenant.
2. Con su sesión: leer clientes, leads, knowledge_base, equipo, agente_assets.
   → TODAS deben devolver 0 filas de otros tenants.
3. Intentar INSERT con tenant_id ajeno → debe ser rechazado por WITH CHECK.
4. Repetir con la anon key → 0 filas en todo.
```

**Fase 4 — test de aislamiento en runtime:**
```
1. Levantar el agente del canario con su propio MCP.
2. buscar_conocimiento → solo su RAG, cero filas de AutoKing.
3. identificar_contacto con un WhatsApp de AutoKing → "desconocido".
4. Arrancar su MCP con AUTOKING_TENANT_ID equivocado → debe NEGARSE a arrancar.
```

**Regresión de King en cada fase:** el RAG responde con precios reales, `escalar`
rutea por territorio, y el ciclo de WhatsApp entrega respuesta.

### Resultados — Fases 1 y 2 (ejecutadas)

| Test | Resultado |
|---|---|
| Intruso autenticado (sin membership) ve datos ajenos | **0 filas en las 8 tablas** ✅ |
| Admin de AutoKing ve lo suyo | 4 clientes · 23 leads · 48 chunks · 2 equipo · 3 prospects ✅ |
| Anon lee datos de negocio | **0 filas** en clientes/leads/knowledge/equipo/assets/prospects/tenants ✅ |
| Landing lee precios | 3 planes + precios visibles ✅ |
| Landing captura leads (anon INSERT) | http=201, `tenant_id` auto-asignado a AutoKing ✅ |
| Anon intenta inyectar en OTRO tenant | **RECHAZADO** ✅ |
| Middleware lee `profiles.role` | `administrador` ✅ |
| RAG de King (service role) | 2005 chars de conocimiento real ✅ |
| `identificar_contacto` | rol=equipo, cargo=fundador, sede=colombia ✅ |

> **⚠️ Gotcha documentado.** El INSERT público de leads funciona con
> `Prefer: return=minimal` (lo que hace supabase-js **si no encadenás `.select()`**).
> Si alguien agrega `.select()` a [`lead-form/actions.ts`](../apps/web/src/features/lead-form/actions.ts),
> PostgREST pasa a `INSERT ... RETURNING`, que exige política de SELECT — y anon no
> la tiene a propósito. **Rompería la captación de leads.** Se detectó en el test.

### Resultados — Fases 3 y 4 (ejecutadas)

| Test | Resultado |
|---|---|
| INSERT del panel sin `tenant_id` (clientes/equipo/prospects) | resuelto por `app.tenant_actual()` ✅ |
| RAG de King con `filter_tenant` obligatorio | 2005 chars de conocimiento real ✅ |
| `identificar_contacto` con `tenant_id=eq` | rol=equipo, cargo=fundador ✅ |
| `listar_recursos` (ChannelPort) | catálogo correcto ✅ |
| MCP con tenant **equivocado** (`spa-aurora`) | **NO ARRANCA** — "MISMATCH DE TENANT" ✅ |
| MCP con agente **equivocado** (`rey` + dir de king) | **NO ARRANCA** — bloqueado por id ✅ |
| King end-to-end tras reiniciar el gateway | responde los 3 planes ✅ |

> **⚠️ Colisión semántica resuelta.** `ctx.tenantId` significaba **dos cosas**:
> en `knowledge.mjs` y `channel.mjs` se usaba como `clientes.id`, y en el resto
> como identidad del tenant. Con una sola empresa nunca se notó. Ahora quedó
> separado: **`ctx.tenantId` = frontera dura** (`public.tenants`) y
> **`ctx.clienteId` = namespace opcional adentro** (`public.clientes.id`).

### Qué falta de la Fase 4

No hace falta hasta que exista un **segundo agente**, pero está diseñado:

1. **Kapso multi-cuenta**: `channels["kapso-whatsapp"].accounts.<slug>` con su
   `apiKey`/`phoneNumberId`/`webhookSecret`, + `bindings[].match.accountId`.
2. **`openclaw.json` generado desde la DB** (`scripts/sync-openclaw-config.mjs`),
   nunca editado a mano — un MCP por agente con su `env`.
3. **`tools.allow` por agente** para que el agente A ni vea las tools del B.

---

## Archivos críticos

**Web** — [`lib/supabase/admin.ts`](../apps/web/src/lib/supabase/admin.ts) ·
[`lib/roles.ts`](../apps/web/src/lib/roles.ts) ·
[`lib/session.ts`](../apps/web/src/lib/session.ts) ·
[`middleware.ts`](../apps/web/src/middleware.ts) ·
[`app/onboarding/actions.ts`](../apps/web/src/app/onboarding/actions.ts)

**Plataforma (VPS)** — `core/policy-engine.mjs` · `core/tool-router.mjs` ·
`adapters/crm.mjs` · `adapters/_supabase.mjs` · `tools/catalog.yaml` ·
`scripts/agent-create.mjs` · `/root/autoking-king-tools/mcp-server.mjs` ·
`/root/.openclaw/openclaw.json`
