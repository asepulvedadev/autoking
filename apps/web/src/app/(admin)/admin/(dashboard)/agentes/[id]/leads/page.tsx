import Link from "next/link";
import { redirect } from "next/navigation";
import { cn } from "@autoking/ui";
import { createClient } from "@/lib/supabase/server";
import { agenteAccesible } from "@/lib/agentes";
import { ETAPAS, ETAPAS_ABIERTAS, diasEnEtapa, etapaInfo, DIAS_FRENADO, type LeadCrm } from "@/features/crm/pipeline";

export const dynamic = "force-dynamic";

/**
 * Leads DE ESTE AGENTE. La lista ya no vive suelta en el sidebar: cada agente
 * captura los suyos, y el vendedor de un agente no ve los del otro.
 */
export default async function LeadsDelAgentePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agente = await agenteAccesible(id);
  if (!agente) redirect("/admin/agentes");

  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("agente_id", agente.id) // ← el filtro que separa King de Mayand
    .order("created_at", { ascending: false });
  const leads = (data ?? []) as LeadCrm[];

  // El embudo: cuántos hay en cada etapa. Es lo primero que se mira —dónde se
  // amontonan— y no se puede deducir de una tabla ordenada por fecha.
  const porEtapa = ETAPAS.map((e) => ({
    ...e,
    n: leads.filter((l) => l.etapa === e.value).length,
  }));
  const abiertos = leads.filter((l) => ETAPAS_ABIERTAS.includes(l.etapa as never));
  const frenados = abiertos.filter((l) => diasEnEtapa(l.etapa_desde) >= DIAS_FRENADO);

  return (
    <>
      <p className="text-sm text-[var(--color-muted)]">
        {leads.length} lead(s) que captó <b className="text-white">{agente.nombre ?? agente.slug}</b>
        {frenados.length > 0 && (
          <>
            {" · "}
            <span className="text-[var(--color-gold)]">
              {frenados.length} sin moverse hace {DIAS_FRENADO}+ días
            </span>
          </>
        )}
      </p>

      {/* El embudo de un vistazo. Los ceros se muestran igual: una etapa vacía
          entre dos llenas es justamente donde se está cayendo la venta. */}
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {porEtapa.map((e) => (
          <div key={e.value} className="rounded-[var(--radius-sm)] border border-line bg-surface p-3">
            <div className="flex items-center gap-1.5">
              <span className={cn("h-1.5 w-1.5 rounded-full", e.punto)} />
              <span className="text-xs text-faint">{e.label}</span>
            </div>
            <p className="mt-1 text-xl font-bold text-white">{e.n}</p>
          </div>
        ))}
      </div>

      {leads.length === 0 ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] p-12 text-center text-[var(--color-muted)]">
          Todavía no hay leads de este agente. Aparecerán aquí cuando alguien le escriba o complete el formulario.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-[var(--radius-card)] border border-[var(--line)]">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--color-bg-2)] text-left text-[var(--color-faint)]">
                <th className="p-4 font-medium">Nombre</th>
                <th className="p-4 font-medium">Negocio</th>
                <th className="p-4 font-medium">WhatsApp</th>
                <th className="p-4 font-medium">Fecha</th>
                <th className="p-4 font-medium">Etapa</th>
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
                    <span className={cn("inline-block rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium", etapaInfo(l.etapa).color)}>
                      {etapaInfo(l.etapa).label}
                    </span>
                    {ETAPAS_ABIERTAS.includes(l.etapa as never) && diasEnEtapa(l.etapa_desde) >= DIAS_FRENADO && (
                      <span className="ml-2 text-xs text-[var(--color-gold)]">
                        {diasEnEtapa(l.etapa_desde)}d
                      </span>
                    )}
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
    </>
  );
}
