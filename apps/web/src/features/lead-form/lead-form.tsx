"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@autoking/ui";
import { submitLead, type LeadState } from "./actions";

const field =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[var(--color-faint)] focus:border-blue-bright";

export function LeadForm() {
  const t = useTranslations("LeadForm");
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead, {});

  return (
    <section
      className="section"
      id="contacto"
      style={{ background: "linear-gradient(180deg, transparent, rgb(30 107 255 / 0.04), transparent)" }}
    >
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h2>
            {t("titleA")} <span className="text-blue">{t("titleHighlight")}</span>
          </h2>
          <p>{t("subtitle")}</p>
        </div>

        <div className="reveal mx-auto max-w-lg rounded-[var(--radius-lg)] border border-[rgb(30_107_255_/_0.3)] bg-[linear-gradient(180deg,var(--color-surface),var(--color-bg-2))] p-6 shadow-[var(--shadow-blue)] sm:p-8">
          {state.ok ? (
            <div className="py-10 text-center">
              <p className="text-lg font-semibold text-[var(--color-success)]">{t("success")}</p>
            </div>
          ) : (
            <form action={action} className="flex flex-col gap-3">
              <input name="name" required placeholder={t("name")} className={field} autoComplete="name" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input name="business" placeholder={t("business")} className={field} />
                <input name="whatsapp" required placeholder={t("whatsapp")} className={field} autoComplete="tel" />
              </div>
              <input name="email" type="email" placeholder={t("email")} className={field} autoComplete="email" />
              <textarea name="message" rows={2} placeholder={t("message")} className={field} />
              {state.error && (
                <p className="text-sm text-[var(--color-danger)]">
                  {state.error === "required" ? t("required") : t("error")}
                </p>
              )}
              <button
                type="submit"
                disabled={pending}
                className={buttonVariants({ variant: "primary", className: "mt-1 w-full disabled:opacity-60" })}
              >
                {pending ? t("sending") : t("submit")}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
