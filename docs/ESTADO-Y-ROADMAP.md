# AutoKing — Estado del sistema y roadmap

> Documento de contexto para planificación. Última actualización: 2026-07-22.
> **No contiene secretos.** Las credenciales viven en variables de entorno (Vercel / VPS) y se referencian por nombre.

---

## 1. Qué es AutoKing

SaaS que vende **agentes de IA por WhatsApp** a negocios de LatAm (spas, barberías, consultorios, etc.).
El producto: cada cliente tiene su propio agente que atiende su WhatsApp Business — responde, informa, toma citas, captura leads y cierra ventas.

**Modelo de negocio comercial**: paquetes con costo de instalación + mensualidad, en 3 mercados (Colombia / México / USA) y 3 monedas (COP / MXN / USD). La landing detecta el país por IP y muestra precios locales.

---

## 2. Arquitectura general

```
┌─────────────────────────────────────────────────────────────────┐
│  Cliente final (WhatsApp)                                        │
│        │                                                         │
│        ▼                                                         │
│  Kapso (WhatsApp Business API, multi-número)                     │
│        │  plugin @kapso/openclaw-whatsapp                        │
│        ▼                                                         │
│  VPS (Hostinger) ── OpenClaw Gateway 2026.7.1-2                  │
│     ├─ Agente "king" (demo/ventas) ── MCP narrow tools          │
│     ├─ Control API  :8791  (/control/)  ← salud + on/off        │
│     ├─ Agent Bridge :8790  (/bridge/)   ← chat demo web         │
│     └─ nginx (ia.autoking.pro, TLS)                             │
│        │                                                         │
│        ▼                                                         │
│  Supabase (Postgres + pgvector RAG + Auth)                      │
│        ▲                                                         │
│        │                                                         │
│  Next.js 15 (App Router) en Vercel ── www.autoking.pro          │
│     ├─ (site)  landing pública                                  │
│     └─ (admin) panel de gestión                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes

| Componente | Dónde | Detalle |
|---|---|---|
| **Landing + Admin** | Vercel, proyecto `autoking` (cuenta `asepulvedadev`) | Next.js 15, App Router, Server Actions, next-intl v4. Deploy desde la **raíz del monorepo** (no desde `apps/web`). |
| **VPS** | Hostinger | OpenClaw Gateway, Control API, Agent Bridge, nginx. Dominio `ia.autoking.pro` con TLS. |
| **WhatsApp** | Kapso Platform ($299/mo) | 50 números, 1M mensajes, 50h transcripción. Auto-transcribe notas de voz. |
| **Base de datos** | Supabase (proyecto `autoking`, ref `lzecldpgdnwpcvdssqor`) | Postgres 17 + pgvector para RAG. |

---

## 3. King — el agente de ventas

**Rol**: es el **demo y el closer**. Habla con los prospectos, conoce toda la empresa (qué hacemos, precios, proceso), intenta **cerrar la venta**, y solo escala a una persona del equipo cuando es necesario. Guarda leads, prospectos y clientes.

### Persona (VPS: `/root/.openclaw/agents-ws/king/`)
- `IDENTITY.md`, `SOUL.md`, `AGENTS.md` — persona humana de vendedor con MÉTODO DE VENTA + técnicas de persuasión, manejo de identidad/roles y precios (COP primario).

### RAG (Supabase)
- Tabla `knowledge_base` (embeddings `gte-small`, 384 dim) + edge function `embed` + RPC `match_knowledge`.
- Poblada con 21 chunks (script `populate-kb.mjs` en el VPS), sincronizada con los precios actuales.

### Tools narrow (VPS: `/root/autoking-king-tools/mcp-server.mjs`)
7 herramientas seguras vía MCP stdio:
`buscar_conocimiento`, `guardar_lead`, `marcar_cliente`, `enviar_imagen`, `escalar`, `identificar_contacto`, `crear_cliente`.

### ⚠️ Seguridad — regla crítica de OpenClaw
> **Los MCP servers NO están gateados por `tools.profile`.** Agregar un MCP lo expone a **TODOS** los agentes, incluido el King sandboxeado (`tools.profile="minimal"`).
> **Solo se agregan tools narrow y seguras.** Verificado: King rechaza inyección de comandos pero sí usa sus tools legítimas.

---

## 4. Kapso — integración WhatsApp

**Skill**: `~/.claude/skills/` (investigada a fondo desde `docs.kapso.ai`).

### Bases de API
| Base | Uso |
|---|---|
| `api.kapso.ai/meta/whatsapp/v24.0/{phoneNumberId}/messages` | Enviar mensajes |
| `api.kapso.ai/platform/v1` | Gestión / multi-tenant (customers, setup-links) |
| `app.kapso.ai/api/v1` | Conversaciones (alias de lectura) |

**Auth**: header `X-API-Key` (hex, sin prefijo).
**Plugin**: `@kapso/openclaw-whatsapp` puentea WhatsApp ↔ OpenClaw.

### Onboarding self-service (embedded signup de Meta) — VERIFICADO contra docs
Flujo para conectar el WhatsApp propio de cada cliente sin pedirle contraseñas:

```
1. POST /platform/v1/customers
   body: {customer:{name, external_customer_id}}  →  data.id

