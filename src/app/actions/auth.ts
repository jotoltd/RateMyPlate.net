"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail, sendVerificationEmail } from "@/lib/email";

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;
  const username = (formData.get("username") as string).trim();
  const next = (formData.get("next") as string | null) ?? "";

  try {
    // Check username not already taken
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();
    if (existing) return { error: "Username is already taken." };

    // Check email not already registered
    const { data: existingEmail } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();
    if (existingEmail) return { error: "An account with that email already exists." };

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Store OTP + credentials via RPC (SECURITY DEFINER bypasses RLS)
    await supabase.rpc("upsert_email_verification", {
      p_email: email,
      p_code: code,
      p_username: username,
      p_password_hash: password,
    });

    // Send via Resend
    await sendVerificationEmail(email, username, code);

    const nextParam = next && next.startsWith("/") ? `&next=${encodeURIComponent(next)}` : "";
    redirect(`/auth/verify-email?email=${encodeURIComponent(email)}${nextParam}`);
  } catch (e) {
    if (isRedirectError(e)) throw e;
    return { error: "Something went wrong. Please try again." };
  }
}

export async function verifyEmail(formData: FormData) {
  const supabase = await createClient();
  const email = (formData.get("email") as string).trim().toLowerCase();
  const code = (formData.get("code") as string).trim().replace(/\s/g, "");

  try {
    // Verify code via RPC
    const { data: rows } = await supabase.rpc("verify_email_code", {
      p_email: email,
      p_code: code,
    });

    if (!rows || rows.length === 0) {
      return { error: "Invalid or expired code. Please try again." };
    }

    const { username, password_hash: password } = rows[0] as { username: string; password_hash: string };

    // Create the Supabase auth user (email confirmation disabled in Supabase — we handle it)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (error) return { error: error.message };

    const userId = data.user?.id ?? data.session?.user?.id;
    if (!userId) return { error: "Could not create account. Please try again." };

    // Create profile
    await supabase.from("profiles").upsert({
      id: userId,
      username,
      email,
      avatar_url: null,
      bio: null,
    });

    // If Supabase still requires confirmation internally, sign in directly
    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) return { error: signInError.message };
    }

    sendWelcomeEmail(email, username).catch(() => {});
    revalidatePath("/", "layout");
    const redirectTo = (formData.get("next") as string | null);
    redirect(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/upload?welcome=1");
  } catch (e) {
    if (isRedirectError(e)) throw e;
    return { error: "Something went wrong. Please try again." };
  }
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || "/";

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/", "layout");
    redirect(next.startsWith("/") ? next : "/");
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

export async function resendConfirmation(email: string) {
  const supabase = await createClient();
  const code = String(Math.floor(100000 + Math.random() * 900000));

  // Fetch pending verification row without consuming it
  const { data: rows } = await supabase.rpc("get_pending_verification", { p_email: email });
  const username = rows?.[0]?.username ?? email.split("@")[0];
  const passwordHash = rows?.[0]?.password_hash ?? "";

  await supabase.rpc("upsert_email_verification", {
    p_email: email,
    p_code: code,
    p_username: username,
    p_password_hash: passwordHash,
  });

  await sendVerificationEmail(email, username, code);
  return { success: true };
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/reset-password`,
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  redirect("/");
}

export async function deleteAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Delete profile first (cascades to plates, ratings, comments, etc.)
  await supabase.from("profiles").delete().eq("id", user.id);

  // Delete the auth user via SECURITY DEFINER RPC (no service role key needed)
  await supabase.rpc("delete_own_auth_user");

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
