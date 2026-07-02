import { getTranslations } from "next-intl/server";
import { CountUp, cn } from "@autoking/ui";

export async function Stats() {
  const t = await getTranslations("Stats");
  const items = t.raw("items") as { to: number; prefix: string; suffix: string; label: string }[];

  return (
    <section
      className="section"
      style={{ background: "linear-gradient(180deg, transparent, rgb(30 107 255 / 0.05), transparent)" }}
    >
      <div className="container">
        <div className="grid grid-cols-2 gap-y-10 lg:grid-cols-4">
          {items.map((s, i) => (
            <div key={s.label} className={cn("reveal text-center", i > 0 && `d${i}`)}>
              <div className="glow-text font-display text-[clamp(38px,6vw,56px)] font-extrabold leading-none text-white">
                <CountUp to={s.to} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <div className="mt-3 text-sm text-[var(--color-muted)]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
