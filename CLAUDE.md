# AutoKing — contexto para Claude Code

> Convención: la documentación de este repo está en **español neutro**. Mantenela así.
> Verificado el 2026-08-03 contra el código y los endpoints públicos.

## Qué es

SaaS que vende **agentes de IA por WhatsApp** a negocios de LatAm (spas, barberías,
consultorios). Cada cliente tiene su agente atendiendo su WhatsApp Business: responde,
informa, agenda citas, captura leads y cierra ventas.

Multi-tenant real: AutoKing es el tenant #1, sin casos especiales.

## Monorepo

Turborepo + pnpm 9.15 (Node ≥20). **No usar npm ni yarn.**

```
apps/web/            → Next.js 15 · App Router · React 19 · Tailwind v4 · next-intl v4
  src/app/(site)/[locale]   landing pública
  src/app/(admin)/admin     backoffice del equipo interno
  src/app/(cliente)/panel   panel del cliente (dueño del negocio)
  src/app/onboarding/[token] ruta pública con service_role
packages/ui/         → design system (tokens como CSS variables)
packages/config/     → tsconfig compartida
packages/video/      → Remotion
hermes/              → perfiles, ops y parches del agente en el VPS
docs/                → estado, arquitectura, precios, playbooks de venta
```

**Principio rector: Screaming Architecture.** Dentro de `apps/web/src/features/` las
carpetas gritan el dominio (`hero`, `pricing`, `crm`, `roi-calculator`), no el framework.

```bash
pnpm install
pnpm --filter web dev      # solo la web, puerto 3000
pnpm build                 # Turborepo cachea
pnpm typecheck             # antes de dar por hecho cualquier cambio
```

Deploy: Vercel, proyecto `autoking`, **desde la raíz del monorepo** (no desde `apps/web`).
Variables: `vercel env pull apps/web/.env.local --environment=production`.
Ver [apps/web/ENVIRONMENT.md](apps/web/ENVIRONMENT.md).

## Infraestructura

| Pieza | Dónde |
|---|---|
| Landing + admin + panel | Vercel → `www.autoking.pro` |
| Base de datos | Supabase `lzecldpgdnwpcvdssqor` — Postgres 17 + pgvector |
| Canal WhatsApp | Kapso (plan Platform, multi-número) |
| Motor de agentes | **Hermes v0.19.0** en el VPS `2.24.115.58` (Hostinger, Ubuntu 24.04, 15 Gi RAM, sin swap), nginx en `ia.autoking.pro` |

### El VPS es compartido con J4

**Ojo: el mismo host aloja AutoKing y el backend de Grupo J4.** No son dos servidores.
Además de King/Mayand/Johan corren el contenedor `grupo-j4-backend` (Go, `:8080`) y tres
perfiles Hermes del asistente del ERP (`j4-dev` :8643, `j4-readonly` :8644, `j4-admin`
:8645). **Nunca reutilices un puerto sin revisar `/root/INFRA.md` primero** — esa es la
fuente de verdad de la infraestructura, auditada el 2026-08-03.

Para entrar: skill **`autoking-vps`**. Solo hay password auth para `root`; la llave
`grupoj4.pem` **no abre este VPS** y la EC2 de `j4/backend/SPEC.md` ya no sirve el backend.

### Estado real (verificado dentro del VPS el 2026-08-03)

| Ruta de `ia.autoking.pro` | Código | Qué significa |
|---|---|---|
| `/` | **502** | nada escucha en `:18789` — **preexistente**, residuo de OpenClaw. No lo persigas |
| `/kapso/webhook` | 405 | gateway de **King** vivo en `:8648` |
| `/kapso/webhook-mayand` | 405 | gateway de **Mayand** vivo en `:8649` |
| `/kapso/webhook-johan` | 405 | gateway de **Johan** vivo en `:8650` |
| `/control/health`, `/control/agents` | 401 | Control API viva en `127.0.0.1:8791`, exige `Bearer CONTROL_SECRET` |
| `/bridge/` | 401 | Agent Bridge (chat demo de la web) vivo, exige secreto |

UFW quedó activo el 2026-08-03: desde afuera solo 22, 80 y 443. Los gateways escuchan en
`0.0.0.0` por decisión de Hermes, pero el firewall los tapa.

