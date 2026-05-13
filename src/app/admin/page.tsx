import { requireAdmin } from "@/lib/admin";
import { Users, ImageIcon, MessageSquare, Star, Heart, TrendingUp, Construction } from "lucide-react";
import { toggleMaintenanceMode } from "@/app/actions/settings";

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();

  const [
    { count: userCount },
    { count: plateCount },
    { count: commentCount },
    { count: ratingCount },
    { count: bannedCount },
    recentPlates,
    { data: appSettings },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("plates").select("*", { count: "exact", head: true }),
    supabase.from("comments").select("*", { count: "exact", head: true }),
    supabase.from("ratings").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("banned", true),
    supabase.from("plates").select("id, title, like_count, rating_count, created_at, profiles(username)").order("created_at", { ascending: false }).limit(5),
    supabase.from("app_settings").select("maintenance_mode").eq("id", true).single(),
  ]);

  const maintenanceOn = appSettings?.maintenance_mode === true;

  const stats = [
    { label: "Total Users", value: userCount ?? 0, icon: Users, color: "from-violet-500 to-purple-600", shadow: "shadow-violet-500/20" },
    { label: "Total Plates", value: plateCount ?? 0, icon: ImageIcon, color: "from-orange-500 to-rose-500", shadow: "shadow-orange-500/20" },
    { label: "Comments", value: commentCount ?? 0, icon: MessageSquare, color: "from-blue-500 to-cyan-500", shadow: "shadow-blue-500/20" },
    { label: "Ratings", value: ratingCount ?? 0, icon: Star, color: "from-amber-400 to-orange-500", shadow: "shadow-amber-500/20" },
    { label: "Banned Users", value: bannedCount ?? 0, icon: Users, color: "from-red-500 to-rose-600", shadow: "shadow-red-500/20" },
  ];

  return (
    <div className="space-y-8">
      {/* Maintenance mode toggle */}
      <div className={`flex items-center justify-between gap-4 rounded-2xl border p-5 ${maintenanceOn ? "bg-amber-500/10 border-amber-500/30" : "bg-surface-1 border-app-1"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${maintenanceOn ? "bg-amber-500/20" : "bg-surface-2"}`}>
            <Construction className={`w-5 h-5 ${maintenanceOn ? "text-amber-400" : "text-faint"}`} />
          </div>
          <div>
            <p className="font-bold text-app text-sm">Maintenance Mode</p>
            <p className="text-xs text-faint mt-0.5">
              {maintenanceOn ? "Site is in maintenance mode — only admins can access it." : "Site is live and accessible to everyone."}
            </p>
          </div>
        </div>
        <form action={toggleMaintenanceMode}>
          <input type="hidden" name="enabled" value={maintenanceOn ? "false" : "true"} />
          <button
            type="submit"
            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${maintenanceOn ? "bg-amber-500" : "bg-surface-2"}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${maintenanceOn ? "translate-x-5" : "translate-x-0.5"}`}
            />
          </button>
        </form>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(({ label, value, icon: Icon, color, shadow }) => (
          <div key={label} className={`bg-surface-1 border border-app-1 rounded-2xl p-5 flex flex-col gap-3`}>
            <div className={`w-9 h-9 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-lg ${shadow}`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-2xl font-black text-app">{value.toLocaleString()}</p>
              <p className="text-xs text-faint font-semibold">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent plates */}
      <div className="bg-surface-1 border border-app-1 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-app-1 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-400" />
          <h2 className="font-bold text-app">Recent Plates</h2>
        </div>
        <div className="divide-y divide-app-1">
          {(recentPlates.data ?? []).map((plate) => {
            const prof = plate.profiles as unknown as { username: string } | null;
            return (
              <div key={plate.id} className="px-6 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-app truncate">{plate.title}</p>
                  <p className="text-xs text-faint">@{prof?.username ?? "unknown"}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-faint flex-shrink-0">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-400" />{plate.like_count}</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />{plate.rating_count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
