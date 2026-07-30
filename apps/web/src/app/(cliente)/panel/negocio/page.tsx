import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { miAgente } from "@/lib/agentes";
import { NegocioForm, type Negocio } from "./negocio-form";

export const dynamic = "force-dynamic";

export default async function PanelNegocioPage() {
  const agente = await miAgente();
  if (!agente) redirect("/panel");

  const supabase = await createClient();
  const { data } = await supabase
    .from("agentes")
    .select("negocio_nombre, industria, asistente, emoji, servicios, horario, ubicacion, tono, notas_negocio")
    .eq("id", agente.id)
    .single();

  return (
    <div>
      <h1 className="font-display text-[clamp(22px,4vw,28px)] font-extrabold text-white">Mi negocio</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Con esto tu agente sabe quién eres y cómo hablarle a tus clientes. Al guardar, los cambios
        se aplican enseguida.
      </p>
      <NegocioForm n={(data ?? {}) as Negocio} />
    </div>
  );
}
