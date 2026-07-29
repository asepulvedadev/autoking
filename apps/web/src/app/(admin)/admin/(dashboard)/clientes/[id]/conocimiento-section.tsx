"use client";

import { useRef } from "react";
import { agregarConocimientoAction, eliminarConocimientoAction } from "../actions";

export type Chunk = { id: string; titulo: string | null; contenido: string };

const field =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[var(--color-faint)] focus:border-blue-bright";

/** Editor del RAG (memoria) del agente del cliente: agrega/borra chunks que se embeben y se buscan por significado. */
export function ConocimientoSection({ clienteId, chunks }: { clienteId: string; chunks: Chunk[] }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-6">
      <div className="flex items-center gap-2">
        <span className="text-lg">📚</span>
        <h2 className="font-semibold text-white">Conocimiento del agente (RAG)</h2>
        <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--color-faint)]">{chunks.length}</span>
      </div>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Lo que el agente puede consultar para responder (promos, políticas, FAQ…). Se busca por significado, no por palabra exacta.
      </p>

      {chunks.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {chunks.map((c) => (
            <li key={c.id} className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] p-3">
              <div className="min-w-0 flex-1">
                {c.titulo && <div className="text-sm font-medium text-white">{c.titulo}</div>}
                <div className="truncate text-xs text-[var(--color-muted)]">{c.contenido}</div>
              </div>
              <form action={eliminarConocimientoAction}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="clienteId" value={clienteId} />
                <button type="submit" className="flex-none text-xs text-[var(--color-faint)] transition-colors hover:text-[var(--color-danger)]">
                  Borrar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form
        ref={formRef}
        action={async (fd) => {
          await agregarConocimientoAction(fd);
          formRef.current?.reset();
        }}
        className="mt-4 flex flex-col gap-3"
      >
        <input type="hidden" name="clienteId" value={clienteId} />
        <input name="titulo" placeholder="Título (ej: Promo de septiembre)" className={field} />
        <textarea name="contenido" required rows={3} placeholder="El dato que el agente debe saber…" className={field} />
        <div>
          <button
            type="submit"
            className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white shadow-cta transition-transform hover:-translate-y-0.5"
          >
            + Agregar al conocimiento
          </button>
        </div>
      </form>
    </div>
  );
}
