import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          padding: 72,
          backgroundColor: "#f5f1e7",
          color: "#0c1418",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -110,
            top: 90,
            width: 470,
            height: 470,
            borderRadius: 999,
            backgroundColor: "#12656f",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 19,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: "rgba(12,20,24,0.55)",
          }}
        >
          <span>CESAC / VIT Pune</span>
          <span>Prompt Engineering Hackathon</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: 24,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#12656f",
              marginBottom: 22,
            }}
          >
            Three chapters. One battlefield.
          </span>
          <span style={{ fontSize: 132, fontWeight: 800, lineHeight: 0.86, letterSpacing: -2 }}>
            ATTACK
          </span>
          <span style={{ fontSize: 132, fontWeight: 800, lineHeight: 0.86, letterSpacing: -2 }}>
            ON <span style={{ color: "#12656f" }}>TOKEN</span>
          </span>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {["Vision Forge", "Token Trials", "Fusion Awakening"].map((c, i) => (
            <span
              key={c}
              style={{
                fontSize: 21,
                letterSpacing: 3,
                textTransform: "uppercase",
                padding: "10px 20px",
                backgroundColor: ["#2fc4dd", "#6a2ff0", "#c6f733"][i],
                color: i === 1 ? "#f5f1e7" : "#0c1418",
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
