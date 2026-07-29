import { redirect } from "next/navigation";
import { agentesDelUsuario } from "@/lib/agentes";

/**
 * La prospección es el mercado de cada agente. Ver la lista global mezclaría
 * los prospectos de Colombia con los de México, así que se redirige al agente.
 */
export default async function ProspeccionRedirectPage() {
  const agentes = await agentesDelUsuario();
  const unico = agentes.length === 1 ? agentes[0] : undefined;
  if (unico) redirect(`/admin/agentes/${unico.slug}/prospeccion`);
  redirect("/admin/agentes");
}
