import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/utils";
import AdminUserActions from "./AdminUserActions";
import { Shield, Ban } from "lucide-react";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { q } = await searchParams;

  let query = supabase
    .from("profiles")
    .select("id, username, email, avatar_url, is_admin, banned, created_at, follower_count, following_count")
    .order("created_at", { ascending: false })
    .limit(100);

  if (q) query = query.ilike("username", `%${q}%`);

  const { data: users } = await query;

  return (
    <div className="space-y-4">
      {/* Search */}
      <form className="flex gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search username…"
          className="flex-1 px-4 py-2.5 bg-surface-1 border border-app-1 rounded-xl text-sm text-app placeholder-faint focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button type="submit" className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-colors">
          Search
        </button>
      </form>

      <div className="bg-surface-1 border border-app-1 rounded-2xl overflow-hidden">
        <div className="px-6 py-3 border-b border-app-1 text-xs font-bold text-faint uppercase tracking-widest grid grid-cols-[1fr_160px_80px_180px] gap-4">
          <span>User</span>
          <span>Joined</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        <div className="divide-y divide-app-1">
          {(users ?? []).map((user) => (
            <div key={user.id} className="px-6 py-3 grid grid-cols-[1fr_160px_80px_180px] gap-4 items-center">
              <div className="min-w-0 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500 flex-shrink-0 flex items-center justify-center">
                  {user.avatar_url
                    ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-white text-xs font-bold">{user.username[0].toUpperCase()}</span>
                  }
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-app truncate flex items-center gap-1.5">
                    @{user.username}
                    {user.is_admin && <Shield className="w-3 h-3 text-violet-400 flex-shrink-0" />}
                  </p>
                  <p className="text-xs text-faint truncate">{user.email ?? "—"}</p>
                </div>
              </div>
              <p className="text-xs text-faint">{formatDate(user.created_at)}</p>
              <div>
                {user.banned
                  ? <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full"><Ban className="w-3 h-3" />Banned</span>
                  : <span className="text-xs font-bold text-emerald-400">Active</span>
                }
              </div>
              <AdminUserActions userId={user.id} isBanned={user.banned ?? false} isAdmin={user.is_admin ?? false} />
            </div>
          ))}
          {(users ?? []).length === 0 && (
            <p className="px-6 py-8 text-sm text-faint text-center">No users found</p>
          )}
        </div>
      </div>
    </div>
  );
}
