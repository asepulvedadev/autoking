"use client";

import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Stars, cn } from "@autoking/ui";

/**
 * ⚠️ PLACEHOLDER — testimonios ilustrativos. Reemplazá por reales
 * (con permiso del cliente) antes del lanzamiento. No inventamos clientes.
 */
const TESTIMONIALS = [
  {
    quote:
      "Antes perdía clientes que escribían de noche. Ahora el agente responde al instante y me llena la agenda solo. Recuperé un montón de citas.",
    name: "María G.",
    role: "Spa · Placeholder",
    initial: "M",
  },
  {
    quote:
      "Dejé de contestar las mismas preguntas mil veces. El agente atiende, cotiza y agenda. Yo me dedico a atender a la gente que llega.",
    name: "Diego R.",
    role: "Barbería · Placeholder",
    initial: "D",
  },
  {
    quote:
      "Lo mejor es que nunca deja a nadie esperando. Contesta en segundos a cualquier hora. Mis pacientes lo notan y agendan más.",
    name: "Dra. Carla V.",
    role: "Consultorio dental · Placeholder",
    initial: "C",
  },
  {
    quote:
      "Es como tener una recepcionista que no duerme. Se conectó a mi WhatsApp de siempre y en tres días ya estaba trabajando por mí.",
    name: "Sofía L.",
    role: "Estética · Placeholder",
    initial: "S",
  },
];

export function Testimonials() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section className="section" id="testimonios">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Clientes</span>
          <h2>
            Negocios que dejaron de <span className="text-blue">perder clientes</span>
          </h2>
          <p>Lo que pasa cuando un agente atiende por ti, sin descanso.</p>
        </div>

        <div className="reveal">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-5 [touch-action:pan-y]">
              {TESTIMONIALS.map((t) => (
                <article
                  key={t.name}
                  className="min-w-0 flex-[0_0_88%] sm:flex-[0_0_47%] lg:flex-[0_0_31.5%]"
                >
                  <div className="card flex h-full flex-col">
                    <Stars className="mb-4" />
                    <p className="grow text-[15.5px] leading-relaxed text-[var(--color-ink)]">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      <div className="grid h-11 w-11 flex-none place-items-center rounded-full bg-gradient-to-br from-blue-bright to-blue-deep font-display font-bold text-white">
                        {t.initial}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{t.name}</div>
                        <div className="text-xs text-[var(--color-faint)]">{t.role}</div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            {[
              { label: "Anterior", onClick: prev, d: "M15 18l-6-6 6-6" },
              { label: "Siguiente", onClick: next, d: "M9 18l6-6-6-6" },
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

        <p className="mt-5 text-center text-xs text-[var(--color-faint)]">
          * Testimonios ilustrativos — reemplazar por reales antes del lanzamiento.
        </p>
      </div>
    </section>
  );
}
