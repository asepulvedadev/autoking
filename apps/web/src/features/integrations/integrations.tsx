import { getTranslations } from "next-intl/server";
import { Marquee } from "@autoking/ui";

function Chip({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-[var(--line)] bg-[var(--color-surface)] px-5 py-2.5">
      <span className="h-2 w-2 flex-none rounded-full bg-blue-bright shadow-[0_0_8px_var(--color-blue-bright)]" />
      <span className="whitespace-nowrap text-sm font-medium text-[var(--color-muted)]">{label}</span>
    </div>
  );
}

export async function Integrations() {
  const t = await getTranslations("Integrations");
  const tools = t.raw("tools") as string[];

  return (
    <section className="section" id="integraciones">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h2>
            {t("titleA")} <span className="text-blue">{t("titleHighlight")}</span>
          </h2>
          <p>{t("subtitle")}</p>
        </div>
      </div>

      <div
        className="reveal relative"
        style={{
          maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
        }}
      >
        <Marquee speed={34}>
          {tools.map((tool) => (
            <Chip key={tool} label={tool} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
