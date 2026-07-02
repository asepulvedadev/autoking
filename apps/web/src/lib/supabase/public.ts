import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase público (sin cookies) para lecturas de datos públicos
 * desde Server Components — ej: testimonios publicados en la landing.
 * No usa cookies() → no fuerza render dinámico, la página sigue cacheable.
 * RLS garantiza que solo devuelve lo público.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
