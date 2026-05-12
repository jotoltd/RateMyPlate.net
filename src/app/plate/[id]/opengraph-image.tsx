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

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #fff7ed 0%, #fef2f2 100%)",
        fontFamily: "sans-serif",
      }}
    >
      {/* Left: image */}
      <div style={{ width: 630, height: 630, overflow: "hidden", display: "flex", flexShrink: 0 }}>
        <img
          src={plate.image_url}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Right: info */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 48px",
          gap: 16,
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #f97316, #f43f5e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontSize: 20 }}>🍽</span>
          </div>
          <span style={{ fontWeight: 900, fontSize: 22, background: "linear-gradient(90deg,#f97316,#f43f5e)", WebkitBackgroundClip: "text", color: "transparent" }}>
            Rate My Plate
          </span>
        </div>

        <div style={{ fontSize: 42, fontWeight: 900, color: "#111827", lineHeight: 1.15, display: "flex" }}>
          {plate.title}
        </div>

        {plate.description && (
          <div style={{ fontSize: 20, color: "#6b7280", display: "flex", lineHeight: 1.4 }}>
            {plate.description.slice(0, 100)}{plate.description.length > 100 ? "…" : ""}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 999, background: "linear-gradient(135deg,#f97316,#f43f5e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontWeight: 900, fontSize: 16 }}>{username[0].toUpperCase()}</span>
          </div>
          <span style={{ color: "#374151", fontWeight: 700, fontSize: 18 }}>@{username}</span>
        </div>

        {stars !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <div style={{ display: "flex", background: "#fffbeb", borderRadius: 16, padding: "10px 18px", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 24 }}>⭐</span>
              <span style={{ fontSize: 28, fontWeight: 900, color: "#d97706" }}>{stars.toFixed(1)}</span>
              <span style={{ fontSize: 18, color: "#9ca3af" }}>/5</span>
            </div>
          </div>
        )}
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
