"use client";

import { useActionState, useRef } from "react";
import { guardarOnboarding, agregarConocimientoPublico, subirDocumento, type OnboardingState } from "../actions";

export type OnboardingCliente = {
  id: string;
  business_name: string;
  asistente: string | null;
  emoji: string | null;
  servicios: string | null;
  horario: string | null;
  ubicacion: string | null;
  tono: string | null;
  notas_negocio: string | null;
};
export type Chunk = { id: string; titulo: string | null; contenido: string };

const field =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[var(--color-faint)] focus:border-blue-bright";
const label = "mb-1.5 block text-sm text-[var(--color-muted)]";
const card = "mt-6 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-6";
const btn =
  "rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white shadow-cta transition-transform hover:-translate-y-0.5 disabled:opacity-60";

export function OnboardingForm({ token, cliente, chunks }: { token: string; cliente: OnboardingCliente; chunks: Chunk[] }) {
  const [infoState, saveInfo, savingInfo] = useActionState<OnboardingState, FormData>(guardarOnboarding, {});
  const [docState, uploadDoc, uploadingDoc] = useActionState<OnboardingState, FormData>(subirDocumento, {});
  const addRef = useRef<HTMLFormElement>(null);

  return (
    <>
      {/* Info del negocio */}
      <form action={saveInfo} className={card}>
        <input type="hidden" name="token" value={token} />
        <h2 className="font-semibold text-white">Tu negocio</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="asistente">Nombre del asistente</label>
            <input id="asistente" name="asistente" defaultValue={cliente.asistente ?? ""} placeholder="Sofía" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="emoji">Emoji</label>
            <input id="emoji" name="emoji" defaultValue={cliente.emoji ?? ""} placeholder="💇" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="ubicacion">Ubicación</label>
            <input id="ubicacion" name="ubicacion" defaultValue={cliente.ubicacion ?? ""} placeholder="Calle 10 #5-20" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="tono">¿Cómo querés que hable?</label>
            <input id="tono" name="tono" defaultValue={cliente.tono ?? ""} placeholder="cálido y cercano (tuteo)" className={field} />
          </div>
        </div>
        <div className="mt-5">
          <label className={label} htmlFor="servicios">Servicios y precios (uno por línea)</label>
          <textarea id="servicios" name="servicios" rows={4} defaultValue={cliente.servicios ?? ""} placeholder={"Corte de dama — $40.000\nManicure — $25.000"} className={field} />
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="horario">Horario de atención</label>
            <textarea id="horario" name="horario" rows={3} defaultValue={cliente.horario ?? ""} placeholder={"Lun-Vie 9-19\nSáb 9-14"} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="notas_negocio">Otras cosas que debe saber</label>
            <textarea id="notas_negocio" name="notas_negocio" rows={3} defaultValue={cliente.notas_negocio ?? ""} placeholder="Promos, políticas, formas de pago…" className={field} />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button type="submit" disabled={savingInfo} className={btn}>{savingInfo ? "Guardando…" : "Guardar"}</button>
          {infoState.ok && <span className="text-sm text-[var(--color-success)]">¡Guardado! ✅</span>}
          {infoState.error && <span className="text-sm text-[var(--color-danger)]">{infoState.error}</span>}
        </div>
      </form>

      {/* Conocimiento */}
      <div className={card}>
        <h2 className="font-semibold text-white">Preguntas frecuentes y datos ({chunks.length})</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Cosas puntuales que tu asistente debe responder.</p>

        {chunks.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {chunks.map((c) => (
              <li key={c.id} className="rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] p-3">
                {c.titulo && <div className="text-sm font-medium text-white">{c.titulo}</div>}
                <div className="truncate text-xs text-[var(--color-muted)]">{c.contenido}</div>
              </li>
            ))}
          </ul>
        )}

        <form ref={addRef} action={async (fd) => { await agregarConocimientoPublico(fd); addRef.current?.reset(); }} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="token" value={token} />
          <input name="titulo" placeholder="Tema (ej: ¿Atienden domingos?)" className={field} />
          <textarea name="contenido" required rows={2} placeholder="La respuesta…" className={field} />
          <div><button type="submit" className={btn}>+ Agregar</button></div>
        </form>
      </div>

      {/* Subir documento */}
      <form action={uploadDoc} className={card}>
        <input type="hidden" name="token" value={token} />
        <h2 className="font-semibold text-white">Subir un documento o foto</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Un texto (.txt, .md) o una <b className="text-white">foto de tu lista de precios / menú / flyer</b>. La leemos y tu asistente la aprende.</p>
        <input type="file" name="file" accept=".txt,.md,text/plain,text/markdown,image/*" className="mt-4 block w-full text-sm text-[var(--color-muted)] file:mr-4 file:rounded-full file:border-0 file:bg-white/[0.08] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-white/[0.14]" />
        <div className="mt-4 flex items-center gap-3">
          <button type="submit" disabled={uploadingDoc} className={btn}>{uploadingDoc ? "Procesando…" : "Subir y aprender"}</button>
          {docState.ok && <span className="text-sm text-[var(--color-success)]">¡Aprendido! ✅</span>}
          {docState.error && <span className="text-sm text-[var(--color-danger)]">{docState.error}</span>}
        </div>
      </form>

      <p className="mt-6 text-center text-xs text-[var(--color-faint)]">AutoKing · tu imperio, en piloto automático</p>
    </>
  );
}
