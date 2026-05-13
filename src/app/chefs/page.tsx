import Link from "next/link";
import Image from "next/image";
import { Users, Upload, Star, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { scoreToStars } from "@/lib/utils";

export const metadata = { title: "Discover Chefs – Rate My Plate" };

export default async function ChefsPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, bio, avatar_url, follower_count, following_count")
    .order("follower_count", { ascending: false })
    .limit(50);

  const chefs = profiles ?? [];

  // Get plate counts + avg rating per chef
  const { data: plateCounts } = await supabase
    .from("plates")
    .select("user_id, avg_user_rating, ai_rating, like_count");

  const statsMap: Record<string, { plates: number; avgRating: number | null; likes: number }> = {};
  for (const p of plateCounts ?? []) {
    if (!statsMap[p.user_id]) statsMap[p.user_id] = { plates: 0, avgRating: null, likes: 0 };
    statsMap[p.user_id].plates++;
    statsMap[p.user_id].likes += p.like_count ?? 0;
    const r = p.avg_user_rating ?? p.ai_rating;
    if (r !== null) {
      statsMap[p.user_id].avgRating =
        statsMap[p.user_id].avgRating === null ? r : (statsMap[p.user_id].avgRating! + r) / 2;
    }
  }

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-violet-500 rounded-2xl flex items-center justify-center shadow-md">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-app">Discover Chefs</h1>
          <p className="text-sm text-muted">Find talented food creators to follow</p>
        </div>
      </div>

      {chefs.length === 0 ? (
        <div className="text-center py-20 text-faint">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No chefs yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {chefs.map((chef) => {
            const stats = statsMap[chef.id];
            const isOwn = user?.id === chef.id;
            return (
              <Link
                key={chef.id}
                href={`/profile/${chef.id}`}
                className="flex items-center gap-4 p-4 bg-surface-1 rounded-3xl border border-app-1 hover:border-orange-500/30 hover:bg-surface-2 transition-all group"
              >
                <div className="relative w-14 h-14 flex-shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500 shadow-md">
                  {chef.avatar_url ? (
                    <Image src={chef.avatar_url} alt={chef.username} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white text-2xl font-black">{chef.username[0].toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-app group-hover:text-orange-400 transition-colors truncate">
                    @{chef.username}
                    {isOwn && <span className="ml-2 text-[10px] font-bold bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full">You</span>}
                  </p>
                  {chef.bio && (
                    <p className="text-xs text-muted line-clamp-1 mt-0.5">{chef.bio}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    {stats?.plates > 0 && (
                      <span className="flex items-center gap-1 text-xs text-faint">
                        <Upload className="w-3 h-3" />
                        {stats.plates}
                      </span>
                    )}
                    {stats?.likes > 0 && (
                      <span className="flex items-center gap-1 text-xs text-rose-400">
                        <Heart className="w-3 h-3 fill-rose-400" />
                        {stats.likes}
                      </span>
                    )}
                    {stats?.avgRating !== null && stats?.avgRating !== undefined && (
                      <span className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {scoreToStars(stats.avgRating).toFixed(1)}
                      </span>
                    )}
                    <span className="text-xs text-faint ml-auto">
                      {chef.follower_count ?? 0} followers
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
