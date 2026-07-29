"use client";

import { useActionState } from "react";
import { guardarIdentidadAction, type AgenteState } from "../actions";

const area =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-4 py-3 font-mono text-xs leading-relaxed text-white outline-none transition-colors focus:border-blue-bright";

const CAMPOS = [
  { key: "identity", archivo: "IDENTITY.md", titulo: "Identidad", ayuda: "Quién es: nombre, rol, vibe, emoji." },
  { key: "soul", archivo: "SOUL.md", titulo: "Alma", ayuda: "Cómo se comporta: tono, límites, forma de responder." },
  { key: "instructions", archivo: "AGENTS.md", titulo: "Conocimiento base", ayuda: "Su fuente de verdad: negocio, servicios, precios, horarios." },
] as const;

export function IdentidadEditor({
  agentId,
  identidad,
}: {
  agentId: string;
  identidad: { identity: string | null; soul: string | null; instructions: string | null };
}) {
  const [state, action, pending] = useActionState<AgenteState, FormData>(guardarIdentidadAction, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={agentId} />

      {CAMPOS.map((c) => (
        <details key={c.key} className="rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] p-3">
          <summary className="cursor-pointer text-sm font-medium text-white">
            {c.archivo}
            <span className="ml-2 text-xs font-normal text-[var(--color-faint)]">{c.ayuda}</span>
          </summary>
          <textarea
            name={c.key}
            rows={14}
            defaultValue={identidad[c.key] ?? ""}
            className={`${area} mt-3`}
            spellCheck={false}
          />
        </details>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white shadow-cta transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar identidad"}
        </button>
        {state.ok && <span className="text-sm text-[var(--color-success)]">Guardado ✅ {state.detalle}</span>}
        {state.error && <span className="text-sm text-[var(--color-danger)]">{state.error}</span>}
      </div>
      <p className="text-xs text-[var(--color-faint)]">
        Los cambios aplican en conversaciones nuevas. No hace falta reiniciar nada.
      </p>
    </form>
  );
}
