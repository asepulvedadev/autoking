import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { BentoGrid, Spotlight, cn } from "@autoking/ui";

const ICONS: ReactNode[] = [
  <g key="0">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </g>,
  <g key="1">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01" />
  </g>,
  <g key="2">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <path d="M22 4L12 14.01l-3-3" />
  </g>,
  <path key="3" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  <path key="4" d="M20 6L9 17l-5-5" />,
  <g key="5">
    <path d="M23 6l-9.5 9.5-5-5L1 18" />
    <path d="M17 6h6v6" />
  </g>,
];

// Tamaños bento (desktop): filas 4+2, 2+4, 3+3 → layout asimétrico moderno.
const SPANS = [
  "lg:col-span-4",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-4",
  "lg:col-span-3",
  "lg:col-span-3",
];

export async function Benefits() {
  const t = await getTranslations("Benefits");
  const items = t.raw("items") as { title: string; text: string }[];

  return (
    <section className="section" id="beneficios">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h2>
            {t("titleA")} <span className="text-blue">{t("titleHighlight")}</span> {t("titleB")}
          </h2>
          <p>{t("subtitle")}</p>
        </div>

        <BentoGrid className="reveal">
          {items.map((b, i) => (
            <Spotlight key={b.title} className={cn("h-full rounded-[var(--radius-card)]", SPANS[i])}>
              <div className="flex h-full flex-col rounded-[var(--radius-card)] border border-[var(--line)] bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-bg-2)] p-7 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-[var(--line-strong)]">
                <div className="ico">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    {ICONS[i]}
                  </svg>
                </div>
                <h3 className="mb-2 text-[19px] font-bold text-[var(--color-ink)]">{b.title}</h3>
                <p className="text-[15px] text-[var(--color-muted)]">{b.text}</p>
              </div>
            </Spotlight>
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
