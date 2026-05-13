"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  Shield,
  ShieldCheck,
  LogOut,
  Upload,
  Bookmark,
  BookMarked,
  ChevronDown,
  Bell,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type UserMenuProps = {
  userId: string;
  username: string;
  email?: string;
  avatarUrl?: string | null;
  themeToggle?: React.ReactNode;
  isAdmin?: boolean;
};

export default function UserMenu({ userId, username, email, avatarUrl, themeToggle, isAdmin }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const initial = username[0]?.toUpperCase() ?? "?";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSignOut() {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger — avatar + chevron */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 rounded-xl hover:bg-surface-2 p-1 transition-colors"
        aria-label="User menu"
      >
        <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500 shadow-sm flex-shrink-0">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={initial} width={32} height={32} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white text-xs font-black">{initial}</span>
            </div>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-app border border-app-1 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-app-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500 flex-shrink-0">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={initial} width={40} height={40} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white text-sm font-black">{initial}</span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-app text-sm truncate">@{username}</p>
              {email && <p className="text-xs text-faint truncate">{email}</p>}
            </div>
          </div>

          {/* Nav items */}
          <div className="py-1.5">
            <MenuItem href={`/profile/${userId}`} icon={<User className="w-4 h-4" />} label="My Profile" onClick={() => setOpen(false)} />
            <MenuItem href="/upload" icon={<Upload className="w-4 h-4" />} label="Upload Plate" onClick={() => setOpen(false)} />
            <MenuItem href="/saved" icon={<Bookmark className="w-4 h-4" />} label="Saved Plates" onClick={() => setOpen(false)} />
            <MenuItem href="/collections" icon={<BookMarked className="w-4 h-4" />} label="Collections" onClick={() => setOpen(false)} />
            <MenuItem href="/notifications" icon={<Bell className="w-4 h-4" />} label="Notifications" onClick={() => setOpen(false)} />
          </div>

          <div className="border-t border-app-1 py-1.5">
            {isAdmin && (
              <MenuItem href="/admin" icon={<ShieldCheck className="w-4 h-4 text-violet-400" />} label="Admin Panel" onClick={() => setOpen(false)} />
            )}
            <MenuItem href="/settings" icon={<Settings className="w-4 h-4" />} label="Settings" onClick={() => setOpen(false)} />
            <MenuItem href="/settings#privacy" icon={<Shield className="w-4 h-4" />} label="Privacy" onClick={() => setOpen(false)} />
            {themeToggle && (
              <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted">
                <span className="flex-1 font-medium">Theme</span>
                {themeToggle}
              </div>
            )}
          </div>

          <div className="border-t border-app-1 py-1.5">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-muted hover:text-app hover:bg-surface-1 transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}
