"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";

interface AwardBadgeParams {
  userId: string;
  badgeId: string;
  reason?: string;
}

export async function awardBadge(params: AwardBadgeParams) {
  const { supabase, user } = await requireAdmin();

  const { error } = await supabase.from("user_badges").insert({
    user_id: params.userId,
    badge_id: params.badgeId,
    awarded_by: user.id,
    reason: params.reason || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "User already has this badge" };
    }
    return { success: false, error: error.message };
  }

  // Log admin action
  await supabase.from("admin_actions").insert({
    admin_id: user.id,
    action_type: "award_badge",
    target_user_id: params.userId,
    details: { badge_id: params.badgeId, reason: params.reason },
  });

  return { success: true };
}

export async function removeBadge(userBadgeId: string) {
  const { supabase, user } = await requireAdmin();

  const { error } = await supabase.from("user_badges").delete().eq("id", userBadgeId);

  if (error) return { success: false, error: error.message };

  // Log admin action
  await supabase.from("admin_actions").insert({
    admin_id: user.id,
    action_type: "remove_badge",
    details: { user_badge_id: userBadgeId },
  });

  return { success: true };
}
