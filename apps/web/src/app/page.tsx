import { ScrollProgress } from "@autoking/ui";
import { Header } from "@/shared/header/header";
import { WhatsAppFloat } from "@/shared/whatsapp-float/whatsapp-float";
import { StickyCta } from "@/shared/sticky-cta/sticky-cta";
import { ScrollReveal } from "@/shared/scroll-reveal";
import { Hero } from "@/features/hero/hero";
import { Problem } from "@/features/problem/problem";
import { Solution } from "@/features/solution/solution";
import { Benefits } from "@/features/benefits/benefits";
import { Stats } from "@/features/stats/stats";
import { Comparison } from "@/features/comparison/comparison";
import { Testimonials } from "@/features/testimonials/testimonials";
import { Integrations } from "@/features/integrations/integrations";
import { Pricing } from "@/features/pricing/pricing";
import { Demo } from "@/features/demo/demo";
import { Faq } from "@/features/faq/faq";
import { Footer } from "@/features/footer/footer";

export default function HomePage() {
  return (
    <>
      <ScrollProgress />
      <Header />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <Benefits />
        <Stats />
        <Comparison />
        <Testimonials />
        <Integrations />
        <Pricing />
        <Demo />
        <Faq />
      </main>
      <Footer />
      <WhatsAppFloat />
      <StickyCta />
      <ScrollReveal />
    </>
  );
}
