import { getTranslations } from "next-intl/server";
import { CheckIcon, cn } from "@autoking/ui";

type Cell = boolean | string;
type Row = { feature: string; autoking: Cell; none: Cell; employee: Cell };

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="mx-auto h-5 w-5 text-[var(--color-danger)]">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

/** Valor de una celda: check / cross para booleanos, texto con tono para strings.
 *  `emphasis` agranda y resalta (se usa en la fila de costo para que el contraste
 *  $90 USD vs $2.000.000 COP salte a la vista). */
function Value({ v, tone, emphasis }: { v: Cell; tone: "good" | "bad" | "mid"; emphasis?: boolean }) {
  if (typeof v === "string") {
    return (
      <span
        className={cn(
          emphasis ? "font-display text-base font-extrabold sm:text-lg" : "text-sm",
          tone === "good" && (emphasis ? "text-[var(--color-success)]" : "font-semibold text-white"),
          tone === "bad" && "text-[var(--color-danger)]",
          tone === "mid" && "text-[var(--color-muted)]",
        )}
      >
        {v}
      </span>
    );
  }
  return v ? <CheckIcon className="mx-auto h-5 w-5 text-[var(--color-success)]" /> : <XIcon />;
}

export async function Comparison() {
  const t = await getTranslations("Comparison");
  const rows = t.raw("rows") as Row[];
  // En la fila de costo (última) el empleado se muestra en rojo (caro), no en gris.
  const employeeTone = (i: number): "bad" | "mid" => (i === rows.length - 1 ? "bad" : "mid");

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

        {/* ---------- Tabla (>= 768px) ---------- */}
        <div className="reveal hidden md:block">
          <table className="w-full border-separate border-spacing-0">
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
              {rows.map((row, i) => {
                const isCost = i === rows.length - 1;
                return (
                  <tr key={row.feature}>
                    <td className="border-t border-[var(--line)] p-4 text-sm text-[var(--color-ink)]">{row.feature}</td>
                    <td
                      className={cn(
                        "border-x border-blue/50 bg-blue/[0.06] p-4 text-center",
                        i === rows.length - 1 && "rounded-b-[var(--radius-card)] border-b",
                      )}
                    >
                      <Value v={row.autoking} tone="good" emphasis={isCost} />
                    </td>
                    <td className="border-t border-[var(--line)] p-4 text-center">
                      <Value v={row.none} tone="bad" />
                    </td>
                    <td className={cn("border-t border-[var(--line)] p-4 text-center", isCost && "bg-[rgb(255_80_80_/_0.06)]")}>
                      <Value v={row.employee} tone={employeeTone(i)} emphasis={isCost} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ---------- Tarjetas apiladas (< 768px) ---------- */}
        <div className="reveal flex flex-col gap-3 md:hidden">
          {rows.map((row, i) => {
            const isCost = i === rows.length - 1;
            return (
              <div
                key={row.feature}
                className={cn(
                  "rounded-[var(--radius-card)] border p-4",
                  isCost ? "border-blue/50 bg-blue/[0.05]" : "border-[var(--line)] bg-[var(--color-surface)]",
                )}
              >
                <div className="mb-3 text-sm font-semibold text-white">{row.feature}</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-blue-bright">{t("colAutoking")}</div>
                    <Value v={row.autoking} tone="good" emphasis={isCost} />
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-faint)]">{t("colNone")}</div>
                    <Value v={row.none} tone="bad" />
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-faint)]">{t("colEmployee")}</div>
                    <Value v={row.employee} tone={employeeTone(i)} emphasis={isCost} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
