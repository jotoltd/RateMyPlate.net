import Link from "next/link";
import Image from "next/image";
import { TrendingUp, Star, Heart, Flame, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, scoreToStars } from "@/lib/utils";
import { CATEGORIES } from "@/lib/types";

export const metadata = { title: "Trending – Rate My Plate" };

const timeLabels: Record<string, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "all": "All time",
};

export default async function TrendingPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; category?: string }>;
}) {
  const { period, category } = await searchParams;
  const activePeriod = period === "7d" ? "7d" : period === "all" ? "all" : "24h";
  const activeCategory = category && CATEGORIES.includes(category as never) ? category : "all";

  const supabase = await createClient();

  const since =
    activePeriod === "24h"
      ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      : activePeriod === "7d"
      ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      : null;

  let query = supabase
    .from("plates")
    .select("id, title, image_url, avg_user_rating, ai_rating, like_count, rating_count, created_at, category, profiles(id, username, avatar_url)");

  if (since) query = query.gte("created_at", since);
  if (activeCategory !== "all") query = query.eq("category", activeCategory);

  const { data: plates } = await query
    .order("like_count", { ascending: false })
    .order("rating_count", { ascending: false })
    .limit(25);

  const allPlates = plates ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-md shadow-rose-500/30">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Trending</h1>
          <p className="text-sm text-white/40">{timeLabels[activePeriod]}</p>
        </div>
      </div>

      {/* Time filter */}
      <div className="flex gap-1 bg-white/5 rounded-2xl p-1 mb-6 w-fit">
        {(["24h", "7d", "all"] as const).map((p) => (
          <Link
            key={p}
            href={`/trending?period=${p}${activeCategory !== "all" ? `&category=${activeCategory}` : ""}`}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activePeriod === p
                ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {p === "24h" ? "24h" : p === "7d" ? "7 Days" : "All Time"}
          </Link>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 no-scrollbar">
        <Link
          href={`/trending?period=${activePeriod}`}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-colors ${
            activeCategory === "all" ? "bg-orange-500 text-white" : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
          }`}
        >
          All
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/trending?period=${activePeriod}&category=${cat}`}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-colors capitalize ${
              activeCategory === cat ? "bg-orange-500 text-white" : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {allPlates.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">Nothing trending yet</p>
          <p className="text-sm mt-1">Check back later or be the first to upload!</p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 mt-6 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            <Upload className="w-4 h-4" /> Upload a Plate
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {allPlates.map((plate, i) => {
            const prof = plate.profiles as unknown as { id: string; username: string } | null;
            const rating = plate.avg_user_rating ?? plate.ai_rating;
            const isHot = i === 0;
            return (
              <Link
                key={plate.id}
                href={`/plate/${plate.id}`}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group ${
                  isHot
                    ? "bg-gradient-to-r from-orange-500/10 to-rose-500/5 border-orange-500/30 hover:border-orange-500/50"
                    : "bg-white/[0.03] border-white/5 hover:border-orange-500/20 hover:bg-white/5"
                }`}
              >
                <div className="w-7 flex-shrink-0 flex items-center justify-center">
                  {isHot ? (
                    <Flame className="w-5 h-5 text-orange-400" />
                  ) : (
                    <span className="text-sm font-bold text-white/20">{i + 1}</span>
                  )}
                </div>
                <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-white/5">
                  <Image src={plate.image_url} alt={plate.title} fill className="object-cover" sizes="56px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate group-hover:text-orange-400 transition-colors text-sm ${isHot ? "text-white" : "text-white/80"}`}>
                    {plate.title}
                  </p>
                  <p className="text-xs text-white/30">
                    @{prof?.username ?? "chef"} · {formatDate(plate.created_at)}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-rose-400">
                      <Heart className="w-3 h-3 fill-rose-400" /> {plate.like_count}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-white/30">
                      <Star className="w-3 h-3" /> {plate.rating_count} reviews
                    </span>
                  </div>
                </div>
                {rating && (
                  <div className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg flex-shrink-0">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-bold text-amber-400">{scoreToStars(Number(rating)).toFixed(1)}</span>
                    <span className="text-xs text-amber-400/60">/5</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
