"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleCommentLike(commentId: string, plateId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("comment_id", commentId)
    .single();

  if (existing) {
    await supabase.from("comment_likes").delete().eq("id", existing.id);
    const { count } = await supabase
      .from("comment_likes")
      .select("id", { count: "exact", head: true })
      .eq("comment_id", commentId);
    await supabase.from("comments").update({ like_count: count ?? 0 }).eq("id", commentId);
    revalidatePath(`/plate/${plateId}`);
    return { liked: false };
  } else {
    await supabase.from("comment_likes").insert({ user_id: user.id, comment_id: commentId });
    const { count } = await supabase
      .from("comment_likes")
      .select("id", { count: "exact", head: true })
      .eq("comment_id", commentId);
    await supabase.from("comments").update({ like_count: count ?? 0 }).eq("id", commentId);
    revalidatePath(`/plate/${plateId}`);
    return { liked: true };
  }
}
