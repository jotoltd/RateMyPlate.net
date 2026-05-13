"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { sendPlateStatusEmail } from "@/lib/email";

export async function moderatePlate(plateId: string, action: "approved" | "rejected"): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("plates").update({ status: action }).eq("id", plateId);

  // Notify the uploader (fire-and-forget)
  const { data: plate } = await supabase
    .from("plates")
    .select("title, user_id, profiles(username)")
    .eq("id", plateId)
    .single();

  if (plate) {
    const prof = plate.profiles as unknown as { username: string } | null;
    const { data: authUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", plate.user_id)
      .single();

    if (authUser) {
      // Get email from auth.users via RPC isn't available on anon client,
      // so fetch from profiles email column if stored, else skip
      const { data: profileWithEmail } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", plate.user_id)
        .single();

      const email = (profileWithEmail as { email?: string } | null)?.email;
      if (email && prof) {
        sendPlateStatusEmail({
          to: email,
          username: prof.username,
          plateTitle: plate.title,
          plateId,
          approved: action === "approved",
        }).catch(() => {});
      }
    }
  }

  revalidatePath("/admin/review");
  revalidatePath(`/plate/${plateId}`);
  revalidatePath("/");
}
