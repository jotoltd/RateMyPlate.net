import Link from "next/link";
import Image from "next/image";
import { Search, Star, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, scoreToStars } from "@/lib/utils";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const supabase = await createClient();

  const [platesRes, usersRes] = query
    ? await Promise.all([
        supabase
          .from("plates")
          .select("id, title, description, image_url, avg_user_rating, ai_rating, like_count, created_at, profiles(id, username)")
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("profiles")
          .select("id, username, bio, avatar_url")
          .ilike("username", `%${query}%`)
          .limit(10),
      ])
    : [{ data: [] }, { data: [] }];

  const plates = platesRes.data ?? [];
  const users = usersRes.data ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Search</h1>

      <form method="GET" action="/search" className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
        <input
          name="q"
          defaultValue={query}
          placeholder="Search plates or users…"
          autoFocus
          className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-white placeholder-white/20"
        />
      </form>

      {query && (
        <>
          {/* Users */}
          {users.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-orange-400" /> Users
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {users.map((u) => (
                  <Link
                    key={u.id}
                    href={`/profile/${u.id}`}
                    className="flex items-center gap-3 p-4 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-orange-500/30 hover:bg-white/5 transition-all"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-rose-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                        : u.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">@{u.username}</p>
                      {u.bio && <p className="text-xs text-white/40 line-clamp-1">{u.bio}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Plates */}
          {plates.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Plates
              </h2>
              <div className="space-y-3">
                {plates.map((plate) => {
                  const rating = plate.avg_user_rating ?? plate.ai_rating;
                  const prof = plate.profiles as unknown as { id: string; username: string } | null;
                  return (
                    <Link
                      key={plate.id}
                      href={`/plate/${plate.id}`}
                      className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-orange-500/30 hover:bg-white/5 transition-all"
                    >
                      <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-white/5">
                        <Image src={plate.image_url} alt={plate.title} fill className="object-cover" sizes="64px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{plate.title}</p>
                        <p className="text-xs text-white/40">by @{prof?.username ?? "chef"} · {formatDate(plate.created_at)}</p>
                        {plate.description && (
                          <p className="text-xs text-white/30 line-clamp-1 mt-0.5">{plate.description}</p>
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

          {plates.length === 0 && users.length === 0 && (
            <div className="text-center py-16 text-white/30">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No results for &quot;{query}&quot;</p>
            </div>
          )}
        </>
      )}

      {!query && (
        <div className="text-center py-16 text-white/30">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Search for plates or users</p>
        </div>
      )}
    </div>
  );
}
