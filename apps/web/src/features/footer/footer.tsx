import { getTranslations } from "next-intl/server";
import { Logo } from "@autoking/ui";
import { NAV_LINKS, CONTACT, waHref } from "@/lib/site";
import styles from "./footer.module.css";

export async function Footer() {
  const t = await getTranslations("Footer");
  const tNav = await getTranslations("Nav");
  const tCommon = await getTranslations("Common");
  const waUrl = waHref(tCommon("waMessage"));

  const socials = [
    {
      label: "WhatsApp",
      href: waUrl,
      icon: <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />,
    },
    {
      label: "Instagram",
      href: CONTACT.instagram,
      icon: (
        <>
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </>
      ),
    },
    {
      label: "Facebook",
      href: CONTACT.facebook,
      icon: <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />,
    },
    {
      label: "LinkedIn",
      href: CONTACT.linkedin,
      icon: (
        <>
          <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </>
      ),
    },
  ];

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.brand}>
            <a href="#hero" aria-label="AutoKing">
              <Logo />
            </a>
            <p>{t("brandDesc")}</p>
          </div>

          <div className={styles.col}>
            <h4>{t("navTitle")}</h4>
            {NAV_LINKS.map((link) => (
              <a href={link.href} key={link.href}>
                {tNav(link.key)}
              </a>
            ))}
          </div>

          <div className={styles.col}>
            <h4>{t("contactTitle")}</h4>
            <a href={waUrl} target="_blank" rel="noopener">
              {t("waContact")}
            </a>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            <a href="#planes">{t("plansLink")}</a>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} {t("rights")}</p>
          <div className={styles.socials}>
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                {...(s.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  {s.icon}
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
