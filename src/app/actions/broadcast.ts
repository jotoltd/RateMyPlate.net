"use server";

import { requireAdmin } from "@/lib/admin";
import { sendLaunchEmail } from "@/lib/email";

export async function broadcastLaunchEmail(): Promise<{ sent: number; error?: string }> {
  const { supabase } = await requireAdmin();

  const { data: entries } = await supabase
    .from("waitlist")
    .select("email, name")
    .order("created_at", { ascending: true });

  if (!entries || entries.length === 0) return { sent: 0 };

  let sent = 0;
  for (const entry of entries) {
    try {
      await sendLaunchEmail(entry.email, entry.name ?? undefined);
      sent++;
      await new Promise((r) => setTimeout(r, 120));
    } catch {
      // continue on individual failure
    }
  }

  return { sent };
}

export async function triggerWeeklyDigest(): Promise<{ sent: number; error?: string }> {
  const { supabase } = await requireAdmin();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

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

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, email")
    .not("email", "is", null);

  const { sendWeeklyDigestEmail } = await import("@/lib/email");
  let sent = 0;

  for (const profile of profiles ?? []) {
    if (!profile.email) continue;

    const { data: userPlates } = await supabase
      .from("plates")
      .select("id, title, image_url, like_count")
      .eq("user_id", profile.id)
      .eq("status", "approved");

    const plateIds = (userPlates ?? []).map((p) => p.id);
    let newLikes = 0, newRatings = 0;

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
    await new Promise((r) => setTimeout(r, 100));
  }

  return { sent };
}
