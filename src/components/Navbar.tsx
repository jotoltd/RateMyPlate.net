"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChefHat, Upload, User, LogOut, LogIn, Menu, X, Search, Flame, Bookmark, Bell, BookMarked } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/NotificationBell";
import { Notification } from "@/lib/types";

type NavbarProps = {
  user: { id: string; email?: string } | null;
  username?: string | null;
  notifications?: Notification[];
  themeToggle?: React.ReactNode;
  avatarUrl?: string | null;
  userId?: string;
};

export default function Navbar({ user, username, notifications = [], themeToggle, avatarUrl, userId }: NavbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  const initial = (username ?? "?")[0].toUpperCase();

  return (
    <nav className="sticky top-0 z-50 bg-nav backdrop-blur-2xl border-b border-nav">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200/60 dark:shadow-none group-hover:scale-105 transition-transform">
            <ChefHat className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-base text-fire hidden sm:block">
            Rate My Plate
          </span>
        </Link>

        {/* Desktop: centre search */}
        <div className="hidden md:flex flex-1 max-w-xs mx-4">
          <Link
            href="/search"
            className="flex items-center gap-2 w-full bg-surface-1 hover:bg-surface-2 text-muted hover:text-app rounded-xl px-3 py-1.5 text-sm transition-colors border border-app-1"
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            <span>Search plates &amp; chefs…</span>
          </Link>
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-1">
          {themeToggle}
          <Link href="/trending" className="p-2 text-white/40 hover:text-orange-400 hover:bg-orange-500/10 rounded-xl transition-colors" title="Trending">
            <Flame className="w-4 h-4" />
          </Link>
          {user ? (
            <>
              <Link href="/saved" className="p-2 text-white/40 hover:text-orange-400 hover:bg-orange-500/10 rounded-xl transition-colors" title="Saved">
                <Bookmark className="w-4 h-4" />
              </Link>
              <Link href="/collections" className="p-2 text-white/40 hover:text-violet-400 hover:bg-violet-500/10 rounded-xl transition-colors" title="Collections">
                <BookMarked className="w-4 h-4" />
              </Link>
              <NotificationBell notifications={notifications} userId={userId} />
              <Link
                href="/upload"
                className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-3.5 py-1.5 rounded-xl text-sm font-bold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-orange-200/50 dark:shadow-none ml-1"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload
              </Link>
              <Link href={`/profile/${user.id}`} className="ml-1 flex-shrink-0" title={username ?? "Profile"}>
                <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500 shadow-sm hover:scale-105 transition-transform">
                  {avatarUrl
                    ? <img src={avatarUrl} alt={initial} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><span className="text-white text-xs font-black">{initial}</span></div>
                  }
                </div>
              </Link>
              <button onClick={handleSignOut} className="p-2 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm font-semibold text-muted hover:text-app px-3 py-1.5 rounded-xl hover:bg-surface-1 transition-colors ml-1">
                Sign in
              </Link>
              <Link href="/auth/signup" className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-3.5 py-1.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md shadow-orange-200/50 dark:shadow-none">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile right */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/search" className="p-1.5 text-muted hover:text-orange-400 rounded-lg transition-colors">
            <Search className="w-5 h-5" />
          </Link>
          {user && <NotificationBell notifications={notifications} userId={userId} />}
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 text-muted hover:text-orange-400 rounded-lg transition-colors">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-nav border-t border-nav px-4 py-4 flex flex-col gap-1">
          {user && (
            <Link
              href={`/profile/${user.id}`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-orange-500/10 mb-1"
            >
              <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500 flex-shrink-0">
                {avatarUrl
                  ? <img src={avatarUrl} alt={initial} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><span className="text-white font-black">{initial}</span></div>
                }
              </div>
              <div>
                <p className="font-bold text-muted text-sm">{username}</p>
                <p className="text-xs text-muted/30">View profile</p>
              </div>
            </Link>
          )}

          {user && (
            <Link href="/upload" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 py-3 rounded-2xl font-semibold mb-2">
              <Upload className="w-4 h-4" /> Upload Plate
            </Link>
          )}

          {[
            { href: "/trending", icon: <Flame className="w-4 h-4" />, label: "Trending" },
            { href: "/leaderboard", icon: <span className="text-base">🏆</span>, label: "Leaderboard" },
            { href: "/chefs", icon: <User className="w-4 h-4" />, label: "Discover Chefs" },
            ...(user ? [
              { href: "/saved", icon: <Bookmark className="w-4 h-4" />, label: "Saved Plates" },
              { href: "/collections", icon: <BookMarked className="w-4 h-4" />, label: "Collections" },
              { href: "/notifications", icon: <Bell className="w-4 h-4" />, label: "Notifications" },
            ] : []),
          ].map(({ href, icon, label }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-muted hover:text-app hover:bg-surface-1 text-sm font-medium">
              {icon} {label}
            </Link>
          ))}

          <div className="border-t border-nav mt-2 pt-2">
            {user ? (
              <button onClick={() => { setMenuOpen(false); handleSignOut(); }} className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 text-sm font-medium">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-muted hover:text-app hover:bg-surface-1 text-sm font-medium">
                  <LogIn className="w-4 h-4" /> Sign in
                </Link>
                <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 py-3 rounded-2xl font-semibold">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
