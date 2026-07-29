import { redirect } from "next/navigation";
import { agentesDelUsuario } from "@/lib/agentes";

/**
 * Las conversaciones son del número de cada agente, no del panel.
 * Si el usuario tiene un solo agente lo llevamos directo a las suyas; si tiene
 * varios, elige. El detalle (/admin/conversaciones/<id>) sigue vivo.
 */
export default async function ConversacionesRedirectPage() {
  const agentes = await agentesDelUsuario();
  const unico = agentes.length === 1 ? agentes[0] : undefined;
  if (unico) redirect(`/admin/agentes/${unico.slug}/conversaciones`);
  redirect("/admin/agentes");
}
