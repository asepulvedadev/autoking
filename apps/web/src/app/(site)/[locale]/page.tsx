import { setRequestLocale } from "next-intl/server";
import { ScrollProgress } from "@autoking/ui";
import { Header } from "@/shared/header/header";
import { WhatsAppFloat } from "@/shared/whatsapp-float/whatsapp-float";
import { StickyCta } from "@/shared/sticky-cta/sticky-cta";
import { ScrollReveal } from "@/shared/scroll-reveal";
import { Hero } from "@/features/hero/hero";
import { Problem } from "@/features/problem/problem";
import { Solution } from "@/features/solution/solution";
import { Benefits } from "@/features/benefits/benefits";
import { RoiCalculator } from "@/features/roi-calculator/roi-calculator";
import { LiveDemo } from "@/features/live-demo/live-demo";
import { Integrations } from "@/features/integrations/integrations";
import { Pricing } from "@/features/pricing/pricing";
import { Faq } from "@/features/faq/faq";
import { LeadForm } from "@/features/lead-form/lead-form";
import { Footer } from "@/features/footer/footer";

/**
 * Landing — 8 secciones.
 *
 * Venía de 15 secciones y 14.635px (unas 15 pantallas de scroll). En una
 * landing larga la gente no lee más: lee menos. Cada sección extra diluye el
 * mensaje y empuja el botón de compra más lejos.
 *
 * El recorrido ahora sigue el mismo orden con el que vende un vendedor bueno:
 *   dolor → solución → prueba → cuánto pierdo → cuánto cuesta → dudas → acción
 *
 * Qué salió y por qué:
 *   InAction    → el video de marca no vende; distrae justo después del hero.
 *   Stats       → los números que importan ya están en el Hero. Repetirlos
 *                 los devalúa.
 *   Comparison  → la comparación "con/sin AutoKing" pertenece al momento del
 *                 precio, no antes. Se resuelve dentro de Planes.
 *   AgentChat   → mostraba una conversación simulada. LiveDemo deja escribirle
 *                 al agente DE VERDAD: una demo real le gana a una actuada.
 *   Industries  → el rubro se resuelve en el copy del Hero y en la demo.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <ScrollProgress />
      <Header />
      <main>
        {/* 1 · Qué es y para quién */}
        <Hero />
        {/* 2 · El dolor, en sus términos */}
        <Problem />
        {/* 3 · Cómo se resuelve */}
        <Solution />
        {/* 4 · Qué gana */}
        <Benefits />
        {/* 5 · La prueba: que le escriba al agente */}
        <LiveDemo />
        {/* 6 · Cuánto está perdiendo hoy */}
        <RoiCalculator />
        {/* 7 · Cuánto cuesta */}
        <Pricing />
        {/* 8 · Dudas y contacto */}
        <Faq />
        <LeadForm />
      </main>
      {/* Banda fina de confianza, no una sección: no compite por atención. */}
      <Integrations />
      <Footer />
      <WhatsAppFloat />
      <StickyCta />
      <ScrollReveal />
    </>
  );
}
