import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEMO_FALLBACK =
  "Perdón, no pude responder en este momento 😅 ¿Quieres que te agenden una demo por WhatsApp? 👑";

/**
 * Proxy público: recibe el mensaje del chat de la landing y lo reenvía al
 * bridge del VPS, que lo responde con el agente sandbox `autoking-web`
 * (sin acceso a base de datos ni herramientas). El secreto nunca sale del server.
 */
export async function POST(req: Request) {
  let body: { message?: unknown; session?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const message = String(body.message ?? "").slice(0, 600).trim();
  if (!message) return NextResponse.json({ error: "empty_message" }, { status: 400 });
  const session = String(body.session ?? "anon").slice(0, 40);

  const url = process.env.AGENT_BRIDGE_URL;
  const secret = process.env.AGENT_BRIDGE_SECRET;
  if (!url || !secret) {
    // Sin backend configurado: degradar con elegancia, no romper la landing.
    return NextResponse.json({ reply: DEMO_FALLBACK });
  }

  try {
    const upstream = await fetch(`${url.replace(/\/$/, "")}/chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, session }),
      signal: AbortSignal.timeout(75_000),
    });

    if (!upstream.ok) return NextResponse.json({ reply: DEMO_FALLBACK });
    const data = (await upstream.json()) as { reply?: string };
    const reply = typeof data.reply === "string" && data.reply.trim() ? data.reply.trim() : DEMO_FALLBACK;
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: DEMO_FALLBACK });
  }
}
