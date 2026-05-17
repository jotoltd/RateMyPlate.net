import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/utils";
import AdminDeleteButton from "../AdminDeleteButton";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star, ExternalLink } from "lucide-react";
import PlateStatusSelect from "./PlateStatusSelect";

export default async function AdminPlatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { q, status } = await searchParams;
  const filterStatus = status === "pending" || status === "rejected" || status === "approved" ? status : null;

  let query = supabase
    .from("plates")
    .select("id, title, image_url, like_count, rating_count, created_at, category, status, profiles(id, username)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (q) query = query.ilike("title", `%${q}%`);
  if (filterStatus) query = query.eq("status", filterStatus);

  const { data: plates } = await query;

  return (
    <div className="space-y-4">
      <form className="flex gap-3 flex-wrap">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search plate title…"
          className="flex-1 px-4 py-2.5 bg-surface-1 border border-app-1 rounded-xl text-sm text-app placeholder-faint focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <select name="status" defaultValue={filterStatus ?? ""} className="px-3 py-2.5 bg-surface-1 border border-app-1 rounded-xl text-sm text-app focus:outline-none">
          <option value="">All statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <button type="submit" className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-colors">
          Search
        </button>
      </form>

      <div className="bg-surface-1 border border-app-1 rounded-2xl overflow-hidden">
        <div className="divide-y divide-app-1">
          {(plates ?? []).map((plate) => {
            const prof = plate.profiles as unknown as { id: string; username: string } | null;
            return (
              <div key={plate.id} className="px-4 py-3 flex items-center gap-4">
                <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-surface-2">
                  <Image src={plate.image_url} alt={plate.title} fill className="object-cover" sizes="48px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-app truncate">{plate.title}</p>
                  <p className="text-xs text-faint">
                    @{prof?.username ?? "?"} · {plate.category} · {formatDate(plate.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-faint flex-shrink-0">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-400" />{plate.like_count}</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />{plate.rating_count}</span>
                  <PlateStatusSelect plateId={plate.id} current={plate.status} />
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link href={`/plate/${plate.id}`} target="_blank" className="p-1.5 rounded-lg text-faint hover:text-app hover:bg-surface-2 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <AdminDeleteButton id={plate.id} type="plate" />
                </div>
              </div>
            );
          })}
          {(plates ?? []).length === 0 && (
            <p className="px-6 py-8 text-sm text-faint text-center">No plates found</p>
          )}
        </div>
      </div>
    </div>
  );
}
