import { getTranslations } from "next-intl/server";
import { createPublicClient } from "@/lib/supabase/public";
import { TestimonialsCarousel, type Testimonio } from "./testimonials-carousel";

export async function Testimonials() {
  const t = await getTranslations("Testimonials");
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("testimonios")
    .select("id, quote, author_name, author_role, rating, avatar_url")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  const items = (data ?? []) as Testimonio[];
  if (items.length === 0) return null;

  return (
    <section className="section" id="testimonios">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h2>
            {t("titleA")} <span className="text-blue">{t("titleHighlight")}</span>
          </h2>
          <p>{t("subtitle")}</p>
        </div>

        <TestimonialsCarousel items={items} prevLabel={t("prev")} nextLabel={t("next")} />
      </div>
    </section>
  );
}
