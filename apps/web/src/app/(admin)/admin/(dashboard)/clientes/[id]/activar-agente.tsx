"use client";

import { useActionState } from "react";
import Link from "next/link";
import { activarAgenteAction, type UserActivationState } from "../actions";

/**
 * Activación del agente REAL del cliente (crea cuenta Kapso + agente + binding en el VPS
 * y reinicia el gateway). Solo visible cuando el WhatsApp está conectado.
 */
export function ActivarAgente({
  clienteId,
  waStatus,
  agentId,
}: {
  clienteId: string;
  waStatus: string;
  agentId: string | null;
}) {
  const [state, formAction, pending] = useActionState<UserActivationState, FormData>(activarAgenteAction, {});
  const activado = Boolean(agentId);

  return (
    <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-6">
      <div className="flex items-center gap-2">
        <span className="text-lg">🤖</span>
        <h2 className="font-semibold text-white">Agente que responde WhatsApp</h2>
        {activado && (
          <span className="rounded-full border border-[rgb(43_212_123_/_0.3)] bg-[rgb(43_212_123_/_0.14)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-success)]">
            Activado
          </span>
        )}
      </div>

      {activado ? (
        <>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            El agente <b className="text-white">{agentId}</b> está creado y atiende el WhatsApp del cliente.
            Prendelo/apagalo desde Infraestructura.
          </p>
          <Link
            href="/admin/infraestructura"
            className="mt-4 inline-block rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--color-muted)] transition-colors hover:text-white"
          >
            Ver en Infraestructura →
          </Link>
        </>
      ) : waStatus === "conectado" ? (
        <>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            El WhatsApp está conectado. Activar crea el agente real en el servidor, lo conecta al número
            del cliente y <b className="text-white">reinicia el gateway</b> (King se interrumpe unos segundos).
          </p>
          <form action={formAction} className="mt-4">
            <input type="hidden" name="clienteId" value={clienteId} />
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white shadow-cta transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {pending ? "Activando…" : "Activar agente"}
            </button>
          </form>
          {state.error && <p className="mt-3 text-sm text-[var(--color-danger)]">{state.error}</p>}
          {state.ok && <p className="mt-3 text-sm text-[var(--color-success)]">¡Agente activado! Ya responde el WhatsApp del cliente.</p>}
        </>
      ) : (
        <p className="mt-2 text-sm text-[var(--color-faint)]">
          Primero el cliente tiene que conectar su WhatsApp (sección de arriba). Después vas a poder activar el agente.
        </p>
      )}
    </div>
  );
}
