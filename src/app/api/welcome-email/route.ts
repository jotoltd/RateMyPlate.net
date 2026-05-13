import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email, username } = await req.json();
    if (email && username) await sendWelcomeEmail(email, username);
  } catch { /* non-blocking */ }
  return NextResponse.json({ ok: true });
}
