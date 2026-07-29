"use client";

import { useActionState, useState } from "react";
import { cn } from "@autoking/ui";
import { ZonaSubida } from "@/components/zona-subida";
import { crearOEditarDocumento, subirComoDocumento, eliminarDocumento, type DocState } from "./actions";

export type Documento = {
  id: string;
  titulo: string;
  contenido_md: string;
  origen: string;
  chunks: number;
  updated_at: string;
};

const campo =
  "w-full rounded-xl border border-line bg-[var(--color-bg-2)] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-bright";

const ICONO: Record<string, string> = { pdf: "📕", imagen: "🖼️", texto: "📄", manual: "✍️", web: "🌐" };

/** Subir un archivo → se convierte a markdown editable. */
export function SubirDocumento({ agentSlug }: { agentSlug?: string }) {
  const [state, action, pending] = useActionState<DocState, FormData>(subirComoDocumento, {});

  return (
    <form action={action} className="rounded-[var(--radius-card)] border border-line bg-[var(--color-surface)] p-5">
      {agentSlug && <input type="hidden" name="agentSlug" value={agentSlug} />}
      <h3 className="font-semibold text-white">⚡ Subir un archivo</h3>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        <b className="text-white">PDF, foto o texto.</b> Lo convertimos a un documento markdown que
        vas a poder <b className="text-white">leer y editar</b>, y de ahí sale lo que el agente consulta.
      </p>
      <div className="mt-4">
        <ZonaSubida accept="application/pdf,image/*,.txt,.md" maxMB={20} ayuda="PDF, imagen o texto" />
      </div>
      <input name="titulo" placeholder="Título (opcional, si no usamos el nombre del archivo)" className={`${campo} mt-3`} />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "Convirtiendo…" : "Subir y convertir"}
        </button>
        {state.ok && <span className="text-sm text-[var(--color-success)]">{state.detalle}</span>}
        {state.error && <span className="text-sm text-[var(--color-danger)]">{state.error}</span>}
      </div>
    </form>
  );
}

/** Escribir un documento a mano. */
export function NuevoDocumento({ agentSlug }: { agentSlug?: string }) {
  const [state, action, pending] = useActionState<DocState, FormData>(crearOEditarDocumento, {});
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button onClick={() => setAbierto(true)} className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-white hover:border-blue-bright/50">
        ✍️ Escribir un documento
      </button>
    );
  }

  return (
    <form action={action} className="rounded-[var(--radius-card)] border border-line bg-[var(--color-surface)] p-5">
      {agentSlug && <input type="hidden" name="agentSlug" value={agentSlug} />}
      <input name="titulo" required placeholder="Título (ej: Servicios y precios)" className={campo} />
      <textarea
        name="contenido_md"
        required
        rows={12}
        placeholder={"## Servicios\n\nCorte de dama — $45.000\n\n## Horarios\n\nLunes a sábado de 9 a 19."}
        className={`${campo} mt-3 resize-y font-mono text-xs`}
      />
      <p className="mt-2 text-xs text-[var(--color-faint)]">
        Usá <code>##</code> para separar temas: cada sección se convierte en un fragmento distinto,
        y así el agente no mezcla precios con horarios.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="text-sm text-[var(--color-muted)] hover:text-white">Cancelar</button>
        {state.ok && <span className="text-sm text-[var(--color-success)]">{state.detalle}</span>}
        {state.error && <span className="text-sm text-[var(--color-danger)]">{state.error}</span>}
      </div>
    </form>
  );
}

/** Ver y editar un documento existente. */
export function DocumentoFila({ d, agentSlug }: { d: Documento; agentSlug?: string }) {
  const [modo, setModo] = useState<"cerrado" | "ver" | "editar">("cerrado");
  const [state, action, pending] = useActionState<DocState, FormData>(crearOEditarDocumento, {});

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-[var(--color-surface)] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xl">{ICONO[d.origen] ?? "📄"}</span>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-white">{d.titulo}</div>
          <div className="text-xs text-[var(--color-faint)]">
            {d.chunks} fragmento(s) · {d.origen} ·{" "}
            {new Date(d.updated_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
          </div>
        </div>
        <button onClick={() => setModo(modo === "ver" ? "cerrado" : "ver")} className="text-xs font-medium text-[var(--color-muted)] hover:text-white">
          {modo === "ver" ? "Ocultar" : "Ver"}
        </button>
        <button onClick={() => setModo(modo === "editar" ? "cerrado" : "editar")} className="text-xs font-medium text-blue-bright hover:underline">
          Editar
        </button>
        <form action={eliminarDocumento}>
          {agentSlug && <input type="hidden" name="agentSlug" value={agentSlug} />}
          <input type="hidden" name="documentoId" value={d.id} />
          <button
            type="submit"
            onClick={(e) => { if (!confirm(`¿Borrar "${d.titulo}"? El agente deja de saber eso.`)) e.preventDefault(); }}
            className="text-xs text-[var(--color-faint)] hover:text-[var(--color-danger)]"
          >
            Borrar
          </button>
        </form>
      </div>

      {modo === "ver" && (
        <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--color-bg-2)] p-3 text-xs text-[var(--color-muted)]">
          {d.contenido_md}
        </pre>
      )}

      {modo === "editar" && (
        <form action={action} className="mt-3">
          {agentSlug && <input type="hidden" name="agentSlug" value={agentSlug} />}
          <input type="hidden" name="documentoId" value={d.id} />
          <input name="titulo" defaultValue={d.titulo} required className={campo} />
          <textarea name="contenido_md" defaultValue={d.contenido_md} rows={16} required className={`${campo} mt-2 resize-y font-mono text-xs`} />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={pending} className={cn("rounded-full bg-blue-bright px-4 py-2 text-sm font-semibold text-white", pending && "opacity-60")}>
              {pending ? "Guardando…" : "Guardar y reprocesar"}
            </button>
            <button type="button" onClick={() => setModo("cerrado")} className="text-sm text-[var(--color-muted)]">Cancelar</button>
            {state.ok && <span className="text-sm text-[var(--color-success)]">{state.detalle}</span>}
            {state.error && <span className="text-sm text-[var(--color-danger)]">{state.error}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
