import Link from "next/link";
import { cn } from "@autoking/ui";
import { getConversation, getMessages, type KapsoMessage } from "@/lib/kapso";
import { buildRoleMap, roleFor, ROLE_STYLES, ROLE_LABEL } from "../roles";

export const dynamic = "force-dynamic";

function hora(ts: string | null) {
  if (!ts) return "";
  // WhatsApp manda timestamps Unix en segundos; también soportamos ISO.
  const d = /^\d{9,}$/.test(ts) ? new Date(Number(ts) * 1000) : new Date(ts);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function ConversacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Cada fuente por separado y tolerante a fallos: que un error de Kapso no rompa la página.
  const conv = await getConversation(id).catch(() => null);
  let mensajes: KapsoMessage[] = [];
  let errorMsgs: string | null = null;
  try {
    mensajes = await getMessages(id, 200);
  } catch (e) {
    errorMsgs = (e as Error).message;
  }
  const roles = await buildRoleMap().catch(() => new Map());

  const phone = conv?.phone_number ?? "";
  const r = roleFor(roles, phone);
  const nombre = r.nombre || conv?.contact_name || (phone ? `+${phone}` : "Conversación");

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/conversaciones" className="text-sm text-[var(--color-muted)] hover:text-white">
        ← Volver a conversaciones
      </Link>

      {/* Header */}
      <div className="mt-4 flex items-center gap-3 rounded-t-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-bg-2)] p-4">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-gradient-to-br from-blue-bright to-blue-deep text-sm font-bold text-white">
          {(nombre[0] || "?").toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-white">{nombre}</span>
            <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", ROLE_STYLES[r.rol])}>
              {ROLE_LABEL[r.rol]}
              {r.detalle ? ` · ${r.detalle}` : ""}
            </span>
          </div>
          {phone && (
            <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener" className="text-xs text-[var(--color-faint)] hover:text-blue-bright">
              +{phone} · abrir en WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Hilo */}
      <div className="flex flex-col gap-2 border-x border-b border-[var(--line)] bg-[rgb(7_12_16_/_0.6)] p-4 rounded-b-[var(--radius-card)] min-h-[300px]">
        {errorMsgs ? (
          <p className="py-10 text-center text-sm text-[var(--color-danger)]">No pude cargar los mensajes ({errorMsgs}).</p>
        ) : mensajes.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--color-faint)]">Sin mensajes en esta conversación.</p>
        ) : (
          mensajes.map((m) => {
            const esKing = m.direction === "outbound";
            return (
              <div key={m.id} className={cn("flex flex-col", esKing ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[14px] leading-snug",
                    esKing
                      ? "rounded-br-md bg-[linear-gradient(135deg,#1e6bff,#1450c7)] text-white"
                      : "rounded-bl-md bg-[#1b2630] text-[#e7eefb]",
                  )}
                >
                  {m.text || <span className="opacity-60">[{m.type}]</span>}
                </div>
                <span className="mt-0.5 px-1 text-[10px] text-[var(--color-faint)]">
                  {esKing ? "King 👑" : nombre.split(" ")[0]} · {hora(m.timestamp)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
