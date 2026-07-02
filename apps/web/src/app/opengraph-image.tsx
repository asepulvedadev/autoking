import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const alt = "AutoKing — Automatiza. Inteligencia. Imperio.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagen que se muestra al compartir el link (WhatsApp, redes),
 *  con el ícono de marca real y el branding AutoKing (negro + azul). */
export default function OpengraphImage() {
  const iconData = readFileSync(fileURLToPath(new URL("./icon.png", import.meta.url)));
  const iconSrc = `data:image/png;base64,${iconData.toString("base64")}`;

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
          backgroundImage: "radial-gradient(circle at 50% 12%, rgba(30,107,255,0.35), transparent 55%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconSrc} width={150} height={150} alt="" style={{ marginBottom: 26 }} />
        <div style={{ display: "flex", fontSize: 120, fontWeight: 800, lineHeight: 1 }}>
          <span style={{ color: "#f4f7ff" }}>Auto</span>
          <span style={{ color: "#4d8bff" }}>King</span>
        </div>
        <div style={{ fontSize: 40, color: "#c3cde0", fontWeight: 700, marginTop: 26 }}>
          Automatiza. Inteligencia. Imperio.
        </div>
        <div style={{ fontSize: 27, color: "#9aa6be", marginTop: 26, maxWidth: 820, textAlign: "center" }}>
          Un agente de IA que atiende, responde y agenda solo en WhatsApp, 24/7.
        </div>
      </div>
    ),
    { ...size },
  );
}
