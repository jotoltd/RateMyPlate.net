"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const username = (formData.get("username") as string)?.trim();
  const bio = (formData.get("bio") as string)?.trim();
  const avatarFile = formData.get("avatar") as File | null;

  if (!username || username.length < 3)
    return { error: "Username must be at least 3 characters" };

  let avatar_url: string | undefined;

  if (avatarFile && avatarFile.size > 0) {
    const ext = avatarFile.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("plates")
      .upload(path, avatarFile, { contentType: avatarFile.type, upsert: true });
    if (uploadError) return { error: uploadError.message };
    const { data: { publicUrl } } = supabase.storage
      .from("plates")
      .getPublicUrl(path);
    avatar_url = publicUrl;
  }

  const updates: Record<string, string> = { username, bio: bio || "" };
  if (avatar_url) updates.avatar_url = avatar_url;

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/");
  return { success: true };
}
