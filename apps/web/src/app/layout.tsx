import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import { StructuredData } from "@/shared/structured-data";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AutoKing — Agentes de IA que atienden y agendan por ti 24/7",
    template: "%s · AutoKing",
  },
  description:
    "Deja de perder clientes y citas. AutoKing te pone un agente de IA que atiende, responde y agenda solo en WhatsApp, 24/7. Como un empleado que nunca duerme.",
  keywords: [
    "agente de IA",
    "inteligencia artificial WhatsApp",
    "chatbot WhatsApp",
    "agendar citas automático",
    "atención al cliente 24/7",
    "automatización para negocios",
    "AutoKing",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "AutoKing — Automatiza. Inteligencia. Imperio.",
    description: "Un agente de IA que atiende, responde y agenda solo en WhatsApp, 24/7.",
    url: SITE_URL,
    siteName: "AutoKing",
    type: "website",
    locale: "es_MX",
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoKing — Automatiza. Inteligencia. Imperio.",
    description: "Un agente de IA que atiende, responde y agenda solo en WhatsApp, 24/7.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${sora.variable}`}>
      <body>
        {children}
        <StructuredData />
      </body>
    </html>
  );
}
