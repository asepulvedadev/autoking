---
name: vercel-cli
description: >
  Operar Vercel desde la terminal: ver deploys, logs, dominios, variables de
  entorno, promover o revertir producción del sitio de AutoKing. Usala SIEMPRE que
  el pedido tenga que ver con el deploy, la web caída, un dominio, un rollback o
  las variables de entorno de la app. Dispara con "cómo va el deploy", "revertí",
  "está caída la web", "los logs de producción", "agregá una variable de entorno".
license: private
metadata:
  author: autoking
  verified: "2026-08-03"
---

# Vercel por CLI

CLI instalado en el VPS (`vercel --version` → 58.x).

## Autenticación

**Ya está autenticado** como `asepulvedadev` (device flow, 2026-08-03). La
credencial vive en `/root/.local/share/com.vercel.cli/auth.json`.

```bash
vercel whoami        # tiene que devolver: asepulvedadev
```

Si algún día devuelve *"No existing credentials found"*, la sesión se cayó. **No
corras `vercel login` a secas**: en el VPS no hay navegador y se queda esperando.
El flujo que sí funciona es el de dispositivo, y necesita que un humano abra la
URL:

```bash
script -qec "vercel login" /dev/null    # imprime https://vercel.com/oauth/device?user_code=XXXX-XXXX
```

Pasale esa URL a Álvaro y esperá. El código expira en ~15 minutos.

## ⚠️ Confirmá SIEMPRE el proyecto antes de operar

`.vercel/` está en el `.gitignore`, así que **un checkout limpio no tiene el link
del proyecto**. Sin él, `vercel ls` no falla: te devuelve deploys de **otro**
proyecto de la cuenta (ya pasó — devolvió los de `grupo-j4-frontend`). Operar
sobre el proyecto equivocado es el peor error posible acá.

El link ya está creado en `/root/.hermes/home/autoking/.vercel/project.json`. Si
falta, se recrea así:

```bash
cd /root/.hermes/home/autoking
mkdir -p .vercel && cat > .vercel/project.json <<'EOF'
{"projectId":"prj_l845yrJqDeS1hKc4EIhnYJ4TiHPD","orgId":"team_1XTXn6kpZkCb86QtlkN1EUCH","projectName":"autoking"}
EOF
```

**Antes de cualquier comando, verificá que la salida diga `autoking`.** Si dice
otro proyecto, pará.

## El proyecto

| Dato | Valor |
|---|---|
| Proyecto | `autoking` |
| Project ID | `prj_l845yrJqDeS1hKc4EIhnYJ4TiHPD` |
| Org (team) ID | `team_1XTXn6kpZkCb86QtlkN1EUCH` |
| Producción | `www.autoking.pro` |
| Repo | `asepulvedadev/autoking` (monorepo) |

**El deploy sale de la RAÍZ del monorepo, nunca desde `apps/web`.** Es un error
que ya se cometió y rompe el build.

## Diagnóstico (lo que más se va a pedir)

```bash
vercel ls                             # últimos deploys y su estado
vercel inspect <url-o-id>             # detalle de un deploy
vercel logs <url-del-deploy>          # logs de runtime
vercel inspect <id> --logs            # logs de build
vercel domains ls
vercel project ls
```

Si el pedido es *"está caída la web"*, empezá por afuera antes de culpar a Vercel:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://www.autoking.pro/
```

Un 200 significa que Vercel está bien y el problema es otro.

## Deploys

```bash
cd /root/.hermes/home/autoking        # la raíz del monorepo
vercel                                # PREVIEW — seguro, URL propia
vercel --prod                         # PRODUCCIÓN — lo ven clientes reales
```

**Preferí siempre el preview.** Un preview no afecta a nadie y sirve para
verificar antes de tocar producción.

## Rollback

Lo más rápido cuando producción quedó rota:

```bash
vercel ls                             # encontrá el último deploy que estaba bien
vercel promote <url-del-deploy-bueno> # lo pone en producción
```

`promote` sobre un deploy anterior es más seguro y más rápido que rebuildear.

## Variables de entorno

```bash
vercel env ls                         # SOLO los nombres, nunca los valores
vercel env add <NOMBRE> production
vercel env rm <NOMBRE> production
```

**Nunca corras `vercel env pull` ni imprimas el valor de una variable en Discord.**
La conversación queda escrita para siempre y ahí viven `SUPABASE_SERVICE_ROLE_KEY`,
`CONTROL_SECRET`, `KAPSO_API_KEY` y `BRIDGE_SECRET`. Listar nombres está bien;
mostrar valores no.

Y recordá la regla del proyecto: **nada secreto se prefija con `NEXT_PUBLIC_`**,
porque eso lo manda al bundle del browser.

## Reglas duras

1. **`vercel --prod` solo con confirmación explícita** de Álvaro o Johan en la
   misma conversación. Nunca por iniciativa propia.
2. **Nunca imprimas valores de variables de entorno.**
3. **No borres deploys ni dominios.** Un deploy viejo es el rollback de mañana.
4. Si algo falla por permisos del token, decilo. No busques la vuelta.
5. Después de tocar producción, **verificá**:
   `curl -s -o /dev/null -w "%{http_code}" https://www.autoking.pro/` → 200.
