import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para el navegador (Client Components).
 * Usa la publishable key (segura para el front). NUNCA la service_role.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
