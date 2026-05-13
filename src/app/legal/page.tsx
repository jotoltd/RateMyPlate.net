import Link from "next/link";
import { ArrowLeft, Shield, FileText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Privacy – Rate My Plate",
  description: "Terms of Service and Privacy Policy for Rate My Plate.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-black text-app mb-3">{title}</h2>
      <div className="text-sm text-muted leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function LegalPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  return <LegalContent />;
}

async function LegalContent() {
  const SITE = "https://ratemyplate.net";
  const EMAIL = "legal@ratemyplate.net";
  const UPDATED = "13 May 2025";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-faint hover:text-orange-400 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to feed
      </Link>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-1 border border-app-1 rounded-2xl p-1 w-fit mb-10">
        <a href="#terms" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-app bg-surface-2 transition-colors">
          <FileText className="w-4 h-4 text-orange-400" /> Terms of Service
        </a>
        <a href="#privacy" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-muted hover:text-app transition-colors">
          <Shield className="w-4 h-4 text-violet-400" /> Privacy Policy
        </a>
      </div>

      {/* ── Terms ── */}
      <div id="terms" className="mb-16">
        <h1 className="text-3xl font-black text-app mb-1">Terms of Service</h1>
        <p className="text-xs text-faint mb-8">Last updated: {UPDATED}</p>

        <Section title="1. Acceptance">
          <p>By accessing or using Rate My Plate (&quot;the Service&quot;) at <a href={SITE} className="text-orange-400 hover:underline">{SITE}</a>, you agree to be bound by these Terms. If you do not agree, do not use the Service.</p>
        </Section>

        <Section title="2. Eligibility">
          <p>You must be at least 13 years old to use the Service. By using the Service, you represent that you meet this requirement.</p>
        </Section>

        <Section title="3. User Content &amp; Licence">
          <p>You retain ownership of all content you upload (&quot;User Content&quot;). By uploading any image or content to the Service, you grant Rate My Plate and its affiliates a perpetual, worldwide, non-exclusive, royalty-free, sublicensable, transferable licence to use, reproduce, modify, adapt, publish, translate, distribute, publicly display, and create derivative works from that content, in any media or format now known or later developed, for any purpose connected with operating, promoting, or improving the Service — including marketing and editorial use.</p>
          <p>You represent and warrant that you own or have the necessary rights to grant this licence and that your content does not infringe any third-party rights.</p>
          <p>You are solely responsible for your content. You must not upload content that is illegal, harmful, deceptive, infringing, sexually explicit, or violates the rights of others.</p>
        </Section>

        <Section title="4. Prohibited Conduct">
          <p>You agree not to: (a) harass or abuse other users; (b) post spam or misleading content; (c) attempt to gain unauthorised access to any system; (d) use automated tools to scrape or abuse the Service; (e) impersonate any person or entity.</p>
        </Section>

        <Section title="5. AI Ratings">
          <p>AI-generated ratings are provided for entertainment and informational purposes only. They are not professional culinary assessments and should not be relied upon as such.</p>
        </Section>

        <Section title="6. Termination">
          <p>We reserve the right to suspend or terminate your account at any time, with or without notice, for conduct that we determine violates these Terms or is harmful to other users, us, or third parties.</p>
        </Section>

        <Section title="7. Disclaimer of Warranties">
          <p>The Service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee the Service will be uninterrupted, error-free, or that any content is accurate.</p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>To the maximum extent permitted by law, Rate My Plate shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>
        </Section>

        <Section title="9. Changes to Terms">
          <p>We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
        </Section>

        <Section title="10. Contact">
          <p>Questions about these Terms? Email us at <a href={`mailto:${EMAIL}`} className="text-orange-400 hover:underline">{EMAIL}</a>.</p>
        </Section>
      </div>

      <div className="border-t border-app-1 mb-16" />

      {/* ── Privacy ── */}
      <div id="privacy">
        <h1 className="text-3xl font-black text-app mb-1">Privacy Policy</h1>
        <p className="text-xs text-faint mb-8">Last updated: {UPDATED}</p>

        <Section title="1. What We Collect">
          <p><strong className="text-app">Account data:</strong> email address, username, and password (hashed by Supabase Auth).</p>
          <p><strong className="text-app">Content:</strong> plate images, titles, descriptions, ratings, and comments you post.</p>
          <p><strong className="text-app">Usage data:</strong> page views, interactions (likes, follows), and device/browser info collected automatically.</p>
          <p><strong className="text-app">Waitlist:</strong> if you sign up during maintenance mode, we store your name and email.</p>
        </Section>

        <Section title="2. How We Use Your Data">
          <p>We use your data to: operate and improve the Service; send transactional emails (email verification, notifications) via Resend; display your public profile and plates; and prevent abuse.</p>
          <p>We do not sell your personal data to third parties.</p>
        </Section>

        <Section title="3. Email Notifications">
          <p>We send transactional emails (account verification, activity notifications) via Resend. You can reduce notification emails from your Settings page. We do not send marketing emails without your explicit consent.</p>
        </Section>

        <Section title="4. Data Storage">
          <p>Data is stored in Supabase (EU West — Ireland) and Vercel Edge infrastructure. Plate images are stored in Supabase Storage (public bucket).</p>
        </Section>

        <Section title="5. Data Sharing">
          <p>We share data only with: Supabase (database/auth/storage), Vercel (hosting), Google (Gemini AI — plate images are sent for analysis), and Resend (email delivery). All are bound by their own privacy policies.</p>
        </Section>

        <Section title="6. Your Rights">
          <p>You may delete your account at any time from Settings → Danger Zone. This permanently removes your profile, plates, ratings, and comments. You may also email <a href={`mailto:${EMAIL}`} className="text-orange-400 hover:underline">{EMAIL}</a> to request a data export or erasure.</p>
        </Section>

        <Section title="7. Cookies">
          <p>We use a single session cookie set by Supabase Auth for authentication. We do not use tracking or advertising cookies.</p>
        </Section>

        <Section title="8. Children">
          <p>The Service is not directed to children under 13. If we become aware of data collected from a child under 13, we will delete it promptly.</p>
        </Section>

        <Section title="9. Changes">
          <p>We may update this policy. We will note the &quot;Last updated&quot; date above when we do. Continued use constitutes acceptance.</p>
        </Section>

        <Section title="10. Contact">
          <p>Privacy questions: <a href={`mailto:${EMAIL}`} className="text-orange-400 hover:underline">{EMAIL}</a></p>
        </Section>
      </div>
    </div>
  );
}
