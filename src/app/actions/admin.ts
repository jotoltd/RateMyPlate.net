"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", supabase: null };
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!data?.is_admin) return { error: "Forbidden", supabase: null };
  return { error: null, supabase };
}

export async function adminDeletePlate(plateId: string) {
  const { error, supabase } = await assertAdmin();
  if (error || !supabase) return { error };

  const { data: plate } = await supabase.from("plates").select("image_url").eq("id", plateId).single();
  if (plate?.image_url) {
    const path = plate.image_url.split("/plates/")[1];
    if (path) await supabase.storage.from("plates").remove([path]);
  }
  await supabase.from("plates").delete().eq("id", plateId);
  revalidatePath("/admin/plates");
  revalidatePath("/");
  return { success: true };
}

export async function adminDeleteComment(commentId: string) {
  const { error, supabase } = await assertAdmin();
  if (error || !supabase) return { error };
  await supabase.from("comments").delete().eq("id", commentId);
  revalidatePath("/admin/comments");
  return { success: true };
}

export async function adminBanUser(userId: string) {
  const { error, supabase } = await assertAdmin();
  if (error || !supabase) return { error };
  await supabase.from("profiles").update({ banned: true }).eq("id", userId);
  revalidatePath("/admin/users");
  return { success: true };
}

export async function adminUnbanUser(userId: string) {
  const { error, supabase } = await assertAdmin();
  if (error || !supabase) return { error };
  await supabase.from("profiles").update({ banned: false }).eq("id", userId);
  revalidatePath("/admin/users");
  return { success: true };
}

export async function adminDeleteUser(userId: string) {
  const { error, supabase } = await assertAdmin();
  if (error || !supabase) return { error };
  await supabase.from("profiles").delete().eq("id", userId);
  revalidatePath("/admin/users");
  return { success: true };
}

export async function adminToggleAdmin(userId: string, makeAdmin: boolean) {
  const { error, supabase } = await assertAdmin();
  if (error || !supabase) return { error };
  await supabase.from("profiles").update({ is_admin: makeAdmin }).eq("id", userId);
  revalidatePath("/admin/users");
  return { success: true };
}
