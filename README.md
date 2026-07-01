# 👑 AutoKing

> Automatiza. Inteligencia. Imperio.

Agentes de IA a medida que atienden, responden y agendan por tu negocio, 24/7.

## Arquitectura

Monorepo [Turborepo](https://turbo.build) + [pnpm](https://pnpm.io), desplegado en [Vercel](https://vercel.com).

```
autoking/
├── apps/
│   └── web/            → Landing + marketing + blog/SEO   (autoking.com)
│       (próximo)
│   ├── dashboard/      → App de clientes autenticada       (app.autoking.com)
│   └── admin/          → Backoffice interno                (admin.autoking.com)
├── packages/
│   ├── ui/             → Design system AutoKing (tokens + componentes)
│   └── config/         → TS config compartida
│       (próximo)
│   ├── auth/           → Sesión y permisos compartidos
│   └── api-client/     → Cliente tipado hacia el backend de IA
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Principio rector:** *Screaming Architecture* — dentro de cada app las carpetas
gritan el dominio (`features/hero`, `features/pricing`…), no el framework.

## Comandos

```bash
pnpm install        # instala todo el workspace
pnpm dev            # levanta todas las apps en modo dev
pnpm --filter web dev   # solo la web
pnpm build          # build de producción (Turborepo cachea)
pnpm typecheck      # chequeo de tipos en todo el monorepo
```

## Stack

- **Next.js 15** (App Router, React Server Components)
- **React 19**
- **Tailwind CSS v4** (tokens como CSS variables en `@autoking/ui`)
- **TypeScript** estricto

## Fases

- **Fase 0 (actual):** monorepo + landing (`apps/web`) + design system (`packages/ui`).
- **Fase 1:** dashboard de clientes + auth + api-client (cuando se defina el backend de IA).
- **Fase 2:** panel admin + blog/SEO programático.
