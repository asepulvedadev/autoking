"use client";

import { useActionState, useState } from "react";
import { cn } from "@autoking/ui";
import { guardarInterno, borrarInterno, type InternoState } from "./actions";

export type Interno = {
  id: string;
  clave: string;
  valor: string;
  descripcion: string | null;
  visibilidad: string;
};

const campo =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-bright";
const label = "mb-1 block text-xs font-medium text-[var(--color-muted)]";

export function AgregarInterno() {
  const [state, action, pending] = useActionState<InternoState, FormData>(guardarInterno, {});
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white shadow-cta"
      >
        + Agregar información interna
      </button>
    );
  }

  return (
    <form action={action} className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="clave">Nombre</label>
          <input id="clave" name="clave" required placeholder="Margen mínimo" className={campo} />
        </div>
        <div>
          <label className={label} htmlFor="visibilidad">¿Puede decirlo?</label>
          <select id="visibilidad" name="visibilidad" defaultValue="equipo" className={campo}>
            <option value="equipo">Solo a alguien de mi equipo</option>
            <option value="nunca">Nunca lo dice — solo lo usa para decidir</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="valor">Contenido</label>
          <textarea id="valor" name="valor" required rows={3} placeholder="Puedo dar hasta 15% de descuento sin consultar." className={`${campo} resize-y`} />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="descripcion">Para qué sirve (opcional)</label>
          <input id="descripcion" name="descripcion" placeholder="Cuándo aplicarlo" className={campo} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="text-sm text-[var(--color-muted)] hover:text-white">Cancelar</button>
        {state.ok && <span className="text-sm text-[var(--color-success)]">Guardado ✅</span>}
        {state.error && <span className="text-sm text-[var(--color-danger)]">{state.error}</span>}
      </div>
    </form>
  );
}

export function InternoFila({ i }: { i: Interno }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-white">{i.clave}</div>
          {i.descripcion && <div className="text-xs text-[var(--color-faint)]">{i.descripcion}</div>}
        </div>
        <span
          className={cn(
            "flex-none rounded-full border px-2.5 py-1 text-[11px] font-medium",
            i.visibilidad === "nunca"
              ? "border-[var(--color-danger)]/40 text-[var(--color-danger)]"
              : "border-[rgb(255_193_7_/_0.3)] text-[var(--color-gold)]",
          )}
        >
          {i.visibilidad === "nunca" ? "🔒 nunca lo dice" : "👥 solo al equipo"}
        </span>
        <button onClick={() => setVisible((v) => !v)} className="flex-none text-xs font-medium text-blue-bright hover:underline">
          {visible ? "Ocultar" : "Ver"}
        </button>
        <form action={borrarInterno} className="flex-none">
          <input type="hidden" name="id" value={i.id} />
          <button
            type="submit"
            onClick={(e) => { if (!confirm(`¿Borrar "${i.clave}"?`)) e.preventDefault(); }}
            className="text-xs text-[var(--color-faint)] hover:text-[var(--color-danger)]"
          >
            Borrar
          </button>
        </form>
      </div>
      <p className="mt-2 rounded-lg bg-[var(--color-bg-2)] p-3 text-sm text-[var(--color-muted)]">
        {visible ? i.valor : "••••••••••••••••••••"}
      </p>
    </div>
  );
}
