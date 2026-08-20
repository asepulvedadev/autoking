import { getTranslations, setRequestLocale } from "next-intl/server";
import { ScrollProgress } from "@autoking/ui";
import { Header } from "@/shared/header/header";
import { WhatsAppFloat } from "@/shared/whatsapp-float/whatsapp-float";
import { StickyCta } from "@/shared/sticky-cta/sticky-cta";
import { ScrollReveal } from "@/shared/scroll-reveal";
import { Hero } from "@/features/hero/hero";
import { Problem } from "@/features/problem/problem";
import { Solution } from "@/features/solution/solution";
import { Benefits } from "@/features/benefits/benefits";
import { BrandPreview } from "@/features/brand-preview/brand-preview";
import { RoiCalculator } from "@/features/roi-calculator/roi-calculator";
import { LiveDemo } from "@/features/live-demo/live-demo";
import { Integrations } from "@/features/integrations/integrations";
import { Pricing } from "@/features/pricing/pricing";
import { Faq } from "@/features/faq/faq";
import { LeadForm } from "@/features/lead-form/lead-form";
import { Footer } from "@/features/footer/footer";
import { RevenueLoop } from "@/features/revenue-loop/revenue-loop";

/**
 * Landing — 10 secciones.
 *
 * Venía de 15 secciones y 14.635px (unas 15 pantallas de scroll). En una
 * landing larga la gente no lee más: lee menos. Cada sección extra diluye el
 * mensaje y empuja el botón de compra más lejos.
 *
 * El recorrido sigue el WhatsApp Revenue Loop:
 *   mensaje perdido → respuesta → calificación → cita → seguimiento → acción
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
  const tCommon = await getTranslations("Common");

  return (
    <>
      <ScrollProgress />
      <Header />
      <a className="skip-link" href="#main-content">
        {tCommon("skipToContent")}
      </a>
      <main id="main-content" tabIndex={-1}>
        {/* 1 · Qué es y para quién */}
        <Hero />
        {/* 2 · El recorrido de cada conversación hasta convertirse en ingreso */}
        <RevenueLoop />
        {/* 3 · El dolor que el loop elimina */}
        <Problem />
        {/* 4 · Cómo se implementa */}
        <Solution />
        {/* 5 · Qué cambia para el negocio */}
        <Benefits />
        {/* 6 · El loop en movimiento */}
        <BrandPreview />
        {/* 7 · La prueba: que le escriba al agente */}
        <LiveDemo />
        {/* 8 · Cuánto está perdiendo hoy */}
        <RoiCalculator />
        {/* 9 · Cuánto cuesta */}
        <Pricing />
        {/* 10 · Dudas y contacto */}
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
