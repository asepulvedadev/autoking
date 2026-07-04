"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@autoking/ui";
import styles from "./faq.module.css";

export function Faq() {
  const t = useTranslations("Faq");
  const items = t.raw("items") as { q: string; a: string }[];
  const [open, setOpen] = useState<number | null>(0);

  // Aparición manejada por React (NO por el reveal global): al re-renderizar en
  // cada clic, React reaplica el estilo y el item nunca se "borra". Antes el
  // reveal global agregaba `.visible` al DOM y el re-render de React lo pisaba.
  const [shown, setShown] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="section" id="faq">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h2>
            {t("titleA")} <span className="text-blue">{t("titleHighlight")}</span>
          </h2>
        </div>

        <div className={styles.wrap} ref={wrapRef}>
          {items.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                className={cn(styles.item, isOpen && styles.open)}
                key={faq.q}
                style={{
                  opacity: shown ? 1 : 0,
                  transform: shown ? "none" : "translateY(24px)",
                  transition: "opacity 0.6s var(--ease), transform 0.6s var(--ease)",
                  transitionDelay: shown ? `${i * 0.06}s` : "0s",
                }}
              >
                <button className={styles.q} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  {faq.q}
                  <span className={styles.plus} aria-hidden="true" />
                </button>
                <div className={styles.answer}>
                  <div>
                    <p>{faq.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
