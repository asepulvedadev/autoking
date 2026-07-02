import { CrownMark, CheckIcon, buttonVariants, cn } from "@autoking/ui";
import { waHref } from "@/lib/site";
import { PLANS } from "./plans";
import styles from "./pricing.module.css";

export function Pricing() {
  return (
    <section className={cn("section", styles.section)} id="planes">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Planes</span>
          <h2>
            Elige el nivel de tu <span className="text-blue">imperio</span>
          </h2>
          <p>
            Empieza simple y sube de nivel cuando quieras. Todos incluyen instalación, entrenamiento del
            agente y soporte.
          </p>
        </div>

        <div className={styles.grid}>
          {PLANS.map((plan, i) => (
            <div
              className={cn(styles.plan, plan.featured && styles.featured, "reveal", `d${i}`)}
              key={plan.title}
            >
              {plan.featured && <span className={styles.tag}>⭐ Recomendado</span>}

              <div className={styles.crowns}>
                {Array.from({ length: plan.level }).map((_, k) => (
                  <CrownMark key={k} />
                ))}
              </div>

              <div className={styles.name}>{plan.name}</div>
              <div className={styles.title}>{plan.title}</div>
              <div className={styles.price}>
                <span className={styles.amount}>{plan.price}</span>
                <span className={styles.per}>/mes</span>
              </div>
              <div className={styles.setup}>Desde · + costo de instalación inicial</div>

              <ul className={styles.features}>
                {plan.features.map((f) => (
                  <li key={f.text}>
                    <CheckIcon />
                    {f.strong ? <b>{f.text}</b> : f.text}
                  </li>
                ))}
              </ul>

              <a
                href={waHref(`Hola AutoKing 👑 Me interesa el plan ${plan.name} "${plan.title}".`)}
                target="_blank"
                rel="noopener"
                className={buttonVariants({ variant: plan.featured ? "primary" : "secondary", className: "w-full" })}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
