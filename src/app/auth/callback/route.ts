import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const userId = data.user.id;
      const email = data.user.email ?? "";
      const rawUsername =
        data.user.user_metadata?.preferred_username ??
        data.user.user_metadata?.name?.replace(/\s+/g, "").toLowerCase() ??
        email.split("@")[0];

      // Upsert profile (safe — only inserts if not exists)
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();

      if (!existingProfile) {
        // Make username unique if taken
        let username = rawUsername.slice(0, 28);
        const { data: taken } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username)
          .single();
        if (taken) username = `${username}${Math.floor(Math.random() * 9000) + 1000}`;

        await supabase.from("profiles").insert({
          id: userId,
          username,
          email,
          avatar_url: data.user.user_metadata?.avatar_url ?? null,
          bio: null,
        });

        // Welcome email for new OAuth users
        const { sendWelcomeEmail } = await import("@/lib/email");
        sendWelcomeEmail(email, username).catch(() => {});

        return NextResponse.redirect(`${origin}/upload?welcome=1`);
      }

      const redirectTo = next.startsWith("/") ? next : "/";
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=oauth`);
}
