import { SITE_URL, CONTACT } from "@/lib/site";
import { FAQS } from "@/features/faq/faqs";

/** JSON-LD para rich results de Google (Organization + FAQPage).
 *  Server component: se serializa en el HTML inicial. */
export function StructuredData() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AutoKing",
    url: SITE_URL,
    logo: `${SITE_URL}/AutoKing-logo.png`,
    description:
      "Agentes de inteligencia artificial que atienden, responden y agendan por tu negocio en WhatsApp, 24/7.",
    slogan: "Automatiza. Inteligencia. Imperio.",
    email: CONTACT.email,
    sameAs: [CONTACT.instagram, CONTACT.facebook, CONTACT.linkedin].filter((u) => u && u !== "#"),
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
    </>
  );
}
