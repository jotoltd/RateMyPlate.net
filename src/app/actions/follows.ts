"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleFollow(targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (user.id === targetUserId) return { error: "Cannot follow yourself" };

  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .single();

  if (existing) {
    await supabase.from("follows").delete().eq("id", existing.id);
    const { data: t } = await supabase.from("profiles").select("follower_count").eq("id", targetUserId).single();
    await supabase.from("profiles").update({ follower_count: Math.max(0, (t?.follower_count ?? 1) - 1) }).eq("id", targetUserId);
    const { data: s } = await supabase.from("profiles").select("following_count").eq("id", user.id).single();
    await supabase.from("profiles").update({ following_count: Math.max(0, (s?.following_count ?? 1) - 1) }).eq("id", user.id);
  } else {
    await supabase.from("follows").insert({ follower_id: user.id, following_id: targetUserId });
    const { data: t } = await supabase.from("profiles").select("follower_count").eq("id", targetUserId).single();
    await supabase.from("profiles").update({ follower_count: (t?.follower_count ?? 0) + 1 }).eq("id", targetUserId);
    const { data: s } = await supabase.from("profiles").select("following_count").eq("id", user.id).single();
    await supabase.from("profiles").update({ following_count: (s?.following_count ?? 0) + 1 }).eq("id", user.id);

    await supabase.from("notifications").insert({
      user_id: targetUserId,
      actor_id: user.id,
      type: "comment",
      plate_id: null,
    });
  }

  revalidatePath(`/profile/${targetUserId}`);
  return { success: true };
}
