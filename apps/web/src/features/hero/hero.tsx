import { getTranslations } from "next-intl/server";
import { buttonVariants, WhatsAppIcon, AuroraBackground, cn } from "@autoking/ui";
import { waHref } from "@/lib/site";
import { WhatsAppMock } from "./whatsapp-mock";
import styles from "./hero.module.css";

export async function Hero() {
  const t = await getTranslations("Hero");
  const tCommon = await getTranslations("Common");
  const proof = t.raw("proof") as { num: string; label: string }[];

  return (
    <section className={styles.hero} id="hero">
      <div className="grid-bg" />
      <AuroraBackground />

      <div className={cn("container", styles.grid)}>
        <div className="hero-copy">
          <span className={cn(styles.badge, "reveal")}>
            <span className={styles.badgeDot} /> {t("badge")}
          </span>
          <h1 className={cn(styles.title, "reveal", "d1", "glow-text")}>
            {t("titleA")} <span>{t("titleHighlight")}</span>
          </h1>
          <p className={cn(styles.sub, "reveal", "d2")}>
            {t("subA")}
            <b>{t("subStrong")}</b>
            {t("subB")}
          </p>

          <div className={cn(styles.cta, "reveal", "d3")}>
            <a
              href={waHref(tCommon("waMessage"))}
              target="_blank"
              rel="noopener"
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              <WhatsAppIcon /> {tCommon("agendaDemo")}
            </a>
            <a href="#solucion" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              {tCommon("conoceMas")}
            </a>
          </div>

          <div className={cn(styles.proof, "reveal", "d4")}>
            {proof.map((p) => (
              <div className={styles.proofItem} key={p.label}>
                <span className={styles.proofNum}>{p.num}</span>
                <span className={styles.proofLbl}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={cn(styles.phoneWrap, "reveal", "d2")}>
          <div className={cn("glow-orb", styles.phoneOrb)} />
          <WhatsAppMock />
        </div>
      </div>
    </section>
  );
}
