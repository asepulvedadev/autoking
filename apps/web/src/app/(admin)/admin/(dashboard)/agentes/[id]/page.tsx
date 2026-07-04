import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgentConfig } from "@/lib/agents-bridge";
import { AgentForm } from "../agent-form";
import { saveAgent } from "../actions";
import { DeleteAgentButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function EditAgentePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const config = await getAgentConfig(id);
  if (!config) notFound();
  const initial = { ...config, agentId: id };

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/agentes" className="text-sm text-[var(--color-muted)] hover:text-white">← Agentes</Link>
      <h1 className="mt-2 font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">
        Editar {config.business_name ?? "agente"}
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Cambiá servicios, precios, horarios o tono. Se aplica al instante en su chat.
      </p>

      <AgentForm action={saveAgent} initial={initial} />

      <div className="mt-10 border-t border-[var(--line)] pt-6">
        <p className="mb-3 text-sm text-[var(--color-faint)]">Zona peligrosa</p>
        <DeleteAgentButton agentId={id} business={config.business_name ?? id} />
      </div>
    </div>
  );
}
