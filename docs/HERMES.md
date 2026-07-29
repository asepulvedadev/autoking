# Hermes Agent — evaluación para reemplazar OpenClaw

> Investigado sobre el repo real ([NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent))
> en el commit `bcb352e` del 2026-07-29. Todo lo que dice este documento salió de leer el código;
> lo que no pude verificar está marcado como tal.

---

## Resumen para quien no va a leer todo

Hermes es **un motor de agentes muy superior a OpenClaw en casi todo** — y trae una herramienta
oficial de migración desde OpenClaw, `hermes claw migrate`.

Y tiene **DOS** adaptadores de WhatsApp independientes, no uno:

| adaptador | qué es | sirve para AutoKing |
|---|---|---|
| `plugins/platforms/whatsapp/` + `scripts/whatsapp-bridge/` | **Baileys**, no oficial, se empareja con QR | ❌ **no** — riesgo de baneo del número del cliente |
| **`gateway/platforms/whatsapp_cloud.py`** | **Cloud API oficial de Meta**, 2.097 líneas | ✅ **sí**, con dos huecos |

El propio archivo lo dice: *"This adapter is a complement to whatsapp.py (the Baileys bridge),
not a replacement."*

**Los dos huecos del adaptador oficial** — verificados leyendo el código, no suponiendo:

1. **No manda templates.** El docstring anuncia *"Phase 5 — 24-hour conversation window +
   template fallback"*, pero **no existe un solo payload `"type": "template"` en todo `gateway/`**.
   Está declarado, no implementado. AutoKing lo necesita: recordatorios de cita y seguimientos
   de venta salen **fuera** de la ventana de 24 h, y ahí solo entran templates aprobados.
2. **Un número por instancia.** `WHATSAPP_CLOUD_PHONE_NUMBER_ID` / `extra.phone_number_id` es
   uno solo. Para King + Mayand + clientes hay que correr **multi-gateway** (un proceso por
   perfil), que Hermes sí soporta.

**Traducción:** Hermes puede reemplazar el cerebro **y también el canal**, pero antes hay que
tapar esos dos huecos. Ver §12 para las dos rutas posibles.

---

## 1 · Qué es Hermes

