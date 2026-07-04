"use client";

import { useActionState } from "react";
import Link from "next/link";
import { buttonVariants } from "@autoking/ui";
import type { AgentFormState } from "./actions";
import type { AgentConfig } from "@/lib/agents-bridge";

const field =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[var(--color-faint)] focus:border-blue-bright";
const label = "mb-1.5 block text-sm text-[var(--color-muted)]";

type Initial = (AgentConfig & { agentId?: string }) | undefined;

function servicesToText(services?: AgentConfig["services"]) {
  if (!services?.length) return "";
  return services.map((s) => [s.name, s.price, s.duration].filter(Boolean).join(" | ")).join("\n");
}

export function AgentForm({
  action,
  initial,
}: {
  action: (prev: AgentFormState, formData: FormData) => Promise<AgentFormState>;
  initial?: Initial;
}) {
  const [state, formAction, pending] = useActionState<AgentFormState, FormData>(action, {});
  const editing = Boolean(initial?.agentId);
  const slug = initial?.slug ?? initial?.agentId?.replace(/^client-/, "");

  return (
    <form action={formAction} className="mt-6 flex max-w-2xl flex-col gap-5">
      {slug && <input type="hidden" name="slug" value={slug} />}

      <div>
        <label className={label} htmlFor="business_name">Negocio *</label>
        <input id="business_name" name="business_name" required defaultValue={initial?.business_name ?? ""} placeholder="Barbería El Rey" className={field} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="industry">Rubro</label>
          <input id="industry" name="industry" defaultValue={initial?.industry ?? ""} placeholder="barbería" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="assistant_name">Nombre del asistente</label>
          <input id="assistant_name" name="assistant_name" defaultValue={initial?.assistant_name ?? ""} placeholder="Leo" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="emoji">Emoji</label>
          <input id="emoji" name="emoji" defaultValue={initial?.emoji ?? ""} placeholder="💈" maxLength={4} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="location">Ubicación</label>
          <input id="location" name="location" defaultValue={initial?.location ?? ""} placeholder="Calle 10 #5-20, Bogotá" className={field} />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="hours">Horario</label>
        <input id="hours" name="hours" defaultValue={initial?.hours ?? ""} placeholder="Lunes a sábado, 9:00 a.m. – 8:00 p.m." className={field} />
      </div>

      <div>
        <label className={label} htmlFor="services">Servicios y precios</label>
        <textarea
          id="services"
          name="services"
          rows={5}
          defaultValue={servicesToText(initial?.services)}
          placeholder={"Un servicio por línea:  Nombre | precio | duración\nCorte clásico | $25.000 | 30 min\nCorte + barba | $40.000 | 45 min"}
          className={field}
        />
        <p className="mt-1 text-xs text-[var(--color-faint)]">Un servicio por línea: <code>Nombre | precio | duración</code></p>
      </div>

      <div>
        <label className={label} htmlFor="tone">Tono</label>
        <input id="tone" name="tone" defaultValue={initial?.tone ?? ""} placeholder="cercano, relajado y colombiano (tuteo)" className={field} />
      </div>

      <div>
        <label className={label} htmlFor="notes">Notas</label>
        <textarea id="notes" name="notes" rows={2} defaultValue={initial?.notes ?? ""} placeholder="Aceptamos tarjeta y Nequi." className={field} />
      </div>

      {state.error && <p className="text-sm text-[var(--color-danger)]">{state.error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className={buttonVariants({ variant: "primary", className: "disabled:opacity-60" })}>
          {pending ? "Guardando…" : editing ? "Guardar cambios" : "Crear agente"}
        </button>
        <Link href="/admin/agentes" className={buttonVariants({ variant: "secondary" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
