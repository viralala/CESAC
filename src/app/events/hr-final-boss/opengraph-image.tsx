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
          backgroundColor: "#f8f8ff",
          backgroundImage:
            "linear-gradient(rgba(7,26,51,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(7,26,51,0.08) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
          color: "#071a33",
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
            backgroundColor: "#007fff",
            opacity: 0.18,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 19,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: "rgba(7,26,51,0.55)",
          }}
        >
          <span>CESAC / VIT Pune</span>
          <span>Speaker session</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: 24,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#0057b3",
              marginBottom: 22,
            }}
          >
            Free entry. Name withheld.
          </span>
          <span style={{ fontSize: 132, fontWeight: 800, lineHeight: 0.86, letterSpacing: -2, color: "#007fff" }}>
            HR
          </span>
          <span style={{ fontSize: 132, fontWeight: 800, lineHeight: 0.86, letterSpacing: -2 }}>
            FINAL BOSS
          </span>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {["30+ yrs HR", "Based in Africa", "2–3 hr Q&A"].map((c, i) => (
            <span
              key={c}
              style={{
                fontSize: 21,
                letterSpacing: 1,
                padding: "10px 20px",
                backgroundColor: ["#007fff", "#73c2fb", "#071a33"][i],
                color: i === 1 ? "#071a33" : "#f8f8ff",
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
