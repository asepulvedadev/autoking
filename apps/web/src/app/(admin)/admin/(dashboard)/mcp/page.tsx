import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { isPrivileged } from "@/lib/roles";
import { listarMcp, type McpServer } from "@/lib/control";
import { ConectarMcp, ServidorMcp } from "./mcp-ui";

export const dynamic = "force-dynamic";

export default async function McpPage() {
  const me = await getSessionProfile();
  if (!me) redirect("/admin/login");
  if (!isPrivileged(me.role)) redirect("/admin");

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

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">Conexiones (MCP)</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Un MCP le da <b className="text-white">herramientas reales</b> a un agente: leer un calendario,
        cobrar, consultar un sistema. Conectás uno acá y decidís qué agente puede usarlo.
      </p>

      <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-gold)]/40 bg-[rgb(255_193_7_/_0.05)] p-4 text-sm">
        <p className="font-medium text-[var(--color-gold)]">⚠️ Cuidado con los agentes públicos</p>
        <p className="mt-1 text-[var(--color-muted)]">
          Un MCP conectado a King o Mayand le da esas herramientas a un agente que habla con
          <b className="text-white"> desconocidos</b>. Alguien podría intentar, con el mensaje
          correcto, que las ejecute. Por eso <b className="text-white">un MCP nuevo nace apagado
          para todos</b> y lo habilitás agente por agente. Dale solo lo que necesita.
        </p>
      </div>

      <div className="mt-6">
        <ConectarMcp />
      </div>

      {error ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-danger)]/40 bg-[rgb(255_80_80_/_0.06)] p-6 text-sm text-[var(--color-danger)]">
          No pude leer las conexiones del servidor ({error}).
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {servers.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] p-10 text-center text-sm text-[var(--color-muted)]">
              Todavía no hay conexiones.
            </div>
          ) : (
            servers.map((s) => <ServidorMcp key={s.nombre} s={s} agentes={agentes} />)
          )}
        </div>
      )}
    </div>
  );
}
