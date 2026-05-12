"use server";

import { createClient } from "@/lib/supabase/server";
import { Plate } from "@/lib/types";

export async function loadMorePlates(
  offset: number,
  limit: number,
  category?: string
): Promise<Plate[]> {
  const supabase = await createClient();

  let query = supabase
    .from("plates")
    .select("*, profiles(id, username, avatar_url)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data } = await query;
  return (data ?? []) as Plate[];
}

export async function loadFollowingFeed(
  offset: number,
  limit: number
): Promise<Plate[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  if (!follows || follows.length === 0) return [];

  const ids = follows.map((f) => f.following_id);

  const { data } = await supabase
    .from("plates")
    .select("*, profiles(id, username, avatar_url)")
    .in("user_id", ids)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return (data ?? []) as Plate[];
}
