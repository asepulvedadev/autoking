import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/session";
import { isPrivileged } from "@/lib/roles";
import { AgregarMiembro, MiembroRow, type Miembro } from "./miembro-form";

export const dynamic = "force-dynamic";

export default async function EquipoPage() {
  const me = await getSessionProfile();
  if (!me) redirect("/admin/login");
  if (!isPrivileged(me.role)) redirect("/admin");

  // Cliente de sesión: RLS ya filtra por tenant, no hace falta service role.
  const supabase = await createClient();
  const { data } = await supabase
    .from("equipo")
    .select("id, whatsapp, nombre, rol, activo, territorio_pais, territorio_ciudad, recibe_leads")
    .order("rol");
  const miembros = (data ?? []) as Miembro[];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">Equipo y territorios</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Quién atiende WhatsApp del lado del equipo, y <b className="text-white">qué zona cubre cada uno</b>. Cuando King
        cierra o escala, le reenvía el contacto a la persona asignada a la zona del cliente.
      </p>
      <p className="mt-1 text-sm text-[var(--color-faint)]">
        Prioridad de asignación: <b>ciudad exacta</b> → <b>todo el país</b> → <b>cobertura total (all)</b>.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {miembros.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] p-10 text-center text-sm text-[var(--color-muted)]">
            Todavía no hay nadie en el equipo.
          </div>
        ) : (
          miembros.map((m) => <MiembroRow key={m.id} m={m} />)
        )}
      </div>

      <AgregarMiembro />
    </div>
  );
}
