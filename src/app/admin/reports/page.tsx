import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/utils";
import { Flag, ExternalLink, CheckCircle } from "lucide-react";
import Link from "next/link";
import ResolveReportButton from "./ResolveReportButton";

export const revalidate = 0;

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { show } = await searchParams;
  const showResolved = show === "resolved";

  const { data: reports, count } = await supabase
    .from("reports")
    .select("id, reason, resolved, created_at, plate_id, comment_id, reporter_id, profiles!reporter_id(username)", { count: "exact" })
    .eq("resolved", showResolved)
    .order("created_at", { ascending: false })
    .limit(100);

  const { count: openCount } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("resolved", false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-red-400" />
          <h2 className="font-bold text-app">Reported Content</h2>
          {(openCount ?? 0) > 0 && (
            <span className="text-xs font-black bg-red-500 text-white px-2 py-0.5 rounded-full">{openCount} open</span>
          )}
        </div>
        <div className="flex gap-1 bg-surface-1 rounded-xl p-1">
          <Link
            href="/admin/reports"
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${!showResolved ? "bg-surface-2 text-app" : "text-muted hover:text-app"}`}
          >
            Open
          </Link>
          <Link
            href="/admin/reports?show=resolved"
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${showResolved ? "bg-surface-2 text-app" : "text-muted hover:text-app"}`}
          >
            Resolved
          </Link>
        </div>
      </div>

      <div className="bg-surface-1 border border-app-1 rounded-2xl overflow-hidden">
        {(reports ?? []).length === 0 ? (
          <div className="px-6 py-16 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="font-bold text-app">No {showResolved ? "resolved" : "open"} reports</p>
            <p className="text-sm text-faint mt-1">{!showResolved ? "All clear — nothing flagged." : "Resolve some reports first."}</p>
          </div>
        ) : (
          <div className="divide-y divide-app-1">
            {(reports ?? []).map((r) => {
              const reporter = r.profiles as unknown as { username: string } | null;
              return (
                <div key={r.id} className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                        {r.plate_id ? "Plate" : "Comment"}
                      </span>
                      <span className="text-xs text-faint">reported by @{reporter?.username ?? "?"}</span>
                      <span className="text-xs text-faintest">{formatDate(r.created_at)}</span>
                    </div>
                    <p className="text-sm font-semibold text-app">{r.reason}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {r.plate_id && (
                      <Link href={`/plate/${r.plate_id}`} target="_blank" className="p-1.5 rounded-lg text-faint hover:text-app hover:bg-surface-2 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}
                    {!r.resolved && <ResolveReportButton reportId={r.id} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
