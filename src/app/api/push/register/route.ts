import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token, platform = "ios" } = await req.json();
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  await supabase.from("push_tokens").upsert(
    { user_id: user.id, token, platform, updated_at: new Date().toISOString() },
    { onConflict: "token" }
  );

  return NextResponse.json({ ok: true });
}
