"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

export async function toggleMaintenanceMode(enabled: boolean): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase
    .from("app_settings")
    .update({ maintenance_mode: enabled })
    .eq("id", true);
  revalidatePath("/admin");
}
