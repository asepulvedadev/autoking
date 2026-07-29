import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { BentoGrid, cn } from "@autoking/ui";

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

        {/* Se sacó el <Spotlight>: proyectaba un glow azul que seguía al cursor
            en CADA tarjeta — seis gradientes solo para esta sección, y el gesto
            más asociado a plantilla de la página. El hover ahora es el mismo
            que en el resto del sitio: se aclara el borde y sube un pixel. */}
        <BentoGrid className="reveal">
          {items.map((b, i) => (
            <div
              key={b.title}
              className={cn(
                "flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-surface p-7 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-line-strong",
                SPANS[i],
              )}
            >
              <div className="ico">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  {ICONS[i]}
                </svg>
              </div>
              <h3 className="mb-2 text-h3 font-bold text-ink">{b.title}</h3>
              <p className="text-[15px] text-muted">{b.text}</p>
            </div>
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
