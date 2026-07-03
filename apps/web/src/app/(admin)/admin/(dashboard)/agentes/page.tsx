import Link from "next/link";
import { cn } from "@autoking/ui";
import { listAgents, type TenantAgent } from "@/lib/agents-bridge";
import { AgentChat } from "./agent-chat";

export const dynamic = "force-dynamic";

function AgentCard({ agent }: { agent: TenantAgent }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{agent.business}</h3>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                agent.type === "system"
                  ? "border-[var(--line)] bg-white/[0.05] text-[var(--color-faint)]"
                  : "border-[rgb(30_107_255_/_0.3)] bg-blue/[0.12] text-blue-bright",
              )}
            >
              {agent.type === "system" ? "AutoKing" : "Cliente"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--color-faint)]">
            {agent.assistant ? `${agent.assistant} · ` : ""}
            <code className="text-[var(--color-muted)]">{agent.agentId}</code>
          </p>
        </div>
        <AgentChat agentId={agent.agentId} assistant={agent.assistant} />
      </div>
    </div>
  );
}

export default async function AgentesPage() {
  let agents: TenantAgent[] = [];
  let error: string | null = null;
  try {
    agents = await listAgents();
  } catch (e) {
    error = (e as Error).message;
  }

  const system = agents.filter((a) => a.type === "system");
  const clients = agents.filter((a) => a.type !== "system");

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">Agentes</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            La recepcionista de IA de cada negocio. {clients.length} {clients.length === 1 ? "cliente" : "clientes"}.
          </p>
        </div>
        <Link
          href="/admin/agentes/nuevo"
          className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-blue)] transition-transform hover:-translate-y-0.5"
        >
          + Nuevo agente
        </Link>
      </div>

      {error ? (
        <div className="mt-10 rounded-[var(--radius-card)] border border-[rgb(255_90_90_/_0.3)] bg-[rgb(255_80_80_/_0.06)] p-6 text-sm text-[var(--color-danger)]">
          No pude conectar con el backend de agentes: {error}
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {system.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">Asistente de AutoKing</h2>
              <div className="space-y-3">
                {system.map((a) => (
                  <AgentCard key={a.agentId} agent={a} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-faint)]">Agentes de clientes</h2>
            {clients.length === 0 ? (
              <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] p-12 text-center">
                <p className="text-[var(--color-muted)]">Todavía no hay agentes de clientes.</p>
                <Link href="/admin/agentes/nuevo" className="mt-3 inline-block text-sm font-semibold text-blue-bright hover:underline">
                  Crear el primero →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {clients.map((a) => (
                  <AgentCard key={a.agentId} agent={a} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
