import { setRequestLocale } from "next-intl/server";
import { LegalPage, type LegalSection } from "@/features/legal/legal-page";
import { CONTACT } from "@/lib/site";

/* ⚠️ BORRADOR — revisar con un abogado y completar [RAZÓN SOCIAL] / [NIT] /
   [CIUDAD/DIRECCIÓN] antes de publicar. Plantilla orientativa, no asesoría legal. */

export const metadata = {
  title: "Términos y Condiciones · AutoKing",
  robots: { index: false }, // no indexar mientras sea borrador
};

const CONTENT: Record<"es" | "en", { title: string; updated: string; sections: LegalSection[] }> = {
  es: {
    title: "Términos y Condiciones del Servicio",
    updated: "Borrador — última actualización pendiente de revisión legal.",
    sections: [
      {
        heading: "1. Quiénes somos",
        body: [
          `Este servicio es prestado por [RAZÓN SOCIAL], NIT [NIT], con domicilio en [CIUDAD/DIRECCIÓN], Colombia ("AutoKing"). Contacto: ${CONTACT.email}.`,
        ],
      },
      {
        heading: "2. Objeto del servicio",
        body: [
          "AutoKing configura y opera un agente de inteligencia artificial que atiende, responde y agenda por WhatsApp en nombre de tu negocio, entrenado con la información (servicios, precios, horarios) que vos nos proporcionás.",
        ],
      },
      {
        heading: "3. Suscripción y pagos",
        body: [
          "El servicio se presta bajo una suscripción mensual según el plan elegido. Adicionalmente se cobra una instalación única (pago inicial) para el setup y la conexión de tu WhatsApp. Los precios se muestran en el sitio y pueden actualizarse con aviso previo.",
        ],
      },
      {
        heading: "4. Sin permanencia y cancelación",
        body: [
          "No hay cláusulas de permanencia. Podés cancelar cuando quieras y el servicio permanecerá activo hasta el final del período mensual ya pagado. Los valores de meses ya transcurridos no son reembolsables, salvo lo previsto en la garantía.",
        ],
      },
      {
        heading: "5. Garantía de 30 días",
        body: [
          "Si durante el primer mes tu agente no te agenda citas, te devolvemos el valor de la instalación. Esta garantía aplica por una sola vez y requiere que el negocio haya entregado la información necesaria para el entrenamiento del agente.",
        ],
      },
      {
        heading: "6. Alcance y limitaciones",
        body: [
          "El agente responde con base en la información y las reglas configuradas; puede cometer errores y no reemplaza el criterio profesional (médico, legal, financiero u otro). La disponibilidad depende de servicios de terceros (por ejemplo, WhatsApp/Meta) que están fuera de nuestro control.",
        ],
      },
      {
        heading: "7. Responsabilidades del cliente",
        body: [
          "El cliente es responsable de la veracidad de la información que entrega, del cumplimiento de las normas aplicables a su actividad y de obtener las autorizaciones de datos de sus propios clientes cuando corresponda.",
        ],
      },
      {
        heading: "8. Limitación de responsabilidad",
        body: [
          "En la máxima medida permitida por la ley, AutoKing no será responsable por lucro cesante, pérdida de oportunidades o daños indirectos derivados del uso del servicio. Nuestra responsabilidad total se limita al valor pagado por el cliente en los últimos tres (3) meses.",
        ],
      },
      {
        heading: "9. Modificaciones y ley aplicable",
        body: [
          "Podemos modificar estos términos publicando la versión vigente en el sitio. Estos términos se rigen por las leyes de la República de Colombia.",
        ],
      },
    ],
  },
  en: {
    title: "Terms & Conditions of Service",
    updated: "Draft — last update pending legal review.",
    sections: [
      {
        heading: "1. Who we are",
        body: [
          `This service is provided by [LEGAL NAME], tax ID [NIT], domiciled at [CITY/ADDRESS], Colombia ("AutoKing"). Contact: ${CONTACT.email}.`,
        ],
      },
      {
        heading: "2. The service",
        body: [
          "AutoKing sets up and operates an AI agent that attends, replies and books via WhatsApp on behalf of your business, trained with the information (services, prices, hours) you provide.",
        ],
      },
      {
        heading: "3. Subscription and payments",
        body: [
          "The service is provided under a monthly subscription according to the chosen plan. A one-time installation fee also applies for setup and WhatsApp connection. Prices are shown on the site and may be updated with prior notice.",
        ],
      },
      {
        heading: "4. No lock-in and cancellation",
        body: [
          "There are no lock-in clauses. You may cancel anytime and the service will remain active until the end of the monthly period already paid. Amounts for elapsed months are non-refundable, except as provided in the guarantee.",
        ],
      },
      {
        heading: "5. 30-day guarantee",
        body: [
          "If during the first month your agent does not book you appointments, we refund the installation fee. This guarantee applies once and requires that the business provided the information needed to train the agent.",
        ],
      },
      {
        heading: "6. Scope and limitations",
        body: [
          "The agent responds based on the configured information and rules; it may make mistakes and does not replace professional judgment (medical, legal, financial or other). Availability depends on third-party services (e.g., WhatsApp/Meta) beyond our control.",
        ],
      },
      {
        heading: "7. Client responsibilities",
        body: [
          "The client is responsible for the accuracy of the information provided, for complying with the rules applicable to its activity, and for obtaining data authorizations from its own customers where applicable.",
        ],
      },
      {
        heading: "8. Limitation of liability",
        body: [
          "To the maximum extent permitted by law, AutoKing shall not be liable for lost profits, lost opportunities or indirect damages arising from use of the service. Our total liability is limited to the amount paid by the client in the last three (3) months.",
        ],
      },
      {
        heading: "9. Changes and governing law",
        body: [
          "We may modify these terms by publishing the current version on the site. These terms are governed by the laws of the Republic of Colombia.",
        ],
      },
    ],
  },
};

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = CONTENT[locale === "en" ? "en" : "es"];
  return <LegalPage title={c.title} updated={c.updated} sections={c.sections} />;
}
