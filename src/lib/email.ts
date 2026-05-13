import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "Rate My Plate <noreply@ratemyplate.net>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ratemyplate.net";

function base(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Rate My Plate</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;">
        <!-- Logo -->
        <tr><td style="padding-bottom:32px;" align="center">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:linear-gradient(135deg,#f97316,#f43f5e);border-radius:16px;width:44px;height:44px;text-align:center;vertical-align:middle;">
              <span style="font-size:22px;line-height:44px;">🍽</span>
            </td>
            <td style="padding-left:12px;vertical-align:middle;">
              <span style="font-size:20px;font-weight:900;background:linear-gradient(90deg,#f97316,#f43f5e);-webkit-background-clip:text;color:#f97316;">Rate My Plate</span>
            </td>
          </tr></table>
        </td></tr>
        <!-- Card -->
        <tr><td style="background:#1a1a1a;border-radius:24px;border:1px solid #2a2a2a;padding:40px 36px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding-top:28px;text-align:center;color:#555;font-size:12px;">
          © ${new Date().getFullYear()} Rate My Plate &nbsp;·&nbsp;
          <a href="${SITE}/settings" style="color:#555;text-decoration:underline;">Manage notifications</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(text: string, url: string) {
  return `<a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#f97316,#f43f5e);color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:14px;text-decoration:none;margin-top:8px;">${text}</a>`;
}

function h1(text: string) {
  return `<h1 style="color:#fff;font-size:26px;font-weight:900;margin:0 0 12px;">${text}</h1>`;
}

function p(text: string) {
  return `<p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 20px;">${text}</p>`;
}

// ─── Email types ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, username: string) {
  if (!resend) return;
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to Rate My Plate 🍽",
    html: base(`
      ${h1("Welcome, @" + username + "!")}
      ${p("You're now part of the best food-rating community on the internet. Share your plates, get rated by AI, and discover amazing food from chefs around the world.")}
      ${p("Get started by uploading your first plate — it takes less than a minute.")}
      ${btn("Upload Your First Plate", SITE + "/upload")}
    `),
  });
}

export async function sendNotificationEmail(opts: {
  to: string;
  recipientUsername: string;
  actorUsername: string;
  type: "like" | "comment" | "rating" | "reply" | "follow";
  plateTitle?: string;
  plateId?: string;
  actorId?: string;
}) {
  const { to, recipientUsername, actorUsername, type, plateTitle, plateId, actorId } = opts;

  const messages: Record<string, string> = {
    like: `<strong style="color:#fff;">@${actorUsername}</strong> liked your plate <strong style="color:#f97316;">"${plateTitle}"</strong>`,
    comment: `<strong style="color:#fff;">@${actorUsername}</strong> commented on your plate <strong style="color:#f97316;">"${plateTitle}"</strong>`,
    rating: `<strong style="color:#fff;">@${actorUsername}</strong> rated your plate <strong style="color:#f97316;">"${plateTitle}"</strong>`,
    reply: `<strong style="color:#fff;">@${actorUsername}</strong> replied to your comment on <strong style="color:#f97316;">"${plateTitle}"</strong>`,
    follow: `<strong style="color:#fff;">@${actorUsername}</strong> started following you`,
  };

  const subjects: Record<string, string> = {
    like: `@${actorUsername} liked your plate`,
    comment: `@${actorUsername} commented on your plate`,
    rating: `@${actorUsername} rated your plate`,
    reply: `@${actorUsername} replied to your comment`,
    follow: `@${actorUsername} is now following you`,
  };

  const ctaUrl = plateId
    ? `${SITE}/plate/${plateId}`
    : actorId
    ? `${SITE}/profile/${actorId}`
    : SITE;

  const ctaLabels: Record<string, string> = {
    like: "View Plate",
    comment: "View Comment",
    rating: "See Rating",
    reply: "View Reply",
    follow: "View Profile",
  };

  if (!resend) return;
  return resend.emails.send({
    from: FROM,
    to,
    subject: subjects[type] ?? "New activity on Rate My Plate",
    html: base(`
      ${h1("Hey, @" + recipientUsername + "!")}
      ${p(messages[type] ?? "You have new activity on Rate My Plate.")}
      ${btn(ctaLabels[type] ?? "View", ctaUrl)}
      <p style="color:#555;font-size:12px;margin-top:24px;">You're receiving this because you have email notifications enabled. <a href="${SITE}/settings" style="color:#888;">Manage preferences</a></p>
    `),
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!resend) return;
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your Rate My Plate password",
    html: base(`
      ${h1("Password Reset")}
      ${p("We received a request to reset your password. Click the button below — this link expires in 1 hour.")}
      ${btn("Reset Password", resetUrl)}
      ${p("If you didn't request this, you can safely ignore this email.")}
    `),
  });
}

export async function sendPlateRatedEmail(opts: {
  to: string;
  recipientUsername: string;
  plateTitle: string;
  plateId: string;
  raterUsername: string;
  stars: number;
}) {
  const { to, recipientUsername, plateTitle, plateId, raterUsername, stars } = opts;
  const starStr = "★".repeat(stars) + "☆".repeat(5 - stars);
  if (!resend) return;
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Your plate "${plateTitle}" just got ${stars} stars!`,
    html: base(`
      ${h1("Your plate was rated!")}
      ${p(`<strong style="color:#fff;">@${raterUsername}</strong> gave <strong style="color:#f97316;">"${plateTitle}"</strong> a rating of <strong style="color:#f59e0b;">${starStr} (${stars}/5)</strong>.`)}
      ${btn("View Plate", SITE + "/plate/" + plateId)}
    `),
  });
}

export async function sendVerificationEmail(to: string, username: string, code: string) {
  if (!resend) return;
  const digits = code.split("");
  const digitBoxes = digits
    .map((d) => `<span style="display:inline-block;width:44px;height:56px;line-height:56px;text-align:center;font-size:28px;font-weight:900;color:#fff;background:#1f1f1f;border:2px solid #333;border-radius:10px;margin:0 3px;">${d}</span>`)
    .join("");
  return resend.emails.send({
    from: FROM,
    to,
    subject: `${code} is your Rate My Plate verification code`,
    html: base(`
      ${h1("Verify your email")}
      ${p(`Hey <strong style="color:#fff;">@${username}</strong> — enter this 6-digit code to activate your account:`)}
      <div style="text-align:center;margin:28px 0;">${digitBoxes}</div>
      ${p("This code expires in <strong style=\"color:#fff;\">15 minutes</strong>. If you didn't create an account, you can safely ignore this email.")}
    `),
  });
}
