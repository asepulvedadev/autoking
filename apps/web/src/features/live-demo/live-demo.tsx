"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { buttonVariants, WhatsAppIcon, cn } from "@autoking/ui";
import { waHref } from "@/lib/site";

type Msg = { from: "agent" | "user"; text: string };

export function LiveDemo() {
  const t = useTranslations("LiveDemo");
  const tCommon = useTranslations("Common");

  const greeting = t("greeting");
  const fallback = t("fallback");
  const quick = t.raw("quick") as string[];

  const [messages, setMessages] = useState<Msg[]>([{ from: "agent", text: greeting }]);
  const [typing, setTyping] = useState(false);
  const [slowHint, setSlowHint] = useState(false);
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const [sessionId] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  );

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, slowHint]);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || typing) return;
    setInput("");
    setMessages((m) => [...m, { from: "user", text: clean }]);
    setTyping(true);

    // El modelo puede tardar unos segundos: tras 4s mostramos un aviso para que
    // no parezca colgado, y a los 35s abortamos con un mensaje amable.
    const hintTimer = setTimeout(() => setSlowHint(true), 4000);
    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), 35000);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean, session: sessionId }),
        signal: controller.signal,
      });
      const data = (await res.json()) as { reply?: string };
      setMessages((m) => [...m, { from: "agent", text: data.reply || fallback }]);
    } catch {
      setMessages((m) => [...m, { from: "agent", text: fallback }]);
    } finally {
      clearTimeout(hintTimer);
      clearTimeout(abortTimer);
      setTyping(false);
      setSlowHint(false);
    }
  };

  return (
    <section className="section" id="demo-vivo">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h2>
            {t("titleA")} <span className="text-blue">{t("titleHighlight")}</span>
          </h2>
          <p>{t("subtitle")}</p>
        </div>

        <div className="reveal mx-auto max-w-lg overflow-hidden rounded-[var(--radius-lg)] border border-line-strong bg-[var(--color-surface)] shadow-cta">
          {/* header */}
          <div className="flex items-center gap-3 border-b border-line bg-[#102434] px-4 py-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-blue text-sm font-bold text-white">
              AK
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{t("agentName")}</div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-success)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" /> {t("online")}
              </div>
            </div>
          </div>

          {/* body */}
          <div ref={bodyRef} className="flex h-[340px] flex-col gap-2.5 overflow-y-auto bg-[rgb(7_12_16_/_0.6)] p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-snug animate-[fadeIn_.3s_var(--ease)]",
                  m.from === "user"
                    ? "self-end rounded-br-md bg-blue text-white"
                    : "self-start rounded-bl-md bg-[#1b2630] text-[#e7eefb]",
                )}
              >
                {m.text}
              </div>
            ))}
            {typing && (
              <div className="flex flex-col gap-1.5 self-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-[#1b2630] px-4 py-3">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 rounded-full bg-[var(--color-muted)]"
                      style={{ animation: `float 1s ${d * 0.15}s infinite` }}
                    />
                  ))}
                </div>
                {slowHint && (
                  <span className="px-1 text-xs text-[var(--color-faint)]">
                    Pensando la mejor respuesta… 💭
                  </span>
                )}
              </div>
            )}
          </div>

          {/* quick replies */}
          <div className="flex flex-wrap gap-2 border-t border-line px-3 pt-3">
            {quick.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="rounded-full border border-line-strong px-3 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:border-blue-bright hover:text-white"
              >
                {q}
              </button>
            ))}
          </div>

          {/* input */}
          <form
            className="flex items-center gap-2 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("placeholder")}
              className="min-w-0 flex-1 rounded-full border border-line bg-[var(--color-bg-2)] px-4 py-2.5 text-sm text-white outline-none placeholder:text-[var(--color-faint)] focus:border-blue-bright"
            />
            <button
              type="submit"
              aria-label="Enviar"
              className="grid h-10 w-10 flex-none place-items-center rounded-full bg-blue text-white transition-transform hover:scale-105"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>

        <div className="reveal mt-6 text-center">
          <p className="mb-4 text-xs text-[var(--color-faint)]">{t("disclaimer")}</p>
          <a
            href={waHref(tCommon("waMessage"))}
            target="_blank"
            rel="noopener"
            className={buttonVariants({ variant: "primary", size: "lg" })}
          >
            <WhatsAppIcon /> {t("cta")}
          </a>
        </div>
      </div>
    </section>
  );
}
