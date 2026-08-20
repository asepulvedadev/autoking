import { getTranslations } from "next-intl/server";
import { cn } from "@autoking/ui";
import styles from "./brand-preview.module.css";
import { BrandPlayer } from "./brand-player";

export async function BrandPreview() {
  const t = await getTranslations("BrandPreview");
  const stages = [t("messageLost"), t("instantReply"), t("qualified"), t("confirmed"), t("followUp")];

  return (
    <section className={cn("section", styles.section)} id="preview">
      <div className={cn("container", styles.grid)}>
        <div className={cn("section-head", styles.copy, "reveal")}>
          <span className="eyebrow">{t("eyebrow")}</span>
          <h2>{t("title")}</h2>
          <p>{t("subtitle")}</p>
        </div>
        <figure className={cn(styles.frame, "reveal", "d1")}>
          <BrandPlayer stages={stages} buttonLabel={t("play")} replayLabel={t("replay")} fallbackText={t("subtitle")} />
        </figure>
      </div>
    </section>
  );
}
