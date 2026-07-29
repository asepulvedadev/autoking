import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClienteForm, type Cliente } from "../cliente-form";
import { updateCliente } from "../actions";
import { DeleteClienteButton } from "./delete-button";
import { AgentSection } from "./agent-section";
import { WhatsappSection } from "./whatsapp-section";
import { ActivarAgente } from "./activar-agente";
import { ConocimientoSection, type Chunk } from "./conocimiento-section";
import { OnboardingLink } from "./onboarding-link";

export default async function EditClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("clientes").select("*").eq("id", id).single();
  if (!data) notFound();

  const { data: chunksData } = await supabase
    .from("knowledge_base")
    .select("id, titulo, contenido")
    .eq("cliente_id", id)
    .order("created_at", { ascending: false });
  const chunks = (chunksData ?? []) as Chunk[];
  const cliente = data as Cliente & {
    wa_status?: "sin_conectar" | "pendiente" | "conectado";
    kapso_setup_url?: string | null;
    kapso_setup_expires_at?: string | null;
    kapso_phone_number_id?: string | null;
    openclaw_agent_id?: string | null;
    onboarding_token?: string | null;
  };

  // ¿Tiene el mínimo para emitir factura electrónica?
  const org = cliente.fe_tipo_organizacion;
  const facturable = Boolean(
    cliente.fe_tipo_documento && cliente.fe_identificacion && org &&
    (org === "2" ? cliente.fe_nombres : org === "1" ? cliente.fe_razon_social : false),
  );

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/clientes" className="text-sm text-[var(--color-muted)] hover:text-white">← Clientes</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">{cliente.business_name}</h1>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${facturable ? "border-[rgb(43_212_123_/_0.3)] bg-[rgb(43_212_123_/_0.14)] text-[var(--color-success)]" : "border-[rgb(255_176_32_/_0.3)] bg-[rgb(255_176_32_/_0.12)] text-[var(--color-gold)]"}`}>
          {facturable ? "✓ Listo para facturar" : "Facturación incompleta"}
        </span>
      </div>

      <ClienteForm cliente={cliente} action={updateCliente} />

      <WhatsappSection
        clienteId={cliente.id}
        waStatus={cliente.wa_status ?? "sin_conectar"}
        setupUrl={cliente.kapso_setup_url ?? null}
        expiresAt={cliente.kapso_setup_expires_at ?? null}
        phoneNumberId={cliente.kapso_phone_number_id ?? null}
      />

      <ActivarAgente
        clienteId={cliente.id}
        waStatus={cliente.wa_status ?? "sin_conectar"}
        agentId={cliente.openclaw_agent_id ?? null}
      />

      {cliente.onboarding_token && <OnboardingLink token={cliente.onboarding_token} />}

      <ConocimientoSection clienteId={cliente.id} chunks={chunks} />

      <AgentSection clienteId={cliente.id} agentId={cliente.agent_id} />

      <div className="mt-10 border-t border-[var(--line)] pt-6">
        <p className="mb-3 text-sm text-[var(--color-faint)]">Zona peligrosa</p>
        <DeleteClienteButton id={cliente.id} name={cliente.business_name} />
      </div>
    </div>
  );
}
