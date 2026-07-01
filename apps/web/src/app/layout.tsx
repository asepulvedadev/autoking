import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
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
  title: "AutoKing — Agentes de IA que atienden y agendan por ti 24/7",
  description:
    "Deja de perder clientes y citas. AutoKing te pone un agente de IA que atiende, responde y agenda solo en WhatsApp, 24/7. Como un empleado que nunca duerme.",
  openGraph: {
    title: "AutoKing — Automatiza. Inteligencia. Imperio.",
    description: "Un agente de IA que atiende, responde y agenda solo en WhatsApp, 24/7.",
    type: "website",
    locale: "es_MX",
  },
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${sora.variable}`}>
      <body>{children}</body>
    </html>
  );
}
