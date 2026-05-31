import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a0500 60%, #0a0a0a 100%)",
        fontFamily: "sans-serif",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      {/* Glow */}
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 900, height: 500, background: "radial-gradient(ellipse, rgba(249,115,22,0.22) 0%, transparent 70%)", display: "flex" }} />

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
        <div style={{ width: 80, height: 80, borderRadius: 24, background: "linear-gradient(135deg, #f97316, #f43f5e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 44 }}>🍽</span>
        </div>
        <span style={{ fontSize: 52, fontWeight: 900, color: "white" }}>Rate My Plate</span>
      </div>

      {/* Tagline */}
      <div style={{ fontSize: 30, color: "rgba(255,255,255,0.5)", display: "flex", textAlign: "center", maxWidth: 700 }}>
        Upload your food. Get brutally honest AI critiques.
      </div>

      {/* Pills */}
      <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
        {["👨‍🍳 Ramsay Ratings", "🔥 Trending Feed", "� Chef Community"].map((label) => (
          <div key={label} style={{ display: "flex", background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 999, padding: "10px 22px", color: "#fb923c", fontWeight: 700, fontSize: 18 }}>
            {label}
          </div>
        ))}
      </div>

      {/* URL */}
      <div style={{ position: "absolute", bottom: 32, display: "flex", color: "rgba(255,255,255,0.25)", fontSize: 18, fontWeight: 600 }}>
        ratemyplate.net
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
