import { redirect } from "next/navigation";
import { cn } from "@autoking/ui";
import { getHealth, getAgentesInfra, bytesToGb, uptimeStr, type VpsHealth, type AgenteInfra } from "@/lib/control";
import { getSessionProfile } from "@/lib/session";
import { isPrivileged } from "@/lib/roles";
import { AgenteToggle } from "./agente-toggle";

export const dynamic = "force-dynamic";

function Metric({ label, value, sub, pct, warn }: { label: string; value: string; sub?: string; pct?: number; warn?: boolean }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-4">
      <div className="text-xs text-[var(--color-faint)]">{label}</div>
      <div className={cn("mt-1 font-display text-2xl font-extrabold", warn ? "text-[var(--color-danger)]" : "text-white")}>{value}</div>
      {sub && <div className="text-xs text-[var(--color-muted)]">{sub}</div>}
      {pct != null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-bg-2)]">
          <div className={cn("h-full rounded-full", pct > 85 ? "bg-[var(--color-danger)]" : pct > 60 ? "bg-amber-400" : "bg-[var(--color-success)]")} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export default async function InfraestructuraPage() {
  const me = await getSessionProfile();
  if (!me) redirect("/admin/login");
  if (!isPrivileged(me.role)) redirect("/admin");

  let health: VpsHealth | null = null;
  let agentes: AgenteInfra[] = [];
  let error: string | null = null;
  try {
    [health, agentes] = await Promise.all([getHealth(), getAgentesInfra()]);
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">Infraestructura</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">Salud del servidor y control de los agentes de tus clientes.</p>

      {error ? (
        <div className="mt-8 rounded-[var(--radius-card)] border border-[var(--color-danger)]/40 bg-[rgb(255_80_80_/_0.06)] p-6 text-sm text-[var(--color-danger)]">
          No pude conectar con el servidor de control ({error}). Verificá que la API de control esté activa en el VPS.
        </div>
      ) : (
        <>
          {/* Salud del VPS */}
          {health && (
            <div className="mt-6">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--color-muted)]">
                Servidor
                <span className={cn("rounded-full px-2 py-0.5 text-xs", health.gatewayActivo ? "bg-emerald-500/10 text-emerald-400" : "bg-[rgb(255_80_80_/_0.1)] text-[var(--color-danger)]")}>
                  {health.gatewayActivo ? "● Operativo" : "● Gateway caído"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="RAM" value={`${health.ram.pct}%`} sub={`${bytesToGb(health.ram.usado)} / ${bytesToGb(health.ram.total)} GB`} pct={health.ram.pct} />
                <Metric label="CPU (carga)" value={health.cpu.load1.toFixed(2)} sub={`${health.cpu.cores} cores`} pct={Math.min(100, Math.round((health.cpu.load1 / health.cpu.cores) * 100))} />
                <Metric label="Disco" value={`${health.disco.pct}%`} sub={`${bytesToGb(health.disco.usado)} / ${bytesToGb(health.disco.total)} GB`} pct={health.disco.pct} />
                <Metric label="Uptime" value={uptimeStr(health.uptimeSec)} sub="sin reinicios" />
              </div>
            </div>
          )}

          {/* Agentes */}
          <div className="mt-8">
            <div className="mb-2 text-sm font-medium text-[var(--color-muted)]">Agentes ({agentes.length})</div>
            {agentes.length === 0 ? (
              <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] p-10 text-center text-sm text-[var(--color-muted)]">
                Todavía no hay agentes de clientes. Se crean al provisionar un cliente.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {agentes.map((a) => (
                  <div key={a.id} className="flex items-center gap-4 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-4">
                    <span className={cn("h-2.5 w-2.5 flex-none rounded-full", a.activo ? "bg-[var(--color-success)]" : "bg-[var(--line-strong)]")} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-white">{a.nombre}</span>
                        {a.sandbox && <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] text-[var(--color-faint)]">sandbox</span>}
                      </div>
                      <div className="text-xs text-[var(--color-faint)]">{a.modelo}{a.canal ? ` · ${a.canal}` : ""}</div>
                    </div>
                    <span className={cn("text-xs font-medium", a.activo ? "text-[var(--color-success)]" : "text-[var(--color-faint)]")}>
                      {a.activo ? "Activo" : "Apagado"}
                    </span>
                    <AgenteToggle id={a.id} activo={a.activo} />
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-[var(--color-faint)]">
              Apagar un agente detiene sus respuestas de IA — el WhatsApp del cliente sigue recibiendo mensajes normalmente.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
