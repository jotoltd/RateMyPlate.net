"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleLike(plateId: string, ownerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("plate_id", plateId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    await supabase.from("likes").delete().eq("id", existing.id);
    // decrement
    const { data: plate } = await supabase
      .from("plates")
      .select("like_count")
      .eq("id", plateId)
      .single();
    await supabase
      .from("plates")
      .update({ like_count: Math.max(0, (plate?.like_count ?? 1) - 1) })
      .eq("id", plateId);
  } else {
    await supabase.from("likes").insert({ plate_id: plateId, user_id: user.id });
    const { data: plate } = await supabase
      .from("plates")
      .select("like_count")
      .eq("id", plateId)
      .single();
    await supabase
      .from("plates")
      .update({ like_count: (plate?.like_count ?? 0) + 1 })
      .eq("id", plateId);

    // Notify plate owner (skip self-like)
    if (user.id !== ownerId) {
      await supabase.from("notifications").insert({
        user_id: ownerId,
        actor_id: user.id,
        type: "like",
        plate_id: plateId,
      });
    }
  }

  revalidatePath("/");
  revalidatePath(`/plate/${plateId}`);
  return { success: true };
}
