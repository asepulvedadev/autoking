"use client";

import { useActionState } from "react";
import Link from "next/link";
import { crearAgenteAction, type AgenteState } from "./actions";

const field =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[var(--color-faint)] focus:border-blue-bright";
const label = "mb-1.5 block text-sm text-[var(--color-muted)]";

export function NuevoAgente() {
  const [state, action, pending] = useActionState<AgenteState, FormData>(crearAgenteAction, {});

  return (
    <form action={action} className="mt-6 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-6">
      <h2 className="font-semibold text-white">Crear un agente</h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Genera un AgentPackage completo desde el template: identidad, skills, herramientas, policies, conocimiento y evals.
      </p>

      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="negocio">Negocio *</label>
          <input id="negocio" name="negocio" required placeholder="Spa Aurora" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="rubro">Rubro</label>
          <input id="rubro" name="rubro" placeholder="spa, odontología, peluquería…" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="asistente">Nombre del asistente</label>
          <input id="asistente" name="asistente" placeholder="Sofía" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="emoji">Emoji</label>
          <input id="emoji" name="emoji" placeholder="💆" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="ubicacion">Ubicación</label>
          <input id="ubicacion" name="ubicacion" placeholder="Calle 10 #5-20" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="tenantId">Tenant ID (cliente en la DB)</label>
          <input id="tenantId" name="tenantId" placeholder="uuid del cliente (opcional)" className={field} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="servicios">Servicios (uno por línea)</label>
          <textarea id="servicios" name="servicios" rows={3} placeholder={"Masaje relajante — $120.000\nManicure — $28.000"} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="horario">Horario</label>
          <textarea id="horario" name="horario" rows={3} placeholder={"Lun-Vie 9-19\nSáb 9-14"} className={field} />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white shadow-cta transition-transform hover:-translate-y-0.5 disabled:opacity-60">
          {pending ? "Creando…" : "Crear agente"}
        </button>
        {state.ok && state.agentId && (
          <Link href={`/admin/agentes/${state.agentId}`} className="text-sm font-medium text-[var(--color-success)] hover:underline">
            ¡Creado! Configurar {state.agentId} →
          </Link>
        )}
        {state.error && <span className="text-sm text-[var(--color-danger)]">{state.error}</span>}
      </div>
    </form>
  );
}
