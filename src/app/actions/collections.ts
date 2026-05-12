"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleSave(plateId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("saved_plates")
    .select("id")
    .eq("user_id", user.id)
    .eq("plate_id", plateId)
    .single();

  if (existing) {
    await supabase.from("saved_plates").delete().eq("id", existing.id);
    revalidatePath(`/plate/${plateId}`);
    revalidatePath("/saved");
    return { saved: false };
  } else {
    await supabase.from("saved_plates").insert({ user_id: user.id, plate_id: plateId });
    revalidatePath(`/plate/${plateId}`);
    revalidatePath("/saved");
    return { saved: true };
  }
}