**OpenClaw está apagado y deshabilitado desde el 2026-07-30.** No lo reactives salvo
rollback explícito (`/root/rollback-openclaw`). Todo lo que diga "OpenClaw" en
`docs/ESTADO-Y-ROADMAP.md` es histórico.

## Trampas que ya nos costaron caro

**Systemd de usuario, no del sistema.** Los gateways y `autoking-control` corren bajo
`systemctl --user` (la excepción es `autoking-bridge`, que sí es de sistema). Sin
`--user` el comando **devuelve éxito** y el proceso sigue atendiendo WhatsApp.
Verificá el **puerto**, nunca el estado del servicio.

**`hermes profile create` no aísla las credenciales de modelo.** El pool vive en
`~/.hermes/auth.json` a nivel de usuario y se comparte entre perfiles. Config, MCP y
engram sí quedan aislados solos; las credenciales no.

**Cada perfil de Hermes tiene su propio directorio de plugins.** Un plugin en
`~/.hermes/plugins/` es invisible para los perfiles; hay que **copiarlo** (no symlink) a
`~/.hermes/profiles/<perfil>/plugins/`.

**`terminal.cwd` es obligatorio en cada perfil.** Hermes carga el `AGENTS.md` del
directorio de trabajo. Sin `cwd` el gateway levanta al agente **sin su playbook** y
responde genérico, sin un solo error visible.

**El parche `is_reconnect` se pierde al actualizar el plugin de Kapso.** Está en
`hermes/contrib/kapso-is-reconnect/`. Sin él el gateway arranca `active` pero sin
plataformas, reintentando para siempre.

**El modelo chico NO es el económico.** `gpt-5.5` resuelve en 1 llamada lo que el mini
hace en 5. Con suscripción la cuota se gasta por llamada. Y recortar las skills del perfil
de 75 a 5 bajó de 20 s a 11 s.

**Nadie manda plantillas de WhatsApp.** Ni el plugin de Kapso ni el adaptador Cloud de
Hermes. Fuera de la ventana de 24 h los agentes **pueden responder pero no volver a
escribir**. Los recordatorios y seguimientos salen de crons que hablan con Kapso directo.

**No inventes precios.** Salen de `planes` / `plan_precios` / `plan_features` en Supabase
y del RAG. Si no está ahí, no existe.

## Seguridad — reglas no negociables

**RLS es la única frontera legal entre empresas.** Los roles reales son
`administrador | dev | vendedor | cliente` — **`admin` nunca existió** y políticas que lo
chequean evalúan FALSE siempre. Los helpers son `app.tenant_ids()`, `app.es_staff()`,
`app.manda_en(t)`, todos SECURITY DEFINER (obligatorio: si no, la policy de `memberships`
recursa infinitamente).

**`service_role` bypassea RLS.** Solo quedan 4 usos legítimos en la web: onboarding
(ruta pública), creativos (Storage), usuarios (`auth.admin`) y el factory. **No agregues
un quinto sin justificarlo.**

**Nunca prefijes con `NEXT_PUBLIC_` una key secreta.** La anon key viaja en el bundle del
browser; por eso una policy `TO public` filtra datos a internet (ya pasó con
`knowledge_base`).

**El INSERT público de leads exige `Prefer: return=minimal`.** Si alguien agrega
`.select()` a `features/lead-form/actions.ts`, PostgREST hace `INSERT ... RETURNING`, que
necesita una policy de SELECT que `anon` no tiene a propósito → **se rompe la captación de
leads de la landing**.

**`match_knowledge` lleva `filter_tenant` sin default.** Olvidarlo falla, no devuelve todo.

**RBAC del panel: `apps/web/src/lib/roles.ts` es la fuente única de verdad.**
`SECTION_ACCESS` ordena de prefijo más específico a más general y la usan el middleware
(imposición) y el nav (visibilidad). El **rol** habilita la ruta; la **membresía**
(`lib/agentes.ts`) decide a qué agente entrás — un vendedor atado a Mayand no abre King.

## Agentes en producción

