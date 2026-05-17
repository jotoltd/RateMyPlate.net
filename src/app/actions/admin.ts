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

export async function adminChangePlateStatus(plateId: string, status: "pending" | "approved" | "rejected") {
  const { error, supabase } = await assertAdmin();
  if (error || !supabase) return { error };
  await supabase.from("plates").update({ status }).eq("id", plateId);
  revalidatePath("/admin/plates");
  revalidatePath("/admin/review");
  revalidatePath("/");
  return { success: true };
}

export async function adminResolveReport(reportId: string) {
  const { error, supabase } = await assertAdmin();
  if (error || !supabase) return { error };
  await supabase.from("reports").update({ resolved: true }).eq("id", reportId);
  revalidatePath("/admin/reports");
  return { success: true };
}

export async function adminSetFeaturedPlate(plateId: string | null): Promise<void> {
  const { error, supabase } = await assertAdmin();
  if (error || !supabase) return;
  await supabase.from("app_settings").update({ featured_plate_id: plateId }).eq("id", true);
  revalidatePath("/admin/settings");
  revalidatePath("/");
}

export async function submitReport(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const plateId = formData.get("plate_id") as string | null;
  const commentId = formData.get("comment_id") as string | null;
  const reason = (formData.get("reason") as string)?.trim();
  if (!reason) return { error: "Reason required" };
  await supabase.from("reports").insert({
    reporter_id: user.id,
    plate_id: plateId || null,
    comment_id: commentId || null,
    reason,
  });
  return { success: true };
}

export async function adminSendCustomEmail(formData: FormData) {
  const { error, supabase } = await assertAdmin();
  if (error || !supabase) return { error };
  const subject = (formData.get("subject") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();
  if (!subject || !body) return { error: "Subject and body required" };

  const { data: profiles } = await supabase.from("profiles").select("email, username").not("email", "is", null);
  const { sendCustomBroadcastEmail } = await import("@/lib/email");

  let sent = 0;
  for (const p of profiles ?? []) {
    if (!p.email) continue;
    await sendCustomBroadcastEmail(p.email, p.username, subject, body).catch(() => {});
    sent++;
    await new Promise((r) => setTimeout(r, 100));
  }
  revalidatePath("/admin/settings");
  return { success: true, sent };
}
