import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@autoking/ui";
import {
  PROSPECT_STATUSES,
  prospectStatusLabel,
  PROSPECT_STATUS_STYLES,
  scoreColor,
  type Prospect,
} from "./status";
import { ProspectActions } from "./prospect-actions";

export default async function ProspeccionPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("prospects").select("*").order("need_score", { ascending: false });
  if (status && PROSPECT_STATUSES.includes(status as never)) query = query.eq("status", status);
  const { data } = await query.limit(300);
  const prospects = (data ?? []) as Prospect[];

  // conteos por estado (para stats + tabs)
  const { data: allForCounts } = await supabase.from("prospects").select("status");
  const counts: Record<string, number> = {};
  for (const r of (allForCounts ?? []) as { status: string }[]) counts[r.status] = (counts[r.status] ?? 0) + 1;
  const total = (allForCounts ?? []).length;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">Prospección</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {total} negocio(s) descubierto(s) en Google Maps. Ordenados por necesidad de agente.
      </p>

      {/* Filtros por estado */}
      <div className="mt-6 flex flex-wrap gap-2">
        <FilterTab label="Todos" count={total} href="/admin/prospeccion" active={!status} />
        {PROSPECT_STATUSES.map((s) => (
          <FilterTab
            key={s}
            label={prospectStatusLabel(s)}
            count={counts[s] ?? 0}
            href={`/admin/prospeccion?status=${s}`}
            active={status === s}
          />
        ))}
      </div>

      {prospects.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] p-12 text-center text-[var(--color-muted)]">
          {total === 0 ? (
            <>
              Todavía no hay prospectos. Corré el scraper en el VPS:
              <br />
              <code className="mt-2 inline-block rounded bg-[var(--color-bg-2)] px-2 py-1 text-xs text-blue-bright">
                run.sh scrape --categorias &quot;spa,barbería&quot; --ciudades &quot;Bogotá&quot; --limite 20
              </code>
            </>
          ) : (
            "No hay prospectos en este estado."
          )}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-[var(--radius-card)] border border-[var(--line)]">
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
                      <Signal on={!p.has_website} label={p.has_website ? "con web" : "SIN WEB"} good={!p.has_website} />
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
    </div>
  );
}

function FilterTab({ label, count, href, active }: { label: string; count: number; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-blue-bright bg-blue/[0.12] text-white"
          : "border-[var(--line)] text-[var(--color-muted)] hover:bg-white/[0.03]",
      )}
    >
      {label}
      <span className="rounded-full bg-white/[0.06] px-1.5 text-[10px]">{count}</span>
    </Link>
  );
}

function Signal({ label, good }: { on: boolean; label: string; good: boolean }) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 font-semibold",
        good ? "bg-emerald-500/10 text-emerald-400" : "bg-white/[0.04] text-[var(--color-faint)]",
      )}
    >
      {label}
    </span>
  );
}
