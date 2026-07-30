import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@autoking/ui";
import { createClient } from "@/lib/supabase/server";
import { historialDeContacto, normalizarWhatsapp } from "@/features/crm/contacto";
import { EtapaSelector } from "@/features/crm/etapa-selector";
import { NotasUI } from "@/features/crm/notas-ui";
import { diasEnEtapa, etapaInfo, DIAS_FRENADO, type LeadCrm } from "@/features/crm/pipeline";
import { LeadActions } from "./lead-actions";

export const dynamic = "force-dynamic";

/**
 * Ficha de contacto: todo lo que sabemos de una persona en una pantalla.
 *
 * Antes esto listaba seis campos del lead y nada más. El resto de su historia
 * —sus citas, los seguimientos que le programó el agente, si ya es cliente—
 * vivía en otras pantallas y había que cruzarlas a mano.
 */

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-line py-3 last:border-0 sm:flex-row sm:gap-4">
      <div className="w-32 flex-none text-sm text-faint">{label}</div>
      <div className="text-sm text-ink">{children}</div>
    </div>
  );
}

function Bloque({ titulo, vacio, children }: { titulo: string; vacio?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <h2 className="text-sm font-semibold text-white">{titulo}</h2>
      {children ?? <p className="mt-3 text-sm text-faint">{vacio}</p>}
    </div>
  );
}

const FECHA = { dateStyle: "medium", timeStyle: "short" } as const;

export default async function FichaContactoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("leads").select("*").eq("id", id).single();
  if (!data) notFound();

  const lead = data as LeadCrm;
  const wa = normalizarWhatsapp(lead.whatsapp);
  const historial = await historialDeContacto(lead.whatsapp);

  const info = etapaInfo(lead.etapa);
  const dias = diasEnEtapa(lead.etapa_desde);
  const abierto = !["ganado", "perdido"].includes(lead.etapa);
  const frenado = abierto && dias >= DIAS_FRENADO;

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/leads" className="text-sm text-muted hover:text-white">
        ← Leads
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">{lead.name}</h1>
        <span className={cn("rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-medium", info.color)}>
          {info.label}
        </span>
        {/* Un lead frenado hace semanas no se distingue en una lista ordenada
            por fecha de creación. Acá sí. */}
        {frenado && (
          <span className="rounded-[var(--radius-sm)] border border-[rgb(255_176_32_/_0.3)] bg-[rgb(255_176_32_/_0.14)] px-2.5 py-1 text-xs font-medium text-gold">
            ⏳ {dias} días sin moverse
          </span>
        )}
        {historial.cliente && (
          <span className="rounded-[var(--radius-sm)] border border-[rgb(43_212_123_/_0.3)] bg-[rgb(43_212_123_/_0.14)] px-2.5 py-1 text-xs font-medium text-success">
            Ya es cliente
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        {/* ── Columna izquierda: quién es y qué se hizo ── */}
        <div className="space-y-5">
          <div className="rounded-[var(--radius-card)] border border-line bg-surface px-5">
            <Dato label="Negocio">{lead.business || "—"}</Dato>
            <Dato label="WhatsApp">
              {wa ? (
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener" className="text-blue-bright hover:underline">
                  {lead.whatsapp}
                </a>
              ) : (
                "—"
              )}
            </Dato>
            <Dato label="Email">
              {lead.email ? (
                <a href={`mailto:${lead.email}`} className="text-blue-bright hover:underline">
                  {lead.email}
                </a>
              ) : (
                "—"
              )}
            </Dato>
            <Dato label="Mensaje">{lead.message || "—"}</Dato>
            <Dato label="Origen">{lead.source}</Dato>
            <Dato label="Recibido">{new Date(lead.created_at).toLocaleString("es-CO", FECHA)}</Dato>
          </div>

          <EtapaSelector leadId={lead.id} etapa={lead.etapa} motivoPerdida={lead.motivo_perdida} />

          <NotasUI whatsapp={wa} leadId={lead.id} agenteId={lead.agente_id} notas={historial.notas} />
        </div>

        {/* ── Columna derecha: qué pasó con esta persona ── */}
        <div className="space-y-5">
          {historial.cliente && (
            <Bloque titulo="Cliente">
              <div className="mt-3 space-y-1 text-sm">
                <p className="text-white">{historial.cliente.business_name ?? "—"}</p>
                <p className="text-muted">
                  Plan {historial.cliente.plan ?? "—"} · {historial.cliente.status ?? "—"}
                </p>
                <Link
                  href={`/admin/clientes/${historial.cliente.id}`}
                  className="inline-block pt-1 text-sm font-semibold text-blue-bright hover:underline"
                >
                  Abrir ficha de cliente →
                </Link>
              </div>
            </Bloque>
          )}

          <Bloque titulo="Citas" vacio="Sin citas agendadas.">
            {historial.citas.length > 0 && (
              <ul className="mt-3 space-y-2">
                {historial.citas.map((c) => (
                  <li key={c.id} className="rounded-[var(--radius-sm)] border border-line bg-bg-2 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white">{new Date(c.inicio).toLocaleString("es-CO", FECHA)}</span>
                      <span className="text-xs text-faint">{c.estado}</span>
                    </div>
                    {c.recurso && <p className="mt-1 text-xs text-muted">{c.recurso}</p>}
                    {c.notas && <p className="mt-1 text-xs text-muted">{c.notas}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Bloque>

          <Bloque titulo="Seguimientos del agente" vacio="El agente no programó seguimientos.">
            {historial.seguimientos.length > 0 && (
              <ul className="mt-3 space-y-2">
                {historial.seguimientos.map((s) => (
                  <li key={s.id} className="rounded-[var(--radius-sm)] border border-line bg-bg-2 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-white">{s.motivo}</span>
                      <span className="text-xs text-faint">{s.estado}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(s.programado).toLocaleString("es-CO", FECHA)}
                      {s.intentos > 0 && ` · ${s.intentos} intento(s)`}
                    </p>
                    {s.contexto && <p className="mt-1 text-xs text-muted">{s.contexto}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Bloque>

          <LeadActions id={lead.id} status={lead.status} name={lead.name} />
        </div>
      </div>
    </div>
  );
}
