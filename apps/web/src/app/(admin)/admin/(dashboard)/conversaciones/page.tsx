import Link from "next/link";
import { cn } from "@autoking/ui";
import { listConversations, type KapsoConversation } from "@/lib/kapso";
import { buildRoleMap, roleFor, ROLE_STYLES, ROLE_LABEL } from "./roles";

export const dynamic = "force-dynamic";

function fecha(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const hoy = new Date();
  const mismoDia = d.toDateString() === hoy.toDateString();
  return mismoDia
    ? d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

export default async function ConversacionesPage() {
  let conversaciones: KapsoConversation[] = [];
  let error: string | null = null;
  try {
    conversaciones = await listConversations(60);
  } catch (e) {
    error = (e as Error).message;
  }
  const roles = await buildRoleMap();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">Conversaciones</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Lo que King habla por WhatsApp, en vivo. {conversaciones.length} conversación(es) recientes.
      </p>

      {error ? (
        <div className="mt-8 rounded-[var(--radius-card)] border border-[var(--color-danger)]/40 bg-[rgb(255_80_80_/_0.06)] p-6 text-sm text-[var(--color-danger)]">
          No pude cargar las conversaciones de Kapso ({error}). Verificá que <code>KAPSO_API_KEY</code> esté en el entorno.
        </div>
      ) : conversaciones.length === 0 ? (
        <div className="mt-10 rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] p-12 text-center text-[var(--color-muted)]">
          Todavía no hay conversaciones. Aparecerán acá cuando alguien le escriba al WhatsApp.
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {conversaciones.map((c) => {
            const r = roleFor(roles, c.phone_number);
            const nombre = r.nombre || c.contact_name || `+${c.phone_number}`;
            return (
              <Link
                key={c.id}
                href={`/admin/conversaciones/${c.id}`}
                className="flex items-center gap-4 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-4 transition-colors hover:border-blue-bright/40 hover:bg-white/[0.02]"
              >
                <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-gradient-to-br from-blue-bright to-blue-deep text-sm font-bold text-white">
                  {(nombre[0] || "?").toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-white">{nombre}</span>
                    <span className={cn("flex-none rounded-full border px-2 py-0.5 text-[11px] font-medium", ROLE_STYLES[r.rol])}>
                      {ROLE_LABEL[r.rol]}
                      {r.detalle ? ` · ${r.detalle}` : ""}
                    </span>
                  </div>
                  <div className="truncate text-xs text-[var(--color-faint)]">+{c.phone_number}</div>
                </div>
                <span className="flex-none text-xs text-[var(--color-faint)]">{fecha(c.last_active_at)}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
