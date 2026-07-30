"use client";

import { useActionState, useState } from "react";
import { cn } from "@autoking/ui";
import {
  guardarServicio,
  borrarServicio,
  guardarHorario,
  borrarHorario,
  cancelarCita,
  type AgendaState,
} from "./actions";

export const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export type Servicio = { id: string; nombre: string; duracion_min: number; precio: number | null };
export type Horario = { id: string; dia_semana: number; abre: string; cierra: string };
export type Cita = {
  id: string;
  cliente_nombre: string | null;
  cliente_whatsapp: string | null;
  inicio: string;
  estado: string;
  servicios: { nombre: string } | { nombre: string }[] | null;
};

const campo =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm text-white outline-none focus:border-blue-bright";

const ESTADO_COLOR: Record<string, string> = {
  confirmada: "border-[rgb(43_212_123_/_0.3)] bg-[rgb(43_212_123_/_0.14)] text-[var(--color-success)]",
  pendiente: "border-[rgb(255_193_7_/_0.3)] bg-[rgb(255_193_7_/_0.1)] text-[var(--color-gold)]",
  cancelada: "border-[var(--line)] text-[var(--color-faint)]",
};

export function Citas({ citas, tz }: { citas: Cita[]; tz: string }) {
  if (citas.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] p-10 text-center text-sm text-[var(--color-muted)]">
        No hay citas próximas. Cuando tu agente agende una, aparece aquí.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {citas.map((c) => {
        const s = Array.isArray(c.servicios) ? c.servicios[0] : c.servicios;
        const d = new Date(c.inicio);
        return (
          <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-4">
            <div className="flex-none text-center">
              <div className="font-display text-lg font-extrabold text-white">
                {new Intl.DateTimeFormat("es-CO", { timeZone: tz, day: "2-digit" }).format(d)}
              </div>
              <div className="text-[11px] uppercase text-[var(--color-faint)]">
                {new Intl.DateTimeFormat("es-CO", { timeZone: tz, month: "short" }).format(d)}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-white">{c.cliente_nombre || "Sin nombre"}</div>
              <div className="text-xs text-[var(--color-faint)]">
                {new Intl.DateTimeFormat("es-CO", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(d)}
                {s?.nombre ? ` · ${s.nombre}` : ""}
                {c.cliente_whatsapp ? ` · +${c.cliente_whatsapp}` : ""}
              </div>
            </div>
            <span className={cn("flex-none rounded-full border px-2.5 py-1 text-xs font-medium", ESTADO_COLOR[c.estado] ?? "")}>
              {c.estado}
            </span>
            {c.estado !== "cancelada" && (
              <form action={cancelarCita} className="flex-none">
                <input type="hidden" name="id" value={c.id} />
                <button
                  type="submit"
                  onClick={(e) => { if (!confirm("¿Cancelar esta cita?")) e.preventDefault(); }}
                  className="text-xs text-[var(--color-faint)] hover:text-[var(--color-danger)]"
                >
                  Cancelar
                </button>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Servicios({ servicios }: { servicios: Servicio[] }) {
  const [state, action, pending] = useActionState<AgendaState, FormData>(guardarServicio, {});
  const [abierto, setAbierto] = useState(false);

  return (
    <div>
      <div className="flex flex-col gap-2">
        {servicios.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--color-surface)] px-4 py-3">
            <div className="min-w-0 flex-1">
              <span className="font-medium text-white">{s.nombre}</span>
              <span className="ml-2 text-xs text-[var(--color-faint)]">
                {s.duracion_min} min{s.precio ? ` · $${Number(s.precio).toLocaleString("es-CO")}` : ""}
              </span>
            </div>
            <form action={borrarServicio}>
              <input type="hidden" name="id" value={s.id} />
              <button type="submit" className="text-xs text-[var(--color-faint)] hover:text-[var(--color-danger)]">Quitar</button>
            </form>
          </div>
        ))}
        {servicios.length === 0 && (
          <p className="text-sm text-[var(--color-muted)]">
            Sin servicios cargados. Tu agente necesita al menos uno para poder agendar.
          </p>
        )}
      </div>

      {abierto ? (
        <form action={action} className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <input name="nombre" required placeholder="Corte de dama" className={campo} />
            <input name="duracion_min" type="number" min={5} max={480} defaultValue={30} placeholder="minutos" className={campo} />
            <input name="precio" placeholder="45000 (opcional)" className={campo} />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button type="submit" disabled={pending} className="rounded-full bg-blue-bright px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {pending ? "Guardando…" : "Agregar"}
            </button>
            <button type="button" onClick={() => setAbierto(false)} className="text-sm text-[var(--color-muted)]">Cancelar</button>
            {state.error && <span className="text-sm text-[var(--color-danger)]">{state.error}</span>}
          </div>
        </form>
      ) : (
        <button onClick={() => setAbierto(true)} className="mt-3 text-sm font-medium text-blue-bright hover:underline">
          + Agregar servicio
        </button>
      )}
    </div>
  );
}

export function Horarios({ horarios }: { horarios: Horario[] }) {
  const [state, action, pending] = useActionState<AgendaState, FormData>(guardarHorario, {});
  const [abierto, setAbierto] = useState(false);

  return (
    <div>
      <div className="flex flex-col gap-2">
        {horarios.map((h) => (
          <div key={h.id} className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--color-surface)] px-4 py-3">
            <span className="min-w-0 flex-1 text-sm text-white">
              <b>{DIAS[h.dia_semana]}</b>
              <span className="ml-2 text-[var(--color-muted)]">{h.abre.slice(0, 5)} a {h.cierra.slice(0, 5)}</span>
            </span>
            <form action={borrarHorario}>
              <input type="hidden" name="id" value={h.id} />
              <button type="submit" className="text-xs text-[var(--color-faint)] hover:text-[var(--color-danger)]">Quitar</button>
            </form>
          </div>
        ))}
        {horarios.length === 0 && (
          <p className="text-sm text-[var(--color-muted)]">
            Sin horario cargado. Sin esto tu agente no sabe cuándo puede ofrecer turnos.
          </p>
        )}
      </div>

      {abierto ? (
        <form action={action} className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <select name="dia_semana" defaultValue="1" className={campo}>
              {DIAS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
            <input name="abre" type="time" defaultValue="09:00" required className={campo} />
            <input name="cierra" type="time" defaultValue="18:00" required className={campo} />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button type="submit" disabled={pending} className="rounded-full bg-blue-bright px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {pending ? "Guardando…" : "Agregar"}
            </button>
            <button type="button" onClick={() => setAbierto(false)} className="text-sm text-[var(--color-muted)]">Cancelar</button>
            {state.error && <span className="text-sm text-[var(--color-danger)]">{state.error}</span>}
          </div>
        </form>
      ) : (
        <button onClick={() => setAbierto(true)} className="mt-3 text-sm font-medium text-blue-bright hover:underline">
          + Agregar franja horaria
        </button>
      )}
    </div>
  );
}
