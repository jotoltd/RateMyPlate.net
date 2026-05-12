import Link from "next/link";
import Image from "next/image";
import { Upload, Star, Users, Sparkles, TrendingUp, ChefHat, Flame, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PlateCard from "@/components/PlateCard";
import InfiniteFeed from "@/components/InfiniteFeed";
import { Plate, CATEGORIES } from "@/lib/types";
import { scoreToStars } from "@/lib/utils";

const PAGE_SIZE = 12;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tab?: string }>;
}) {
  const { category, tab } = await searchParams;
  const activeTab = tab === "following" ? "following" : "all";
  const activeCategory = category && CATEGORIES.includes(category as never) ? category : "all";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let followingPlates: Plate[] = [];
  if (activeTab === "following" && user) {
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);
    if (follows && follows.length > 0) {
      const ids = follows.map((f) => f.following_id);
      const { data } = await supabase
        .from("plates")
        .select("*, profiles(id, username, avatar_url)")
        .in("user_id", ids)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      followingPlates = (data ?? []) as Plate[];
    }
  }

  let feedQuery = supabase
    .from("plates")
    .select("*, profiles(id, username, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (activeCategory !== "all") {
    feedQuery = feedQuery.eq("category", activeCategory);
  }

  const [{ data: plates }, { data: topPlates }, { data: spotlightChefData }] = await Promise.all([
    feedQuery,
    supabase
      .from("plates")
      .select("*, profiles(id, username, avatar_url)")
      .not("avg_user_rating", "is", null)
      .order("avg_user_rating", { ascending: false })
      .limit(3),
    supabase
      .from("profiles")
      .select("id, username, bio, avatar_url, follower_count")
      .order("follower_count", { ascending: false })
      .limit(1)
      .single(),
  ]);

  // Get spotlight chef's best plate
  const spotlightChef = spotlightChefData ?? null;
  const { data: spotlightPlateData } = spotlightChef
    ? await supabase
        .from("plates")
        .select("id, title, image_url, avg_user_rating, ai_rating, like_count")
        .eq("user_id", spotlightChef.id)
        .order("like_count", { ascending: false })
        .limit(1)
        .single()
    : { data: null };
  const spotlightPlate = spotlightPlateData ?? null;

  return (
    <div>
      {/* Hero */}
      {!user && (
        <section className="bg-gradient-to-br from-orange-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 border-b border-orange-100 dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-powered food ratings
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
              Show off your{" "}
              <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                best plates
              </span>
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload your meals, get instant AI critiques, and see how the community rates your cooking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg"
              >
                <Upload className="w-5 h-5" />
                Start Rating
              </Link>
              <Link
                href="#feed"
                className="flex items-center justify-center gap-2 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-2xl font-semibold text-lg hover:border-orange-300 hover:text-orange-500 transition-colors"
              >
                Browse Plates
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /> AI Ratings</div>
              <div className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /> Social Feed</div>
              <div className="flex items-center gap-2"><ChefHat className="w-4 h-4 text-green-400" /> Food Critiques</div>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick links */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-1">
          <Link href="/trending" className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-semibold hover:bg-rose-100 transition-colors whitespace-nowrap flex-shrink-0">
            <Flame className="w-4 h-4" /> Trending
          </Link>
          <Link href="/leaderboard" className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors whitespace-nowrap flex-shrink-0">
            <Star className="w-4 h-4 fill-amber-400" /> Top Rated
          </Link>
          <Link href="/chefs" className="flex items-center gap-1.5 px-4 py-2 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-xl text-sm font-semibold hover:bg-violet-100 transition-colors whitespace-nowrap flex-shrink-0">
            <Users className="w-4 h-4" /> Chefs
          </Link>
          {user && (
            <Link href="/saved" className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors whitespace-nowrap flex-shrink-0">
              <Sparkles className="w-4 h-4" /> Saved
            </Link>
          )}
        </div>

        {/* Chef Spotlight */}
        {spotlightChef && activeCategory === "all" && activeTab === "all" && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <Crown className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chef Spotlight</h2>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-rose-50 dark:from-orange-900/10 dark:to-rose-900/10 border border-orange-100 dark:border-orange-900/30 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6">
              <Link href={`/profile/${spotlightChef.id}`} className="flex-shrink-0 group">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500 shadow-lg group-hover:scale-105 transition-transform">
                  {spotlightChef.avatar_url ? (
                    <Image src={spotlightChef.avatar_url} alt={spotlightChef.username} fill className="object-cover" sizes="80px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white text-3xl font-black">{spotlightChef.username[0].toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <Link href={`/profile/${spotlightChef.id}`} className="text-xl font-black text-gray-900 dark:text-white hover:text-orange-500 transition-colors">
                    @{spotlightChef.username}
                  </Link>
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
                    ⭐ Top Chef
                  </span>
                </div>
                {spotlightChef.bio && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{spotlightChef.bio}</p>
                )}
                <p className="text-xs text-gray-400">{spotlightChef.follower_count ?? 0} followers</p>
              </div>
              {spotlightPlate && (
                <Link href={`/plate/${spotlightPlate.id}`} className="flex-shrink-0 group">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
                    <Image src={spotlightPlate.image_url} alt={spotlightPlate.title} fill className="object-cover" sizes="96px" />
                    {(spotlightPlate.avg_user_rating ?? spotlightPlate.ai_rating) && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 whitespace-nowrap">
                        ⭐ {scoreToStars(spotlightPlate.avg_user_rating ?? spotlightPlate.ai_rating!).toFixed(1)}
                      </div>
                    )}
                  </div>
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Top Rated strip */}
        {topPlates && topPlates.length > 0 && activeCategory === "all" && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Top Rated</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {topPlates.map((plate) => (
                <PlateCard key={plate.id} plate={plate as Plate} />
              ))}
            </div>
          </section>
        )}

        {/* Feed */}
        <section id="feed">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Latest Plates</h2>
            {user && (
              <Link
                href="/upload"
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity text-sm shadow-md"
              >
                <Upload className="w-4 h-4" /> Upload
              </Link>
            )}
          </div>

          {/* All / Following tabs */}
          {user && (
            <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 w-fit">
              <Link
                href="/"
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "all"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                For You
              </Link>
              <Link
                href="/?tab=following"
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "following"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Following
              </Link>
            </div>
          )}

          {/* Category filter tabs (only in For You tab) */}
          {activeTab === "all" && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
              <Link
                href="/"
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
                  activeCategory === "all"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-orange-50"
                }`}
              >
                All
              </Link>
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  href={`/?category=${cat}`}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-colors capitalize ${
                    activeCategory === cat
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-orange-50"
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          )}

          {activeTab === "following" ? (
            followingPlates.length > 0 ? (
              <InfiniteFeed
                initialPlates={followingPlates}
                mode="following"
              />
            ) : (
              <div className="text-center py-20 text-gray-400">
                <Users className="w-14 h-14 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No plates from people you follow yet</p>
                <p className="text-sm mt-1 mb-6">Follow chefs to see their plates here</p>
                {topPlates && topPlates.length > 0 && (
                  <>
                    <p className="text-sm font-semibold text-gray-500 mb-4">Suggested plates</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                      {topPlates.map((p) => <PlateCard key={p.id} plate={p as Plate} />)}
                    </div>
                  </>
                )}
              </div>
            )
          ) : plates && plates.length > 0 ? (
            <InfiniteFeed
              initialPlates={plates as Plate[]}
              category={activeCategory !== "all" ? activeCategory : undefined}
            />
          ) : (
            <div className="text-center py-24 text-gray-400">
              <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No plates in this category yet!</p>
              <Link
                href={user ? "/upload" : "/auth/signup"}
                className="inline-flex items-center gap-2 mt-6 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                <Upload className="w-4 h-4" />
                Upload a Plate
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
