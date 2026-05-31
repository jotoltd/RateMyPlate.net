import Link from "next/link";
import Image from "next/image";
import { Trophy, Star, Heart, Medal, Crown, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { scoreToStars } from "@/lib/utils";
import { CATEGORIES } from "@/lib/types";

export const metadata = { title: "Leaderboard – Rate My Plate" };

type PlateRow = {
  id: string;
  title: string;
  image_url: string;
  avg_user_rating: number | null;
  ai_rating: number | null;
  like_count: number;
  rating_count: number;
  profiles: unknown;
};

const podiumGlow = [
  "shadow-amber-500/40 border-amber-500/40",
  "shadow-white/10 border-white/20",
  "shadow-orange-600/30 border-orange-600/30",
];
const podiumLabel = ["🥇 Gold", "🥈 Silver", "🥉 Bronze"];
const podiumSize = ["w-24 h-24", "w-20 h-20", "w-18 h-18"];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; category?: string }>;
}) {
  const { tab, category } = await searchParams;
  const activeTab = tab === "liked" ? "liked" : tab === "reviewed" ? "reviewed" : "rated";
  const activeCategory = category && CATEGORIES.includes(category as never) ? category : "all";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  function buildQuery(orderCol: string, nullCheck?: string) {
    let q = supabase
      .from("plates")
      .select("id, title, image_url, avg_user_rating, ai_rating, like_count, rating_count, profiles(id, username, avatar_url)");
    if (nullCheck) q = q.not(nullCheck, "is", null);
    if (activeCategory !== "all") q = q.eq("category", activeCategory);
    return q.order(orderCol, { ascending: false }).limit(10);
  }

  const { data: plates } =
    activeTab === "liked"
      ? await buildQuery("like_count")
      : activeTab === "reviewed"
      ? await buildQuery("rating_count")
      : await buildQuery("avg_user_rating", "avg_user_rating");

  const list = (plates ?? []) as PlateRow[];
  const top3 = list.slice(0, 3);
  const rest = list.slice(3);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-md shadow-amber-500/30">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-app">Leaderboard</h1>
          <p className="text-sm text-muted">The best plates on the platform</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-surface-1 rounded-2xl p-1 mb-6 w-fit">
        {[
          { key: "rated", icon: <Star className="w-3.5 h-3.5" />, label: "Top Rated" },
          { key: "liked", icon: <Heart className="w-3.5 h-3.5" />, label: "Most Liked" },
          { key: "reviewed", icon: <Medal className="w-3.5 h-3.5" />, label: "Most Reviewed" },
        ].map(({ key, icon, label }) => (
          <Link
            key={key}
            href={`/leaderboard?tab=${key}${activeCategory !== "all" ? `&category=${activeCategory}` : ""}`}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === key
                ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm"
                : "text-muted hover:text-app"
            }`}
          >
            {icon}{label}
          </Link>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 no-scrollbar">
        <Link
          href={`/leaderboard?tab=${activeTab}`}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-colors ${
            activeCategory === "all" ? "bg-orange-500 text-white" : "bg-surface-1 text-muted hover:text-app hover:bg-surface-2"
          }`}
        >
          All
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/leaderboard?tab=${activeTab}&category=${cat}`}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-colors capitalize ${
              activeCategory === cat ? "bg-orange-500 text-white" : "bg-surface-1 text-muted hover:text-app hover:bg-surface-2"
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="text-center py-20 text-faint">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">Nothing ranked yet</p>
          <p className="text-sm mt-1">Be the first to upload in this category!</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {top3.length > 0 && (
            <div className="flex items-end justify-center gap-3 mb-8">
              {/* Reorder: 2nd, 1st, 3rd */}
              {[top3[1], top3[0], top3[2]].map((plate, podiumIdx) => {
                if (!plate) return <div key={podiumIdx} className="flex-1" />;
                const realRank = podiumIdx === 1 ? 1 : podiumIdx === 0 ? 2 : 3;
                const prof = plate.profiles as { id: string; username: string; avatar_url?: string } | null;
                const stat =
                  activeTab === "liked"
                    ? `${plate.like_count} likes`
                    : activeTab === "reviewed"
                    ? `${plate.rating_count} reviews`
                    : plate.avg_user_rating
                    ? `${scoreToStars(plate.avg_user_rating).toFixed(1)} / 5`
                    : "—";

                return (
                  <Link
                    key={plate.id}
                    href={`/plate/${plate.id}`}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-3xl border bg-surface-1 hover:bg-surface-2 transition-all shadow-lg ${podiumGlow[realRank - 1]} ${realRank === 1 ? "pb-6 pt-6" : "pb-4 pt-4"}`}
                  >
                    {realRank === 1 && <Crown className="w-5 h-5 text-amber-400 mb-1" />}
                    <div className={`relative ${podiumSize[realRank - 1] ?? "w-16 h-16"} rounded-2xl overflow-hidden shadow-lg flex-shrink-0`}>
                      <Image src={plate.image_url} alt={plate.title} fill className="object-cover" sizes="96px" />
                    </div>
                    <span className="text-lg">{podiumLabel[realRank - 1].split(" ")[0]}</span>
                    <p className="text-xs font-bold text-app text-center line-clamp-2 leading-tight">{plate.title}</p>
                    <p className="text-[10px] text-faint">@{prof?.username ?? "chef"}</p>
                    <div className="mt-1 px-2.5 py-1 rounded-lg bg-surface-2 text-xs font-bold text-orange-400">{stat}</div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Ranks 4–10 */}
          {rest.length > 0 && (
            <div className="space-y-2">
              {rest.map((plate, i) => {
                const rank = i + 4;
                const prof = plate.profiles as { id: string; username: string } | null;
                return (
                  <Link
                    key={plate.id}
                    href={`/plate/${plate.id}`}
                    className="flex items-center gap-4 p-4 bg-surface-1 rounded-2xl border border-app-1 hover:border-orange-500/30 hover:bg-surface-2 transition-all group"
                  >
                    <span className="w-7 text-center text-sm font-bold text-faintest flex-shrink-0">{rank}</span>
                    <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-surface-2">
                      <Image src={plate.image_url} alt={plate.title} fill className="object-cover" sizes="48px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-app truncate group-hover:text-orange-400 transition-colors text-sm">{plate.title}</p>
                      <p className="text-xs text-faint">@{prof?.username ?? "chef"}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {activeTab === "rated" && plate.avg_user_rating && (
                        <div className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="text-xs font-bold text-amber-400">{scoreToStars(plate.avg_user_rating).toFixed(1)}</span>
                        </div>
                      )}
                      {activeTab === "liked" && (
                        <div className="flex items-center gap-1 bg-rose-500/10 px-2.5 py-1 rounded-lg">
                          <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                          <span className="text-xs font-bold text-rose-400">{plate.like_count}</span>
                        </div>
                      )}
                      {activeTab === "reviewed" && (
                        <div className="flex items-center gap-1 bg-orange-500/10 px-2.5 py-1 rounded-lg">
                          <Star className="w-3 h-3 text-orange-400" />
                          <span className="text-xs font-bold text-orange-400">{plate.rating_count}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
      {/* Guest CTA */}
      {!user && (
        <div className="mt-10 rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-rose-500/5 to-transparent p-7 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/25">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-black text-app mb-2">Think your plate can top the leaderboard?</h3>
          <p className="text-sm text-muted mb-5">Upload your food. Get rated by chefs worldwide and Ramsay. Compete on the global leaderboard.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/auth/signup" className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-6 py-3 rounded-xl font-black text-sm hover:opacity-90 transition-opacity shadow-md shadow-orange-500/20">
              <Flame className="w-4 h-4" /> Join
            </Link>
            <Link href="/auth/login" className="flex items-center gap-2 border border-app-1 text-muted px-6 py-3 rounded-xl font-semibold text-sm hover:bg-surface-1 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
