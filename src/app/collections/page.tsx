import { redirect } from "next/navigation";
import Link from "next/link";
import { BookMarked, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createCollection, deleteCollection } from "@/app/actions/collections-boards";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "My Collections – Rate My Plate" };

export default async function CollectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, description, created_at, collection_plates(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const cols = collections ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-2xl flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-app">Collections</h1>
            <p className="text-sm text-muted">{cols.length} {cols.length === 1 ? "collection" : "collections"}</p>
          </div>
        </div>
      </div>

      {/* Create form */}
      <form action={createCollection} className="bg-surface-1 border border-app-1 rounded-3xl p-5 mb-8 space-y-3">
        <p className="text-sm font-bold text-muted uppercase tracking-widest text-xs mb-4">New Collection</p>
        <input
          name="name"
          required
          maxLength={60}
          placeholder="Collection name…"
          className="w-full bg-surface-2 border border-app-1 rounded-xl px-4 py-2.5 text-sm text-app placeholder-faint focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <textarea
          name="description"
          maxLength={200}
          rows={2}
          placeholder="Description (optional)"
          className="w-full bg-surface-2 border border-app-1 rounded-xl px-4 py-2.5 text-sm text-app placeholder-faint focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
        />
        <button
          type="submit"
          className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Create Collection
        </button>
      </form>

      {cols.length === 0 ? (
        <div className="text-center py-20 text-faint">
          <BookMarked className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">No collections yet</p>
          <p className="text-sm mt-1">Create one above to start organising your saved plates</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cols.map((col) => {
            const plateCount = (col.collection_plates as unknown as { count: number }[])?.[0]?.count ?? 0;
            return (
              <div key={col.id} className="group bg-surface-1 border border-app-1 hover:border-violet-500/30 rounded-3xl p-5 transition-all relative">
                <Link href={`/collections/${col.id}`} className="block">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 rounded-2xl flex items-center justify-center mb-4">
                    <BookMarked className="w-5 h-5 text-violet-400" />
                  </div>
                  <h2 className="font-bold text-app text-base mb-1">{col.name}</h2>
                  {col.description && <p className="text-xs text-muted mb-3 line-clamp-2">{col.description}</p>}
                  <p className="text-xs text-faint">{plateCount} {plateCount === 1 ? "plate" : "plates"} · {formatDate(col.created_at)}</p>
                </Link>
                <form action={deleteCollection.bind(null, col.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="submit" className="p-2 rounded-xl text-faintest hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
