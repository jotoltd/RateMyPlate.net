"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Trophy, Upload, User } from "lucide-react";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function MobileNav({ userId, unreadCount = 0 }: { userId?: string | null; unreadCount?: number }) {
  const pathname = usePathname();

  const links = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/upload", icon: Upload, label: "Upload" },
    { href: "/leaderboard", icon: Trophy, label: "Top" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-nav backdrop-blur-xl border-t border-nav safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {links.map(({ href, icon: Icon, label }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
                active ? "text-orange-400" : "text-faint hover:text-muted"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span className={`text-[10px] font-medium ${active ? "font-bold" : ""}`}>{label}</span>
            </Link>
          );
        })}
        {userId && (
          <Link
            href={`/profile/${userId}`}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
              isActive(pathname, "/profile") ? "text-orange-400" : "text-faint hover:text-muted"
            }`}
          >
            <User className={`w-5 h-5 ${isActive(pathname, "/profile") ? "stroke-[2.5]" : ""}`} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <span className={`text-[10px] font-medium ${isActive(pathname, "/profile") ? "font-bold" : ""}`}>Profile</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
