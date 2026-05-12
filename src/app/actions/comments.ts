"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addComment(
  plateId: string,
  body: string,
  parentId?: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };
  if (!body.trim()) return { error: "Comment cannot be empty" };

  const { error } = await supabase.from("comments").insert({
    plate_id: plateId,
    user_id: user.id,
    parent_id: parentId ?? null,
    body: body.trim(),
  });

  if (error) return { error: error.message };

  revalidatePath(`/plate/${plateId}`);
  return { success: true };
}

export async function deleteComment(commentId: string, plateId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/plate/${plateId}`);
  return { success: true };
}
