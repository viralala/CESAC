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
          padding: 80,
          backgroundColor: "#070C1A",
          color: "#F1F5FC",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 22, height: 22, backgroundColor: "#00B2FF" }} />
          <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5 }}>
            CESAC
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <span style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, maxWidth: 900 }}>
            Community, events and programs.
          </span>
          <span style={{ fontSize: 28, color: "#93A2C4", maxWidth: 760 }}>
            Browse upcoming events, meet the people behind them, and register through the
            student portal.
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
