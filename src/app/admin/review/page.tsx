import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, CheckCircle, XCircle, Clock } from "lucide-react";
import { moderatePlate } from "@/app/actions/moderation";

export const revalidate = 0;

export default async function AdminReviewPage() {
  const { supabase } = await requireAdmin();

  const { data: pending } = await supabase
    .from("plates")
    .select("id, title, description, image_url, category, created_at, ai_rating, ai_comment, profiles(id, username)")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);

  const { count: approvedToday } = await supabase
    .from("plates")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved")
    .gte("created_at", new Date(Date.now() - 86400000).toISOString());

  const { count: rejectedToday } = await supabase
    .from("plates")
    .select("id", { count: "exact", head: true })
    .eq("status", "rejected")
    .gte("created_at", new Date(Date.now() - 86400000).toISOString());

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-amber-400">{pending?.length ?? 0}</p>
          <p className="text-xs text-faint font-semibold mt-1">Pending</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-400">{approvedToday ?? 0}</p>
          <p className="text-xs text-faint font-semibold mt-1">Approved today</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-red-400">{rejectedToday ?? 0}</p>
          <p className="text-xs text-faint font-semibold mt-1">Rejected today</p>
        </div>
      </div>

      {(pending ?? []).length === 0 ? (
        <div className="bg-surface-1 border border-app-1 rounded-2xl p-12 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="font-bold text-app">Queue is clear!</p>
          <p className="text-sm text-faint mt-1">No plates waiting for review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(pending ?? []).map((plate) => {
            const prof = plate.profiles as unknown as { id: string; username: string } | null;
            return (
              <div key={plate.id} className="bg-surface-1 border border-app-1 rounded-2xl overflow-hidden">
                <div className="flex gap-0">
                  {/* Image */}
                  <div className="relative w-48 h-48 flex-shrink-0">
                    <Image src={plate.image_url} alt={plate.title} fill className="object-cover" sizes="192px" />
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500/90 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" /> Pending
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="font-black text-app text-lg leading-tight">{plate.title}</h3>
                        <Link href={`/plate/${plate.id}`} target="_blank" className="text-faint hover:text-orange-400 transition-colors flex-shrink-0">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                      <p className="text-xs text-faint mb-2">
                        @{prof?.username ?? "?"} · {plate.category} · {formatDate(plate.created_at)}
                      </p>
                      {plate.description && (
                        <p className="text-sm text-muted line-clamp-2 mb-2">{plate.description}</p>
                      )}
                      {plate.ai_comment && (
                        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 mt-2">
                          <p className="text-xs font-bold text-violet-400 mb-1">Ramsay says ({plate.ai_rating}/10):</p>
                          <p className="text-xs text-violet-300/80 italic">&quot;{plate.ai_comment}&quot;</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <form action={moderatePlate.bind(null, plate.id, "approved")}>
                        <button
                          type="submit"
                          className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                      </form>
                      <form action={moderatePlate.bind(null, plate.id, "rejected")}>
                        <button
                          type="submit"
                          className="flex items-center gap-2 px-5 py-2 bg-red-600/80 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-colors"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
