"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";

interface ToggleFeatureParams {
  plateId: string;
  action: "feature" | "unfeature";
  featuredId?: string;
  category?: string;
  position?: number;
  reason?: string;
}

export async function toggleFeaturePlate(params: ToggleFeatureParams) {
  const { supabase, user } = await requireAdmin();

  if (params.action === "unfeature") {
    // Soft delete - mark as inactive
    const { error } = await supabase
      .from("featured_plates")
      .update({ is_active: false })
      .eq("id", params.featuredId!);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // Feature the plate
  const { error } = await supabase.from("featured_plates").insert({
    plate_id: params.plateId,
    featured_by: user.id,
    category: params.category || "homepage",
    position: params.position || 0,
    reason: params.reason || null,
    is_active: true,
  });

  if (error) {
    // If already exists, update instead
    if (error.code === "23505") {
      const { error: updateError } = await supabase
        .from("featured_plates")
        .update({
          is_active: true,
          category: params.category || "homepage",
          position: params.position || 0,
          reason: params.reason || null,
          featured_by: user.id,
        })
        .eq("plate_id", params.plateId);

      if (updateError) return { success: false, error: updateError.message };
      return { success: true };
    }
    return { success: false, error: error.message };
  }

  // Log admin action
  await supabase.from("admin_actions").insert({
    admin_id: user.id,
    action_type: "feature_plate",
    target_plate_id: params.plateId,
    details: { category: params.category, reason: params.reason },
  });

  return { success: true };
}
