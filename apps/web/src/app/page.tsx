import { ScrollProgress } from "@autoking/ui";
import { Header } from "@/shared/header/header";
import { WhatsAppFloat } from "@/shared/whatsapp-float/whatsapp-float";
import { StickyCta } from "@/shared/sticky-cta/sticky-cta";
import { ScrollReveal } from "@/shared/scroll-reveal";
import { Hero } from "@/features/hero/hero";
import { Problem } from "@/features/problem/problem";
import { Solution } from "@/features/solution/solution";
import { InAction } from "@/features/in-action/in-action";
import { Benefits } from "@/features/benefits/benefits";
import { Stats } from "@/features/stats/stats";
import { RoiCalculator } from "@/features/roi-calculator/roi-calculator";
import { Comparison } from "@/features/comparison/comparison";
import { Testimonials } from "@/features/testimonials/testimonials";
import { Industries } from "@/features/industries/industries";
import { Integrations } from "@/features/integrations/integrations";
import { LiveDemo } from "@/features/live-demo/live-demo";
import { Pricing } from "@/features/pricing/pricing";
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
        <InAction />
        <Benefits />
        <Stats />
        <RoiCalculator />
        <Comparison />
        <Testimonials />
        <Industries />
        <Integrations />
        <LiveDemo />
        <Pricing />
        <Faq />
      </main>
      <Footer />
      <WhatsAppFloat />
      <StickyCta />
      <ScrollReveal />
    </>
  );
}
