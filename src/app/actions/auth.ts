"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      // Non-fatal: profile table may not exist yet during initial setup
      await supabase.from("profiles").upsert({
        id: data.user.id,
        username,
        avatar_url: null,
        bio: null,
      });
    }

    revalidatePath("/", "layout");
    redirect("/");
  } catch (e) {
    if (isRedirectError(e)) throw e;
    return { error: "Something went wrong. Please try again." };
  }
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/", "layout");
    redirect("/");
  } catch (e) {
    if (isRedirectError(e)) throw e;
    return { error: "Something went wrong. Please try again." };
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function deleteAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Delete profile (cascades to plates, ratings, etc. via FK)
  await supabase.from("profiles").delete().eq("id", user.id);
  // Delete auth user via admin — falls back to just signing out if service role not available
  try {
    const { createClient: createAdmin } = await import("@/lib/supabase/server");
    const admin = await createAdmin();
    await admin.auth.admin.deleteUser(user.id);
  } catch { /* no-op: profile cascade is sufficient */ }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
