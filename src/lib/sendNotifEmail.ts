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

    const profileRes = await supabase
      .from("profiles")
      .select("username, email")
      .eq("id", opts.recipientUserId)
      .single();

    const email = profileRes.data?.email as string | null | undefined;
    const recipientUsername = profileRes.data?.username ?? "there";

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
