# Variables de entorno — `apps/web`

Las provee la integración **Vercel → Supabase** (ya cargadas en el proyecto de Vercel,
entornos Production y Preview).

## Traer las variables a local

```bash
vercel env pull apps/web/.env.local --environment=production
```

Esto crea `apps/web/.env.local` (gitignoreado). Next.js lo lee automáticamente en `pnpm dev`.

## Variables disponibles

| Variable | Uso | ¿Llega al navegador? |
|----------|-----|----------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | ✅ sí |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Key pública para el cliente (preferida) | ✅ sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Key anon legacy (compatibilidad) | ✅ sí |
| `SUPABASE_SECRET_KEY` | Key secreta — **solo server** | ❌ NUNCA |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role — **solo server**, bypassa RLS | ❌ NUNCA |
| `SUPABASE_JWT_SECRET` | Verificación de JWT | ❌ NUNCA |
| `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING` | Conexión directa a Postgres (migraciones) | ❌ NUNCA |

⚠️ **Regla de oro:** cualquier cosa con `NEXT_PUBLIC_` se envía al navegador. Las keys
`SECRET`/`SERVICE_ROLE` jamás deben prefijarse así ni usarse en Client Components.

## Uso en código

```ts
// Client Component
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

// Server Component / Route Handler / Server Action
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();
```
