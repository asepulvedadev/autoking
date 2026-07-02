"use client";

import { useActionState } from "react";
import { buttonVariants } from "@autoking/ui";
import { updateLeadStatus, deleteLead, type LeadAdminState } from "../actions";
import { LEAD_ESTADOS } from "../lead-status";

const field =
  "rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-4 py-3 text-sm text-white outline-none focus:border-blue-bright";

export function LeadActions({ id, status, name }: { id: string; status: string; name: string }) {
  const [state, action, pending] = useActionState<LeadAdminState, FormData>(updateLeadStatus, {});

  return (
    <div className="mt-8 flex flex-col gap-6">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="id" value={id} />
        <div>
          <label className="mb-1.5 block text-sm text-[var(--color-muted)]" htmlFor="status">Estado</label>
          <select id="status" name="status" defaultValue={status} className={field}>
            {LEAD_ESTADOS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={pending} className={buttonVariants({ variant: "primary", className: "disabled:opacity-60" })}>
          {pending ? "Guardando…" : "Actualizar estado"}
        </button>
        {state.ok && <span className="pb-3 text-sm text-[var(--color-success)]">✓ Guardado</span>}
        {state.error && <span className="pb-3 text-sm text-[var(--color-danger)]">{state.error}</span>}
      </form>

      <div className="border-t border-[var(--line)] pt-6">
        <p className="mb-3 text-sm text-[var(--color-faint)]">Zona peligrosa</p>
        <form
          action={deleteLead}
          onSubmit={(e) => {
            if (!confirm(`¿Eliminar el lead de "${name}"?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            className="rounded-full border border-[rgb(255_90_90_/_0.4)] px-5 py-2.5 text-sm font-semibold text-[var(--color-danger)] transition-colors hover:bg-[rgb(255_80_80_/_0.1)]"
          >
            Eliminar lead
          </button>
        </form>
      </div>
    </div>
  );
}
