import Link from "next/link";
import { redirect } from "next/navigation";
import { cn } from "@autoking/ui";
import { createClient } from "@/lib/supabase/server";
import { agenteAccesible } from "@/lib/agentes";
import {
  PROSPECT_STATUSES,
  prospectStatusLabel,
  PROSPECT_STATUS_STYLES,
  scoreColor,
  type Prospect,
} from "../../../prospeccion/status";
import { ProspectActions } from "../../../prospeccion/prospect-actions";

export const dynamic = "force-dynamic";

/** Prospección DE ESTE AGENTE: cada agente trabaja su propio mercado. */
export default async function ProspeccionDelAgentePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ id }, { status }] = await Promise.all([params, searchParams]);
  const agente = await agenteAccesible(id);
  if (!agente) redirect("/admin/agentes");

  const supabase = await createClient();
  const base = `/admin/agentes/${agente.slug}/prospeccion`;

  let query = supabase
    .from("prospects")
    .select("*")
    .eq("agente_id", agente.id) // ← separa el mercado de cada agente
    .order("need_score", { ascending: false });
  if (status && PROSPECT_STATUSES.includes(status as never)) query = query.eq("status", status);
  const { data } = await query.limit(300);
  const prospects = (data ?? []) as Prospect[];

  const { data: paraConteo } = await supabase.from("prospects").select("status").eq("agente_id", agente.id);
  const counts: Record<string, number> = {};
  for (const r of (paraConteo ?? []) as { status: string }[]) counts[r.status] = (counts[r.status] ?? 0) + 1;
  const total = (paraConteo ?? []).length;

  return (
    <>
      <p className="text-sm text-[var(--color-muted)]">
        {total} negocio(s) descubierto(s) para <b className="text-white">{agente.nombre ?? agente.slug}</b>.
        Ordenados por necesidad de agente.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterTab label="Todos" count={total} href={base} active={!status} />
        {PROSPECT_STATUSES.map((s) => (
          <FilterTab
            key={s}
            label={prospectStatusLabel(s)}
            count={counts[s] ?? 0}
            href={`${base}?status=${s}`}
            active={status === s}
          />
        ))}
      </div>

      {prospects.length === 0 ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] p-12 text-center text-[var(--color-muted)]">
          {total === 0
            ? "Todavía no hay prospectos para este agente."
            : "No hay prospectos en este estado."}
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-[var(--radius-card)] border border-[var(--line)]">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--color-bg-2)] text-left text-[var(--color-faint)]">
                <th className="p-3 pl-4 font-medium">Score</th>
                <th className="p-3 font-medium">Negocio</th>
                <th className="p-3 font-medium">Señales</th>
                <th className="p-3 font-medium">Contacto</th>
                <th className="p-3 font-medium">Estado</th>
                <th className="p-3 pr-4 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {prospects.map((p) => (
                <tr key={p.id} className="border-b border-[var(--line)] align-top last:border-0 hover:bg-white/[0.02]">
                  <td className="p-3 pl-4">
                    <span className={cn("font-display text-lg font-extrabold", scoreColor(p.need_score))}>
                      {p.need_score}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-white">
                      {p.maps_url ? (
                        <a href={p.maps_url} target="_blank" rel="noopener" className="hover:text-blue-bright">
                          {p.business_name}
                        </a>
                      ) : (
                        p.business_name
                      )}
                    </div>
                    <div className="text-xs text-[var(--color-faint)]">
                      {[p.category?.split(",")[0], p.city].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </td>
                  <td className="p-3 text-xs text-[var(--color-muted)]">
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5",
                          p.has_website ? "bg-white/[0.04]" : "bg-[rgb(43_212_123_/_0.14)] text-[var(--color-success)]",
                        )}
                      >
                        {p.has_website ? "con web" : "SIN WEB"}
                      </span>
                      {p.reviews > 0 && <span className="rounded bg-white/[0.04] px-1.5 py-0.5">{p.reviews}★ reseñas</span>}
                      {p.rating != null && <span className="rounded bg-white/[0.04] px-1.5 py-0.5">{p.rating} rating</span>}
                    </div>
                  </td>
                  <td className="p-3 text-xs">
                    {p.email ? (
                      <div className="text-[var(--color-muted)]">📧 {p.email}</div>
                    ) : (
                      <div className="text-[var(--color-faint)]">sin email</div>
                    )}
                    {p.whatsapp && <div className="text-[var(--color-faint)]">📱 {p.whatsapp}</div>}
                  </td>
                  <td className="p-3">
                    <span
                      className={cn(
                        "inline-block rounded-full border px-2.5 py-1 text-xs font-medium",
                        PROSPECT_STATUS_STYLES[p.status] ?? "",
                      )}
                    >
                      {prospectStatusLabel(p.status)}
                    </span>
                  </td>
                  <td className="p-3 pr-4">
                    <ProspectActions prospect={p} />
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

function FilterTab({ label, count, href, active }: { label: string; count: number; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-blue-bright bg-blue/[0.12] text-white"
          : "border-[var(--line)] text-[var(--color-muted)] hover:border-[var(--line-strong)] hover:text-white",
      )}
    >
      {label} <span className="text-[var(--color-faint)]">{count}</span>
    </Link>
  );
}
