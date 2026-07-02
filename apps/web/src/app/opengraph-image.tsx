import { ImageResponse } from "next/og";

export const alt = "AutoKing — Automatiza. Inteligencia. Imperio.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Corona de marca como SVG inline (data-URI) → sin leer archivos, estable en el build.
const CROWN_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 48 48'><path d='M8 16l7 7 9-13 9 13 7-7-3 23H11L8 16z' fill='#4d8bff'/><path d='M14 41h20l-1.4 4H15.4L14 41z' fill='#1e6bff'/><circle cx='8' cy='14' r='3' fill='#4d8bff'/><circle cx='40' cy='14' r='3' fill='#4d8bff'/><circle cx='24' cy='8' r='3.4' fill='#4d8bff'/></svg>`;
const CROWN_SRC = `data:image/svg+xml,${encodeURIComponent(CROWN_SVG)}`;

/** Imagen que se muestra al compartir el link (WhatsApp, redes),
 *  con el ícono de marca y el branding AutoKing (negro + azul). */
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
          backgroundImage: "radial-gradient(circle at 50% 12%, rgba(30,107,255,0.35), transparent 55%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={CROWN_SRC} width={150} height={150} alt="" style={{ marginBottom: 26 }} />
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
