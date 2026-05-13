import Link from "next/link";
import Image from "next/image";
import { Search, Star, User, SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, scoreToStars } from "@/lib/utils";

const CATEGORIES = ["breakfast", "lunch", "dinner", "dessert", "snack", "drink", "other"];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; minRating?: string }>;
}) {
  const { q, category, minRating } = await searchParams;
  const query = q?.trim() ?? "";
  const activeCategory = category ?? "all";
  const minRatingNum = minRating ? parseFloat(minRating) : 0;
  const supabase = await createClient();

  let platesQuery = supabase
    .from("plates")
    .select("id, title, description, image_url, avg_user_rating, ai_rating, like_count, created_at, category, profiles(id, username)")
    .order("created_at", { ascending: false })
    .limit(30);

  if (query) {
    platesQuery = platesQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
  }
  if (activeCategory !== "all") {
    platesQuery = platesQuery.eq("category", activeCategory);
  }
  if (minRatingNum > 0) {
    const minScore = minRatingNum * 2;
    platesQuery = platesQuery.gte("avg_user_rating", minScore);
  }

  const [platesRes, usersRes] = await Promise.all([
    query || activeCategory !== "all" || minRatingNum > 0 ? platesQuery : Promise.resolve({ data: [] }),
    query
      ? supabase.from("profiles").select("id, username, bio, avatar_url").ilike("username", `%${query}%`).limit(10)
      : Promise.resolve({ data: [] }),
  ]);

  const plates = (platesRes.data ?? []) as typeof platesRes.data;
  const users = usersRes.data ?? [];
  const hasFilters = query || activeCategory !== "all" || minRatingNum > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-app mb-6">Search</h1>

      <form method="GET" action="/search" className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-faint" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search plates or users…"
            autoFocus
            className="w-full pl-12 pr-4 py-3.5 bg-surface-1 border border-app-1 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-app placeholder-faint"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-faint flex-shrink-0" />
          {/* Category chips */}
          {["all", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="submit"
              name="category"
              value={cat}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                activeCategory === cat
                  ? "bg-orange-500 text-white shadow"
                  : "bg-surface-1 border border-app-1 text-muted hover:border-orange-500/40 hover:text-orange-400"
              }`}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
          {/* Min rating */}
          <div className="flex items-center gap-1.5 ml-auto">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
            <span className="text-xs text-faint">Min:</span>
            {[0, 3, 4, 4.5].map((r) => (
              <button
                key={r}
                type="submit"
                name="minRating"
                value={String(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  minRatingNum === r
                    ? "bg-amber-500 text-white"
                    : "bg-surface-1 border border-app-1 text-muted hover:border-amber-500/40 hover:text-amber-400"
                }`}
              >
                {r === 0 ? "Any" : `${r}★`}
              </button>
            ))}
          </div>
          {/* Hidden carry-through fields */}
          {query && <input type="hidden" name="q" value={query} />}
          {activeCategory !== "all" && <input type="hidden" name="category" value={activeCategory} />}
          {minRatingNum > 0 && <input type="hidden" name="minRating" value={String(minRatingNum)} />}
        </div>
      </form>

      {hasFilters && (
        <>
          {/* Users */}
          {users.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-bold text-app mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-orange-400" /> Users
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {users.map((u) => (
                  <Link
                    key={u.id}
                    href={`/profile/${u.id}`}
                    className="flex items-center gap-3 p-4 bg-surface-1 rounded-2xl border border-app-1 hover:border-orange-500/30 hover:bg-surface-2 transition-all"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-rose-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                        : u.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-app">@{u.username}</p>
                      {u.bio && <p className="text-xs text-muted line-clamp-1">{u.bio}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Plates */}
          {(plates ?? []).length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-app mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Plates
              </h2>
              <div className="space-y-3">
                {(plates ?? []).map((plate) => {
                  const rating = plate.avg_user_rating ?? plate.ai_rating;
                  const prof = plate.profiles as unknown as { id: string; username: string } | null;
                  return (
                    <Link
                      key={plate.id}
                      href={`/plate/${plate.id}`}
                      className="flex items-center gap-4 p-4 bg-surface-1 rounded-2xl border border-app-1 hover:border-orange-500/30 hover:bg-surface-2 transition-all"
                    >
                      <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-surface-2">
                        <Image src={plate.image_url} alt={plate.title} fill className="object-cover" sizes="64px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-app truncate">{plate.title}</p>
                        <p className="text-xs text-muted">by @{prof?.username ?? "chef"} · {formatDate(plate.created_at)}</p>
                        {plate.description && (
                          <p className="text-xs text-faint line-clamp-1 mt-0.5">{plate.description}</p>
                        )}
                      </div>
                      {rating && (
                        <div className="flex items-center gap-1 flex-shrink-0 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-bold text-amber-400">{scoreToStars(Number(rating)).toFixed(1)}</span>
                          <span className="text-xs text-amber-400">/5</span>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {(plates ?? []).length === 0 && users.length === 0 && (
            <div className="text-center py-16 text-faint">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No results found</p>
              <p className="text-sm mt-1">Try different keywords or filters</p>
            </div>
          )}
        </>
      )}

      {!hasFilters && (
        <div className="text-center py-16 text-faint">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Search plates or filter by category &amp; rating</p>
        </div>
      )}
    </div>
  );
}
