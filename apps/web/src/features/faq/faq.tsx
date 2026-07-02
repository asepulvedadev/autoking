"use client";

import { useState } from "react";
import { cn } from "@autoking/ui";
import { FAQS } from "./faqs";
import styles from "./faq.module.css";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="section" id="faq">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Preguntas frecuentes</span>
          <h2>
            Lo que seguro te estás <span className="text-blue">preguntando</span>
          </h2>
        </div>

        <div className={styles.wrap}>
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div className={cn(styles.item, isOpen && styles.open, "reveal")} key={faq.q}>
                <button
                  className={styles.q}
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
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
