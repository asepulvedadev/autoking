"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { buttonVariants, WhatsAppIcon, cn } from "@autoking/ui";
import { Link } from "@/i18n/navigation";
import { waHref } from "@/lib/site";
import { submitLead, getAgentReply, type LeadState, type Lead } from "./actions";

const field =
  // rounded-xl era 12px: un radio inventado que no estaba en la escala. Los
  // campos usan el mismo radio que los botones, así el formulario se lee como
  // una pieza y no como tres controles de sitios distintos.
  "w-full rounded-[var(--radius-sm)] border border-line bg-bg-2 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-faint focus:border-blue-bright";

/** Respuesta inmediata del agente: se ve "escribiendo" y luego responde
 *  personalizado al negocio del prospecto. Es la demo en vivo del producto. */
function LeadSuccess({ lead }: { lead: Lead }) {
  const t = useTranslations("LeadForm");
  const tCommon = useTranslations("Common");
  const [reply, setReply] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getAgentReply(lead).then((r) => {
      if (alive) setReply(r.reply);
    });
    return () => {
      alive = false;
    };
  }, [lead]);

  return (
    <div className="animate-[fadeIn_.4s_var(--ease)]">
      <p className="mb-4 text-center text-lg font-semibold text-[var(--color-success)]">
        {t("successTitle", { name: lead.name })}
      </p>

      <div className="overflow-hidden rounded-2xl border border-line bg-[rgb(7_12_16_/_0.6)]">
        {/* header estilo WhatsApp */}
        <div className="flex items-center gap-3 border-b border-line bg-[#102434] px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-blue text-xs font-bold text-white">
            AK
          </span>
          <div>
            <div className="text-sm font-semibold text-white">{t("agentName")}</div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-success)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" /> {t("online")}
            </div>
          </div>
        </div>

        {/* cuerpo */}
        <div className="flex min-h-[120px] flex-col gap-2.5 p-4">
          {reply === null ? (
            <>
              <div className="flex items-center gap-1 self-start rounded-2xl rounded-bl-md bg-[#1b2630] px-4 py-3">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-1.5 w-1.5 rounded-full bg-[var(--color-muted)]"
                    style={{ animation: `float 1s ${d * 0.15}s infinite` }}
                  />
                ))}
              </div>
              <span className="px-1 text-xs text-[var(--color-faint)]">{t("preparing")}</span>
            </>
          ) : (
            <div className="max-w-[90%] self-start whitespace-pre-wrap rounded-2xl rounded-bl-md bg-[#1b2630] px-3.5 py-2.5 text-[14px] leading-snug text-[#e7eefb] animate-[fadeIn_.3s_var(--ease)]">
              {reply}
            </div>
          )}
        </div>
      </div>

      {reply && (
        <a
          href={waHref(tCommon("waMessage"))}
          target="_blank"
          rel="noopener"
          className={buttonVariants({ variant: "primary", className: "mt-4 w-full animate-[fadeIn_.4s_var(--ease)]" })}
        >
          <WhatsAppIcon /> {t("continueWa")}
        </a>
      )}
    </div>
  );
}

export function LeadForm() {
  const t = useTranslations("LeadForm");
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead, {});

  return (
    <section className="section border-t border-line" id="contacto">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h2>
            {t("titleA")} <span className="text-blue">{t("titleHighlight")}</span>
          </h2>
          <p>{t("subtitle")}</p>
        </div>

        {/* La sombra azul se reserva al botón de acción: si la caja entera
            brilla, el botón que está adentro deja de destacar. */}
        <div className="reveal mx-auto max-w-lg rounded-[var(--radius-card)] border border-blue/30 bg-surface p-6 shadow-raised sm:p-8">
          {state.ok && state.lead ? (
            <LeadSuccess lead={state.lead} />
          ) : (
            <form action={action} className="flex flex-col gap-3">
              <input name="name" required placeholder={t("name")} className={field} autoComplete="name" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input name="business" placeholder={t("business")} className={field} />
                <input name="whatsapp" required placeholder={t("whatsapp")} className={field} autoComplete="tel" />
              </div>
              <input name="email" type="email" placeholder={t("email")} className={field} autoComplete="email" />
              <textarea name="message" rows={2} placeholder={t("message")} className={field} />

              {/* Consentimiento obligatorio (Habeas Data, Ley 1581/2012). */}
              <label className="flex items-start gap-2.5 text-xs leading-snug text-[var(--color-muted)]">
                <input
                  type="checkbox"
                  name="consent"
                  required
                  className="mt-0.5 h-4 w-4 flex-none accent-[var(--color-primary,#1e6bff)]"
                />
                <span>
                  {t.rich("consent", {
                    link: (chunks) => (
                      <Link
                        href="/privacidad"
                        target="_blank"
                        rel="noopener"
                        className="text-blue-bright underline hover:text-white"
                      >
                        {chunks}
                      </Link>
                    ),
                  })}
                </span>
              </label>

              {state.error && (
                <p className="text-sm text-[var(--color-danger)]">
                  {state.error === "required"
                    ? t("required")
                    : state.error === "consent"
                      ? t("consentRequired")
                      : t("error")}
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
