import "server-only";

import { createClient } from "@/lib/supabase/server";

export type TenantResumen = {
  id: string;
  slug: string;
  nombre: string;
};

export type SessionProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  /** Tenant activo. Null si el usuario pertenece a varios y todavía no eligió uno. */
  tenantId: string | null;
  tenantSlug: string | null;
  /** Todos los tenants donde el usuario es miembro (para el selector). */
  tenants: TenantResumen[];
  /** Staff de AutoKing con acceso transversal (break-glass). Se audita. */
  esStaffPlataforma: boolean;
};

/**
 * Devuelve el usuario autenticado, su rol y su contexto de tenant.
 *
 * El tenant activo espeja la lógica de `app.tenant_actual()` en Postgres: si hay
 * exactamente una membresía, esa; si hay varias, null hasta que se elija. Que las
 * dos capas resuelvan igual evita el peor bug posible — que la app crea que
 * escribe en un tenant y la DB lo guarde en otro.
 */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: perfil }, { data: membresias }] = await Promise.all([
    supabase.from("profiles").select("full_name, role, plataforma_rol").eq("id", user.id).single(),
    supabase.from("memberships").select("tenant_id, tenants(id, slug, nombre)").eq("user_id", user.id),
  ]);

  const tenants: TenantResumen[] = (membresias ?? [])
    .map((m) => (Array.isArray(m.tenants) ? m.tenants[0] : m.tenants) as TenantResumen | null)
    .filter((t): t is TenantResumen => Boolean(t?.id));

  const activo = tenants.length === 1 ? tenants[0] : null;

  return {
    id: user.id,
    email: user.email ?? "",
    full_name: (perfil?.full_name as string | null) ?? null,
    role: (perfil?.role as string | null) ?? null,
    tenantId: activo?.id ?? null,
    tenantSlug: activo?.slug ?? null,
    tenants,
    esStaffPlataforma: Boolean(perfil?.plataforma_rol),
  };
}

/**
 * Tenant del usuario actual, o error si no se puede determinar.
 *
 * Usalo en las rutas que escriben con SERVICE ROLE, donde el default
 * `app.tenant_actual()` de Postgres no aplica porque no hay `auth.uid()`.
 * Preferí que reviente acá y no que escriba en el tenant equivocado.
 */
export async function requireTenantId(): Promise<string> {
  const me = await getSessionProfile();
  if (!me?.tenantId) {
    throw new Error("No se pudo determinar el tenant activo de la sesión.");
  }
  return me.tenantId;
}
