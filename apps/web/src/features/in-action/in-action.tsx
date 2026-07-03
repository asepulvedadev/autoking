"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

// Todo el peso de Remotion (@remotion/player + @autoking/video) vive en este
// chunk async. No bloquea la hidratación del resto de la landing.
const BrandVideo = dynamic(() => import("./brand-video"), {
  ssr: false,
  loading: () => <div className="aspect-video w-full animate-pulse bg-[var(--color-surface-2)]" />,
});

export function InAction() {
  const t = useTranslations("InAction");

  return (
    <section className="section" id="en-accion">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h2>
            {t("titleA")} <span className="text-blue">{t("titleHighlight")}</span>
          </h2>
          <p>{t("subtitle")}</p>
        </div>

        <div className="reveal mx-auto max-w-3xl overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line-strong)] shadow-[var(--shadow-blue)]">
          <BrandVideo />
        </div>
      </div>
    </section>
  );
}
