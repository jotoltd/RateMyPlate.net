import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWeeklyDigestEmail } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Trending plates this week
  const { data: trendingRaw } = await supabase
    .from("plates")
    .select("id, title, profiles(username)")
    .eq("status", "approved")
    .gte("created_at", since)
    .order("like_count", { ascending: false })
    .limit(5);

  const trendingPlates = (trendingRaw ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    username: (p.profiles as unknown as { username: string } | null)?.username ?? "chef",
  }));

  // All users with email
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, email")
    .not("email", "is", null);

  let sent = 0;
  for (const profile of profiles ?? []) {
    if (!profile.email) continue;

    // Activity this week on their plates
    const { data: userPlates } = await supabase
      .from("plates")
      .select("id, title, image_url, like_count, rating_count")
      .eq("user_id", profile.id)
      .eq("status", "approved");

    const plateIds = (userPlates ?? []).map((p) => p.id);

    let newLikes = 0;
    let newRatings = 0;
    if (plateIds.length > 0) {
      const [{ count: lc }, { count: rc }] = await Promise.all([
        supabase.from("likes").select("id", { count: "exact", head: true }).in("plate_id", plateIds).gte("created_at", since),
        supabase.from("ratings").select("id", { count: "exact", head: true }).in("plate_id", plateIds).gte("created_at", since),
      ]);
      newLikes = lc ?? 0;
      newRatings = rc ?? 0;
    }

    const { count: newFollowers } = await supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", profile.id)
      .gte("created_at", since);

    const topPlate = (userPlates ?? []).sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0))[0] ?? null;

    await sendWeeklyDigestEmail({
      to: profile.email,
      username: profile.username,
      newLikes,
      newRatings,
      newFollowers: newFollowers ?? 0,
      topPlate: topPlate ? { title: topPlate.title, id: topPlate.id, image_url: topPlate.image_url } : null,
      trendingPlates,
    });

    sent++;
    // Small delay to respect Resend rate limits
    await new Promise((r) => setTimeout(r, 100));
  }

  return NextResponse.json({ sent });
}
