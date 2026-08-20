import { getTranslations } from "next-intl/server";
import { CrownMark, CheckIcon, buttonVariants, cn } from "@autoking/ui";
import { waHref } from "@/lib/site";
import { getPais, getPlanes, formatMoneda } from "@/lib/planes";
import styles from "./pricing.module.css";

export const dynamic = "force-dynamic"; // precios por ubicación del visitante

// Cantidad de coronas por posición (el destacado viene de la DB).
const CROWNS = [1, 2, 3];

export async function Pricing() {
  const t = await getTranslations("Pricing");
  const pais = await getPais();
  const planes = await getPlanes(pais);

  if (planes.length === 0) {
    return (
      <section className={cn("section", styles.section)} id="planes">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">{t("eyebrow")}</span>
            <h2>{t("fallbackTitle")}</h2>
            <p>{t("fallbackText")}</p>
          </div>
          <a
            href={waHref(t("waMessage", { name: t("fallbackCta"), title: t("fallbackTitle") }))}
            target="_blank"
            rel="noopener"
            className={buttonVariants({ variant: "primary" })}
          >
            {t("fallbackCta")}
          </a>
        </div>
      </section>
    );
  }

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
          {planes.map((plan, i) => (
            <div className={cn(styles.plan, plan.destacado && styles.featured, "reveal", `d${i}`)} key={plan.slug}>
              {plan.destacado && <span className={styles.tag}>{t("recommended")}</span>}

              <div className={styles.crowns}>
                {Array.from({ length: CROWNS[i] ?? 1 }).map((_, k) => (
                  <CrownMark key={k} />
                ))}
              </div>

              <div className={styles.name}>{plan.nombre}</div>
              <div className={styles.title}>{plan.titulo}</div>
              {plan.descripcion && (
                <p className="mb-4 mt-1.5 text-[13.5px] leading-snug text-[var(--color-muted)]">{plan.descripcion}</p>
              )}

              <div className={styles.price}>
                <span className={styles.amount}>{formatMoneda(plan.precioMensual, plan.moneda, plan.simbolo)}</span>
                <span className={styles.per}>
                  {t("perMonth")} {plan.moneda}
                </span>
              </div>
              <div className={styles.setup}>
                {t("instalacionLabel")} {formatMoneda(plan.precioInstalacion, plan.moneda, plan.simbolo)} {plan.moneda}
              </div>
              {plan.instalacionIncluye && (
                <p className="mb-2 mt-1 text-[11.5px] leading-snug text-[var(--color-faint)]">
                  {plan.instalacionIncluye}
                </p>
              )}

              <ul className={styles.features}>
                {plan.features.map((f) => (
                  <li key={f.texto}>
                    <CheckIcon />
                    {f.destacado ? <b>{f.texto}</b> : f.texto}
                  </li>
                ))}
              </ul>

              <a
                href={waHref(t("waMessage", { name: plan.nombre, title: plan.titulo }))}
                target="_blank"
                rel="noopener"
                className={buttonVariants({ variant: plan.destacado ? "primary" : "secondary", className: "w-full" })}
              >
                {t("planCta", { name: plan.nombre })}
              </a>
            </div>
          ))}
        </div>

        {/* Garantía destacada — borde azul eléctrico */}
        <div className="reveal mx-auto mt-10 flex max-w-2xl items-center gap-4 rounded-[var(--radius-lg)] border-2 border-blue-bright bg-blue/10 p-6 shadow-cta">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-10 w-10 flex-none text-blue-bright">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" />
            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <div className="font-display text-lg font-extrabold text-white">{t("guaranteeTitle")}</div>
            <p className="mt-1 text-sm leading-snug text-[var(--color-muted)]">{t("guaranteeText")}</p>
          </div>
        </div>

        <p className="reveal mx-auto mt-8 flex max-w-fit items-center gap-2 rounded-full border border-line bg-[var(--color-surface)] px-5 py-2.5 text-sm text-[var(--color-muted)]">
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
