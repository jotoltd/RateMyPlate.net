import Link from "next/link";
import Image from "next/image";
import { TrendingUp, Star, Heart, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, scoreToStars } from "@/lib/utils";

export default async function TrendingPage() {
  const supabase = await createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: plates } = await supabase
    .from("plates")
    .select("*, profiles(id, username, avatar_url)")
    .gte("created_at", since)
    .order("like_count", { ascending: false })
    .order("rating_count", { ascending: false })
    .limit(20);

  const allPlates = plates ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trending Now</h1>
          <p className="text-sm text-gray-500">Hottest plates in the last 24 hours</p>
        </div>
      </div>

      {allPlates.length === 0 ? (
        <div className="text-center py-20">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-400 font-medium">Nothing trending yet today</p>
          <p className="text-sm text-gray-400 mt-1">Check back later or be the first to upload!</p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 mt-6 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Upload a Plate
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {allPlates.map((plate, i) => {
            const prof = plate.profiles as unknown as { id: string; username: string } | null;
            const rating = plate.avg_user_rating ?? plate.ai_rating;
            return (
              <Link
                key={plate.id}
                href={`/plate/${plate.id}`}
                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-orange-200 hover:shadow-md transition-all group"
              >
                <span className="w-7 text-center font-bold text-gray-300 text-lg flex-shrink-0">
                  {i + 1}
                </span>
                <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                  <Image src={plate.image_url} alt={plate.title} fill className="object-cover" sizes="64px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-orange-500 transition-colors">
                    {plate.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    by @{prof?.username ?? "chef"} · {formatDate(plate.created_at)}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-rose-500">
                      <Heart className="w-3 h-3 fill-rose-400" /> {plate.like_count}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400" /> {plate.rating_count} reviews
                    </span>
                  </div>
                </div>
                {rating && (
                  <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg flex-shrink-0">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-bold text-amber-700">{scoreToStars(Number(rating)).toFixed(1)}</span>
                    <span className="text-xs text-amber-400">/5</span>
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
