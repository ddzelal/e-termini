import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "e-termini — Pronađi i rezerviši sportski teren u Srbiji";
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
          background: "linear-gradient(145deg, #0a1f14 0%, #0f2d1c 40%, #0a1f14 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(5,150,105,0.15) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "72px",
              height: "72px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #059669, #C8FC2C)",
              fontSize: "36px",
              fontWeight: 800,
              color: "white",
            }}
          >
            e
          </div>
          <span
            style={{
              fontSize: "56px",
              fontWeight: 800,
              color: "white",
              letterSpacing: "-2px",
            }}
          >
            termini
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            fontSize: "32px",
            fontWeight: 700,
            color: "white",
            textAlign: "center",
            marginBottom: "12px",
          }}
        >
          Pronađi i rezerviši sportski teren
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: "20px",
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
            marginBottom: "36px",
          }}
        >
          Fudbal · Tenis · Padel · Košarka · i više
        </div>

        {/* CTA Button */}
        <div
          style={{
            display: "flex",
            padding: "14px 40px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #059669, #0ea87a)",
            color: "white",
            fontSize: "20px",
            fontWeight: 700,
            boxShadow: "0 8px 32px rgba(5,150,105,0.4)",
          }}
        >
          Rezerviši besplatno →
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            display: "flex",
            fontSize: "16px",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          e-termini.com
        </div>
      </div>
    ),
    { ...size }
  );
}
