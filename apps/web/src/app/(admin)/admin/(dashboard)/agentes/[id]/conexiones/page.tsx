import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { isPrivileged } from "@/lib/roles";
import { agenteAccesible } from "@/lib/agentes";
import { listarMcp, type McpServer } from "@/lib/control";
import { ConectarMcp, ServidorMcp } from "./mcp-ui";

export const dynamic = "force-dynamic";

/**
 * Conexiones (MCP) DE ESTE AGENTE.
 *
 * Salió del sidebar por el mismo motivo que leads, conversaciones y
 * prospección: un MCP es una herramienta que se le da a UN agente, no al
 * panel. Verlo suelto invitaba a razonar al revés —"conecto Supabase y
 * después veo a quién se lo doy"— y así fue como King terminó una vez con
 * acceso a la base de datos.
 *
 * Acá la pregunta es la correcta desde el principio: qué necesita ESTE agente.
 */
export default async function ConexionesDelAgentePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Doble puerta: acceso al agente + rol privilegiado. Un vendedor puede ver
  // las conversaciones de su agente, pero conectarle herramientas es otra cosa.
  const agente = await agenteAccesible(id);
  if (!agente) redirect("/admin/agentes");
  const me = await getSessionProfile();
  if (!me || !isPrivileged(me.role)) redirect(`/admin/agentes/${id}`);

  const nombre = agente.nombre ?? agente.slug;

  let servers: McpServer[] = [];
  let agentes: string[] = [];
  let error: string | null = null;
  try {
    const r = await listarMcp();
    servers = r.servers;
    agentes = r.agentes;
  } catch (e) {
    error = (e as Error).message;
  }

  // Los MCP viven en el gateway, que es global. Lo que cambia por agente es
  // a quién está habilitado: se separan en dos listas para que se vea de un
  // golpe qué tiene ESTE agente y qué hay disponible para darle.
  const slug = agente.slug;
  const habilitados = servers.filter((s) => s.agentes?.includes(slug));
  const disponibles = servers.filter((s) => !s.agentes?.includes(slug));

  const esPublico = Boolean(agente.kapso_phone_number_id);

  return (
    <>
      <p className="text-sm text-[var(--color-muted)]">
        Herramientas reales que puede usar <b className="text-white">{nombre}</b>: leer un
        calendario, consultar un sistema, cobrar. Un MCP nuevo nace apagado y se habilita agente
        por agente.
      </p>

      {esPublico && (
        <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-gold)]/40 bg-[rgb(255_193_7_/_0.05)] p-4 text-sm">
          <p className="font-medium text-[var(--color-gold)]">⚠️ {nombre} atiende WhatsApp público</p>
          <p className="mt-1 text-[var(--color-muted)]">
            Todo lo que le conectes acá queda al alcance de <b className="text-white">desconocidos</b>:
            alguien puede intentar, con el mensaje correcto, que lo ejecute. Dale solo lo que
            necesita para vender, y nada que escriba en sistemas internos.
          </p>
        </div>
      )}

      {error ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-danger)]/40 bg-[rgb(255_80_80_/_0.06)] p-6 text-sm text-[var(--color-danger)]">
          No pude leer las conexiones del servidor ({error}).
        </div>
      ) : (
        <>
          <h2 className="mt-8 text-sm font-semibold text-white">
            Habilitadas para {nombre} ({habilitados.length})
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {habilitados.length === 0 ? (
              <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] p-8 text-center text-sm text-[var(--color-muted)]">
                Este agente no tiene ninguna conexión habilitada.
              </div>
            ) : (
              habilitados.map((s) => <ServidorMcp key={s.nombre} s={s} agentes={agentes} />)
            )}
          </div>

          {disponibles.length > 0 && (
            <>
              <h2 className="mt-8 text-sm font-semibold text-white">
                Disponibles para habilitar ({disponibles.length})
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {disponibles.map((s) => (
                  <ServidorMcp key={s.nombre} s={s} agentes={agentes} />
                ))}
              </div>
            </>
          )}

          <h2 className="mt-8 text-sm font-semibold text-white">Conectar una nueva</h2>
          <div className="mt-3">
            <ConectarMcp />
          </div>
        </>
      )}
    </>
  );
}
