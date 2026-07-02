"use client";

import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Stars, cn } from "@autoking/ui";

export type Testimonio = {
  id: string;
  quote: string;
  author_name: string;
  author_role: string | null;
  rating: number;
  avatar_url: string | null;
};

export function TestimonialsCarousel({
  items,
  prevLabel,
  nextLabel,
}: {
  items: Testimonio[];
  prevLabel: string;
  nextLabel: string;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="reveal">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-5 [touch-action:pan-y]">
          {items.map((t) => (
            <article key={t.id} className="min-w-0 flex-[0_0_88%] sm:flex-[0_0_47%] lg:flex-[0_0_31.5%]">
              <div className="card flex h-full flex-col">
                <Stars count={t.rating} className="mb-4" />
                <p className="grow text-[15.5px] leading-relaxed text-[var(--color-ink)]">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  {t.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.avatar_url} alt="" className="h-11 w-11 flex-none rounded-full object-cover" />
                  ) : (
                    <div className="grid h-11 w-11 flex-none place-items-center rounded-full bg-gradient-to-br from-blue-bright to-blue-deep font-display font-bold text-white">
                      {t.author_name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold">{t.author_name}</div>
                    <div className="text-xs text-[var(--color-faint)]">{t.author_role ?? ""}</div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-3">
        {[
          { label: prevLabel, onClick: prev, d: "M15 18l-6-6 6-6" },
          { label: nextLabel, onClick: next, d: "M9 18l6-6-6-6" },
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
  );
}
