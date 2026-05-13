import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/utils";
import { Mail, Users, Download } from "lucide-react";

export default async function AdminWaitlistPage() {
  const { supabase } = await requireAdmin();

  const { data: entries, count } = await supabase
    .from("waitlist")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  const isMaintenance = process.env.MAINTENANCE_MODE === "true";

  return (
    <div className="space-y-6">
      {/* Maintenance status banner */}
      <div className={`flex items-center justify-between p-4 rounded-2xl border ${
        isMaintenance
          ? "bg-amber-500/10 border-amber-500/30"
          : "bg-emerald-500/10 border-emerald-500/30"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isMaintenance ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
          <div>
            <p className={`font-bold text-sm ${isMaintenance ? "text-amber-300" : "text-emerald-300"}`}>
              {isMaintenance ? "Maintenance Mode ACTIVE" : "Site is LIVE"}
            </p>
            <p className="text-xs text-faint mt-0.5">
              {isMaintenance
                ? "All non-admin visitors see the maintenance page."
                : 'Set MAINTENANCE_MODE=true in your Vercel env vars to activate.'}
            </p>
          </div>
        </div>
        <code className="text-xs bg-black/20 px-3 py-1.5 rounded-lg text-faint font-mono">
          MAINTENANCE_MODE={isMaintenance ? "true" : "false"}
        </code>
      </div>

      {/* Waitlist stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-1 border border-app-1 rounded-2xl p-5">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-orange-500/20">
            <Users className="w-4 h-4 text-white" />
          </div>
          <p className="text-3xl font-black text-app">{count ?? 0}</p>
          <p className="text-xs text-faint font-semibold mt-0.5">Total signups</p>
        </div>
        <div className="bg-surface-1 border border-app-1 rounded-2xl p-5">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-violet-500/20">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <p className="text-3xl font-black text-app">
            {entries?.filter((e) => {
              const d = new Date(e.created_at);
              return Date.now() - d.getTime() < 86_400_000;
            }).length ?? 0}
          </p>
          <p className="text-xs text-faint font-semibold mt-0.5">Last 24 hours</p>
        </div>
      </div>

      {/* CSV export hint */}
      {(entries?.length ?? 0) > 0 && (
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-app flex items-center gap-2">
            <Mail className="w-4 h-4 text-orange-400" />
            Waitlist
          </h2>
          <a
            href={`data:text/csv;charset=utf-8,Name,Email,Joined\n${(entries ?? []).map((e) => `${e.name ?? ""},${e.email},${e.created_at}`).join("\n")}`}
            download="waitlist.csv"
            className="flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 px-3 py-1.5 rounded-xl hover:bg-orange-500/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>
        </div>
      )}

      <div className="bg-surface-1 border border-app-1 rounded-2xl overflow-hidden">
        {(entries?.length ?? 0) === 0 ? (
          <p className="px-6 py-10 text-sm text-faint text-center">No signups yet. Enable maintenance mode to start capturing leads.</p>
        ) : (
          <div className="divide-y divide-app-1">
            <div className="px-5 py-2.5 grid grid-cols-[1fr_200px_120px] gap-4 text-xs font-bold text-faint uppercase tracking-widest border-b border-app-1">
              <span>Email</span>
              <span>Name</span>
              <span>Joined</span>
            </div>
            {(entries ?? []).map((e) => (
              <div key={e.id} className="px-5 py-3 grid grid-cols-[1fr_200px_120px] gap-4 items-center">
                <p className="text-sm font-semibold text-app truncate">{e.email}</p>
                <p className="text-sm text-faint truncate">{e.name ?? "—"}</p>
                <p className="text-xs text-faint">{formatDate(e.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
