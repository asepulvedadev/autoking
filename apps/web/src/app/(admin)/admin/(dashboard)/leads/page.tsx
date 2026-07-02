import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@autoking/ui";
import { LEAD_STATUS_STYLES, leadStatusLabel, type Lead } from "./lead-status";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
  const leads = (data ?? []) as Lead[];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">Leads</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">{leads.length} solicitud(es) de demo.</p>

      {leads.length === 0 ? (
        <div className="mt-10 rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] p-12 text-center text-[var(--color-muted)]">
          Todavía no hay leads. Aparecerán acá cuando alguien complete el formulario de la landing.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-[var(--radius-card)] border border-[var(--line)]">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--color-bg-2)] text-left text-[var(--color-faint)]">
                <th className="p-4 font-medium">Nombre</th>
                <th className="p-4 font-medium">Negocio</th>
                <th className="p-4 font-medium">WhatsApp</th>
                <th className="p-4 font-medium">Fecha</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-[var(--line)] last:border-0 hover:bg-white/[0.02]">
                  <td className="p-4 font-medium text-white">{l.name}</td>
                  <td className="p-4 text-[var(--color-muted)]">{l.business ?? "—"}</td>
                  <td className="p-4 text-[var(--color-muted)]">{l.whatsapp ?? "—"}</td>
                  <td className="p-4 text-[var(--color-faint)]">
                    {new Date(l.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
                  </td>
                  <td className="p-4">
                    <span className={cn("inline-block rounded-full border px-2.5 py-1 text-xs font-medium", LEAD_STATUS_STYLES[l.status] ?? "")}>
                      {leadStatusLabel(l.status)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/leads/${l.id}`} className="text-sm font-semibold text-blue-bright hover:underline">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
