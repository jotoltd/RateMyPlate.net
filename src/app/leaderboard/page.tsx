import Link from "next/link";
import Image from "next/image";
import { Trophy, Star, Heart, Medal } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { scoreToStars } from "@/lib/utils";

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const [topRatedRes, mostLikedRes, mostRatedRes] = await Promise.all([
    supabase
      .from("plates")
      .select("id, title, image_url, avg_user_rating, ai_rating, like_count, rating_count, profiles(id, username)")
      .not("avg_user_rating", "is", null)
      .order("avg_user_rating", { ascending: false })
      .limit(10),
    supabase
      .from("plates")
      .select("id, title, image_url, avg_user_rating, ai_rating, like_count, rating_count, profiles(id, username)")
      .order("like_count", { ascending: false })
      .limit(10),
    supabase
      .from("plates")
      .select("id, title, image_url, avg_user_rating, ai_rating, like_count, rating_count, profiles(id, username)")
      .order("rating_count", { ascending: false })
      .limit(10),
  ]);

  const medals = ["🥇", "🥈", "🥉"];

  function PlateRow({
    plate,
    rank,
    stat,
  }: {
    plate: typeof topRatedRes.data extends (infer T)[] | null ? T : never;
    rank: number;
    stat: React.ReactNode;
  }) {
    const prof = plate.profiles as unknown as { id: string; username: string } | null;
    return (
      <Link
        href={`/plate/${plate.id}`}
        className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-orange-200 hover:shadow-md transition-all group"
      >
        <span className="w-8 text-center text-lg font-bold text-gray-400 flex-shrink-0">
          {rank <= 3 ? medals[rank - 1] : rank}
        </span>
        <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
          <Image src={plate.image_url} alt={plate.title} fill className="object-cover" sizes="56px" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate group-hover:text-orange-500 transition-colors">
            {plate.title}
          </p>
          <p className="text-xs text-gray-500">
            by @{prof?.username ?? "chef"}
          </p>
        </div>
        <div className="flex-shrink-0">{stat}</div>
      </Link>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-sm text-gray-500">The best plates on the platform</p>
        </div>
      </div>

      <div className="space-y-10">
        {/* Top Rated */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h2 className="text-lg font-bold text-gray-900">Top Rated</h2>
          </div>
          <div className="space-y-2">
            {(topRatedRes.data ?? []).map((plate, i) => (
              <PlateRow
                key={plate.id}
                plate={plate}
                rank={i + 1}
                stat={
                  <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-bold text-amber-700">
                      {scoreToStars(Number(plate.avg_user_rating)).toFixed(1)}
                    </span>
                    <span className="text-xs text-amber-400">/5</span>
                  </div>
                }
              />
            ))}
            {(topRatedRes.data ?? []).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No rated plates yet</p>
            )}
          </div>
        </section>

        {/* Most Liked */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h2 className="text-lg font-bold text-gray-900">Most Liked</h2>
          </div>
          <div className="space-y-2">
            {(mostLikedRes.data ?? []).map((plate, i) => (
              <PlateRow
                key={plate.id}
                plate={plate}
                rank={i + 1}
                stat={
                  <div className="flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg">
                    <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                    <span className="text-sm font-bold text-rose-700">{plate.like_count}</span>
                  </div>
                }
              />
            ))}
          </div>
        </section>

        {/* Most Reviewed */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Medal className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-gray-900">Most Reviewed</h2>
          </div>
          <div className="space-y-2">
            {(mostRatedRes.data ?? []).map((plate, i) => (
              <PlateRow
                key={plate.id}
                plate={plate}
                rank={i + 1}
                stat={
                  <div className="flex items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-lg">
                    <Star className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-sm font-bold text-orange-700">{plate.rating_count} reviews</span>
                  </div>
                }
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
