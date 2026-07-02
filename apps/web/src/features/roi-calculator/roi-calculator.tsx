"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatedNumber, buttonVariants, WhatsAppIcon } from "@autoking/ui";
import { waHref } from "@/lib/site";

// Supuesto transparente: de los que escriben y no reciben respuesta a tiempo,
// una parte se va con la competencia. Conservador y declarado en la UI.
const TASA_FUGA = 0.35;

type Field = {
  key: "consultas" | "ticket" | "fuera";
  tkey: "fieldConsultas" | "fieldTicket" | "fieldFuera";
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
};

const FIELDS: Field[] = [
  { key: "consultas", tkey: "fieldConsultas", min: 20, max: 1000, step: 10 },
  { key: "ticket", tkey: "fieldTicket", min: 100, max: 5000, step: 50, prefix: "$" },
  { key: "fuera", tkey: "fieldFuera", min: 0, max: 100, step: 5, suffix: "%" },
];

export function RoiCalculator() {
  const t = useTranslations("Roi");
  const [values, setValues] = useState({ consultas: 200, ticket: 500, fuera: 40 });

  const { clientesPerdidos, plataPerdida } = useMemo(() => {
    const sinResponder = values.consultas * (values.fuera / 100);
    const perdidos = Math.round(sinResponder * TASA_FUGA);
    return { clientesPerdidos: perdidos, plataPerdida: perdidos * values.ticket };
  }, [values]);

  const set = (key: Field["key"], v: number) => setValues((s) => ({ ...s, [key]: v }));

  const waMsg = t("waMessage", { amount: plataPerdida.toLocaleString("es-MX") });

  return (
    <section className="section" id="calculadora">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h2>
            {t("titleA")} <span className="text-blue">{t("titleHighlight")}</span>
          </h2>
          <p>{t("subtitle")}</p>
        </div>

        <div className="reveal grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Inputs */}
          <div className="card flex flex-col justify-center gap-8">
            {FIELDS.map((f) => {
              const val = values[f.key];
              const fill = ((val - f.min) / (f.max - f.min)) * 100;
              return (
                <div key={f.key}>
                  <div className="mb-3 flex items-baseline justify-between gap-4">
                    <label htmlFor={f.key} className="text-sm text-[var(--color-muted)]">
                      {t(f.tkey)}
                    </label>
                    <span className="font-display text-lg font-bold text-white">
                      {f.prefix}
                      {val.toLocaleString("es-MX")}
                      {f.suffix}
                    </span>
                  </div>
                  <input
                    id={f.key}
                    type="range"
                    className="range"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={val}
                    onChange={(e) => set(f.key, Number(e.target.value))}
                    style={{ ["--range-fill" as string]: `${fill}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Resultado */}
          <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-[rgb(255_90_90_/_0.28)] bg-[radial-gradient(ellipse_80%_120%_at_50%_0%,rgb(255_80_80_/_0.14),transparent_60%),linear-gradient(180deg,#160c0e,#0a0709)] p-8 text-center">
            <p className="text-sm text-[var(--color-muted)]">{t("resultPre")}</p>
            <div className="my-2 font-display text-[clamp(40px,8vw,64px)] font-extrabold leading-none text-[#ff6b6b]">
              <AnimatedNumber value={plataPerdida} prefix="$" />
            </div>
            <p className="text-sm text-[var(--color-muted)]">{t("resultSuffix")}</p>
            <p className="mt-4 text-[15px] text-[var(--color-ink)]">
              ≈ <AnimatedNumber value={clientesPerdidos} className="font-bold text-white" /> {t("clientsText")}
            </p>

            <div className="mt-7 w-full rounded-2xl border border-[rgb(30_107_255_/_0.3)] bg-blue/[0.06] p-4">
              <p className="text-sm text-[var(--color-muted)]">
                {t("planNoteA")}
                <b className="text-white">{t("planNoteBold")}</b>
                {t("planNoteB")}
              </p>
              <a
                href={waHref(waMsg)}
                target="_blank"
                rel="noopener"
                className={buttonVariants({ variant: "primary", className: "mt-4 w-full" })}
              >
                <WhatsAppIcon /> {t("cta")}
              </a>
            </div>
          </div>
        </div>

        <p className="reveal mt-5 text-center text-xs text-[var(--color-faint)]">
          {t("disclaimer", { pct: Math.round(TASA_FUGA * 100) })}
        </p>
      </div>
    </section>
  );
}
