import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "../globals.css";

/**
 * Layout RAÍZ del grupo `(cliente)`.
 *
 * En este proyecto cada grupo de rutas trae su propio `<html>`, sus fuentes y
 * el CSS: no hay un layout raíz común que los cubra. Sin este archivo el panel
 * del cliente renderiza el HTML correcto pero SIN estilos — se ve como una
 * página de 1995. Lo detectó la prueba con navegador; las de SQL y las de
 * status HTTP pasaban igual, porque el contenido siempre estuvo bien.
 */

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
  title: "AutoKing · Mi agente",
  robots: { index: false, follow: false },
};

export default function ClienteRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${sora.variable}`}>
      <body>{children}</body>
    </html>
  );
}
