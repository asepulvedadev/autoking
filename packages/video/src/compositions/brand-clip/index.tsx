import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

/**
 * Clip de marca AutoKing (5s). Wordmark que entra con spring, tagline que sube,
 * y una burbuja "cita agendada" — todo función pura de (frame), como pide Remotion.
 */
export const BrandClip: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const logoSpring = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const logoScale = interpolate(logoSpring, [0, 1], [0.72, 1]);
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const taglineY = interpolate(frame, [18, 42], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const taglineOpacity = interpolate(frame, [18, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const bubbleSpring = spring({ frame: frame - 62, fps, config: { damping: 16 } });
  const bubbleY = interpolate(bubbleSpring, [0, 1], [40, 0]);
  const bubbleOpacity = interpolate(frame, [62, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const glowOpacity = interpolate(frame % (fps * 2), [0, fps, fps * 2], [0.45, 0.85, 0.45]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#05070d",
        fontFamily: "var(--font-sora), 'Sora', sans-serif",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: width * 0.7,
          height: width * 0.7,
          borderRadius: "50%",
          background: "rgba(30,107,255,0.35)",
          filter: "blur(160px)",
          opacity: glowOpacity,
        }}
      />

      <div
        style={{
          display: "flex",
          fontSize: height * 0.17,
          fontWeight: 800,
          letterSpacing: -3,
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
        }}
      >
        <span style={{ color: "#f4f7ff" }}>Auto</span>
        <span style={{ color: "#4d8bff" }}>King</span>
      </div>

      <div
        style={{
          marginTop: height * 0.03,
          fontSize: height * 0.045,
          fontWeight: 700,
          color: "#c3cde0",
          letterSpacing: 2,
          transform: `translateY(${taglineY}px)`,
          opacity: taglineOpacity,
        }}
      >
        Automatiza. Inteligencia. Imperio.
      </div>

      <div
        style={{
          marginTop: height * 0.07,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "18px 30px",
          borderRadius: 999,
          background: "linear-gradient(135deg,#1e6bff,#1450c7)",
          color: "#fff",
          fontSize: height * 0.035,
          fontWeight: 600,
          transform: `translateY(${bubbleY}px)`,
          opacity: bubbleOpacity,
          boxShadow: "0 24px 70px -12px rgba(30,107,255,0.6)",
        }}
      >
        ✅ Nueva cita agendada — 17:00
      </div>
    </AbsoluteFill>
  );
};
