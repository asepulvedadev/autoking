"use client";

import { useRef, useState, useTransition } from "react";
import type { Nota } from "./pipeline";
import { agregarNota, borrarNota } from "./actions";

/**
 * Notas de un contacto.
 *
 * Es lo que hoy no tiene dónde vivir: "llamé, pidió pensarlo", "decide el
 * socio", "volver en marzo". Sin esto, ese contexto se pierde en la cabeza de
 * quien atendió — y cuando la persona vuelve a escribir tres semanas después,
 * se arranca de cero.
 */
export function NotasUI({
  whatsapp,
  leadId,
  agenteId,
  notas,
}: {
  whatsapp: string;
  leadId?: string;
  agenteId?: string | null;
  notas: Nota[];
}) {
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  function guardar() {
    const cuerpo = ref.current?.value ?? "";
    if (!cuerpo.trim()) return;
    setError(null);
    startTransition(async () => {
      const r = await agregarNota(whatsapp, cuerpo, { leadId, agenteId });
      if (r?.error) setError(r.error);
      else if (ref.current) ref.current.value = "";
    });
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <h2 className="text-sm font-semibold text-white">Notas</h2>

      <div className="mt-3">
        <textarea
          ref={ref}
          rows={3}
          placeholder="Qué pasó en la conversación: qué pidió, qué lo frena, cuándo volver…"
          // Ctrl/Cmd+Enter para guardar: quien toma notas mientras habla por
          // teléfono no quiere soltar el teclado para buscar el botón.
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") guardar();
          }}
          className="w-full rounded-[var(--radius-sm)] border border-line bg-bg-2 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-faint focus:border-blue-bright"
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={guardar}
            disabled={pendiente}
            className="rounded-[var(--radius-sm)] bg-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-bright disabled:opacity-60"
          >
            {pendiente ? "Guardando…" : "Guardar nota"}
          </button>
          <span className="text-xs text-faint">⌘/Ctrl + Enter</span>
        </div>
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      </div>

      {notas.length === 0 ? (
        <p className="mt-5 text-sm text-faint">
          Sin notas todavía. Escribí lo que no queda en el chat: lo que te dijo por teléfono,
          quién decide, cuándo conviene volver.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {notas.map((n) => (
            <li key={n.id} className="rounded-[var(--radius-sm)] border border-line bg-bg-2 p-3">
              <p className="whitespace-pre-wrap text-sm text-ink">{n.cuerpo}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-faint">
                <span>
                  {n.autor_nombre ?? "—"} ·{" "}
                  {new Date(n.created_at).toLocaleString("es-CO", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => startTransition(() => void borrarNota(n.id, leadId))}
                  className="text-faint transition-colors hover:text-danger"
                >
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
