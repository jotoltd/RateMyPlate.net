import type { Metadata } from "next";
import { Geist } from "next/font/google";
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
  let notifications: unknown[] = [];
  if (user) {
    const [profileRes, notifRes] = await Promise.all([
      supabase.from("profiles").select("username, avatar_url").eq("id", user.id).single(),
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
  }

  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-app text-app transition-colors">
        <Navbar user={user} username={username} avatarUrl={avatarUrl} userId={user?.id} notifications={notifications as never} themeToggle={<ThemeToggle />} />
        <ToastProvider>
          <main className="flex-1">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </ToastProvider>
        <footer className="border-t border-nav bg-nav py-6 text-center text-sm text-faintest hidden md:block">
          {new Date().getFullYear()} Rate My Plate — Share the love of food
        </footer>
        <MobileNav userId={user?.id} />
      </body>
    </html>
  );
}
