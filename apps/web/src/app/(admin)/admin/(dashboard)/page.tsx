import Link from "next/link";
import { cn } from "@autoking/ui";
import { createClient } from "@/lib/supabase/server";
import { agentesDelUsuario } from "@/lib/agentes";
import { ETAPAS, ETAPAS_ABIERTAS, type LeadCrm } from "@/features/crm/pipeline";

export const dynamic = "force-dynamic";

type LeadResumen = Pick<LeadCrm, "etapa" | "valor_estimado">;

export default async function AdminHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single();
  const name = (profile?.full_name || user?.email || "Admin").split(" ")[0];

  // Acotado a los agentes que el usuario puede ver (ver lib/agentes.ts): un
  // vendedor atado a un agente no ve citas ni leads de los demás acá tampoco.
  const agentes = await agentesDelUsuario();
  const agenteIds = agentes.map((a) => a.id);
  const agentesActivos = agentes.filter((a) => a.estado === "activo").length;

  const [{ count: clientes }, { count: citas }, { data: leadsData }] = await Promise.all([
    supabase.from("clientes").select("id", { count: "exact", head: true }),
    agenteIds.length > 0
      ? supabase
          .from("citas")
          .select("id", { count: "exact", head: true })
          .in("agente_id", agenteIds)
          .gte("inicio", new Date().toISOString())
          .in("estado", ["pendiente", "confirmada"])
      : Promise.resolve({ count: 0 }),
    agenteIds.length > 0
      ? supabase.from("leads").select("etapa, valor_estimado").in("agente_id", agenteIds)
      : Promise.resolve({ data: [] as LeadResumen[] }),
  ]);

  const leads = (leadsData ?? []) as LeadResumen[];
  const porEtapa = ETAPAS.map((e) => ({ ...e, n: leads.filter((l) => l.etapa === e.value).length }));
  const cerrados = leads.filter((l) => l.etapa === "ganado" || l.etapa === "perdido");
  const tasaConversion =
    cerrados.length > 0 ? Math.round((leads.filter((l) => l.etapa === "ganado").length / cerrados.length) * 100) : null;
  const valorAbierto = leads
    .filter((l) => ETAPAS_ABIERTAS.includes(l.etapa as never))
    .reduce((acc, l) => acc + (l.valor_estimado ?? 0), 0);

  const CARDS = [
    { label: "Clientes", value: String(clientes ?? 0), note: "negocios que compraron AutoKing" },
    { label: "Citas agendadas", value: String(citas ?? 0), note: "pendientes o confirmadas, de aquí en más" },
    { label: "Agentes activos", value: `${agentesActivos}/${agentes.length}`, note: "atendiendo en este momento" },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-[clamp(26px,4vw,34px)] font-extrabold text-white">Hola, {name} 👋</h1>
      <p className="mt-2 text-[var(--color-muted)]">Este es tu panel de administración de AutoKing.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {CARDS.map((c) => (
          <div key={c.label} className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-5">
            <div className="text-sm text-[var(--color-muted)]">{c.label}</div>
            <div className="mt-1 font-display text-3xl font-extrabold text-white">{c.value}</div>
            <div className="mt-1 text-xs text-[var(--color-faint)]">{c.note}</div>
          </div>
        ))}
      </div>

      {agenteIds.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-bold text-white">Pipeline de ventas</h2>
            <Link href="/admin/agentes" className="text-sm font-semibold text-blue-bright hover:underline">
              Ver por agente →
            </Link>
          </div>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {leads.length} lead{leads.length === 1 ? "" : "s"} en total
            {tasaConversion !== null && (
              <>
                {" · "}
                <b className="text-white">{tasaConversion}%</b> de conversión
              </>
            )}
            {valorAbierto > 0 && (
              <>
                {" · "}
                <b className="text-white">${valorAbierto.toLocaleString("es-CO")}</b> en el embudo abierto
              </>
            )}
          </p>

          {/* Los ceros se muestran igual: una etapa vacía entre dos llenas es
              justamente donde se está cayendo la venta (mismo criterio que
              agentes/[id]/leads/page.tsx). */}
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
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 rounded-[var(--radius-card)] border border-[rgb(30_107_255_/_0.25)] bg-blue/[0.06] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-semibold text-white">Completá tu perfil</div>
          <div className="text-sm text-[var(--color-muted)]">Mantené tus datos personales al día.</div>
        </div>
        <Link
          href="/admin/perfil"
          className="rounded-full border border-blue-bright px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue/[0.12]"
        >
          Ir a mi perfil →
        </Link>
      </div>
    </div>
  );
}
