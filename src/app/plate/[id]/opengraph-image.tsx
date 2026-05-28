import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: plate } = await supabase
    .from("plates")
    .select("title, description, image_url, avg_user_rating, ai_rating, profiles(username)")
    .eq("id", id)
    .single();

  if (!plate) {
    return new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#f97316", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "white", fontSize: 48, fontWeight: 900 }}>Rate My Plate</div>
      </div>,
      { width: 1200, height: 630 }
    );
  }

  const rating = plate.avg_user_rating ?? plate.ai_rating;
  const stars = rating ? Math.round((rating / 10) * 5 * 2) / 2 : null;
  const username = (plate.profiles as { username?: string } | null)?.username ?? "Chef";
  const scoreLabel = stars !== null
    ? stars >= 4.5 ? "Exceptional" : stars >= 4 ? "Great" : stars >= 3 ? "Good" : stars >= 2 ? "Okay" : "Poor"
    : null;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#0a0a0a",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* Background plate image (blurred) */}
      <img
        src={plate.image_url}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.18, filter: "blur(2px)" }}
      />

      {/* Dark overlay gradient */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(10,10,10,0.92) 0%, rgba(20,10,5,0.88) 100%)", display: "flex" }} />

      {/* Left: crisp plate image */}
      <div style={{ position: "relative", width: 560, height: 630, overflow: "hidden", display: "flex", flexShrink: 0 }}>
        <img src={plate.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {/* gradient fade right */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 60%, #0a0a0a 100%)", display: "flex" }} />
        {/* Score badge overlaid on image */}
        {stars !== null && (
          <div style={{
            position: "absolute", bottom: 24, left: 24,
            background: "linear-gradient(135deg, #f97316, #f43f5e)",
            borderRadius: 20, padding: "14px 22px",
            display: "flex", alignItems: "center", gap: 10,
            boxShadow: "0 8px 32px rgba(249,115,22,0.5)",
          }}>
            <span style={{ fontSize: 28 }}>⭐</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: "white", lineHeight: 1 }}>{stars.toFixed(1)}<span style={{ fontSize: 18, opacity: 0.7 }}>/5</span></span>
              {scoreLabel && <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 700, marginTop: 2 }}>{scoreLabel}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Right: info panel */}
      <div style={{
        position: "relative",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "48px 44px",
        gap: 20,
      }}>
        {/* Brand pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #f97316, #f43f5e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 18 }}>🍽️</span>
          </div>
          <span style={{ fontWeight: 900, fontSize: 20, color: "#f97316", letterSpacing: "-0.3px" }}>Rate My Plate</span>
        </div>

        {/* Title */}
        <div style={{ fontSize: 46, fontWeight: 900, color: "#ffffff", lineHeight: 1.1, display: "flex" }}>
          {plate.title.length > 36 ? plate.title.slice(0, 36) + "…" : plate.title}
        </div>

        {/* Description */}
        {plate.description && (
          <div style={{ fontSize: 19, color: "rgba(255,255,255,0.55)", display: "flex", lineHeight: 1.45 }}>
            {plate.description.slice(0, 90)}{plate.description.length > 90 ? "…" : ""}
          </div>
        )}

        {/* Chef */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
          <div style={{ width: 40, height: 40, borderRadius: 999, background: "linear-gradient(135deg,#f97316,#f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "white", fontWeight: 900, fontSize: 17 }}>{username[0].toUpperCase()}</span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 19 }}>@{username}</span>
        </div>

        {/* CTA tag */}
        <div style={{ display: "flex", marginTop: 8 }}>
          <div style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)", borderRadius: 12, padding: "8px 18px" }}>
            <span style={{ color: "#fb923c", fontWeight: 700, fontSize: 15 }}>Rate this plate at ratemyplate.net →</span>
          </div>
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
