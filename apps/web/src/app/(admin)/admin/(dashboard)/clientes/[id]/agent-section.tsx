import Link from "next/link";
import { getAgentConfig } from "@/lib/agents-bridge";
import { AgentChat } from "../../agentes/agent-chat";
import { createAgentForCliente } from "../actions";

export async function AgentSection({ clienteId, agentId }: { clienteId: string; agentId: string | null }) {
  const config = agentId ? await getAgentConfig(agentId) : null;
  const hasAgent = Boolean(agentId && config);

  return (
    <div className="mt-10 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-6">
      <div className="flex items-center gap-2">
        <span className="text-lg">👑</span>
        <h2 className="font-semibold text-white">Agente de IA</h2>
        {hasAgent && (
          <span className="rounded-full border border-[rgb(43_212_123_/_0.3)] bg-[rgb(43_212_123_/_0.14)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-success)]">
            Activo
          </span>
        )}
      </div>

      {hasAgent && config ? (
        <>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {config.assistant_name ? <b className="text-white">{config.assistant_name}</b> : "Recepcionista IA"} atiende
            para este cliente. Probalo (QA) o editá sus servicios y horarios.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href={`/admin/agentes/${agentId}`}
              className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-4 py-2 text-sm font-semibold text-white shadow-cta transition-transform hover:-translate-y-0.5"
            >
              Editar agente
            </Link>
            <AgentChat agentId={agentId!} assistant={config.assistant_name ?? ""} />
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Este cliente todavía no tiene su recepcionista de IA. Creala con sus datos y después completá
            servicios y horarios.
          </p>
          <form action={createAgentForCliente} className="mt-4">
            <input type="hidden" name="clienteId" value={clienteId} />
            <button
              type="submit"
              className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white shadow-cta transition-transform hover:-translate-y-0.5"
            >
              + Crear agente para este cliente
            </button>
          </form>
        </>
      )}
    </div>
  );
}
