"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

export async function moderatePlate(plateId: string, action: "approved" | "rejected"): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("plates").update({ status: action }).eq("id", plateId);
  revalidatePath("/admin/review");
  revalidatePath("/");
}
