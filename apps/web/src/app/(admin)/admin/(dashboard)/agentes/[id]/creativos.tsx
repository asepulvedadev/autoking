"use client";

import { useActionState, useRef } from "react";
import { ZonaSubida } from "@/components/zona-subida";
import { subirRecurso, toggleRecurso, eliminarRecurso, type RecursoState } from "./creativos-actions";

export type Recurso = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  url: string | null;
  activo: boolean;
};

const field =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[var(--color-faint)] focus:border-blue-bright";
const label = "mb-1.5 block text-sm text-[var(--color-muted)]";

/** Gestión de creativos DENTRO del agente: lo que ese agente puede enviar por WhatsApp. */
export function Creativos({ agentId, agenteId, recursos }: { agentId: string; agenteId: string; recursos: Recurso[] }) {
  const [state, action, pending] = useActionState<RecursoState, FormData>(subirRecurso, {});
  const ref = useRef<HTMLFormElement>(null);

  return (
    <div>
      <p className="text-sm text-[var(--color-muted)]">
        Imágenes y documentos que <b className="text-white">este agente</b> puede enviar por chat. Es la lista
        blanca: solo puede mandar lo que esté acá y activo.
      </p>

      {recursos.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {recursos.map((r) => (
            <div key={r.id} className="flex items-center gap-4 rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] p-3">
              {r.tipo === "imagen" && r.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.url} alt={r.nombre} className="h-14 w-20 flex-none rounded-lg border border-[var(--line)] object-cover" />
              ) : (
                <div className="grid h-14 w-20 flex-none place-items-center rounded-lg border border-[var(--line)] bg-[var(--color-surface)] text-xl">
                  {r.tipo === "documento" ? "📄" : "📝"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-white">{r.nombre}</span>
                  <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-[var(--color-gold)]">{r.slug}</code>
                </div>
                <div className="truncate text-xs text-[var(--color-faint)]">{r.descripcion || "— sin descripción —"}</div>
              </div>
              <form action={toggleRecurso}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="activo" value={String(!r.activo)} />
                <input type="hidden" name="agentId" value={agentId} />
                <button type="submit" className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${r.activo ? "border-[rgb(43_212_123_/_0.3)] bg-[rgb(43_212_123_/_0.14)] text-[var(--color-success)]" : "border-[var(--line)] text-[var(--color-faint)]"}`}>
                  {r.activo ? "Activo" : "Apagado"}
                </button>
              </form>
              <form action={eliminarRecurso} onSubmit={(e) => { if (!confirm(`¿Eliminar "${r.nombre}"?`)) e.preventDefault(); }}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="agentId" value={agentId} />
                <button type="submit" className="text-xs text-[var(--color-faint)] transition-colors hover:text-[var(--color-danger)]">Borrar</button>
              </form>
            </div>
          ))}
        </div>
      )}

      <form ref={ref} action={async (fd) => { await action(fd); ref.current?.reset(); }} className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] p-4">
        <input type="hidden" name="agentId" value={agentId} />
        <input type="hidden" name="agenteId" value={agenteId} />
        <h3 className="text-sm font-semibold text-white">Subir un creativo</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="nombre">Nombre *</label>
            <input id="nombre" name="nombre" required placeholder="Planes y precios" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="slug">id / slug (opcional)</label>
            <input id="slug" name="slug" placeholder="planes" className={field} />
          </div>
        </div>
        <div className="mt-4">
          <label className={label} htmlFor="descripcion">¿Cuándo debe enviarlo? *</label>
          <textarea id="descripcion" name="descripcion" rows={2} placeholder="Cuando pregunten precios…" className={field} />
        </div>
        <div className="mt-4">
          <ZonaSubida accept="image/*,application/pdf,.txt,.md" maxMB={8} ayuda="imagen, PDF o texto" />
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-[var(--color-muted)]">
          <input type="checkbox" name="aprender" defaultChecked className="h-4 w-4 accent-[color:var(--color-success)]" />
          También enseñarle el contenido (lo lee y lo suma a su conocimiento)
        </label>
        <div className="mt-4 flex items-center gap-3">
          <button type="submit" disabled={pending} className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white shadow-cta transition-transform hover:-translate-y-0.5 disabled:opacity-60">
            {pending ? "Subiendo…" : "Subir creativo"}
          </button>
          {state.ok && <span className="text-sm text-[var(--color-success)]">¡Listo! ✅</span>}
          {state.error && <span className="text-sm text-[var(--color-danger)]">{state.error}</span>}
        </div>
      </form>
    </div>
  );
}
