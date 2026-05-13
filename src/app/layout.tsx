import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import ThemeToggle from "@/components/ThemeToggle";
import ErrorBoundary from "@/components/ErrorBoundary";
import ToastProvider from "@/components/ToastProvider";
import { createClient } from "@/lib/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ratemyplate.net"),
  title: "Rate My Plate – Share & Rate Food",
  description:
    "Upload your plates, get rated by AI and the community. The ultimate food rating platform.",
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
    <html lang="en" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-KY54CZX9QJ" strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-KY54CZX9QJ');
      `}</Script>
      <body className="min-h-full flex flex-col bg-app text-app transition-colors">
        <Navbar user={user} username={username} avatarUrl={avatarUrl} userId={user?.id} notifications={notifications as never} themeToggle={<ThemeToggle />} isAdmin={isAdmin} />
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
