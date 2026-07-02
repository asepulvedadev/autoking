"use client";

import { useActionState } from "react";
import Link from "next/link";
import { buttonVariants } from "@autoking/ui";
import type { ClienteState } from "./actions";

export type Cliente = {
  id: string;
  business_name: string;
  contact_name: string | null;
  whatsapp: string | null;
  email: string | null;
  plan: string | null;
  status: string;
  industry: string | null;
  notes: string | null;
};

export const PLANES = [
  { value: "recepcion", label: "Recepción ($90)" },
  { value: "agenda", label: "Agenda ($150)" },
  { value: "ventas", label: "Ventas ($250)" },
];
export const ESTADOS = [
  { value: "prueba", label: "En prueba" },
  { value: "activo", label: "Activo" },
  { value: "pausado", label: "Pausado" },
  { value: "cancelado", label: "Cancelado" },
];

const field =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[var(--color-faint)] focus:border-blue-bright";
const label = "mb-1.5 block text-sm text-[var(--color-muted)]";

export function ClienteForm({
  cliente,
  action,
}: {
  cliente?: Cliente;
  action: (prev: ClienteState, formData: FormData) => Promise<ClienteState>;
}) {
  const [state, formAction, pending] = useActionState<ClienteState, FormData>(action, {});

  return (
    <form action={formAction} className="mt-6 flex max-w-2xl flex-col gap-5">
      {cliente && <input type="hidden" name="id" value={cliente.id} />}

      <div>
        <label className={label} htmlFor="business_name">Negocio *</label>
        <input id="business_name" name="business_name" required defaultValue={cliente?.business_name ?? ""} placeholder="Spa Bella" className={field} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="contact_name">Contacto</label>
          <input id="contact_name" name="contact_name" defaultValue={cliente?.contact_name ?? ""} placeholder="María González" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="whatsapp">WhatsApp</label>
          <input id="whatsapp" name="whatsapp" defaultValue={cliente?.whatsapp ?? ""} placeholder="+57 300 000 0000" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="email">Email</label>
          <input id="email" name="email" type="email" defaultValue={cliente?.email ?? ""} placeholder="cliente@email.com" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="industry">Rubro</label>
          <input id="industry" name="industry" defaultValue={cliente?.industry ?? ""} placeholder="Estética" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="plan">Plan</label>
          <select id="plan" name="plan" defaultValue={cliente?.plan ?? ""} className={field}>
            <option value="">— Sin plan —</option>
            {PLANES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="status">Estado</label>
          <select id="status" name="status" defaultValue={cliente?.status ?? "prueba"} className={field}>
            {ESTADOS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={label} htmlFor="notes">Notas</label>
        <textarea id="notes" name="notes" rows={3} defaultValue={cliente?.notes ?? ""} placeholder="Notas internas…" className={field} />
      </div>

      {state.error && <p className="text-sm text-[var(--color-danger)]">{state.error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className={buttonVariants({ variant: "primary", className: "disabled:opacity-60" })}>
          {pending ? "Guardando…" : cliente ? "Guardar cambios" : "Crear cliente"}
        </button>
        <Link href="/admin/clientes" className={buttonVariants({ variant: "secondary" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
