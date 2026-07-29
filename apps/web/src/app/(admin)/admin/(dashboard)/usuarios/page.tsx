import Link from "next/link";
import { redirect } from "next/navigation";
import { cn } from "@autoking/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/session";
import { isPrivileged, ROLE_LABELS, ROLE_BADGE, type Role } from "@/lib/roles";

export const dynamic = "force-dynamic";

type Row = { id: string; email: string; full_name: string | null; phone: string | null; role: Role };

export default async function UsuariosPage() {
  const me = await getSessionProfile();
  if (!me) redirect("/admin/login");
  if (!isPrivileged(me.role)) redirect("/admin");

  const admin = createAdminClient();
  const [{ data: authList }, { data: profiles }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("profiles").select("id, full_name, phone, role"),
  ]);

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  const rows: Row[] = (authList?.users ?? []).map((u) => {
    const p = byId.get(u.id);
    return {
      id: u.id,
      email: u.email ?? "—",
      full_name: (p?.full_name as string | null) ?? null,
      phone: (p?.phone as string | null) ?? null,
      role: ((p?.role as string) ?? "vendedor") as Role,
    };
  });
  rows.sort((a, b) => (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">Usuarios del panel</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {rows.length} persona(s) de <b className="text-white">tu equipo</b> con acceso al panel.
          </p>
          <p className="mt-1 text-sm text-[var(--color-faint)]">
            ¿Buscás las empresas que te compran?{" "}
            <Link href="/admin/clientes" className="font-medium text-blue-bright hover:underline">Están en Clientes →</Link>
          </p>
        </div>
        <Link
          href="/admin/usuarios/nuevo"
          className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white shadow-cta transition-transform hover:-translate-y-0.5"
        >
          + Nuevo usuario
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[var(--radius-card)] border border-[var(--line)]">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--color-bg-2)] text-left text-[var(--color-faint)]">
              <th className="p-4 font-medium">Nombre</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Rol</th>
              <th className="p-4 font-medium">Teléfono</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-[var(--line)] last:border-0 hover:bg-white/[0.02]">
                <td className="p-4 font-medium text-white">
                  {u.full_name || "—"}
                  {u.id === me.id && <span className="ml-2 text-xs text-[var(--color-faint)]">(vos)</span>}
                </td>
                <td className="p-4 text-[var(--color-muted)]">{u.email}</td>
                <td className="p-4">
                  <span className={cn("inline-block rounded-full border px-2.5 py-1 text-xs font-medium", ROLE_BADGE[u.role] ?? "")}>
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </td>
                <td className="p-4 text-[var(--color-muted)]">{u.phone || "—"}</td>
                <td className="p-4 text-right">
                  <Link href={`/admin/usuarios/${u.id}`} className="text-sm font-semibold text-blue-bright hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
