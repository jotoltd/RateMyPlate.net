"use server";

import { createClient } from "@/lib/supabase/server";
import { Comment, Plate } from "@/lib/types";

export type FeedBatch = {
  plates: Plate[];
  likedIds: string[];
  ratingMap: Record<string, number>;
  commentMap: Record<string, Comment[]>;
};

async function enrichBatch(supabase: Awaited<ReturnType<typeof createClient>>, plates: Plate[], userId?: string): Promise<FeedBatch> {
  const ids = plates.map((p) => p.id);
  if (ids.length === 0) return { plates, likedIds: [], ratingMap: {}, commentMap: {} };

  const commentsRes = await supabase
    .from("comments")
    .select("*, profiles(id, username, avatar_url)")
    .in("plate_id", ids)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(ids.length * 2);

  const allComments = (commentsRes.data ?? []) as Comment[];
  const commentMap: Record<string, Comment[]> = {};
  for (const pid of ids) {
    commentMap[pid] = allComments.filter((c) => c.plate_id === pid).slice(0, 2).reverse();
  }

  let likedIds: string[] = [];
  let ratingMap: Record<string, number> = {};

  if (userId) {
    const [likesRes, ratingsRes] = await Promise.all([
      supabase.from("likes").select("plate_id").eq("user_id", userId).in("plate_id", ids),
      supabase.from("ratings").select("plate_id, score").eq("user_id", userId).in("plate_id", ids),
    ]);
    likedIds = (likesRes.data ?? []).map((r) => r.plate_id);
    ratingMap = Object.fromEntries((ratingsRes.data ?? []).map((r) => [r.plate_id, r.score]));
  }

  return { plates, likedIds, ratingMap, commentMap };
}

export async function loadMorePlates(
  offset: number,
  limit: number,
  category?: string
): Promise<FeedBatch> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("plates")
    .select("*, profiles(id, username, avatar_url)")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data } = await query;
  return enrichBatch(supabase, (data ?? []) as Plate[], user?.id);
}

export async function loadFollowingFeed(
  offset: number,
  limit: number
): Promise<FeedBatch> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { plates: [], likedIds: [], ratingMap: {}, commentMap: {} };

  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  if (!follows || follows.length === 0) return { plates: [], likedIds: [], ratingMap: {}, commentMap: {} };

  const ids = follows.map((f) => f.following_id);

  const { data } = await supabase
    .from("plates")
    .select("*, profiles(id, username, avatar_url)")
    .in("user_id", ids)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return enrichBatch(supabase, (data ?? []) as Plate[], user.id);
}
