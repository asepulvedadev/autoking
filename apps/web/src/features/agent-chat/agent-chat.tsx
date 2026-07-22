import { getTranslations } from "next-intl/server";
import { cn } from "@autoking/ui";

/** "Así conversa tu agente": 3 tarjetas con conversaciones simuladas por nicho.
 *  Reutiliza el estilo de burbujas del LiveDemo. Micro-resultados honestos
 *  (capacidades, NO testimonios). Reemplazó a la sección de testimonios falsos. */

type Msg = { from: "agent" | "user"; text: string };
type Card = { label: string; emoji: string; messages: Msg[]; result: string };

export async function AgentChat() {
  const t = await getTranslations("AgentChat");
  const cards = t.raw("cards") as Card[];

  return (
    <section className="section" id="conversaciones">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h2>
            {t("titleA")} <span className="text-blue">{t("titleHighlight")}</span>
          </h2>
          <p>{t("subtitle")}</p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {cards.map((card, i) => (
            <div
              key={card.label}
              className={cn(
                "reveal flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line-strong)] bg-[var(--color-surface)] shadow-[var(--shadow-blue)]",
                i > 0 && `d${i}`,
              )}
            >
              {/* header estilo WhatsApp */}
              <div className="flex items-center gap-3 border-b border-[var(--line)] bg-[linear-gradient(120deg,#11283a,#0e2233)] px-4 py-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-bright to-blue-deep text-base">
                  {card.emoji}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{card.label}</div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-success)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" /> {t("online")}
                  </div>
                </div>
              </div>

              {/* cuerpo de la conversación */}
              <div className="flex flex-1 flex-col gap-2 bg-[rgb(7_12_16_/_0.6)] p-4">
                {card.messages.map((m, j) => (
                  <div
                    key={j}
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-snug",
                      m.from === "user"
                        ? "self-end rounded-br-md bg-[linear-gradient(135deg,#1e6bff,#1450c7)] text-white"
                        : "self-start rounded-bl-md bg-[#1b2630] text-[#e7eefb]",
                    )}
                  >
                    {m.text}
                  </div>
                ))}
              </div>

              {/* micro-resultado (capacidad honesta, no testimonio) */}
              <div className="flex items-center gap-2 border-t border-[var(--line)] px-4 py-3 text-xs font-medium text-[var(--color-muted)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4 flex-none text-[var(--color-success)]">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {card.result}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
