import { getTranslations } from "next-intl/server";
import { SITE_URL, CONTACT } from "@/lib/site";

/** JSON-LD para rich results de Google (Organization + FAQPage), localizado. */
export async function StructuredData() {
  const tMeta = await getTranslations("Meta");
  const tFaq = await getTranslations("Faq");
  const tCommon = await getTranslations("Common");
  const faqs = tFaq.raw("items") as { q: string; a: string }[];

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AutoKing",
    url: SITE_URL,
    logo: `${SITE_URL}/AutoKing-logo.png`,
    description: tMeta("description"),
    slogan: tCommon("tagline"),
    email: CONTACT.email,
    sameAs: [CONTACT.instagram, CONTACT.facebook, CONTACT.linkedin].filter((u) => u && u !== "#"),
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }} />
    </>
  );
}
