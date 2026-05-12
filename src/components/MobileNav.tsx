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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-lg safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
                active ? "text-orange-500" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "fill-orange-100" : ""}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
        {userId && (
          <Link
            href={`/profile/${userId}`}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
              pathname.startsWith("/profile") ? "text-orange-500" : "text-gray-400 hover:text-gray-600"
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
