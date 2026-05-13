"use server";

import { createClient } from "@/lib/supabase/server";

export async function joinWaitlist(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const name = (formData.get("name") as string)?.trim() || null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("waitlist").insert({ email, name });

  if (error) {
    if (error.code === "23505") return { error: "You're already on the list! 🎉" };
    return { error: "Something went wrong. Please try again." };
  }

  return { success: true };
}
