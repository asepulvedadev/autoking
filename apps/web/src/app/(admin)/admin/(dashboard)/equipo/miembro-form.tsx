"use client";

import { useActionState } from "react";
import { crearMiembro, actualizarMiembro, eliminarMiembro, type EquipoState } from "./actions";

export type Miembro = {
  id: string;
  whatsapp: string;
  nombre: string;
  rol: string;
  activo: boolean;
  territorio_pais: string | null;
  territorio_ciudad: string | null;
  recibe_leads: boolean;
};

export const ROLES_EQUIPO = ["fundador", "admin", "vendedor", "soporte"];
export const PAISES = [
  { value: "", label: "— sin territorio —" },
  { value: "colombia", label: "🇨🇴 Colombia" },
  { value: "mexico", label: "🇲🇽 México" },
  { value: "all", label: "🌎 Todos (all)" },
];

const field = "w-full rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-bright";
const label = "mb-1 block text-xs text-[var(--color-muted)]";

/** Descripción legible del territorio de un miembro. */
export function territorioTexto(m: Miembro) {
  if (!m.territorio_pais) return "sin territorio";
  if (m.territorio_pais === "all") return "todo (Colombia + México)";
  const pais = m.territorio_pais === "colombia" ? "Colombia" : "México";
  return m.territorio_ciudad ? `${m.territorio_ciudad}, ${pais}` : `todo ${pais}`;
}

export function AgregarMiembro() {
  const [state, action, pending] = useActionState<EquipoState, FormData>(crearMiembro, {});
  return (
    <form action={action} className="mt-6 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-6">
      <h2 className="font-semibold text-white">Agregar miembro del equipo</h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">Los leads se reparten a quien tenga la zona del cliente asignada.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="nombre">Nombre *</label>
          <input id="nombre" name="nombre" required placeholder="Juan Pérez" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="whatsapp">WhatsApp *</label>
          <input id="whatsapp" name="whatsapp" required placeholder="+57 300 000 0000" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="rol">Rol</label>
          <select id="rol" name="rol" defaultValue="vendedor" className={field}>
            {ROLES_EQUIPO.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="territorio_pais">Territorio — país</label>
          <select id="territorio_pais" name="territorio_pais" defaultValue="" className={field}>
            {PAISES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="territorio_ciudad">Ciudad (vacío = todo el país)</label>
          <input id="territorio_ciudad" name="territorio_ciudad" placeholder="Bogotá (opcional)" className={field} />
        </div>
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <input type="checkbox" name="recibe_leads" defaultChecked className="h-4 w-4 accent-[color:var(--color-success)]" /> Recibe leads
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <input type="checkbox" name="activo" defaultChecked className="h-4 w-4 accent-[color:var(--color-success)]" /> Activo
          </label>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white shadow-cta transition-transform hover:-translate-y-0.5 disabled:opacity-60">
          {pending ? "Agregando…" : "Agregar"}
        </button>
        {state.ok && <span className="text-sm text-[var(--color-success)]">¡Agregado! ✅</span>}
        {state.error && <span className="text-sm text-[var(--color-danger)]">{state.error}</span>}
      </div>
    </form>
  );
}

/** Fila editable de un miembro: rol, territorio y flags, con guardar/borrar. */
export function MiembroRow({ m }: { m: Miembro }) {
  return (
    <form action={actualizarMiembro} className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-4">
      <input type="hidden" name="id" value={m.id} />
      <input type="hidden" name="nombre" value={m.nombre} />
      <input type="hidden" name="whatsapp" value={m.whatsapp} />
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-white">{m.nombre}</div>
          <div className="text-xs text-[var(--color-faint)]">+{m.whatsapp} · {territorioTexto(m)}</div>
        </div>
        <select name="rol" defaultValue={m.rol} className="rounded-lg border border-[var(--line)] bg-[var(--color-bg-2)] px-2 py-1.5 text-xs text-white">
          {ROLES_EQUIPO.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select name="territorio_pais" defaultValue={m.territorio_pais ?? ""} className="rounded-lg border border-[var(--line)] bg-[var(--color-bg-2)] px-2 py-1.5 text-xs text-white">
          {PAISES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <input name="territorio_ciudad" defaultValue={m.territorio_ciudad ?? ""} placeholder="ciudad" className="w-28 rounded-lg border border-[var(--line)] bg-[var(--color-bg-2)] px-2 py-1.5 text-xs text-white" />
        <label className="flex items-center gap-1 text-xs text-[var(--color-muted)]" title="Recibe leads">
          <input type="checkbox" name="recibe_leads" defaultChecked={m.recibe_leads} className="h-3.5 w-3.5 accent-[color:var(--color-success)]" /> leads
        </label>
        <label className="flex items-center gap-1 text-xs text-[var(--color-muted)]" title="Activo">
          <input type="checkbox" name="activo" defaultChecked={m.activo} className="h-3.5 w-3.5 accent-[color:var(--color-success)]" /> activo
        </label>
        <button type="submit" className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-medium text-white hover:bg-white/[0.06]">Guardar</button>
      </div>
      <div className="mt-2 text-right">
        <button
          type="submit" formAction={eliminarMiembro}
          onClick={(e) => { if (!confirm(`¿Quitar a ${m.nombre} del equipo?`)) e.preventDefault(); }}
          className="text-xs text-[var(--color-faint)] hover:text-[var(--color-danger)]"
        >
          Quitar del equipo
        </button>
      </div>
    </form>
  );
}
