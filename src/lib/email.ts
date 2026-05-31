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
      ${p("You're now part of the best food-rating community on the internet. Share your plates, get rated by Ramsay, and discover amazing food from chefs around the world.")}
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

export async function sendCustomBroadcastEmail(to: string, username: string, subject: string, bodyText: string) {
  if (!resend) return;
  return resend.emails.send({
    from: FROM,
    to,
    subject,
    html: base(`
      ${h1("Hey @" + username + "!")}
      ${p(bodyText.replace(/\n/g, "<br>"))}
      ${btn("Visit Rate My Plate", SITE)}
      <p style="color:#555;font-size:12px;margin-top:24px;">Sent by the Rate My Plate team. <a href="${SITE}/settings" style="color:#888;">Manage preferences</a></p>
    `),
  });
}

export async function sendLaunchEmail(to: string, name?: string) {
  if (!resend) return;
  const greeting = name ? `Hey ${name}` : "Hey there";
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Rate My Plate is LIVE 🍽🎉",
    html: base(`
      ${h1(greeting + " — we're live!")}
      ${p("You signed up for the Rate My Plate waitlist and the wait is over. The doors are open!")}
      ${p("Upload your first plate, get brutally honest Ramsay ratings, and see how the community rates your food.")}
      ${p("<strong style='color:#fff;'>It's completely free.</strong> No catch.")}
      ${btn("Claim Your Spot Now →", SITE + "/auth/signup")}
      <p style="color:#666;font-size:12px;margin-top:24px;">You're receiving this because you signed up at ratemyplate.net. <a href="${SITE}" style="color:#888;">Unsubscribe</a></p>
    `),
  });
}

export async function sendWeeklyDigestEmail(opts: {
  to: string;
  username: string;
  newLikes: number;
  newRatings: number;
  newFollowers: number;
  topPlate: { title: string; id: string; image_url: string } | null;
  trendingPlates: { title: string; id: string; username: string }[];
}) {
  if (!resend) return;
  const { to, username, newLikes, newRatings, newFollowers, topPlate, trendingPlates } = opts;
  const hasActivity = newLikes > 0 || newRatings > 0 || newFollowers > 0;

  const statsHtml = hasActivity ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        ${newLikes > 0 ? `<td align="center" style="padding:12px;background:#1f1f1f;border-radius:12px;margin:4px;">
          <div style="font-size:28px;font-weight:900;color:#f43f5e;">${newLikes}</div>
          <div style="font-size:12px;color:#888;margin-top:2px;">new likes</div>
        </td>` : ""}
        ${newRatings > 0 ? `<td width="12"></td><td align="center" style="padding:12px;background:#1f1f1f;border-radius:12px;">
          <div style="font-size:28px;font-weight:900;color:#f59e0b;">${newRatings}</div>
          <div style="font-size:12px;color:#888;margin-top:2px;">new ratings</div>
        </td>` : ""}
        ${newFollowers > 0 ? `<td width="12"></td><td align="center" style="padding:12px;background:#1f1f1f;border-radius:12px;">
          <div style="font-size:28px;font-weight:900;color:#60a5fa;">${newFollowers}</div>
          <div style="font-size:12px;color:#888;margin-top:2px;">new followers</div>
        </td>` : ""}
      </tr>
    </table>
  ` : `${p("It's been quiet this week — upload a new plate to get the ratings rolling!")}`;

  const trendingHtml = trendingPlates.length > 0 ? `
    <div style="margin-top:24px;">
      <p style="color:#888;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">🔥 Trending this week</p>
      ${trendingPlates.map(tp => `
        <a href="${SITE}/plate/${tp.id}" style="display:block;padding:10px 14px;background:#1a1a1a;border-radius:10px;margin-bottom:6px;text-decoration:none;">
          <span style="color:#fff;font-weight:700;font-size:14px;">${tp.title}</span>
          <span style="color:#666;font-size:12px;"> by @${tp.username}</span>
        </a>
      `).join("")}
    </div>
  ` : "";

  return resend.emails.send({
    from: FROM,
    to,
    subject: hasActivity
      ? `Your week on Rate My Plate: ${[newLikes && `${newLikes} likes`, newRatings && `${newRatings} ratings`, newFollowers && `${newFollowers} followers`].filter(Boolean).join(", ")}`
      : "What's trending on Rate My Plate this week 🍽",
    html: base(`
      ${h1("Hey @" + username + ", here's your week")}
      ${statsHtml}
      ${topPlate ? `${p(`Your top plate this week: <a href="${SITE}/plate/${topPlate.id}" style="color:#f97316;font-weight:700;">${topPlate.title}</a>`)}` : ""}
      ${trendingHtml}
      ${btn("See What's Trending", SITE + "/trending")}
      <p style="color:#555;font-size:12px;margin-top:24px;">Weekly digest from Rate My Plate. <a href="${SITE}/settings" style="color:#888;">Unsubscribe</a></p>
    `),
  });
}

export async function sendPlateSubmittedEmail(opts: {
  adminEmail: string;
  uploaderUsername: string;
  plateTitle: string;
  plateId: string;
  aiRating: number;
  aiComment: string;
}) {
  if (!resend) return;
  const { adminEmail, uploaderUsername, plateTitle, plateId, aiRating, aiComment } = opts;
  return resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `New plate pending review: "${plateTitle}"`,
    html: base(`
      ${h1("New plate in the queue")}
      ${p(`<strong style="color:#fff;">@${uploaderUsername}</strong> just uploaded a plate called <strong style="color:#f97316;">"${plateTitle}"</strong> and it's waiting for your approval.`)}
      <div style="background:#111;border:1px solid #2a2a2a;border-radius:16px;padding:20px;margin:16px 0;">
        <p style="color:#888;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px;">Ramsay's verdict (${aiRating ? (Math.round((Number(aiRating) / 10) * 5 * 2) / 2).toFixed(1) : "?"}/5 stars)</p>
        <p style="color:#c4b5fd;font-size:14px;font-style:italic;margin:0;">"${aiComment}"</p>
      </div>
      ${btn("Review Now", SITE + "/admin/review")}
    `),
  });
}

export async function sendPlateStatusEmail(opts: {
  to: string;
  username: string;
  plateTitle: string;
  plateId: string;
  approved: boolean;
}) {
  if (!resend) return;
  const { to, username, plateTitle, plateId, approved } = opts;
  return resend.emails.send({
    from: FROM,
    to,
    subject: approved
      ? `Your plate "${plateTitle}" is live! 🎉`
      : `Update on your plate "${plateTitle}"`,
    html: base(
      approved
        ? `
          ${h1("Your plate is live! 🎉")}
          ${p(`Great news, <strong style="color:#fff;">@${username}</strong> — your plate <strong style="color:#f97316;">"${plateTitle}"</strong> has been approved and is now visible to the community.`)}
          ${p("Get out there and collect some ratings!")}
          ${btn("View Your Plate", SITE + "/plate/" + plateId)}
        `
        : `
          ${h1("Plate not approved")}
          ${p(`Hey <strong style="color:#fff;">@${username}</strong> — unfortunately your plate <strong style="color:#f97316;">"${plateTitle}"</strong> didn't meet our community guidelines and won't be published.`)}
          ${p("This could be because it didn't contain food, or the content wasn't appropriate. You're welcome to upload a different plate.")}
          ${btn("Upload a New Plate", SITE + "/upload")}
        `
    ),
  });
}

export async function sendVerificationEmail(to: string, username: string, code: string) {
  if (!resend) throw new Error("RESEND_API_KEY is not configured");
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
