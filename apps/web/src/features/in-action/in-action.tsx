"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { BrandClip, brandClip } from "@autoking/video";

// El Player es client-only (toca window) → carga diferida sin SSR.
const Player = dynamic(() => import("@remotion/player").then((m) => m.Player), {
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
          <Player
            component={BrandClip}
            durationInFrames={brandClip.durationInFrames}
            fps={brandClip.fps}
            compositionWidth={brandClip.width}
            compositionHeight={brandClip.height}
            autoPlay
            loop
            controls
            style={{ width: "100%" }}
          />
        </div>
      </div>
    </section>
  );
}
