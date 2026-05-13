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

export async function saveSettings(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const analytics_id = (formData.get("analytics_id") as string)?.trim() || null;
  const site_announcement = (formData.get("site_announcement") as string)?.trim() || null;
  await supabase
    .from("app_settings")
    .update({ analytics_id, site_announcement })
    .eq("id", true);
  revalidatePath("/admin/settings");
  revalidatePath("/");
}
