"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Trophy, Upload, User, Flame } from "lucide-react";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function MobileNav({ userId, unreadCount = 0 }: { userId?: string | null; unreadCount?: number }) {
  const pathname = usePathname();

  const baseLinks = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/leaderboard", icon: Trophy, label: "Top" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-nav backdrop-blur-xl border-t border-nav safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {baseLinks.map(({ href, icon: Icon, label }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors press-scale ${
                active ? "text-orange-400" : "text-faint hover:text-muted"
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${active ? "bg-orange-500/15" : ""}`}>
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
              </div>
              <span className={`text-[10px] font-medium ${active ? "font-bold" : ""}`}>{label}</span>
            </Link>
          );
        })}

        {/* Upload — fire gradient pill, always centre-stage */}
        <Link
          href="/upload"
          className="flex flex-col items-center gap-0.5 -mt-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-xl shadow-orange-500/40 press-scale-sm transition-all ring-4 ring-orange-500/10">
            <Upload className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-orange-400 mt-0.5">Upload</span>
        </Link>

        {/* Profile for logged-in, Join CTA for guests */}
        {userId ? (
          <Link
            href={`/profile/${userId}`}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors press-scale ${
              isActive(pathname, "/profile") ? "text-orange-400" : "text-faint hover:text-muted"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${isActive(pathname, "/profile") ? "bg-orange-500/15" : ""}`}>
              <User className={`w-5 h-5 ${isActive(pathname, "/profile") ? "stroke-[2.5]" : ""}`} />
            </div>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <span className={`text-[10px] font-medium ${isActive(pathname, "/profile") ? "font-bold" : ""}`}>Profile</span>
          </Link>
        ) : (
          <Link
            href="/auth/signup"
            className="flex flex-col items-center gap-0.5 -mt-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/40 active:scale-95 transition-transform">
              <Flame className="w-6 h-6 text-white stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-bold text-orange-400 mt-0.5">Join Free</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
