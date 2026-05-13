import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import { Shield, Users, ImageIcon, MessageSquare, LayoutDashboard } from "lucide-react";

export const metadata = { title: "Admin – Rate My Plate" };

const nav = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/plates", icon: ImageIcon, label: "Plates" },
  { href: "/admin/comments", icon: MessageSquare, label: "Comments" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

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
      <div className="flex gap-1 bg-surface-1 rounded-2xl p-1 mb-8 w-fit">
        {nav.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-muted hover:text-app hover:bg-surface-2 transition-colors"
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}
