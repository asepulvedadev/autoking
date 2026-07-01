import { Header } from "@/shared/header/header";
import { WhatsAppFloat } from "@/shared/whatsapp-float/whatsapp-float";
import { ScrollReveal } from "@/shared/scroll-reveal";
import { Hero } from "@/features/hero/hero";
import { Problem } from "@/features/problem/problem";
import { Solution } from "@/features/solution/solution";
import { Benefits } from "@/features/benefits/benefits";
import { Pricing } from "@/features/pricing/pricing";
import { Demo } from "@/features/demo/demo";
import { Faq } from "@/features/faq/faq";
import { Footer } from "@/features/footer/footer";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <Benefits />
        <Pricing />
        <Demo />
        <Faq />
      </main>
      <Footer />
      <WhatsAppFloat />
      <ScrollReveal />
    </>
  );
}
