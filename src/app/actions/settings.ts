"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

export async function toggleMaintenanceMode(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const enabled = formData.get("enabled") === "true";
  await supabase
    .from("app_settings")
    .update({ maintenance_mode: enabled })
    .eq("id", true);
  revalidatePath("/admin");
}
