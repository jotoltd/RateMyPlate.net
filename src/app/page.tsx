import Link from "next/link";
import Image from "next/image";
import { Upload, Star, Users, Sparkles, ChefHat, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import InfiniteFeed from "@/components/InfiniteFeed";
import { Plate, CATEGORIES } from "@/lib/types";

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
  let followedIds: string[] = [];
  if (activeTab === "following" && user) {
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);
    followedIds = (follows ?? []).map((f) => f.following_id);
    if (followedIds.length > 0) {
      const { data } = await supabase
        .from("plates")
        .select("*, profiles(id, username, avatar_url)")
        .in("user_id", followedIds)
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

  const { data: plates } = await feedQuery;

  // Fetch initial like + rating state for the current user
  const initialPlatesList = activeTab === "following" ? followingPlates : ((plates ?? []) as Plate[]);
  const initialPlateIds = initialPlatesList.map((p) => p.id);

  let initialLikedIds: string[] = [];
  let initialRatingMap: Record<string, number> = {};

  if (user && initialPlateIds.length > 0) {
    const [likesRes, ratingsRes] = await Promise.all([
      supabase.from("likes").select("plate_id").eq("user_id", user.id).in("plate_id", initialPlateIds),
      supabase.from("ratings").select("plate_id, score").eq("user_id", user.id).in("plate_id", initialPlateIds),
    ]);
    initialLikedIds = (likesRes.data ?? []).map((r) => r.plate_id);
    initialRatingMap = Object.fromEntries((ratingsRes.data ?? []).map((r) => [r.plate_id, r.score]));
  }

  // Suggested chefs for empty following tab
  const suggestedChefsRes = (activeTab === "following" && user && followingPlates.length === 0)
    ? await supabase
        .from("profiles")
        .select("id, username, bio, avatar_url, follower_count")
        .neq("id", user.id)
        .not("id", "in", `(${followedIds.length > 0 ? followedIds.join(",") : "''"})`)
        .order("follower_count", { ascending: false })
        .limit(6)
    : { data: null };
  const suggestedChefs = suggestedChefsRes.data ?? [];

  return (
    <div>
      {/* HERO */}
      {!user && (
        <section className="relative overflow-hidden bg-app border-b border-nav">
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
            <h1 className="text-6xl md:text-8xl font-black text-app leading-[0.9] tracking-tight mb-6">
              Dare to be
              <br />
              <span className="text-fire">Rated?</span>
            </h1>

            <p className="text-lg md:text-xl text-muted mb-10 max-w-xl mx-auto leading-relaxed">
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
                className="flex items-center gap-2 border border-app-2 text-muted hover:text-app hover:border-app-2 px-8 py-4 rounded-2xl font-semibold text-lg transition-all"
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
                  <span className="text-xs text-faint font-semibold uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Feed chrome: quick links + tabs + filters — full width */}
      <div className="max-w-[680px] mx-auto px-4 pt-6 pb-2">
        {/* Quick links */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { href: "/trending", icon: <Flame className="w-3.5 h-3.5" />, label: "Trending" },
            { href: "/leaderboard", icon: <Star className="w-3.5 h-3.5" />, label: "Top Rated" },
            { href: "/chefs", icon: <Users className="w-3.5 h-3.5" />, label: "Chefs" },
            ...(user ? [{ href: "/saved", icon: <Sparkles className="w-3.5 h-3.5" />, label: "Saved" }] : []),
          ].map(({ href, icon, label }) => (
            <Link key={href} href={href} className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-1 hover:bg-orange-500/10 hover:text-orange-400 text-muted rounded-xl text-xs font-bold uppercase tracking-wide whitespace-nowrap flex-shrink-0 transition-colors border border-app-1 hover:border-orange-500/20">
              {icon}{label}
            </Link>
          ))}
          {user && (
            <Link
              href="/upload"
              className="ml-auto flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-wide whitespace-nowrap flex-shrink-0 transition-opacity hover:opacity-90"
            >
              <Upload className="w-3.5 h-3.5" /> Upload
            </Link>
          )}
        </div>

        {/* For You / Following tabs */}
        {user && (
          <div className="flex gap-1 mb-4 bg-surface-1 rounded-2xl p-1 w-fit">
            <Link
              href="/"
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === "all" ? "bg-surface-2 text-app shadow-sm" : "text-muted hover:text-app"
              }`}
            >
              For You
            </Link>
            <Link
              href="/?tab=following"
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === "following" ? "bg-surface-2 text-app shadow-sm" : "text-muted hover:text-app"
              }`}
            >
              Following
            </Link>
          </div>
        )}

        {/* Category filter pills */}
        {activeTab === "all" && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
            <Link
              href="/"
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
                activeCategory === "all" ? "bg-orange-500 text-white" : "bg-surface-1 text-muted hover:text-app hover:bg-surface-2"
              }`}
            >
              All
            </Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/?category=${cat}`}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-colors capitalize ${
                  activeCategory === cat ? "bg-orange-500 text-white" : "bg-surface-1 text-muted hover:text-app hover:bg-surface-2"
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Feed */}
      <div className="px-4 pb-12" id="feed">
        {activeTab === "following" ? (
          followingPlates.length > 0 ? (
            <InfiniteFeed
              initialPlates={followingPlates}
              mode="following"
              userId={user?.id}
              initialLikedIds={initialLikedIds}
              initialRatingMap={initialRatingMap}
            />
          ) : (
            <div className="max-w-[680px] mx-auto py-10 text-center">
              <Users className="w-14 h-14 mx-auto mb-4 text-faint opacity-40" />
              <p className="text-lg font-bold text-app mb-1">No plates yet</p>
              <p className="text-sm text-muted mb-8">Follow chefs to see their plates here</p>
              {suggestedChefs.length > 0 && (
                <div className="text-left">
                  <p className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Suggested Chefs</p>
                  <div className="space-y-2">
                    {suggestedChefs.map((chef) => (
                      <Link
                        key={chef.id}
                        href={`/profile/${chef.id}`}
                        className="flex items-center gap-4 p-4 bg-surface-1 border border-app-1 rounded-2xl hover:border-orange-500/30 transition-all"
                      >
                        <div className="w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500 flex-shrink-0">
                          {chef.avatar_url
                            ? <Image src={chef.avatar_url} alt={chef.username} width={44} height={44} className="object-cover w-full h-full" />
                            : <div className="w-full h-full flex items-center justify-center"><span className="text-white font-black text-base">{chef.username[0].toUpperCase()}</span></div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-app truncate">@{chef.username}</p>
                          {chef.bio && <p className="text-xs text-muted truncate">{chef.bio}</p>}
                        </div>
                        <span className="text-xs text-faint flex-shrink-0">{chef.follower_count ?? 0} followers</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        ) : plates && plates.length > 0 ? (
          <InfiniteFeed
            initialPlates={plates as Plate[]}
            category={activeCategory !== "all" ? activeCategory : undefined}
            userId={user?.id}
            initialLikedIds={initialLikedIds}
            initialRatingMap={initialRatingMap}
          />
        ) : (
          <div className="max-w-[680px] mx-auto text-center py-24 text-faint">
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
      </div>
    </div>
  );
}
