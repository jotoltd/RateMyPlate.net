import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rate My Plate – Share & Rate Food",
  description:
    "Upload your plates, get rated by AI and the community. The ultimate food rating platform.",
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
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? null;
  }

  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50">
        <Navbar user={user} username={username} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-100 bg-white py-6 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Rate My Plate — Share the love of food
        </footer>
      </body>
    </html>
  );
}
