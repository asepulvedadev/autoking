import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { cn } from "@autoking/ui";

const ICONS: ReactNode[] = [
  <path key="0" d="M12 2a7 7 0 00-7 7c0 5-2 6-2 6h18s-2-1-2-6a7 7 0 00-7-7zM9 20a3 3 0 006 0" />,
  <g key="1">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" />
  </g>,
  <g key="2">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </g>,
  <g key="3">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </g>,
];

export async function Problem() {
  const t = await getTranslations("Problem");
  const items = t.raw("items") as { title: string; text: string }[];

  return (
    <section className="section" id="problema">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h2>
            {t("titleA")} <span className="text-blue">{t("titleHighlight")}</span>
          </h2>
          <p>{t("subtitle")}</p>
        </div>

        <div className="grid cols-2">
          {items.map((item, i) => (
            <div className={cn("card pain reveal", i > 0 && `d${i}`)} key={item.title}>
              <div className="ico">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  {ICONS[i]}
                </svg>
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
