import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type Lead } from "../lead-status";
import { LeadActions } from "./lead-actions";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[var(--line)] py-3 last:border-0 sm:flex-row sm:gap-4">
      <div className="w-40 flex-none text-sm text-[var(--color-faint)]">{label}</div>
      <div className="text-sm text-[var(--color-ink)]">{children}</div>
    </div>
  );
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("leads").select("*").eq("id", id).single();
  if (!data) notFound();
  const lead = data as Lead;
  const waNumber = lead.whatsapp?.replace(/[^\d]/g, "");

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/leads" className="text-sm text-[var(--color-muted)] hover:text-white">← Leads</Link>
      <h1 className="mt-2 font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">{lead.name}</h1>

      <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] px-6">
        <Row label="Negocio">{lead.business || "—"}</Row>
        <Row label="WhatsApp">
          {waNumber ? (
            <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener" className="text-blue-bright hover:underline">
              {lead.whatsapp}
            </a>
          ) : (
            "—"
          )}
        </Row>
        <Row label="Email">
          {lead.email ? (
            <a href={`mailto:${lead.email}`} className="text-blue-bright hover:underline">{lead.email}</a>
          ) : (
            "—"
          )}
        </Row>
        <Row label="Mensaje">{lead.message || "—"}</Row>
        <Row label="Origen">{lead.source}</Row>
        <Row label="Recibido">
          {new Date(lead.created_at).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}
        </Row>
      </div>

      <LeadActions id={lead.id} status={lead.status} name={lead.name} />
    </div>
  );
}
