import { getTranslations } from "next-intl/server";
import { cn } from "@autoking/ui";
import styles from "./solution.module.css";

export async function Solution() {
  const t = await getTranslations("Solution");
  const steps = t.raw("steps") as { n: string; title: string; text: string }[];

  return (
    <section className={cn("section", styles.section)} id="solucion">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h2>
            {t("titleA")} <span className="text-blue">{t("titleHighlight")}</span>
          </h2>
          <p>{t("subtitle")}</p>
        </div>

        <div className="grid cols-3">
          {steps.map((step, i) => (
            <div className={cn("card reveal", i > 0 && `d${i}`, styles.step)} key={step.n}>
              <span className={styles.ghost} aria-hidden="true">
                {i + 1}
              </span>
              <div className={styles.num}>{step.n}</div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
