import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 0;

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, bio, avatar_url")
    .eq("id", id)
    .single();

  const { count: plateCount } = await supabase
    .from("plates")
    .select("id", { count: "exact", head: true })
    .eq("user_id", id);

  const username = profile?.username ?? "Chef";
  const bio = profile?.bio ?? "";

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a00 60%, #0a0a0a 100%)",
        fontFamily: "sans-serif",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {/* Glow */}
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 800, height: 400, background: "radial-gradient(ellipse, rgba(249,115,22,0.18) 0%, transparent 70%)", display: "flex" }} />

      {/* Avatar */}
      <div style={{ width: 140, height: 140, borderRadius: 40, overflow: "hidden", background: "linear-gradient(135deg,#f97316,#f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28, border: "4px solid rgba(249,115,22,0.3)" }}>
        {profile?.avatar_url
          ? <img src={profile.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ color: "white", fontSize: 64, fontWeight: 900 }}>{username[0].toUpperCase()}</span>
        }
      </div>

      {/* Username */}
      <div style={{ fontSize: 56, fontWeight: 900, color: "white", display: "flex", marginBottom: 12 }}>
        @{username}
      </div>

      {/* Bio */}
      {bio && (
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.5)", display: "flex", maxWidth: 700, textAlign: "center", marginBottom: 28 }}>
          {bio.slice(0, 100)}{bio.length > 100 ? "…" : ""}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "flex", gap: 32, marginTop: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.05)", borderRadius: 20, padding: "16px 28px", border: "1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: "white" }}>{plateCount ?? 0}</span>
          <span style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Plates</span>
        </div>
      </div>

      {/* Brand */}
      <div style={{ position: "absolute", bottom: 32, right: 40, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#f97316,#f43f5e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 18 }}>🍽</span>
        </div>
        <span style={{ fontWeight: 900, fontSize: 20, color: "rgba(255,255,255,0.4)" }}>Rate My Plate</span>
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
