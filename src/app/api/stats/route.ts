import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const revalidate = 300; // cache 5 min

export async function GET() {
  const supabase = await createClient();
  const [chefRes, plateRes, ratingRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("plates").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("ratings").select("id", { count: "exact", head: true }),
  ]);
  return NextResponse.json({
    chefs: chefRes.count ?? 0,
    plates: plateRes.count ?? 0,
    ratings: ratingRes.count ?? 0,
  });
}
