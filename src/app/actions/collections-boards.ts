"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sanitise } from "@/lib/sanitise";

export async function createCollection(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const name = sanitise(formData.get("name") as string);
  const description = sanitise((formData.get("description") as string) || "");
  if (!name) return;

  await supabase.from("collections").insert({
    user_id: user.id,
    name,
    description: description || null,
  });

  revalidatePath("/collections");
}

export async function deleteCollection(collectionId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("collections")
    .delete()
    .eq("id", collectionId)
    .eq("user_id", user.id);

  revalidatePath("/collections");
}

export async function addPlateToCollection(collectionId: string, plateId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("collection_plates")
    .insert({ collection_id: collectionId, plate_id: plateId });

  if (error?.code === "23505") return { error: "Already in collection" };
  if (error) return { error: error.message };
  revalidatePath(`/collections/${collectionId}`);
}

export async function removePlateFromCollection(collectionId: string, plateId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("collection_plates")
    .delete()
    .eq("collection_id", collectionId)
    .eq("plate_id", plateId);

  revalidatePath(`/collections/${collectionId}`);
}
