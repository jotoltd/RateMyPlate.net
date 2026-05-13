import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import { Shield, Users, ImageIcon, MessageSquare, LayoutDashboard, Mail, ClipboardCheck, Settings } from "lucide-react";

export const metadata = { title: "Admin – Rate My Plate" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireAdmin();

  const { count: pendingCount } = await supabase
    .from("plates")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const nav = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard", badge: null },
    { href: "/admin/review", icon: ClipboardCheck, label: "Review", badge: pendingCount ?? 0 },
    { href: "/admin/users", icon: Users, label: "Users", badge: null },
    { href: "/admin/plates", icon: ImageIcon, label: "Plates", badge: null },
    { href: "/admin/comments", icon: MessageSquare, label: "Comments", badge: null },
    { href: "/admin/waitlist", icon: Mail, label: "Waitlist", badge: null },
    { href: "/admin/settings", icon: Settings, label: "Settings", badge: null },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-app">Admin Panel</h1>
          <p className="text-xs text-faint font-semibold uppercase tracking-widest">Rate My Plate</p>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="flex gap-1 bg-surface-1 rounded-2xl p-1 mb-8 w-fit flex-wrap">
        {nav.map(({ href, icon: Icon, label, badge }) => (
          <Link
            key={href}
            href={href}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-muted hover:text-app hover:bg-surface-2 transition-colors"
          >
            <Icon className="w-4 h-4" />
            {label}
            {badge !== null && badge > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}
