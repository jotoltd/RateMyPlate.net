"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sanitise } from "@/lib/sanitise";

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
  body = sanitise(body);
  if (!body.trim()) return { error: "Comment cannot be empty" };
  if (body.length > 1000) return { error: "Comment is too long (max 1000 characters)" };

  // Rate limit: max 30 comments per hour
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);
  if ((count ?? 0) >= 30) return { error: "You're commenting too fast. Slow down a bit!" };

  const { data: newComment, error } = await supabase
    .from("comments")
    .insert({
      plate_id: plateId,
      user_id: user.id,
      parent_id: parentId ?? null,
      body: body.trim(),
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Notify plate owner on comment (not self)
  const { data: plate } = await supabase
    .from("plates")
    .select("user_id")
    .eq("id", plateId)
    .single();

  if (plate && plate.user_id !== user.id) {
    await supabase.from("notifications").insert({
      user_id: plate.user_id,
      actor_id: user.id,
      type: "comment",
      plate_id: plateId,
      comment_id: newComment.id,
    });
  }

  // Notify parent comment author on reply (not self)
  if (parentId) {
    const { data: parent } = await supabase
      .from("comments")
      .select("user_id")
      .eq("id", parentId)
      .single();
    if (parent && parent.user_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: parent.user_id,
        actor_id: user.id,
        type: "reply",
        plate_id: plateId,
        comment_id: newComment.id,
      });
    }
  }

  // Notify @mentioned users
  const mentions = [...body.matchAll(/@([a-zA-Z0-9_]+)/g)].map((m) => m[1]);
  if (mentions.length > 0) {
    const uniqueMentions = [...new Set(mentions)].slice(0, 5); // max 5 mentions per comment
    const { data: mentionedProfiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("username", uniqueMentions);

    for (const profile of mentionedProfiles ?? []) {
      if (profile.id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: profile.id,
          actor_id: user.id,
          type: "comment",
          plate_id: plateId,
          comment_id: newComment.id,
        });
      }
    }
  }

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
