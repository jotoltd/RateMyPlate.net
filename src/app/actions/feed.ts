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