| Agente | `phone_number_id` | Puerto | Rol |
|---|---|---|---|
| **King** | `744911478716558` | 8648 | ventas y demo de AutoKing |
| **Mayand** | `1227363337127290` | 8649 | agente de cliente |
| **Johan** | (ver perfil) | 8650 | agente de cliente (Prados/Johan) |

Un gateway por perfil — **no** un gateway con `profile_routes`: el plugin de Kapso
arma el `chat_id` con el número **del cliente**, así que no hay clave estable por número
de AutoKing. Cada perfil: `gpt-5.5` vía Codex OAuth, `max_turns: 25`, MCP `autoking-tools`
parametrizado por `AUTOKING_AGENT_ID`, y **el MCP de Supabase FUERA** (atienden a
desconocidos).

`core/tenant-guard.mjs` hace que **el MCP no arranque** si el `env` no coincide con
`agent.yaml`.

### El Imperio — 12 especialistas bajo demanda

Rey orquesta 12 perfiles de Hermes, uno por dominio, nombrados con emperadores:
`shaka` (desarrollo), `luis` (diseño), `alejandro` (marketing), `soliman`
(contenido), `felipe` (finanzas), `augusto` (operaciones), `justiniano` (legal),
`ramses` (infraestructura), `ciro` (datos y multi-tenant), `carlomagno`
(documentación y RAG), `ricardo` (QA y seguridad), `gengis` (prospección).

**No tienen gateway**: viven apagados, cero RAM en reposo. Rey los invoca con
`hermes --profile <nombre> -z "..."` (~5-10 s de arranque). Cada invocación es una
**sesión nueva** sin memoria de la anterior, así que el contexto va completo en el
prompt.

Se crean y actualizan con un único script idempotente:
[hermes/imperio/provisionar.sh](hermes/imperio/provisionar.sh) — reescribe `SOUL.md`
(personalidad) y `config.yaml` (tools acotadas por `platform_toolsets.cli`), y no
toca `sessions/` ni `memories/`. La skill de orquestación de Rey está en
[hermes/imperio/SKILL.md](hermes/imperio/SKILL.md).

**Trampa:** `hermes profile create` **no** copia la credencial del modelo — sin
`auth.json` propio el perfil muere con *"No inference provider configured"*. El
script la copia desde `king`. Los 12 comparten la misma suscripción y la cuota se
gasta **por llamada**.

Los que tocan código comparten el working tree `/root/.hermes/home/autoking`:
**convocarlos de a uno**, dos escribiendo a la vez se pisan.

## Documentos de referencia

| Archivo | Para qué |
|---|---|
| [docs/ARQUITECTURA-MULTITENANT.md](docs/ARQUITECTURA-MULTITENANT.md) | plan multi-tenant completo y sus fases |
| [docs/HERMES.md](docs/HERMES.md) | por qué Hermes, los dos adaptadores de WhatsApp, el plugin de Kapso |
| [docs/ESTADO-Y-ROADMAP.md](docs/ESTADO-Y-ROADMAP.md) | estado y roadmap — **desactualizado: describe OpenClaw** |
| [docs/PRECIOS-Y-COSTOS.md](docs/PRECIOS-Y-COSTOS.md) | precios por mercado |
| [docs/ARGUMENTARIO-VENTA.md](docs/ARGUMENTARIO-VENTA.md) · [docs/PLAYBOOK-LEAD-A-ENTREGA.md](docs/PLAYBOOK-LEAD-A-ENTREGA.md) | método de venta consultiva |
| [docs/MANUAL-OPERATIVO-AGENTE.md](docs/MANUAL-OPERATIVO-AGENTE.md) | operación diaria del agente |

## Pendientes abiertos

- **Envío de plantillas**: PR propuesto en `hermes/contrib/kapso-send-template/`, **con un
  bug** — manda parámetros posicionales y los templates de AutoKing usan nombrados
  (`{{nombre}}`).
- **Voseo** en dos plantillas ya aprobadas: `recordatorio_cita` y `demo_confirmada`.
- **Supabase**: falta el toggle `auth_leaked_password_protection` (a mano en el Dashboard) y
  decidir qué hacer con el RPC `search_youtube_learning` (SECURITY DEFINER ejecutable por
  `anon`, sin llamador en el repo — probable consumidor externo).
- **`agente_assets`** todavía tiene `assets_public_read TO public USING(true)`.
