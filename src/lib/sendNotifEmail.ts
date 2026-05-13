"server-only";

import { createClient } from "@/lib/supabase/server";
import { sendNotificationEmail } from "@/lib/email";

type NotifEmailOpts = {
  recipientUserId: string;
  actorUserId: string;
  actorUsername: string;
  type: "like" | "comment" | "rating" | "reply" | "follow";
  plateTitle?: string;
  plateId?: string;
};

export async function sendNotifEmail(opts: NotifEmailOpts) {
  try {
    const supabase = await createClient();

    const [recipientRes, actorProfileRes] = await Promise.all([
      supabase.auth.admin.getUserById(opts.recipientUserId),
      supabase.from("profiles").select("username").eq("id", opts.recipientUserId).single(),
    ]);

    const email = recipientRes.data?.user?.email;
    const recipientUsername = actorProfileRes.data?.username ?? "there";

    if (!email) return;

    await sendNotificationEmail({
      to: email,
      recipientUsername,
      actorUsername: opts.actorUsername,
      type: opts.type,
      plateTitle: opts.plateTitle,
      plateId: opts.plateId,
      actorId: opts.actorUserId,
    });
  } catch {
    // Non-blocking — email failures should never crash the action
  }
}
