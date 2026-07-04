import { getTranslations } from "next-intl/server";
import { CrownMark, CheckIcon, buttonVariants, cn } from "@autoking/ui";
import { waHref } from "@/lib/site";
import styles from "./pricing.module.css";

// Nivel (coronas) y destacado viven en código; los textos vienen de i18n.
const META = [
  { level: 1, featured: false },
  { level: 2, featured: true },
  { level: 3, featured: false },
];

type Plan = {
  name: string;
  title: string;
  price: string;
  cta: string;
  features: { text: string; strong?: boolean }[];
};

export async function Pricing() {
  const t = await getTranslations("Pricing");
  const plans = t.raw("plans") as Plan[];

  return (
    <section className={cn("section", styles.section)} id="planes">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h2>
            {t("titleA")} <span className="text-blue">{t("titleHighlight")}</span>
          </h2>
          <p>{t("subtitle")}</p>
        </div>

        <div className={styles.grid}>
          {plans.map((plan, i) => {
            const meta = META[i]!;
            return (
              <div className={cn(styles.plan, meta.featured && styles.featured, "reveal", `d${i}`)} key={plan.title}>
                {meta.featured && <span className={styles.tag}>{t("recommended")}</span>}

                <div className={styles.crowns}>
                  {Array.from({ length: meta.level }).map((_, k) => (
                    <CrownMark key={k} />
                  ))}
                </div>

                <div className={styles.name}>{plan.name}</div>
                <div className={styles.title}>{plan.title}</div>
                <div className={styles.price}>
                  <span className={styles.amount}>{plan.price}</span>
                  <span className={styles.per}>{t("perMonth")}</span>
                </div>
                <div className={styles.setup}>{t("fromSetup")}</div>

                <ul className={styles.features}>
                  {plan.features.map((f) => (
                    <li key={f.text}>
                      <CheckIcon />
                      {f.strong ? <b>{f.text}</b> : f.text}
                    </li>
                  ))}
                </ul>

                <a
                  href={waHref(t("waMessage", { name: plan.name, title: plan.title }))}
                  target="_blank"
                  rel="noopener"
                  className={buttonVariants({ variant: meta.featured ? "primary" : "secondary", className: "w-full" })}
                >
                  {plan.cta}
                </a>
              </div>
            );
          })}
        </div>

        <p className="reveal mx-auto mt-8 flex max-w-fit items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--color-surface)] px-5 py-2.5 text-sm text-[var(--color-muted)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 flex-none text-[var(--color-success)]">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" />
            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t("noPermanence")}
        </p>
      </div>
    </section>
  );
}
