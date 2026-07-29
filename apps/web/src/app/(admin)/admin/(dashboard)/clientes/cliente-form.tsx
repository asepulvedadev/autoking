"use client";

import { useActionState, useState } from "react";
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
  agent_id: string | null;
  asistente: string | null;
  emoji: string | null;
  servicios: string | null;
  horario: string | null;
  ubicacion: string | null;
  tono: string | null;
  notas_negocio: string | null;
  fe_tipo_documento: string | null;
  fe_identificacion: string | null;
  fe_dv: string | null;
  fe_tipo_organizacion: string | null;
  fe_razon_social: string | null;
  fe_nombres: string | null;
  fe_tributo: string | null;
  fe_municipio_codigo: string | null;
  fe_direccion: string | null;
};

/** Catálogos reales de Factus (DIAN) — códigos de las tablas de referencia. */
export const TIPOS_DOCUMENTO = [
  { value: "13", label: "Cédula de ciudadanía" },
  { value: "31", label: "NIT" },
  { value: "22", label: "Cédula de extranjería" },
  { value: "21", label: "Tarjeta de extranjería" },
  { value: "41", label: "Pasaporte" },
  { value: "42", label: "Documento de identificación extranjero" },
  { value: "50", label: "NIT de otro país" },
  { value: "11", label: "Registro civil" },
  { value: "12", label: "Tarjeta de identidad" },
  { value: "91", label: "NUIP" },
];
export const TIPOS_ORGANIZACION = [
  { value: "2", label: "Persona Natural" },
  { value: "1", label: "Persona Jurídica" },
];
export const TRIBUTOS = [
  { value: "ZZ", label: "No aplica" },
  { value: "01", label: "IVA" },
];

/**
 * Los valores son los SLUGS canónicos de la tabla `planes` (FK clientes.plan → planes.slug).
 * Sin precios en el label: los precios viven en la DB y cambian — hardcodearlos acá los deja viejos.
 */
export const PLANES = [
  { value: "basico", label: "Básico — Recepción" },
  { value: "pro", label: "Pro — Agenda" },
  { value: "imperio", label: "Imperio — Ventas" },
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
  const [tipoOrg, setTipoOrg] = useState(cliente?.fe_tipo_organizacion ?? "2");
  const [tipoDoc, setTipoDoc] = useState(cliente?.fe_tipo_documento ?? "13");
  const esNatural = tipoOrg === "2";
  const esNit = tipoDoc === "31";

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
        <label className={label} htmlFor="notes">Notas internas</label>
        <textarea id="notes" name="notes" rows={2} defaultValue={cliente?.notes ?? ""} placeholder="Notas del equipo (no las ve el agente)…" className={field} />
      </div>

      {/* Info del negocio: alimenta la persona + el conocimiento del agente del cliente */}
      <div className="mt-2 border-t border-[var(--line)] pt-6">
        <h2 className="font-display text-lg font-bold text-white">Info del negocio (para el agente)</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Con esto se entrena el agente que atiende el WhatsApp del cliente.</p>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="asistente">Nombre del asistente</label>
            <input id="asistente" name="asistente" defaultValue={cliente?.asistente ?? ""} placeholder="Sofía" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="emoji">Emoji</label>
            <input id="emoji" name="emoji" defaultValue={cliente?.emoji ?? ""} placeholder="💇" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="ubicacion">Ubicación</label>
            <input id="ubicacion" name="ubicacion" defaultValue={cliente?.ubicacion ?? ""} placeholder="Calle 10 #5-20, Bogotá" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="tono">Tono</label>
            <input id="tono" name="tono" defaultValue={cliente?.tono ?? ""} placeholder="cálido y cercano (tuteo)" className={field} />
          </div>
        </div>

        <div className="mt-5">
          <label className={label} htmlFor="servicios">Servicios (uno por línea)</label>
          <textarea id="servicios" name="servicios" rows={4} defaultValue={cliente?.servicios ?? ""} placeholder={"Corte de dama — $40.000\nManicure — $25.000\nDepilación…"} className={field} />
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="horario">Horario</label>
            <textarea id="horario" name="horario" rows={3} defaultValue={cliente?.horario ?? ""} placeholder={"Lun-Vie 9-19\nSáb 9-14"} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="notas_negocio">Notas de conocimiento</label>
            <textarea id="notas_negocio" name="notas_negocio" rows={3} defaultValue={cliente?.notas_negocio ?? ""} placeholder="Políticas, promos, lo que el agente debe saber…" className={field} />
          </div>
        </div>
      </div>

      {/* Datos de facturación electrónica (DIAN / Factus) */}
      <div className="mt-2 border-t border-[var(--line)] pt-6">
        <h2 className="font-display text-lg font-bold text-white">Facturación electrónica (DIAN)</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Datos mínimos para poder emitirle una factura electrónica. Se los pedís al cliente cuando cierra.
        </p>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="fe_tipo_organizacion">Tipo de persona *</label>
            <select id="fe_tipo_organizacion" name="fe_tipo_organizacion" value={tipoOrg} onChange={(e) => setTipoOrg(e.target.value)} className={field}>
              {TIPOS_ORGANIZACION.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="fe_tipo_documento">Tipo de documento *</label>
            <select id="fe_tipo_documento" name="fe_tipo_documento" value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)} className={field}>
              {TIPOS_DOCUMENTO.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="fe_identificacion">Número de documento *</label>
            <input id="fe_identificacion" name="fe_identificacion" defaultValue={cliente?.fe_identificacion ?? ""} placeholder={esNit ? "900123456 (sin dígito de verificación)" : "1234567890"} className={field} />
          </div>
          {esNit && (
            <div>
              <label className={label} htmlFor="fe_dv">Dígito de verificación (DV)</label>
              <input id="fe_dv" name="fe_dv" defaultValue={cliente?.fe_dv ?? ""} placeholder="7 (si no lo sabés, se calcula solo)" className={field} />
            </div>
          )}
        </div>

        {esNatural ? (
          <div className="mt-5">
            <label className={label} htmlFor="fe_nombres">Nombres y apellidos *</label>
            <input id="fe_nombres" name="fe_nombres" defaultValue={cliente?.fe_nombres ?? ""} placeholder="María González Pérez" className={field} />
          </div>
        ) : (
          <div className="mt-5">
            <label className={label} htmlFor="fe_razon_social">Razón social *</label>
            <input id="fe_razon_social" name="fe_razon_social" defaultValue={cliente?.fe_razon_social ?? ""} placeholder="Spa Bella S.A.S." className={field} />
          </div>
        )}

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="fe_direccion">Dirección</label>
            <input id="fe_direccion" name="fe_direccion" defaultValue={cliente?.fe_direccion ?? ""} placeholder="Calle 10 #5-20" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="fe_municipio_codigo">Código de municipio (DANE)</label>
            <input id="fe_municipio_codigo" name="fe_municipio_codigo" defaultValue={cliente?.fe_municipio_codigo ?? ""} placeholder="11001 (Bogotá)" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="fe_tributo">Tributo</label>
            <select id="fe_tributo" name="fe_tributo" defaultValue={cliente?.fe_tributo ?? "ZZ"} className={field}>
              {TRIBUTOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <p className="mt-2 text-xs text-[var(--color-faint)]">
          El email de la factura es el de arriba. Para NIT, si no ponés el DV, la DIAN lo calcula.
        </p>
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
