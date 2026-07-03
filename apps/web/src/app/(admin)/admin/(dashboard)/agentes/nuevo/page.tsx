import Link from "next/link";
import { AgentForm } from "../agent-form";

export default function NuevoAgentePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/agentes" className="text-sm text-[var(--color-muted)] hover:text-white">← Agentes</Link>
      <h1 className="mt-2 font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">Nuevo agente</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Creá la recepcionista de IA de un negocio. Se entrena con sus servicios, precios y horarios.
      </p>
      <AgentForm />
    </div>
  );
}
