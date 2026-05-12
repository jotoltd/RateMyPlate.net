"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Trophy, Upload, User } from "lucide-react";

const links = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/upload", icon: Upload, label: "Upload" },
  { href: "/leaderboard", icon: Trophy, label: "Top" },
];

export default function MobileNav({ userId }: { userId?: string | null }) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/5 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
                active ? "text-orange-400" : "text-white/30 hover:text-white/60"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "fill-orange-500/20" : ""}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
        {userId && (
          <Link
            href={`/profile/${userId}`}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
              pathname.startsWith("/profile") ? "text-orange-400" : "text-white/30 hover:text-white/60"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
