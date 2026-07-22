import { setRequestLocale } from "next-intl/server";
import { LegalPage, type LegalSection } from "@/features/legal/legal-page";
import { CONTACT } from "@/lib/site";

/* ⚠️ BORRADOR — revisar con un abogado y completar [RAZÓN SOCIAL] / [NIT] /
   [CIUDAD/DIRECCIÓN] antes de publicar. Plantilla orientativa, no asesoría legal. */

export const metadata = {
  title: "Política de Privacidad · AutoKing",
  robots: { index: false }, // no indexar mientras sea borrador
};

const CONTENT: Record<"es" | "en", { title: string; updated: string; sections: LegalSection[] }> = {
  es: {
    title: "Política de Privacidad y Tratamiento de Datos",
    updated: "Borrador — última actualización pendiente de revisión legal.",
    sections: [
      {
        heading: "1. Responsable del tratamiento",
        body: [
          `El responsable del tratamiento de tus datos personales es [RAZÓN SOCIAL], identificada con NIT [NIT], con domicilio en [CIUDAD/DIRECCIÓN], Colombia (en adelante, "AutoKing").`,
          `Para cualquier asunto relacionado con tus datos, escribinos a ${CONTACT.email}.`,
        ],
      },
      {
        heading: "2. Datos que recogemos",
        body: [
          "Recogemos los datos que nos entregás voluntariamente a través del formulario de la web y de las conversaciones por WhatsApp: nombre, número de teléfono/WhatsApp, correo electrónico, nombre del negocio y el contenido de los mensajes que nos enviás.",
          "No recogemos datos sensibles de forma intencional. Te pedimos no compartir por estos canales información sensible (salud, datos financieros, etc.).",
        ],
      },
      {
        heading: "3. Finalidad del tratamiento",
        body: [
          "Usamos tus datos para: (i) contactarte y responder tus solicitudes; (ii) agendar y realizar demostraciones del servicio; (iii) prestar y facturar el servicio contratado; y (iv) enviarte información comercial sobre AutoKing, de la cual podés darte de baja en cualquier momento.",
        ],
      },
      {
        heading: "4. Autorización",
        body: [
          "Al completar el formulario o escribirnos por WhatsApp, autorizás de manera libre, previa, expresa e informada el tratamiento de tus datos personales conforme a esta política y a la Ley 1581 de 2012 y sus decretos reglamentarios.",
        ],
      },
      {
        heading: "5. Derechos del titular",
        body: [
          "Como titular de los datos tenés derecho a: conocer, actualizar y rectificar tus datos; solicitar prueba de la autorización otorgada; ser informado sobre el uso de tus datos; presentar quejas ante la Superintendencia de Industria y Comercio (SIC); revocar la autorización y solicitar la supresión de tus datos cuando no exista un deber legal o contractual de conservarlos.",
        ],
      },
      {
        heading: "6. Cómo ejercer tus derechos",
        body: [
          `Podés ejercer estos derechos escribiendo a ${CONTACT.email}, indicando tu solicitud y los datos que permitan identificarte. Atenderemos tu solicitud en los términos y plazos que establece la ley.`,
        ],
      },
      {
        heading: "7. Seguridad y conservación",
        body: [
          "Aplicamos medidas técnicas y administrativas razonables para proteger tus datos contra acceso no autorizado, pérdida o alteración. Conservamos los datos mientras exista una relación comercial o una finalidad legítima o legal que lo justifique.",
        ],
      },
      {
        heading: "8. Cambios a esta política",
        body: [
          "Podemos actualizar esta política. Publicaremos la versión vigente en este mismo sitio con su fecha de actualización.",
        ],
      },
    ],
  },
  en: {
    title: "Privacy & Data Processing Policy",
    updated: "Draft — last update pending legal review.",
    sections: [
      {
        heading: "1. Data controller",
        body: [
          `The controller of your personal data is [LEGAL NAME], tax ID [NIT], domiciled at [CITY/ADDRESS], Colombia ("AutoKing").`,
          `For anything related to your data, contact us at ${CONTACT.email}.`,
        ],
      },
      {
        heading: "2. Data we collect",
        body: [
          "We collect the data you voluntarily provide through the website form and WhatsApp conversations: name, phone/WhatsApp number, email, business name, and the content of the messages you send us.",
          "We do not intentionally collect sensitive data. Please do not share sensitive information (health, financial data, etc.) through these channels.",
        ],
      },
      {
        heading: "3. Purpose of processing",
        body: [
          "We use your data to: (i) contact you and answer your requests; (ii) schedule and run product demos; (iii) provide and bill the contracted service; and (iv) send you commercial information about AutoKing, which you can opt out of at any time.",
        ],
      },
      {
        heading: "4. Authorization",
        body: [
          "By completing the form or messaging us on WhatsApp, you grant free, prior, express and informed authorization to process your personal data under this policy and Colombia's Law 1581 of 2012 and its regulations.",
        ],
      },
      {
        heading: "5. Rights of the data subject",
        body: [
          "As the data subject you have the right to: access, update and rectify your data; request proof of the authorization granted; be informed about the use of your data; file complaints with the Superintendency of Industry and Commerce (SIC); and revoke authorization and request deletion of your data when there is no legal or contractual duty to keep it.",
        ],
      },
      {
        heading: "6. How to exercise your rights",
        body: [
          `You can exercise these rights by writing to ${CONTACT.email}, stating your request and data that identifies you. We will handle your request within the terms and deadlines set by law.`,
        ],
      },
      {
        heading: "7. Security and retention",
        body: [
          "We apply reasonable technical and administrative measures to protect your data against unauthorized access, loss or alteration. We keep data as long as there is a commercial relationship or a legitimate or legal purpose that justifies it.",
        ],
      },
      {
        heading: "8. Changes to this policy",
        body: ["We may update this policy. The current version will be published on this site with its update date."],
      },
    ],
  },
};

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = CONTENT[locale === "en" ? "en" : "es"];
  return <LegalPage title={c.title} updated={c.updated} sections={c.sections} />;
}
