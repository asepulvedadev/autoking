---
name: github-cli
description: >
  Operar GitHub desde la terminal con `gh`: repos, ramas, commits, pull requests,
  issues, releases y GitHub Actions. Usala SIEMPRE que el pedido tenga que ver con
  el repositorio, un PR, un issue, revisar un workflow que falló, o ver qué se
  commiteó. Dispara con "abrí un PR", "qué issues hay", "por qué falló el build",
  "revisá el último commit", "creá un issue", "mergeá".
license: private
metadata:
  author: autoking
  verified: "2026-08-03"
---

# GitHub por CLI

`gh` ya está instalado y **autenticado** en el VPS como `asepulvedadev`. No hace
falta login.

```bash
gh auth status          # confirmar antes de dudar de un permiso
```

## Qué podés y qué no

Los scopes del token son `repo`, `workflow`, `read:org` y `gist`.

| Podés | No podés |
|---|---|
| leer y escribir en repos, ramas, PRs, issues | borrar un repositorio |
| ver, relanzar y cancelar workflows de Actions | cambiar configuración de la organización |
| crear releases y gists | administrar miembros o equipos |

Si algo falla por permisos, **decilo en vez de intentar rodearlo**. El token se
amplía a mano y eso lo decide Álvaro.

## El repositorio

`asepulvedadev/autoking` — monorepo Turborepo + pnpm. Rama principal: `main`.
Se commitea **directo a main** (no hay flujo de PR obligatorio), con conventional
commits en español y **sin atribución de IA**.

El checkout que usás está en `/root/.hermes/home/autoking`.

## Lo que se usa todos los días

```bash
# Estado y contexto
gh repo view asepulvedadev/autoking
git -C /root/.hermes/home/autoking log --oneline -10
gh pr list                      # PRs abiertos
gh issue list --limit 20

# Pull requests
gh pr create --title "..." --body "..." --base main
gh pr view <n> --comments
gh pr diff <n>
gh pr checks <n>                # ¿pasó CI?

# Issues
gh issue create --title "..." --body "..."
gh issue comment <n> --body "..."
gh issue close <n>

# Actions — para cuando "falló el deploy"
gh run list --limit 10
gh run view <id> --log-failed   # solo lo que falló, no el log entero
gh run rerun <id>
```

## Antes de commitear o pushear

1. **Mirá qué hay sin commitear**: `git status --short`. El checkout del VPS ya
   tuvo 45 archivos sin commitear durante una semana sin que nadie lo notara.
2. **Verificá que compile**: `pnpm typecheck` desde la raíz del monorepo.
3. Commit por unidad de trabajo, no un cajón de sastre.
4. **Nunca `git push --force` sobre `main`.**

## Reglas duras

**No pegues secretos en Discord.** Si un log, un archivo de env o la salida de un
comando trae tokens, keys o JWTs, **no los reproduzcas**. Decí que los
encontraste y dónde. La conversación de Discord queda escrita para siempre.

**Nada destructivo sin confirmación explícita** en la misma conversación: borrar
ramas ajenas, cerrar PRs de otros, `git reset --hard`, force push.

**Un push a `main` puede disparar un deploy a producción en Vercel**, y la landing
la ven clientes reales. Si vas a pushear algo que toca `apps/web`, decilo antes.
