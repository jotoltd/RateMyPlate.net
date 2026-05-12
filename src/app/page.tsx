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
      {/* HERO */}
      {!user && (
        <section className="relative overflow-hidden bg-[#0a0a0a] border-b border-white/5">
          {/* Fire radial glow background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-gradient-to-b from-orange-600/30 via-rose-600/10 to-transparent blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-orange-700/10 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-rose-700/10 blur-3xl" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 py-24 md:py-32 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 border border-orange-500/30 bg-orange-500/10 text-orange-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Food Critic
            </div>

            {/* Main headline */}
            <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tight mb-6">
              Dare to be
              <br />
              <span className="text-fire">Rated?</span>
            </h1>

            <p className="text-lg md:text-xl text-white/50 mb-10 max-w-xl mx-auto leading-relaxed">
              Upload your plate. Get brutally honest AI critiques.
              <br className="hidden sm:block" /> Find out if your cooking is actually good.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/signup"
                className="group flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-8 py-4 rounded-2xl font-black text-lg hover:from-orange-400 hover:to-rose-400 transition-all glow-fire active:scale-95"
              >
                <Flame className="w-5 h-5 group-hover:animate-bounce" />
                Submit Your Plate
              </Link>
              <Link
                href="#feed"
                className="flex items-center gap-2 border border-white/20 text-white/70 hover:text-white hover:border-white/40 px-8 py-4 rounded-2xl font-semibold text-lg transition-all"
              >
                See the Feed
              </Link>
            </div>

            {/* Stats row */}
            <div className="mt-14 flex flex-wrap justify-center gap-10">
              {[
                { icon: <Star className="w-5 h-5 text-amber-400 fill-amber-400" />, label: "AI Ratings" },
                { icon: <Flame className="w-5 h-5 text-orange-400" />, label: "Trending Feed" },
                { icon: <ChefHat className="w-5 h-5 text-rose-400" />, label: "Chef Profiles" },
                { icon: <Users className="w-5 h-5 text-violet-400" />, label: "Community" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  {icon}
                  <span className="text-xs text-white/40 font-semibold uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick links */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1 no-scrollbar">
          {[
            { href: "/trending", icon: <Flame className="w-3.5 h-3.5" />, label: "Trending" },
            { href: "/leaderboard", icon: <Star className="w-3.5 h-3.5" />, label: "Top Rated" },
            { href: "/chefs", icon: <Users className="w-3.5 h-3.5" />, label: "Chefs" },
            ...(user ? [{ href: "/saved", icon: <Sparkles className="w-3.5 h-3.5" />, label: "Saved" }] : []),
          ].map(({ href, icon, label }) => (
            <Link key={href} href={href} className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 dark:bg-white/5 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-500 dark:hover:text-orange-400 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-bold uppercase tracking-wide whitespace-nowrap flex-shrink-0 transition-colors border border-transparent hover:border-orange-200 dark:hover:border-orange-500/20">
              {icon}{label}
            </Link>
          ))}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
