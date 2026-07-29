"use client";

import { useActionState, useState } from "react";
import { ZonaSubida } from "@/components/zona-subida";
import {
  agregarConocimiento,
  editarConocimiento,
  borrarConocimiento,
  subirDocumento,
  type ConocimientoState,
} from "./actions";

export type Chunk = {
  id: string;
  titulo: string | null;
  contenido: string;
  agente_id: string | null;
};

const campo =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-bright";

/**
 * Entrenamiento rápido: subir un archivo y que el agente lo aprenda solo.
 * Es la vía más veloz para pasar de "no sabe nada" a "sabe todo lo tuyo".
 */
export function SubirDocumento() {
  const [state, action, pending] = useActionState<ConocimientoState, FormData>(subirDocumento, {});

  return (
    <form action={action} className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-5">
      <h2 className="font-semibold text-white">⚡ Entrenamiento rápido</h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Subí un documento o una <b className="text-white">foto de tu carta o lista de precios</b> y tu
        agente lo aprende solo. Le sacamos el texto y lo dividimos por vos.
      </p>
      <div className="mt-4">
        <ZonaSubida accept="image/*,.txt,.md,text/plain,text/markdown" maxMB={8} ayuda="foto, .txt o .md" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Aprendiendo…" : "Enseñárselo"}
        </button>
        {state.ok && <span className="text-sm text-[var(--color-success)]">¡Listo! Ya lo aprendió ✅</span>}
        {state.error && <span className="text-sm text-[var(--color-danger)]">{state.error}</span>}
      </div>
    </form>
  );
}

export function AgregarConocimiento() {
  const [state, action, pending] = useActionState<ConocimientoState, FormData>(agregarConocimiento, {});
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="rounded-full border border-[var(--line-strong)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-blue-bright/50"
      >
        ✍️ O escribilo a mano
      </button>
    );
  }

  return (
    <form
      action={action}
      className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-5"
    >
      <h2 className="font-semibold text-white">Enseñarle algo a tu agente</h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Escribilo como se lo explicarías a un empleado nuevo. Ejemplo: <i>&quot;El corte de dama
        cuesta $45.000 e incluye lavado y secado&quot;</i>.
      </p>
      <input name="titulo" placeholder="Título corto (ej: Precio del corte)" className={`${campo} mt-4`} />
      <textarea
        name="contenido"
        required
        rows={4}
        placeholder="Contalo con detalle…"
        className={`${campo} mt-2 resize-y`}
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="text-sm text-[var(--color-muted)] hover:text-white"
        >
          Cancelar
        </button>
        {state.ok && <span className="text-sm text-[var(--color-success)]">¡Listo! Ya lo sabe ✅</span>}
        {state.error && <span className="text-sm text-[var(--color-danger)]">{state.error}</span>}
      </div>
    </form>
  );
}

export function ChunkPropio({ c }: { c: Chunk }) {
  const [editando, setEditando] = useState(false);
  const [state, action, pending] = useActionState<ConocimientoState, FormData>(editarConocimiento, {});

  if (editando) {
    return (
      <form action={action} className="rounded-[var(--radius-card)] border border-blue-bright/40 bg-[var(--color-surface)] p-4">
        <input type="hidden" name="id" value={c.id} />
        <input name="titulo" defaultValue={c.titulo ?? ""} className={campo} />
        <textarea name="contenido" defaultValue={c.contenido} rows={4} required className={`${campo} mt-2 resize-y`} />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-blue-bright px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Guardando…" : "Guardar"}
          </button>
          <button type="button" onClick={() => setEditando(false)} className="text-sm text-[var(--color-muted)]">
            Cancelar
          </button>
          {state.error && <span className="text-sm text-[var(--color-danger)]">{state.error}</span>}
        </div>
      </form>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-white">{c.titulo || "Sin título"}</div>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{c.contenido}</p>
        </div>
        <div className="flex flex-none gap-2">
          <button onClick={() => setEditando(true)} className="text-xs font-medium text-blue-bright hover:underline">
            Editar
          </button>
          <form action={borrarConocimiento}>
            <input type="hidden" name="id" value={c.id} />
            <button
              type="submit"
              onClick={(e) => {
                if (!confirm("¿Borrar esto de lo que sabe tu agente?")) e.preventDefault();
              }}
              className="text-xs text-[var(--color-faint)] hover:text-[var(--color-danger)]"
            >
              Borrar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
