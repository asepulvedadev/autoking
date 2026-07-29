"use client";

import { useActionState } from "react";
import { guardarNegocio, type NegocioState } from "./actions";

export type Negocio = {
  negocio_nombre: string | null;
  industria: string | null;
  asistente: string | null;
  emoji: string | null;
  servicios: string | null;
  horario: string | null;
  ubicacion: string | null;
  tono: string | null;
  notas_negocio: string | null;
};

const campo =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-bright";
const label = "mb-1 block text-xs font-medium text-[var(--color-muted)]";

export function NegocioForm({ n }: { n: Negocio }) {
  const [state, action, pending] = useActionState<NegocioState, FormData>(guardarNegocio, {});

  return (
    <form action={action} className="mt-6 flex flex-col gap-5">
      <section className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-5">
        <h2 className="font-semibold text-white">Tu negocio</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="negocio_nombre">Nombre del negocio *</label>
            <input id="negocio_nombre" name="negocio_nombre" required defaultValue={n.negocio_nombre ?? ""} className={campo} />
          </div>
          <div>
            <label className={label} htmlFor="industria">A qué se dedica</label>
            <input id="industria" name="industria" defaultValue={n.industria ?? ""} placeholder="spa, barbería, consultorio…" className={campo} />
          </div>
          <div>
            <label className={label} htmlFor="ubicacion">Dónde están</label>
            <input id="ubicacion" name="ubicacion" defaultValue={n.ubicacion ?? ""} placeholder="Calle 123, Bogotá" className={campo} />
          </div>
          <div>
            <label className={label} htmlFor="horario">Horario de atención</label>
            <input id="horario" name="horario" defaultValue={n.horario ?? ""} placeholder="Lun a sáb 9am–7pm" className={campo} />
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-5">
        <h2 className="font-semibold text-white">Cómo se presenta tu agente</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Es la cara de tu negocio en WhatsApp. Ponele el nombre y el trato que usarías vos.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="asistente">Cómo se llama</label>
            <input id="asistente" name="asistente" defaultValue={n.asistente ?? ""} placeholder="Sofía" className={campo} />
          </div>
          <div>
            <label className={label} htmlFor="emoji">Su emoji</label>
            <input id="emoji" name="emoji" defaultValue={n.emoji ?? ""} placeholder="💆" maxLength={4} className={campo} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="tono">Cómo habla</label>
            <input id="tono" name="tono" defaultValue={n.tono ?? ""} placeholder="cercano y cálido, de usted, sin tecnicismos" className={campo} />
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-5">
        <h2 className="font-semibold text-white">Qué ofrecés</h2>
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <label className={label} htmlFor="servicios">Servicios (uno por línea, con precio si querés)</label>
            <textarea
              id="servicios"
              name="servicios"
              rows={5}
              defaultValue={n.servicios ?? ""}
              placeholder={"Corte de dama — $45.000\nManicure — $30.000"}
              className={`${campo} resize-y`}
            />
          </div>
          <div>
            <label className={label} htmlFor="notas_negocio">Algo más que deba saber</label>
            <textarea
              id="notas_negocio"
              name="notas_negocio"
              rows={3}
              defaultValue={n.notas_negocio ?? ""}
              placeholder="No atendemos sin cita. Estacionamiento gratis. Aceptamos tarjeta."
              className={`${campo} resize-y`}
            />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-6 py-2.5 text-sm font-semibold text-white shadow-cta disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
        {state.ok && !state.aviso && <span className="text-sm text-[var(--color-success)]">¡Guardado! Tu agente ya lo sabe ✅</span>}
        {state.aviso && <span className="text-sm text-[var(--color-gold)]">{state.aviso}</span>}
        {state.error && <span className="text-sm text-[var(--color-danger)]">{state.error}</span>}
      </div>
    </form>
  );
}
