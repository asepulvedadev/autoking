"use client";

import { useActionState } from "react";
import { cn } from "@autoking/ui";
import { sendProposal, setProspectStatus, type ProspectActionState } from "./actions";
import { PROSPECT_STATUSES, prospectStatusLabel, type Prospect } from "./status";

/** Acciones por prospecto: enviar propuesta (email) + cambiar estado. */
export function ProspectActions({ prospect }: { prospect: Prospect }) {
  const [state, action, pending] = useActionState<ProspectActionState, FormData>(sendProposal, {});

  const canEmail = !!prospect.email && prospect.status !== "descartado";
  const already = prospect.status === "contactado" || prospect.status === "respondio" || prospect.status === "cliente";

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        {/* Cambiar estado */}
        <form action={setProspectStatus}>
          <input type="hidden" name="id" value={prospect.id} />
          <select
            name="status"
            defaultValue={prospect.status}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="rounded-lg border border-[var(--line)] bg-[var(--color-bg-2)] px-2 py-1.5 text-xs text-white outline-none focus:border-blue-bright"
          >
            {PROSPECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {prospectStatusLabel(s)}
              </option>
            ))}
          </select>
        </form>

        {/* Enviar propuesta por email */}
        <form action={action}>
          <input type="hidden" name="id" value={prospect.id} />
          <button
            type="submit"
            disabled={pending || !canEmail}
            title={
              !prospect.email
                ? "Sin email — contactar por WhatsApp"
                : prospect.status === "descartado"
                  ? "Prospecto dado de baja"
                  : already
                    ? "Ya contactado — reenviar"
                    : "Enviar propuesta por email"
            }
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              already
                ? "border-[var(--line)] text-[var(--color-muted)] hover:bg-white/[0.03]"
                : "border-blue-bright/50 text-blue-bright hover:bg-blue/[0.1]",
            )}
          >
            {pending ? "Enviando…" : already ? "Reenviar" : "Enviar propuesta"}
          </button>
        </form>

        {/* WhatsApp directo (para los sin email) */}
        {prospect.whatsapp && (
          <a
            href={`https://wa.me/${prospect.whatsapp}`}
            target="_blank"
            rel="noopener"
            className="rounded-lg border border-emerald-500/40 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/10"
            title="Abrir WhatsApp"
          >
            WA
          </a>
        )}
      </div>

      {state.error && <span className="text-right text-[11px] text-[var(--color-danger)]">{state.error}</span>}
      {state.ok && <span className="text-right text-[11px] text-emerald-400">✓ Propuesta enviada</span>}
    </div>
  );
}
