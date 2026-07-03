"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@autoking/ui";
import { testChat } from "./actions";

type Msg = { from: "user" | "agent"; text: string };

export function AgentChat({ agentId, assistant }: { agentId: string; assistant: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [session] = useState(() => "admin-" + Math.random().toString(36).slice(2, 10));

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async () => {
    const clean = input.trim();
    if (!clean || busy) return;
    setInput("");
    setMessages((m) => [...m, { from: "user", text: clean }]);
    setBusy(true);
    const res = await testChat(agentId, clean, session);
    setMessages((m) => [...m, { from: "agent", text: res.reply || res.error || "Sin respuesta." }]);
    setBusy(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-medium text-blue-bright transition-colors hover:bg-blue/[0.1]"
      >
        Probar chat
      </button>
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--line)] bg-[rgb(7_12_16_/_0.6)]">
      <div ref={bodyRef} className="flex h-64 flex-col gap-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="m-auto text-sm text-[var(--color-faint)]">Escribile como si fueras un cliente 👋</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-snug",
              m.from === "user"
                ? "self-end rounded-br-md bg-[linear-gradient(135deg,#1e6bff,#1450c7)] text-white"
                : "self-start rounded-bl-md bg-[#1b2630] text-[#e7eefb]",
            )}
          >
            {m.text}
          </div>
        ))}
        {busy && (
          <div className="self-start rounded-2xl rounded-bl-md bg-[#1b2630] px-4 py-3 text-xs text-[var(--color-muted)]">
            {assistant || "El agente"} está pensando…
          </div>
        )}
      </div>
      <form
        className="flex items-center gap-2 border-t border-[var(--line)] p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un mensaje…"
          className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-[var(--color-bg-2)] px-4 py-2.5 text-sm text-white outline-none placeholder:text-[var(--color-faint)] focus:border-blue-bright"
        />
        <button
          type="submit"
          disabled={busy}
          className="grid h-10 w-10 flex-none place-items-center rounded-full bg-gradient-to-br from-blue-bright to-blue text-white transition-transform hover:scale-105 disabled:opacity-50"
          aria-label="Enviar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </div>
  );
}
