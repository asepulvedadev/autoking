import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { buttonVariants, cn } from "@autoking/ui";
import styles from "./revenue-loop.module.css";

type LoopStep = { label: string; text: string };

const ICONS: ReactNode[] = [
  <path key="message" d="M21 11.5a8.2 8.2 0 01-8.5 8.5 9.2 9.2 0 01-4.1-1L3 21l1.7-4.9A8.5 8.5 0 1112.5 20" />,
  <path key="bolt" d="m13 2-9 12h7l-1 8 10-13h-7l0-7Z" />,
  <g key="qualify">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a8 8 0 0 1 16 0v1M17 11l2 2 3-3" />
  </g>,
  <g key="book">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4m8-4v4M3 10h18m-5 5 2 2 3-4" />
  </g>,
  <path key="follow" d="M4 4v5h.6M20 20v-5h-.6M5.2 15a7.5 7.5 0 0 0 13.1 2M18.8 9A7.5 7.5 0 0 0 5.7 7" />,
];

export async function RevenueLoop() {
  const t = await getTranslations("RevenueLoop");
  const steps: LoopStep[] = [
    { label: t("lossLabel"), text: t("lossText") },
    { label: t("replyLabel"), text: t("replyText") },
    { label: t("qualifyLabel"), text: t("qualifyText") },
    { label: t("bookLabel"), text: t("bookText") },
    { label: t("followLabel"), text: t("followText") },
  ];

  return (
    <section className={cn("section", styles.section)} id="revenue-loop">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h2>
            {t("titleA")} <span className="text-blue">{t("titleHighlight")}</span>
          </h2>
          <p>{t("subtitle")}</p>
        </div>

        <figure className={cn(styles.figure, "reveal")} aria-label={t("sandbox")}>
          <div className={styles.loop}>
            {steps.map((step, index) => (
              <div className={styles.step} key={step.label}>
                <div className={styles.icon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    {ICONS[index]}
                  </svg>
                </div>
                <div className={styles.copy}>
                  <span>{step.label}</span>
                  <p>{step.text}</p>
                </div>
                {index < steps.length - 1 && <span className={styles.connector} aria-hidden="true" />}
              </div>
            ))}
          </div>
          <figcaption className="sr-only">{t("sandbox")}</figcaption>
        </figure>

        <div className={cn(styles.comparison, "reveal")}>
          <article className={styles.before}>
            <span className={styles.kicker}>{t("beforeLabel")}</span>
            <h3>{t("beforeTitle")}</h3>
            <p>{t("beforeText")}</p>
          </article>
          <article className={styles.after}>
            <span className={styles.kicker}>{t("afterLabel")}</span>
            <h3>{t("afterTitle")}</h3>
            <p>{t("afterText")}</p>
            <a href="#solucion" className={buttonVariants({ variant: "secondary", className: styles.cta })}>
              {t("cta")}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
