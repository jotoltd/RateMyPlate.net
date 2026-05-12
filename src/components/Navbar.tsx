"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChefHat, Upload, User, LogOut, LogIn, Menu, X } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type NavbarProps = {
  user: { id: string; email?: string } | null;
  username?: string | null;
};

export default function Navbar({ user, username }: NavbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-rose-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
            Rate My Plate
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/upload"
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity shadow-md"
              >
                <Upload className="w-4 h-4" />
                Upload Plate
              </Link>
              <Link
                href={`/profile/${user.id}`}
                className="flex items-center gap-2 text-gray-600 hover:text-orange-500 px-3 py-2 rounded-xl hover:bg-orange-50 transition-colors font-medium"
              >
                <User className="w-4 h-4" />
                {username || "Profile"}
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-gray-500 hover:text-red-500 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="flex items-center gap-2 text-gray-600 hover:text-orange-500 px-4 py-2 rounded-xl hover:bg-orange-50 transition-colors font-medium"
              >
                <LogIn className="w-4 h-4" />
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity shadow-md"
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
          {user ? (
            <>
              <Link
                href="/upload"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 py-3 rounded-xl font-medium"
              >
                <Upload className="w-4 h-4" />
                Upload Plate
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
