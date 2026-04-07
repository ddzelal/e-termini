import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "e-termini — Pronađi i rezerviši sportski teren";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0c1f15 0%, #132a1e 50%, #0c1f15 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #059669, #C8FC2C)",
              fontSize: "40px",
              fontWeight: 800,
              color: "white",
            }}
          >
            e
          </div>
          <span
            style={{
              fontSize: "64px",
              fontWeight: 800,
              color: "white",
              letterSpacing: "-2px",
            }}
          >
            termini
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: "28px",
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
          }}
        >
          Pronađi i rezerviši sportski teren u Srbiji
        </div>

        {/* Sports */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "32px",
          }}
        >
          {["⚽ Fudbal", "🎾 Tenis", "🏓 Padel", "🏀 Košarka"].map((sport) => (
            <div
              key={sport}
              style={{
                display: "flex",
                padding: "8px 20px",
                borderRadius: "100px",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.7)",
                fontSize: "18px",
              }}
            >
              {sport}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
