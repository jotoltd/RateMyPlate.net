import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import ErrorBoundary from "@/components/ErrorBoundary";
import ToastProvider from "@/components/ToastProvider";
import { createClient } from "@/lib/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ratemyplate.net"),
  title: {
    default: "Rate My Plate – Is Your Food Actually Good?",
    template: "%s – Rate My Plate",
  },
  description:
    "Upload a photo of your plate and get an instant, brutally honest AI food critique scored out of 10. Then see how the community rates it. Free forever.",
  keywords: [
    "rate my food", "food rating", "AI food critic", "rate my plate", "food score",
    "plate rating", "is my food good", "cooking feedback", "food community", "food critique"
  ],
  authors: [{ name: "Rate My Plate", url: "https://ratemyplate.net" }],
  creator: "Rate My Plate",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/favicon.svg",
  },
  openGraph: {
    siteName: "Rate My Plate",
    type: "website",
    title: "Rate My Plate – Is Your Food Actually Good?",
    description: "Upload a photo of your plate. Get brutally honest AI feedback + a score out of 10. Join thousands of home chefs already rated.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Rate My Plate" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@ratemyplate",
    title: "Rate My Plate – Is Your Food Actually Good?",
    description: "Upload a photo of your plate. Get brutally honest AI feedback + a score out of 10.",
    images: ["/opengraph-image"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  let avatarUrl: string | null = null;
  let isAdmin = false;
  let notifications: unknown[] = [];

  const { data: appSettings } = await supabase
    .from("app_settings")
    .select("analytics_id, site_announcement")
    .eq("id", true)
    .single();
  const analyticsId = appSettings?.analytics_id ?? null;
  const announcement = appSettings?.site_announcement ?? null;

  if (user) {
    const [profileRes, notifRes] = await Promise.all([
      supabase.from("profiles").select("username, avatar_url, is_admin").eq("id", user.id).single(),
      supabase
        .from("notifications")
        .select("*, actor:actor_id(id, username), plate:plate_id(id, title, image_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
    username = profileRes.data?.username ?? null;
    notifications = notifRes.data ?? [];
    avatarUrl = profileRes.data?.avatar_url ?? null;
    isAdmin = profileRes.data?.is_admin === true;
  }

  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased dark`} suppressHydrationWarning>
      {analyticsId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`} strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${analyticsId}');
          `}</Script>
        </>
      )}
      <Script id="clarity-init" strategy="afterInteractive">{`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window,document,"clarity","script","wsqj6bru5l");
      `}</Script>
      <body className="min-h-full flex flex-col bg-app text-app transition-colors">
        <Navbar user={user} username={username} avatarUrl={avatarUrl} userId={user?.id} notifications={notifications as never} isAdmin={isAdmin} />
        {announcement && (
          <div className="w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-semibold text-center py-2.5 px-4">
            {announcement}
          </div>
        )}
        <ToastProvider>
          <main className="flex-1">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </ToastProvider>
        <footer className="border-t border-nav bg-nav py-6 text-center text-sm text-faintest hidden md:block">
          <p>{new Date().getFullYear()} Rate My Plate — Share the love of food</p>
          <p className="mt-1.5 flex items-center justify-center gap-4">
            <a href="/legal#terms" className="hover:text-orange-400 transition-colors">Terms</a>
            <a href="/legal#privacy" className="hover:text-orange-400 transition-colors">Privacy</a>
            <a href="mailto:legal@ratemyplate.net" className="hover:text-orange-400 transition-colors">Contact</a>
          </p>
        </footer>
        <MobileNav userId={user?.id} unreadCount={(notifications as {read?: boolean}[]).filter((n) => !n.read).length} />
      </body>
    </html>
  );
}
