"use client";

import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useTranslations } from "next-intl";
import { Stars, cn } from "@autoking/ui";

type Item = { quote: string; name: string; role: string };

export function Testimonials() {
  const t = useTranslations("Testimonials");
  const items = t.raw("items") as Item[];
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section className="section" id="testimonios">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h2>
            {t("titleA")} <span className="text-blue">{t("titleHighlight")}</span>
          </h2>
          <p>{t("subtitle")}</p>
        </div>

        <div className="reveal">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-5 [touch-action:pan-y]">
              {items.map((item) => (
                <article key={item.name} className="min-w-0 flex-[0_0_88%] sm:flex-[0_0_47%] lg:flex-[0_0_31.5%]">
                  <div className="card flex h-full flex-col">
                    <Stars className="mb-4" />
                    <p className="grow text-[15.5px] leading-relaxed text-[var(--color-ink)]">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      <div className="grid h-11 w-11 flex-none place-items-center rounded-full bg-gradient-to-br from-blue-bright to-blue-deep font-display font-bold text-white">
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{item.name}</div>
                        <div className="text-xs text-[var(--color-faint)]">{item.role}</div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            {[
              { label: t("prev"), onClick: prev, d: "M15 18l-6-6 6-6" },
              { label: t("next"), onClick: next, d: "M9 18l6-6-6-6" },
            ].map((b) => (
              <button
                key={b.label}
                onClick={b.onClick}
                aria-label={b.label}
                className={cn(
                  "grid h-11 w-11 place-items-center rounded-full border transition-colors",
                  "border-[var(--line-strong)] text-[var(--color-muted)]",
                  "hover:border-blue-bright hover:text-white",
                )}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <path d={b.d} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-[var(--color-faint)]">{t("disclaimer")}</p>
      </div>
    </section>
  );
}
