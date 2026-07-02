import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  // El español (default) vive en "/", el inglés en "/en".
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