2. POST /platform/v1/customers/{id}/setup_links
   body: {setup_link:{meta_billing_mode:"partner_managed"}}  →  data.url, data.expires_at

3. (cliente completa el embedded signup en el link)

4. GET /platform/v1/customers/{id}  →  phone_number_id  (cuando terminó)
```

### ⚠️ Riesgo abierto — scope de la API key
Kapso **puede** distinguir entre:
- **Project API key** — mensajería / conversaciones (la actual `KAPSO_API_KEY`, confirmada funcionando en lectura).
- **Platform API key** — multi-tenant `/customers` (podría ser una key distinta).

**Pendiente de verificar en vivo**: si "Generar link de conexión" da 401, hay que crear una **Platform API key** en el panel de Kapso y reemplazar `KAPSO_API_KEY`.
_(No se pudo smoke-testear local porque `vercel env pull` redacta valores sensibles a string vacío.)_

---

## 5. Panel de administración (`/admin`)

| Sección | Estado | Qué hace |
|---|---|---|
| **Dashboard** | ✅ | Resumen general. |
| **Clientes** | ✅ + onboarding nuevo | Alta/edición de clientes. **Nuevo**: sección "WhatsApp del cliente" con setup-link self-service (ver §7). |
| **Agentes** | ✅ | Editor de personas de agente (chat demo). |
| **Leads** | ✅ | Leads capturados (landing + King). |
| **Conversaciones** | ✅ | Visor de conversaciones de WhatsApp de King, con badges de rol (equipo/cliente/lead/nuevo). Otros admins pueden ver lo que habla el agente. |
| **Prospección** | ✅ | Google Maps (Outscraper) → leads → propuesta. |
| **Infraestructura** | ✅ NUEVO | Salud del VPS + control on/off de agentes (ver §7). |
| **Testimonios / Perfil** | ✅ | Gestión de contenido y cuenta. |

---

## 6. Base de datos (Supabase)

| Tabla | Uso |
|---|---|
| `clientes` | Clientes. **Nuevas columnas**: `wa_status`, `kapso_customer_id`, `kapso_phone_number_id`, `kapso_setup_url`, `kapso_setup_expires_at`, `agent_id`. |
| `leads` | Leads (landing + agente). |
| `prospects` + `prospect_outreach` | Prospección Google Maps. |
| `equipo` | Roles del equipo (whatsapp/nombre/rol). Alvaro = fundador. |
| `knowledge_base` | RAG (pgvector). |
| `planes` + `plan_precios` + `plan_features` | Precios multi-mercado (CO/MX/US, 3 monedas). |
| `testimonios` | Testimonios de la landing. |
| `profiles` | Perfiles de admins (auth). |

**Precios**: aplicado +40% en instalación y +10% en mensualidad en todos los países (sincronizado en DB + persona de King + RAG).

---

## 7. Lo construido en la última sesión

### #1 — Panel de Infraestructura (`/admin/infraestructura`) ✅ EN VIVO
- **Control API** en el VPS: `/root/autoking-control/control.mjs`, systemd `autoking-control` en `127.0.0.1:8791`, expuesta por nginx en `ia.autoking.pro/control/` (Bearer `CONTROL_SECRET`).
  - `GET /health` → CPU/RAM/disco/uptime/gateway (de `/proc`).
  - `GET /agents` → agentes de `openclaw.json` (excluye internos `main`/`autoking-demo`).
  - `POST /agents/:id/toggle` → habilita/deshabilita el **canal** del agente.
- **App**: `apps/web/src/lib/control.ts`, `infraestructura/page.tsx`, `actions.ts`, `agente-toggle.tsx`.
- **Clave de diseño**: apagar el agente corta la IA, **el WhatsApp del cliente sigue recibiendo mensajes normal** (se deshabilita el canal, no el número).
- Env en Vercel: `CONTROL_URL`, `CONTROL_SECRET`.

### #2 — Onboarding self-service de WhatsApp ✅ EN VIVO (pendiente verificar key)
- `apps/web/src/lib/kapso.ts` → `createKapsoCustomer`, `createKapsoSetupLink`, `getKapsoCustomer`.
- `clientes/actions.ts` → `generarSetupLinkAction`, `verificarConexionAction`.
- `clientes/[id]/whatsapp-section.tsx` → UI: generar/copiar/regenerar link + verificar conexión.
- Migración `clientes_kapso_onboarding` aplicada.

---

## 8. ⚠️ GAP arquitectónico conocido (lo más importante para lo que sigue)

Hoy existen **dos conceptos de "agente" desconectados**:

| Concepto | Dónde vive | ¿Responde WhatsApp? | ¿Aparece en Infra? |
|---|---|---|---|
| **Agente real OpenClaw** | `openclaw.json` → `agents.list` | ✅ Sí (vía Kapso) | ✅ Sí |
| **Persona de tenant** | `/root/autoking-tenants/client-<slug>/` | ❌ No (solo chat demo web, `openclaw infer`) | ❌ No |

**El botón "Crear agente para este cliente" que ya existe crea una PERSONA de demo web, NO un agente que conteste WhatsApp.**

### Lo que falta: "activar el agente real del cliente"
El paso que conecta todo: cuando el cliente termina el embedded signup y tenemos su `phone_number_id`, hay que:
1. Registrar un **agente real** en `openclaw.json` → `agents.list` (clonado de king, sandbox/minimal, apuntando a la persona/RAG del cliente).
2. Crear su **canal Kapso** + un **binding** en `openclaw.json`.
3. Rutear por `phone_number_id` — **depende de cómo el plugin `@kapso/openclaw-whatsapp` maneja múltiples números** (a verificar en el VPS).

Recién con esto el agente del cliente aparece en Infraestructura y contesta su WhatsApp.

---

## 9. Roadmap — qué sigue (en orden sugerido)

### Inmediato
1. **Verificar la Platform API key de Kapso** — probar "Generar link" en un cliente real. Si 401 → generar Platform key.
2. **Cerrar el gap: activación del agente real por cliente**
   - Investigar en el VPS cómo el plugin Kapso rutea varios `phone_number_id`.
   - Extender la Control API con `POST /provision` que registre agente real + canal + binding.
   - Botón "Activar agente" en la ficha del cliente (cuando `wa_status = conectado`).

### Mediano plazo
3. **Persona por cliente conectada al agente real** — que la persona editable (`/admin/agentes`) alimente al agente real de WhatsApp, no solo al demo web.
4. **RAG por cliente** — cada negocio con su propia `knowledge_base` (aislar por `agent_id` / tenant).
5. **Monitoreo por sección de VPS** — CPU/RAM por cliente/contenedor desde el panel.

### Escala
6. **Migrar King a OpenAI API** — salir del techo de la suscripción ChatGPT para escalar (30-50 clientes por hora de modelo).
7. **Container por cliente (infra híbrida)** — aislar clientes premium en su propio contenedor; monitorear/apagar cada uno desde el admin.

---

## 10. Accesos (referencias, sin secretos)

| Recurso | Cómo se accede |
|---|---|
| **Vercel** | Cuenta `asepulvedadev`, proyecto `autoking`. Deploy: `vercel --prod --yes` desde la raíz. |
| **VPS** | SSH (credenciales fuera de este doc). Servicios: `autoking-control`, `openclaw-gateway`. |
| **Supabase** | Proyecto `autoking` (`lzecldpgdnwpcvdssqor`). |
| **Kapso** | Panel Kapso (plan Platform $299/mo). |
| **Env vars (Vercel prod)** | `CONTROL_URL`, `CONTROL_SECRET`, `KAPSO_API_KEY`, `AGENT_BRIDGE_URL`, `AGENT_BRIDGE_SECRET`. |
| **Env vars (VPS)** | `CONTROL_SECRET` (systemd `autoking-control`), `BRIDGE_SECRET` (agent-bridge). |

---

## 11. URLs

| Qué | URL |
|---|---|
| Landing | https://www.autoking.pro |
| Admin | https://www.autoking.pro/admin |
| Infraestructura | https://www.autoking.pro/admin/infraestructura |
| Clientes | https://www.autoking.pro/admin/clientes |
| Gateway / Control (VPS) | https://ia.autoking.pro |
| Docs Kapso | https://docs.kapso.ai |
