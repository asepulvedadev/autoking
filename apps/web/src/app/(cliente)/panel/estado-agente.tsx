"use client";

import { useActionState, useState } from "react";
import { cn } from "@autoking/ui";
import { cambiarEstadoAgente, type PanelState } from "./actions";

/**
 * Encender/pausar el agente, con fricción a propósito.
 *
 * Pausarlo significa que sus clientes dejan de recibir respuesta: es una acción
 * con consecuencia comercial, así que pide confirmación explícita y deja un
 * aviso permanente mientras dure. Reanudar es un solo click — bajar la barrera
 * para volver a la normalidad, subirla para salirse de ella.
 */
export function EstadoAgente({ activo }: { activo: boolean }) {
  const [state, action, pending] = useActionState<PanelState, FormData>(cambiarEstadoAgente, {});
  const [confirmando, setConfirmando] = useState(false);

  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border p-5",
        activo
          ? "border-[rgb(43_212_123_/_0.3)] bg-[rgb(43_212_123_/_0.05)]"
          : "border-[var(--color-danger)]/40 bg-[rgb(255_80_80_/_0.06)]",
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className={cn("h-2.5 w-2.5 flex-none rounded-full", activo ? "bg-[var(--color-success)]" : "bg-[var(--color-danger)]")} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-white">
            {activo ? "Tu agente está atendiendo" : "Tu agente está PAUSADO"}
          </div>
          <p className="mt-0.5 text-sm text-[var(--color-muted)]">
            {activo
              ? "Responde automáticamente por WhatsApp, las 24 horas."
              : "Nadie está recibiendo respuesta automática. Los mensajes que te lleguen quedan sin contestar."}
          </p>
        </div>

        {activo ? (
          confirmando ? (
            <form action={action} className="flex flex-none items-center gap-2">
              <input type="hidden" name="activar" value="false" />
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-[var(--color-danger)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {pending ? "Pausando…" : "Sí, pausar"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--color-muted)] hover:text-white"
              >
                Cancelar
              </button>
            </form>
          ) : (
            <button
              onClick={() => setConfirmando(true)}
              className="flex-none rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition-colors hover:border-[var(--color-danger)]/50 hover:text-[var(--color-danger)]"
            >
              Pausar agente
            </button>
          )
        ) : (
          <form action={action} className="flex-none">
            <input type="hidden" name="activar" value="true" />
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2 text-sm font-semibold text-white shadow-cta disabled:opacity-60"
            >
              {pending ? "Reanudando…" : "Reanudar agente"}
            </button>
          </form>
        )}
      </div>

      {activo && confirmando && (
        <p className="mt-3 rounded-lg bg-[rgb(255_80_80_/_0.08)] p-3 text-sm text-[var(--color-danger)]">
          ⚠️ Si pausás el agente, <b>tus clientes dejan de recibir respuesta automática</b> hasta
          que lo reanudes. Los mensajes te van a seguir llegando, pero nadie los contesta.
        </p>
      )}

      {state.error && <p className="mt-3 text-sm text-[var(--color-danger)]">{state.error}</p>}
    </div>
  );
}
