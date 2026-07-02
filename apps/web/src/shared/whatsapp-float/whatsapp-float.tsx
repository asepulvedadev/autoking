import { getTranslations } from "next-intl/server";
import { WhatsAppIcon } from "@autoking/ui";
import { waHref } from "@/lib/site";
import styles from "./whatsapp-float.module.css";

export async function WhatsAppFloat() {
  const t = await getTranslations("Common");
  return (
    <a
      href={waHref(t("waMessage"))}
      target="_blank"
      rel="noopener"
      className={styles.float}
      aria-label="WhatsApp"
    >
      <WhatsAppIcon className="h-8 w-8" />
    </a>
  );
}