Agente de IA self-hosted de [Nous Research](https://nousresearch.com), MIT, escrito en **Python**
(`>=3.11,<3.14`). OpenClaw es TypeScript/Node — **no es un cambio de librería, es otro stack**.

Lo que lo distingue de la mayoría es el **bucle de aprendizaje cerrado**: crea skills solas
después de tareas complejas, las mejora mientras las usa, se auto-recuerda de persistir
conocimiento, y busca en sus propias conversaciones pasadas.

| | |
|---|---|
| Lenguaje | Python 3.11–3.13 |
| Licencia | MIT |
| Plataformas de mensajería | 21 (ver §5) |
| Skills incluidas | **181** |
| Formato de skills | `SKILL.md` con frontmatter — estándar [agentskills.io](https://agentskills.io), **el mismo que usa OpenClaw** |
| Modelos | Nous Portal, OpenRouter, OpenAI, Anthropic, Bedrock, Vertex, Azure, Mistral, endpoint propio |
| Backends de ejecución | local, Docker, SSH, Singularity, Modal, Daytona |

---

## 2 · WhatsApp: hay DOS adaptadores

Es fácil mirar solo uno y sacar la conclusión equivocada. Están en lugares distintos del repo.

### 2.1 · Baileys — no usar

`plugins/platforms/whatsapp/adapter.py` habla con un proceso Node aparte,
`scripts/whatsapp-bridge/bridge.js`:

```js
// Standalone Node.js process that connects to WhatsApp via Baileys
import { makeWASocket, ... } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';   // se empareja escaneando un QR
```

Protocolo no oficial. Meta banea números. **No sirve para venderle a empresas.**

### 2.2 · Cloud API oficial — este sí

**`gateway/platforms/whatsapp_cloud.py`**, 2.097 líneas. Del propio docstring:

> *WhatsApp Cloud API adapter — official Meta WhatsApp Business Platform.*
> *This adapter is a complement to `whatsapp.py` (the Baileys bridge), not a replacement.*

```
WHATSAPP_CLOUD_PHONE_NUMBER_ID    # el path de la URL de Graph
WHATSAPP_CLOUD_ACCESS_TOKEN       # System User permanent token
WHATSAPP_CLOUD_APP_SECRET         # clave HMAC de X-Hub-Signature-256
WHATSAPP_CLOUD_VERIFY_TOKEN       # secreto compartido de hub.verify_token
WHATSAPP_CLOUD_WABA_ID
WHATSAPP_CLOUD_WEBHOOK_HOST/PORT/PATH   # default :8090 /whatsapp/webhook
WHATSAPP_CLOUD_API_VERSION              # default v20.0
```

**Qué ya está implementado:**

- Texto saliente por `graph.facebook.com/<version>/<phone_id>/messages`
- Webhook con handshake de verify-token, **HMAC X-Hub-Signature-256** sobre el body crudo en
  tiempo constante, y **protección de replay por `wamid`**
- Media completa: imagen, video, audio, documento; descarga entrante por el endpoint de media;
  notas de voz en opus con `ffmpeg` y fallback a MP3 si no está en el PATH
- Inyección de texto de documentos legibles
- **Mensajes interactivos**: botones de respuesta rápida (hasta 3) y listas (hasta 10 filas)
- Respuestas citadas (`context.message_id`)

Métodos disponibles: `send`, `send_image`, `send_image_file`, `send_video`, `send_voice`,
`send_document`, `send_typing`, `send_clarify`, `send_exec_approval`, `send_slash_confirm`,
`_post_interactive`.

### 2.3 · Los dos huecos

**Hueco 1 — no manda templates.** El docstring dice *"Phase 5 — 24-hour conversation window +
template fallback"*. Busqué `"type": "template"`, `template_name` y `"components"` en
`whatsapp_cloud.py` y después en **todo** `gateway/`: **cero resultados**. La fase está anunciada
en el comentario, no escrita en el código.

El código solo reconoce que la ventana existe, en un comentario sobre los interactivos:

> *Unlike utility templates these are FREE-FORM and need no Meta-side approval. They only work
> **inside** the 24-hour conversation window — which is fine because all five senders below fire
> in direct response to a user message.*

O sea: Hermes asume que **siempre** está adentro de la ventana, porque responde a mensajes.
AutoKing no: los **recordatorios de cita** y los **seguimientos de venta** son mensajes que
inicia el negocio, fuera de la ventana. Sin templates, esas dos features del plan Pro no andan.

**Hueco 2 — un número por instancia.** `self._phone_number_id` sale de una sola variable. Para
King + Mayand + clientes hay que correr **multi-gateway**: un proceso por perfil, cada uno con
su `phone_number_id`. Hermes lo soporta (§4), pero es más procesos que administrar que el
multi-cuenta nativo de Kapso.

---

## 3 · Migración desde OpenClaw: viene de fábrica

Hermes trae una skill **oficial** de migración: `optional-skills/migration/openclaw-migration/`.

```bash
hermes claw migrate --dry-run          # previsualizar sin tocar nada
hermes claw migrate                    # migración interactiva completa
hermes claw migrate --preset user-data # sin secretos
hermes claw migrate --overwrite        # pisar conflictos
```

Además, `hermes setup` **detecta `~/.openclaw` solo** y ofrece migrar antes de configurar.

Qué importa:

- `SOUL.md` → `SOUL.md` de Hermes
- `MEMORY.md` y `USER.md` → entradas de memoria de Hermes
- Skills del usuario → `~/.hermes/skills/openclaw-imports/`
- Patrones de aprobación de comandos → `command_allowlist`
- Config de mensajería, usuarios permitidos, working directory
- Secretos de una lista blanca (Telegram, OpenRouter, OpenAI, Anthropic, ElevenLabs)
- `AGENTS.md` del workspace (con `--workspace-target`)

**Lo que NO migra, y a AutoKing le importa:** el canal de Kapso, los bindings por `accountId`,
los adaptadores del VPS (`crm`, `knowledge`, `channel`, `calendar`) y el `tenant-guard`.
Todo eso es trabajo a mano.

---

## 4 · Multi-agente: mejor que OpenClaw

Esto sí es una mejora clara. **Profile-based routing** (`docs/profile-routing.md`):

> Un gateway sirve **múltiples perfiles aislados**, eligiendo cuál atiende un mensaje según
> de dónde vino: plataforma, servidor, canal y/o hilo. Cada perfil mantiene estado
> **completamente aislado**: `MEMORY.md`, `USER.md`, `SOUL.md`, sesiones **y tools**.

```yaml
profile_routes:
  - name: king
    platform: whatsapp
    chat_id: "<cuenta de King>"
    profile: king
  - name: mayand
    platform: whatsapp
    chat_id: "<cuenta de Mayand>"
    profile: mayand
```

**Por qué importa:** en OpenClaw los servidores MCP son **globales** (`mcp.servers` es top-level,
`AgentConfig` no tiene campo `mcp`), y el único aislamiento posible es `tools.deny` por agente.
Eso obligó a sacarle el MCP de Supabase a King y Mayand a mano. En Hermes las tools son
**por perfil**, así que la frontera es real y no un parche.

También soporta **multi-gateway**: un proceso por perfil. Con una regla: solo un gateway puede
tener `kanban.dispatch_in_gateway: true`; los demás en `false`, o multiplican descriptores de
archivo sobre `kanban.db` y se pelean por el WAL.

---

## 5 · Plataformas soportadas

`buzz`, `dingtalk`, `discord`, `email`, `feishu`, `google_chat`, `homeassistant`, `irc`, `line`,
`matrix`, `mattermost`, `ntfy`, `photon`, `raft`, `simplex`, `slack`, `sms`, `teams`, `telegram`,
`wecom`, `whatsapp` (Baileys).

---

## 6 · Instalación

```bash
# Linux / macOS / WSL2 / Termux
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
source ~/.bashrc
hermes
```

El instalador trae `uv`, Python 3.11, Node.js, ripgrep y ffmpeg. Deja un checkout git completo
en `$HERMES_HOME/hermes-agent` (por defecto `~/.hermes/hermes-agent`) — el mismo layout que usa
`hermes update`.

Los extras de `pyproject.toml` permiten instalar solo lo necesario: `messaging`, `cron`, `mcp`,
`voice`, `vision`, `slack`, `modal`, `daytona`, `bedrock`, `vertex`, `computer-use`, `all`…
En Termux se usa `.[termux]` porque `.[all]` arrastra dependencias de voz incompatibles con Android.

También hay `docker-compose.yml` con dos servicios: `gateway` y `dashboard`.

---

## 7 · Comandos que se usan todos los días

```bash
hermes                  # TUI (la terminal interactiva)
hermes setup            # asistente completo de configuración
hermes model            # elegir proveedor y modelo
hermes config set|get   # valores sueltos de configuración
hermes gateway setup    # configurar el gateway de mensajería
hermes gateway start    # arrancarlo
hermes doctor           # diagnóstico
hermes update           # actualizar
hermes claw migrate     # migrar desde OpenClaw
```

Slash-commands compartidos entre TUI y mensajería: `/new`, `/reset`, `/model`, `/personality`,
`/retry`, `/undo`, `/compress`, `/usage`, `/insights`, `/skills`, `/stop`, `/status`, `/sethome`,
`/platforms`.

---

## 8 · Toolsets

En vez de prender y apagar tools de a una, Hermes agrupa en toolsets: `minimal`, `safe`,
`default`, `balanced`, `terminal`, `terminal_only`, `browser`, `browser_only`, `web`, `research`,
`reasoning`, `creative`, `development`, `file`, `image_gen`, `vision`, `science`, `mixed_tasks`.

Los subagentes heredan los toolsets MCP del padre salvo que se ponga
`inherit_mcp_toolsets: false` (intersección estricta).

---

## 9 · Lo que Hermes tiene y OpenClaw no

- **Bucle de aprendizaje**: crea skills solo después de tareas complejas y las mejora usándolas.
- **Búsqueda FTS5 en sesiones pasadas** con resumen por LLM — recuerdo entre sesiones.
- **Modelado dialéctico del usuario** vía [Honcho](https://github.com/plastic-labs/honcho).
- **Subagentes aislados** para trabajo en paralelo.
- **Scripts Python que llaman tools por RPC**, colapsando pipelines de varios pasos en turnos
  de costo cero en contexto.
- **Seis backends de terminal**, con **Modal y Daytona serverless**: el entorno hiberna cuando
  está ocioso y despierta a demanda. Casi gratis entre sesiones.
- **Cron incorporado** con entrega a cualquier plataforma.
- **181 skills** de fábrica.
- Generación de trayectorias por lotes y compresión, para entrenar modelos de tool-calling.

---

## 10 · Riesgos, sin edulcorar

**El proyecto se mueve muy rápido.** El commit que revisé es del mismo día. En el repo hay
señales de trabajo en curso: `relatorio-issue-69678-sqlite-fd-leaks.md` (fugas de descriptores
de archivo en SQLite), `.lazy-refresh-incomplete`, un directorio `.plans/`. Eso es bueno para
un proyecto joven y malo para producción: hay que fijar una versión, no seguir `main`.

**Es otro lenguaje.** Los adaptadores del VPS (`adapters/{crm,knowledge,channel,calendar}.mjs`),
`core/tenant-guard.mjs` y los scripts de recordatorios y seguimientos están en Node. Se
reescriben en Python o se exponen por MCP/HTTP.

**El VPS no tiene swap** y 7,8 GB de RAM. Hermes es Python con muchas dependencias opcionales;
conviene instalar extras acotados y no `.[all]`.

**Migrar el motor y el canal a la vez es la peor idea posible.** Son dos cambios grandes con
modos de falla distintos: si algo se rompe, no se sabe cuál de los dos fue.

---

## 12 · Las dos rutas para el canal

Al descubrirse `whatsapp_cloud.py`, dejaron de ser "Kapso o nada".

### Ruta A — Adaptador de Kapso (`plugins/platforms/kapso/`)

Se escribe un adaptador nuevo que habla con la API de Kapso, igual que el que ya existe para
OpenClaw pero en Python.

**A favor:** Kapso ya tiene los números configurados y andando · su **onboarding multi-tenant**
(setup links) deja que un cliente conecte su WhatsApp sin que nadie toque su Business Manager —
eso es mucho trabajo si se hace contra Meta directo · templates, inbox, Flows y broadcasts ya
resueltos · **no se toca producción mientras se desarrolla**.

**En contra:** un intermediario más en el camino — y el diagnóstico de la lentitud de King
(>1 min de respuesta) apuntó justamente a **intermitencia de la API de Kapso** · Kapso cuesta
plata por encima de lo que ya cobra Meta · hay que escribir y mantener el adaptador entero.

### Ruta B — Extender `whatsapp_cloud.py` y hablar con Meta directo

Se le agrega envío de templates al adaptador oficial, que es el hueco que le falta, y se corre
un gateway por número.

**A favor:** un salto menos de red — ataca de raíz el problema de latencia · se ahorra lo que
cobra Kapso · el 90 % del adaptador **ya está escrito y lo mantiene Nous** · el trabajo propio
se reduce a los templates.

**En contra:** hay que gestionar el **embedded signup de Meta** para cada cliente nuevo, que es
precisamente el dolor que Kapso resuelve · se pierden inbox, Flows y broadcasts · migrar los
números existentes de Kapso a acceso directo no es gratis.

### Lo que hay que preguntarse para elegir

No es una decisión técnica, es de negocio: **¿cuántos clientes nuevos vas a onboardear por mes?**

- **Pocos y a mano** → Ruta B. El embedded signup se hace una vez por cliente y el ahorro de
  latencia y costo se cobra todos los días.
- **Muchos y en serie** → Ruta A. El setup link de Kapso es lo que hace escalable el alta, y
  eso vale más que el salto de red.

Una tercera vía razonable: **Ruta B para los agentes propios** (King y Mayand, donde la latencia
duele y el alta ya está hecha) y **Ruta A para los clientes** (donde el onboarding es el cuello
de botella).

---

## 11 · Recomendación

En orden, sin saltear pasos:

1. **Levantar Hermes en paralelo, sin tocar producción.** Otro directorio, otro puerto. King y
   Mayand siguen en OpenClaw atendiendo clientes.
2. **`hermes claw migrate --dry-run`** para ver qué se lleva solo y qué no.
3. **Probarlo por Telegram**, que Hermes soporta nativo y no arriesga ningún número de WhatsApp.
   Ahí se valida el motor: skills, memoria, MCP, perfiles, cron.
4. **Escribir el adaptador de plataforma para Kapso** (`plugins/platforms/kapso/`). Este es el
   trabajo de verdad, y es el que decide si la migración es viable.
5. **Migrar un solo agente**, el de menos volumen, y medir latencia y costo contra OpenClaw
   durante al menos una semana.
6. Recién ahí, el resto.

**Lo que NO hay que hacer:** apagar OpenClaw antes de tener el adaptador de Kapso andando y
probado. Sin eso, migrar significa mover a los clientes a WhatsApp no oficial — y eso no es una
decisión técnica, es una decisión de negocio con riesgo de baneo para el número de cada cliente.
