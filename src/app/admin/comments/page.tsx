import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/utils";
import AdminDeleteButton from "../AdminDeleteButton";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { q } = await searchParams;

  let query = supabase
    .from("comments")
    .select("id, body, created_at, plate_id, profiles(id, username)")
    .order("created_at", { ascending: false })
    .limit(150);

  if (q) query = query.ilike("body", `%${q}%`);

  const { data: comments } = await query;

  return (
    <div className="space-y-4">
      <form className="flex gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search comment text…"
          className="flex-1 px-4 py-2.5 bg-surface-1 border border-app-1 rounded-xl text-sm text-app placeholder-faint focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button type="submit" className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-colors">
          Search
        </button>
      </form>

      <div className="bg-surface-1 border border-app-1 rounded-2xl overflow-hidden">
        <div className="divide-y divide-app-1">
          {(comments ?? []).map((c) => {
            const prof = c.profiles as unknown as { id: string; username: string } | null;
            return (
              <div key={c.id} className="px-4 py-3 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-app break-words">{c.body}</p>
                  <p className="text-xs text-faint mt-1">
                    @{prof?.username ?? "?"} · {formatDate(c.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {c.plate_id && (
                    <Link href={`/plate/${c.plate_id}`} target="_blank" className="p-1.5 rounded-lg text-faint hover:text-app hover:bg-surface-2 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                  <AdminDeleteButton id={c.id} type="comment" />
                </div>
              </div>
            );
          })}
          {(comments ?? []).length === 0 && (
            <p className="px-6 py-8 text-sm text-faint text-center">No comments found</p>
          )}
        </div>
      </div>
    </div>
  );
}
