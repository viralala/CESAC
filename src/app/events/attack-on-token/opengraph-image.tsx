import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The sponsorship deck's title slide, at share size: warm black ground, a
 * brass frame, parchment display type and the one crimson word.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          backgroundColor: "#141110",
          color: "#f2ead9",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 28,
            border: "2px solid #c99a3e",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 19,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: "#c99a3e",
          }}
        >
          <span>CESAC / VIT Pune</span>
          <span>Prompt Engineering Hackathon</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 124, fontWeight: 800, lineHeight: 0.86, letterSpacing: -2 }}>
            ATTACK
          </span>
          <span style={{ fontSize: 124, fontWeight: 800, lineHeight: 0.86, letterSpacing: -2 }}>
            ON <span style={{ color: "#b8202c" }}>TOKEN</span>
          </span>
          <span
            style={{
              fontSize: 24,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#c99a3e",
              marginTop: 24,
            }}
          >
            Three chapters. One battlefield.
          </span>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {["Vision Forge", "Token Trials", "Fusion Awakening"].map((c, i) => (
            <span
              key={c}
              style={{
                fontSize: 20,
                letterSpacing: 3,
                textTransform: "uppercase",
                padding: "10px 20px",
                backgroundColor: i === 1 ? "#b8202c" : "#f2ead9",
                color: i === 1 ? "#f2ead9" : "#141110",
              }}
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
