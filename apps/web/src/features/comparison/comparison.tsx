import { getTranslations } from "next-intl/server";
import { CheckIcon, cn } from "@autoking/ui";

type Cell = boolean | string;
type Row = { feature: string; autoking: Cell; none: Cell; employee: Cell };

function Value({ v, tone }: { v: Cell; tone: "good" | "bad" | "mid" }) {
  if (typeof v === "string") {
    return (
      <span
        className={cn(
          "text-sm",
          tone === "good" && "font-semibold text-white",
          tone === "bad" && "text-[var(--color-danger)]",
          tone === "mid" && "text-[var(--color-muted)]",
        )}
      >
        {v}
      </span>
    );
  }
  return v ? (
    <CheckIcon className="mx-auto h-5 w-5 text-[var(--color-success)]" />
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="mx-auto h-5 w-5 text-[var(--color-danger)]">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

export async function Comparison() {
  const t = await getTranslations("Comparison");
  const rows = t.raw("rows") as Row[];

  return (
    <section className="section" id="comparativa">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h2>
            {t("titleA")} <span className="text-blue">{t("titleHighlight")}</span>
          </h2>
          <p>{t("subtitle")}</p>
        </div>

        <div className="reveal overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="w-2/5 p-4 text-left text-sm font-medium text-[var(--color-faint)]"></th>
                <th className="rounded-t-[var(--radius-card)] border-x border-t border-blue/50 bg-[linear-gradient(180deg,#0e1830,#0a1020)] p-4 text-center font-display text-base font-extrabold text-white">
                  {t("colAutoking")}
                </th>
                <th className="p-4 text-center text-sm font-semibold text-[var(--color-muted)]">{t("colNone")}</th>
                <th className="p-4 text-center text-sm font-semibold text-[var(--color-muted)]">{t("colEmployee")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.feature}>
                  <td className="border-t border-[var(--line)] p-4 text-sm text-[var(--color-ink)]">{row.feature}</td>
                  <td
                    className={cn(
                      "border-x border-blue/50 bg-blue/[0.06] p-4 text-center",
                      i === rows.length - 1 && "rounded-b-[var(--radius-card)] border-b",
                    )}
                  >
                    <Value v={row.autoking} tone="good" />
                  </td>
                  <td className="border-t border-[var(--line)] p-4 text-center">
                    <Value v={row.none} tone="bad" />
                  </td>
                  <td className="border-t border-[var(--line)] p-4 text-center">
                    <Value v={row.employee} tone="mid" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
