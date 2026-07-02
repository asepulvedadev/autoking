"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@autoking/ui";

type Industry = { label: string; emoji: string; question: string; answer: string };

export function Industries() {
  const t = useTranslations("Industries");
  const items = t.raw("items") as Industry[];
  const [active, setActive] = useState(0);
  const current = items[active]!;

  return (
    <section className="section" id="rubros">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h2>
            {t("titleA")} <span className="text-blue">{t("titleHighlight")}</span>
          </h2>
          <p>{t("subtitle")}</p>
        </div>

        <div className="reveal mx-auto max-w-3xl">
          <div className="mb-8 flex flex-wrap justify-center gap-3">
            {items.map((ind, i) => (
              <button
                key={ind.label}
                onClick={() => setActive(i)}
                className={cn(
                  "rounded-full border px-4 py-2.5 text-sm font-medium transition-all",
                  i === active
                    ? "border-blue-bright bg-blue/[0.12] text-white"
                    : "border-[var(--line)] text-[var(--color-muted)] hover:border-[var(--line-strong)] hover:text-white",
                )}
              >
                <span className="mr-1.5">{ind.emoji}</span>
                {ind.label}
              </button>
            ))}
          </div>

          <div key={current.label} className="card animate-[fadeIn_.4s_var(--ease)]">
            <div className="flex flex-col gap-3">
              <div className="max-w-[80%] self-end rounded-2xl rounded-br-md bg-[linear-gradient(135deg,#1e6bff,#1450c7)] px-4 py-3 text-[15px] text-white">
                {current.question}
              </div>
              <div className="flex items-start gap-2.5 self-start">
                <div className="grid h-8 w-8 flex-none place-items-center rounded-full bg-gradient-to-br from-blue-bright to-blue-deep text-xs font-bold text-white">
                  AK
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-tl-md border border-[var(--line)] bg-[var(--color-surface-2)] px-4 py-3 text-[15px] text-[var(--color-ink)]">
                  {current.answer}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
