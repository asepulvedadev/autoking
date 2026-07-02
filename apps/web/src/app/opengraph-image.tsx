import { ImageResponse } from "next/og";

export const alt = "AutoKing — Automatiza. Inteligencia. Imperio.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagen que se muestra al compartir el link (WhatsApp, redes). Se genera
 *  dinámicamente con el branding AutoKing (negro + azul). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#05070d",
          backgroundImage:
            "radial-gradient(circle at 50% 8%, rgba(30,107,255,0.35), transparent 55%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 34,
            letterSpacing: 8,
            color: "#4d8bff",
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          👑  AGENTES DE IA
        </div>
        <div style={{ display: "flex", fontSize: 130, fontWeight: 800, lineHeight: 1 }}>
          <span style={{ color: "#f4f7ff" }}>Auto</span>
          <span style={{ color: "#4d8bff" }}>King</span>
        </div>
        <div style={{ fontSize: 40, color: "#c3cde0", fontWeight: 700, marginTop: 28 }}>
          Automatiza. Inteligencia. Imperio.
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#9aa6be",
            marginTop: 30,
            maxWidth: 820,
            textAlign: "center",
          }}
        >
          Un agente de IA que atiende, responde y agenda solo en WhatsApp, 24/7.
        </div>
      </div>
    ),
    { ...size },
  );
}
