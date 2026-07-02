import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";

const BG = "#05070d";
const BLUE = "#1e6bff";
const BLUE_BRIGHT = "#4d8bff";
const FONT = "var(--font-sora), 'Sora', system-ui, sans-serif";

/** Glow ambiental que respira. */
const Glow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const o = interpolate(frame % (fps * 4), [0, fps * 2, fps * 4], [0.4, 0.85, 0.4]);
  return (
    <div
      style={{
        position: "absolute",
        width: width * 0.62,
        height: width * 0.62,
        left: "50%",
        top: "5%",
        transform: "translateX(-50%)",
        borderRadius: "50%",
        background: "rgba(30,107,255,0.32)",
        filter: "blur(160px)",
        opacity: o,
      }}
    />
  );
};

/** Corona-K de marca (SVG). */
const Crown: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path d="M8 16l7 7 9-13 9 13 7-7-3 23H11L8 16z" fill={BLUE_BRIGHT} />
    <path d="M14 41h20l-1.4 4H15.4L14 41z" fill={BLUE} />
    <circle cx="8" cy="14" r="3" fill={BLUE_BRIGHT} />
    <circle cx="40" cy="14" r="3" fill={BLUE_BRIGHT} />
    <circle cx="24" cy="8" r="3.4" fill={BLUE_BRIGHT} />
  </svg>
);

/** Burbuja de chat con entrada por spring. */
const Bubble: React.FC<{
  delay: number;
  side: "left" | "right";
  color: string;
  children: React.ReactNode;
}> = ({ delay, side, color, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 90 } });
  const op = interpolate(frame - delay, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(s, [0, 1], [26, 0]);
  return (
    <div
      style={{
        alignSelf: side === "right" ? "flex-end" : "flex-start",
        maxWidth: "76%",
        padding: "20px 28px",
        borderRadius: 26,
        borderBottomLeftRadius: side === "left" ? 8 : 26,
        borderBottomRightRadius: side === "right" ? 8 : 26,
        background: color,
        color: "#fff",
        fontSize: 33,
        fontWeight: 500,
        lineHeight: 1.3,
        opacity: op,
        transform: `translateY(${y}px)`,
        boxShadow: side === "left" ? "0 16px 50px rgba(30,107,255,0.45)" : "0 8px 24px rgba(0,0,0,0.4)",
      }}
    >
      {children}
    </div>
  );
};

/** Puntos de "escribiendo". */
const Typing: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame();
  if (frame < from || frame > to) return null;
  const op = interpolate(frame, [from, from + 6, to - 6, to], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        alignSelf: "flex-start",
        display: "flex",
        gap: 10,
        padding: "24px 30px",
        borderRadius: 26,
        borderBottomLeftRadius: 8,
        background: "#202c3a",
        opacity: op,
      }}
    >
      {[0, 1, 2].map((i) => {
        const t = (frame - from) / 8 + i * 0.33;
        const dy = Math.sin(t * Math.PI * 2) * 6;
        return <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: "#8aa0b8", transform: `translateY(${dy}px)` }} />;
      })}
    </div>
  );
};

/** Escena 1 — la conversación: cliente pregunta, AutoKing responde y agenda. */
const ChatScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const out = interpolate(frame, [durationInFrames - 18, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Badge "cita agendada"
  const badgeDelay = 150;
  const bs = spring({ frame: frame - badgeDelay, fps: 30, config: { damping: 14 } });
  const badgeOp = interpolate(frame - badgeDelay, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: out, alignItems: "center", justifyContent: "center", padding: "0 12%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, width: "100%", maxWidth: 1080 }}>
        <Bubble delay={10} side="right" color="#2a3542">
          Hola 👋 ¿Tienen cita para mañana?
        </Bubble>
        <Typing from={55} to={95} />
        <Bubble delay={95} side="left" color="linear-gradient(135deg,#1e6bff,#1450c7)">
          ¡Con gusto! Te agendo mañana a las 5:00 p. m. ✅
        </Bubble>

        <div
          style={{
            alignSelf: "center",
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 30px",
            borderRadius: 999,
            background: "rgba(43,212,123,0.14)",
            border: "1px solid rgba(43,212,123,0.4)",
            color: "#5ee49b",
            fontSize: 30,
            fontWeight: 600,
            opacity: badgeOp,
            transform: `scale(${interpolate(bs, [0, 1], [0.8, 1])})`,
          }}
        >
          ✓ Cita agendada · 5:00 p. m.
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Escena 2 — cierre de marca. */
const BrandScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  const logoS = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const logoScale = interpolate(logoS, [0, 1], [0.75, 1]);
  const logoOp = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });

  const tagY = interpolate(frame, [16, 38], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagOp = interpolate(frame, [16, 38], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const ctaS = spring({ frame: frame - 44, fps, config: { damping: 16 } });
  const ctaOp = interpolate(frame - 44, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22, opacity: logoOp, transform: `scale(${logoScale})` }}>
        <Crown size={height * 0.16} />
        <div style={{ display: "flex", fontSize: height * 0.15, fontWeight: 800, letterSpacing: -3, fontFamily: FONT }}>
          <span style={{ color: "#f4f7ff" }}>Auto</span>
          <span style={{ color: BLUE_BRIGHT }}>King</span>
        </div>
      </div>
      <div style={{ fontSize: height * 0.05, fontWeight: 700, color: "#c3cde0", letterSpacing: 2, marginTop: 28, fontFamily: FONT, opacity: tagOp, transform: `translateY(${tagY}px)` }}>
        Automatiza. Inteligencia. Imperio.
      </div>
      <div
        style={{
          marginTop: 46,
          padding: "20px 44px",
          borderRadius: 999,
          background: "linear-gradient(135deg,#4d8bff,#1450c7)",
          color: "#fff",
          fontSize: height * 0.042,
          fontWeight: 700,
          fontFamily: FONT,
          boxShadow: "0 24px 70px -12px rgba(30,107,255,0.7)",
          opacity: ctaOp,
          transform: `translateY(${interpolate(ctaS, [0, 1], [24, 0])}px)`,
        }}
      >
        Agenda tu demo →
      </div>
    </AbsoluteFill>
  );
};

/** Caption inferior que refuerza el mensaje durante el chat. */
const Caption: React.FC = () => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [10, 30, 195, 215], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        bottom: "8%",
        width: "100%",
        textAlign: "center",
        fontSize: 34,
        fontWeight: 600,
        color: "#9aa6be",
        fontFamily: FONT,
        opacity: op,
      }}
    >
      Responde y agenda <span style={{ color: BLUE_BRIGHT }}>solo, 24/7</span>. Como un empleado que nunca duerme.
    </div>
  );
};

export const BrandClip: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: BG, fontFamily: FONT }}>
      <Glow />
      <Sequence durationInFrames={215}>
        <ChatScene />
        <Caption />
      </Sequence>
      <Sequence from={215}>
        <BrandScene />
      </Sequence>
    </AbsoluteFill>
  );
};
