import { redirect } from "next/navigation";
import { agentesDelUsuario } from "@/lib/agentes";

/**
 * Los leads ya no viven sueltos: son de un agente.
 *
 * Esta ruta existía como listado global. Si alguien llega acá (link viejo,
 * historial, URL a mano) lo mandamos al agente que corresponda en vez de
 * mostrarle leads mezclados de todos los agentes. El detalle
 * (/admin/leads/<id>) sigue funcionando y se abre desde adentro del agente.
 */
export default async function LeadsRedirectPage() {
  const agentes = await agentesDelUsuario();
  const unico = agentes.length === 1 ? agentes[0] : undefined;
  if (unico) redirect(`/admin/agentes/${unico.slug}/leads`);
  redirect("/admin/agentes");
}
