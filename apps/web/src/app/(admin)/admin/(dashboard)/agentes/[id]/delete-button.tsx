"use client";

import { deleteAgentAction } from "../actions";

export function DeleteAgentButton({ agentId, business }: { agentId: string; business: string }) {
  return (
    <form
      action={deleteAgentAction}
      onSubmit={(e) => {
        if (!confirm(`¿Eliminar el agente de "${business}"? Esta acción no se puede deshacer.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="agentId" value={agentId} />
      <button
        type="submit"
        className="rounded-full border border-[rgb(255_90_90_/_0.4)] px-5 py-2.5 text-sm font-semibold text-[var(--color-danger)] transition-colors hover:bg-[rgb(255_80_80_/_0.1)]"
      >
        Eliminar agente
      </button>
    </form>
  );
}
