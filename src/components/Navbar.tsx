"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChefHat, Upload, User, LogOut, LogIn, Menu, X, Search, Trophy, Flame, Users, Bookmark } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/NotificationBell";
import { Notification } from "@/lib/types";

type NavbarProps = {
  user: { id: string; email?: string } | null;
  username?: string | null;
  notifications?: Notification[];
  themeToggle?: React.ReactNode;
};

export default function Navbar({ user, username, notifications = [], themeToggle }: NavbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  const navLink = "flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 px-3 py-2 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all text-sm font-medium";

  return (
    <nav className="sticky top-0 z-50 bg-white/85 dark:bg-gray-950/85 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200/50 dark:shadow-none group-hover:scale-105 transition-transform">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-lg bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent tracking-tight">
            Rate My Plate
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {themeToggle}
          <Link href="/search" className={navLink}>
            <Search className="w-4 h-4" />
          </Link>
          <Link href="/trending" className={navLink}>
            <Flame className="w-4 h-4" />
          </Link>
          <Link href="/leaderboard" className={navLink}>
            <Trophy className="w-4 h-4" />
          </Link>
          <Link href="/chefs" className={navLink}>
            <Users className="w-4 h-4" />
          </Link>
          {user ? (
            <>
              {notifications && <NotificationBell notifications={notifications} />}
              <Link
                href="/upload"
                className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 py-2 rounded-2xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-orange-200/50 dark:shadow-none active:scale-95 ml-1"
              >
                <Upload className="w-4 h-4" />
                Upload
              </Link>
              <Link
                href={`/profile/${user.id}`}
                className={navLink + " ml-0.5"}
              >
                <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-rose-500 rounded-full flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <span>{username || "Me"}</span>
              </Link>
              <button
                onClick={handleSignOut}
                className={navLink}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className={navLink + " ml-1"}>
                <LogIn className="w-4 h-4" />
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 py-2 rounded-2xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-orange-200/50 dark:shadow-none ml-1"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-orange-50 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-orange-100 bg-white px-4 py-3 flex flex-col gap-2">
          <Link href="/search" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-gray-700 px-4 py-3 rounded-xl hover:bg-orange-50">
            <Search className="w-4 h-4" /> Search
          </Link>
          <Link href="/trending" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-gray-700 px-4 py-3 rounded-xl hover:bg-orange-50">
            <Flame className="w-4 h-4" /> Trending
          </Link>
          <Link href="/leaderboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-gray-700 px-4 py-3 rounded-xl hover:bg-orange-50">
            <Trophy className="w-4 h-4" /> Leaderboard
          </Link>
          <Link href="/chefs" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-gray-700 px-4 py-3 rounded-xl hover:bg-orange-50">
            <Users className="w-4 h-4" /> Discover Chefs
          </Link>
          {user ? (
            <>
              {notifications && <NotificationBell notifications={notifications} />}
              <Link
                href="/upload"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 py-3 rounded-xl font-medium"
              >
                <Upload className="w-4 h-4" />
                Upload Plate
              </Link>
              <Link href="/saved" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-gray-700 px-4 py-3 rounded-xl hover:bg-orange-50">
                <Bookmark className="w-4 h-4" /> Saved Plates
              </Link>
              <Link href="/notifications" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-gray-700 px-4 py-3 rounded-xl hover:bg-orange-50">
                <User className="w-4 h-4" /> Notifications
              </Link>
              <Link
                href={`/profile/${user.id}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-gray-700 px-4 py-3 rounded-xl hover:bg-orange-50"
              >
                <User className="w-4 h-4" />
                {username || "Profile"}
              </Link>
              <button
                onClick={() => { setMenuOpen(false); handleSignOut(); }}
                className="flex items-center gap-2 text-gray-500 px-4 py-3 rounded-xl hover:bg-red-50 text-left"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-gray-700 px-4 py-3 rounded-xl hover:bg-orange-50"
              >
                <LogIn className="w-4 h-4" />
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 py-3 rounded-xl font-medium"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
