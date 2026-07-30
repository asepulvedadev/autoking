import { redirect } from "next/navigation";
import { miAgente } from "@/lib/agentes";
import { listConversations, type KapsoConversation } from "@/lib/kapso";

export const dynamic = "force-dynamic";

function cuando(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

/** Las conversaciones que atendió SU número. Nunca las de otro agente. */
export default async function PanelConversacionesPage() {
  const agente = await miAgente();
  if (!agente) redirect("/panel");

  let conversaciones: KapsoConversation[] = [];
  let error: string | null = null;
  try {
    conversaciones = await listConversations(60, agente.kapso_config_id);
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div>
      <h1 className="font-display text-[clamp(22px,4vw,28px)] font-extrabold text-white">Conversaciones</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Lo que tu agente conversó por WhatsApp. {conversaciones.length} reciente(s).
      </p>

      {error ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-danger)]/40 bg-[rgb(255_80_80_/_0.06)] p-6 text-sm text-[var(--color-danger)]">
          No pude cargar las conversaciones. Volvé a intentar en un momento.
        </div>
      ) : conversaciones.length === 0 ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] p-12 text-center text-[var(--color-muted)]">
          Todavía no hay conversaciones. Van a aparecer aquí cuando alguien le escriba a tu WhatsApp.
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-2">
          {conversaciones.map((c) => {
            const nombre = c.contact_name || `+${c.phone_number}`;
            return (
              <div
                key={c.id}
                className="flex items-center gap-4 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-4"
              >
                <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-gradient-to-br from-blue-bright to-blue-deep text-sm font-bold text-white">
                  {(nombre[0] || "?").toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-white">{nombre}</div>
                  <div className="truncate text-xs text-[var(--color-faint)]">+{c.phone_number}</div>
                </div>
                <span className="flex-none text-xs text-[var(--color-faint)]">{cuando(c.last_active_at)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
