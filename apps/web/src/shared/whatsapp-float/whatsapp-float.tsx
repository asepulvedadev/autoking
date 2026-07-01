import { WhatsAppIcon } from "@autoking/ui";
import { waHref } from "@/lib/site";
import styles from "./whatsapp-float.module.css";

export function WhatsAppFloat() {
  return (
    <a
      href={waHref()}
      target="_blank"
      rel="noopener"
      className={styles.float}
      aria-label="Escribir por WhatsApp"
    >
      <WhatsAppIcon className="h-8 w-8" />
    </a>
  );
}
