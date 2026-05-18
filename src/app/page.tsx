import Link from "next/link";
import Image from "next/image";
import { Upload, Star, Users, Sparkles, ChefHat, Flame, TrendingUp, MessageSquare, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import InfiniteFeed from "@/components/InfiniteFeed";
import GuestSignupNudge from "@/components/GuestSignupNudge";
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

  // Live stats for hero social proof (only needed for guests)
  let heroStats = { chefs: 0, plates: 0, ratings: 0 };
  if (!user) {
    const [{ count: chefs }, { count: plts }, { count: ratings }] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("plates").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("ratings").select("id", { count: "exact", head: true }),
    ]);
    heroStats = { chefs: chefs ?? 0, plates: plts ?? 0, ratings: ratings ?? 0 };
  }

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
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      followingPlates = (data ?? []) as Plate[];
    }
  }

  let feedQuery = supabase
    .from("plates")
    .select("*, profiles(id, username, avatar_url)")
    .eq("status", "approved")
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
  let initialCommentMap: Record<string, import("@/lib/types").Comment[]> = {};
  let initialFollowingIds: string[] = [];
  let currentUserAvatar: string | null = null;
  let currentUsername: string | null = null;

  if (initialPlateIds.length > 0) {
    const commentsRes = await supabase
      .from("comments")
      .select("*, profiles(id, username, avatar_url)")
      .in("plate_id", initialPlateIds)
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .limit(initialPlateIds.length * 2);

    const allComments = (commentsRes.data ?? []) as import("@/lib/types").Comment[];
    for (const plateId of initialPlateIds) {
      initialCommentMap[plateId] = allComments
        .filter((c) => c.plate_id === plateId)
        .slice(0, 2)
        .reverse();
    }

    if (user) {
      const [likesRes, ratingsRes, profileRes, followsRes] = await Promise.all([
        supabase.from("likes").select("plate_id").eq("user_id", user.id).in("plate_id", initialPlateIds),
        supabase.from("ratings").select("plate_id, score").eq("user_id", user.id).in("plate_id", initialPlateIds),
        supabase.from("profiles").select("username, avatar_url").eq("id", user.id).single(),
        supabase.from("follows").select("following_id").eq("follower_id", user.id),
      ]);
      initialLikedIds = (likesRes.data ?? []).map((r) => r.plate_id);
      initialRatingMap = Object.fromEntries((ratingsRes.data ?? []).map((r) => [r.plate_id, r.score]));
      currentUserAvatar = profileRes.data?.avatar_url ?? null;
      currentUsername = profileRes.data?.username ?? null;
      initialFollowingIds = (followsRes.data ?? []).map((r) => r.following_id);
    }
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
          {/* Glow blobs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-gradient-to-b from-orange-600/25 via-rose-600/10 to-transparent blur-3xl" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 pt-14 pb-10 md:pt-20 md:pb-14">
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

              {/* LEFT — copy */}
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 border border-orange-500/30 bg-orange-500/10 text-orange-400 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                  <Sparkles className="w-3 h-3" /> AI Food Critic — Free
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-app leading-[0.92] tracking-tight mb-5">
                  Is your food<br />
                  <span className="text-fire">actually good?</span>
                </h1>

                <p className="text-base md:text-lg text-muted mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed">
                  Upload a photo of your plate. Get a brutally honest critique from our AI food critic. See how the community scores it. Takes 30 seconds.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link
                    href="/auth/signup"
                    className="group flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-7 py-4 rounded-2xl font-black text-base hover:from-orange-400 hover:to-rose-400 transition-all shadow-lg shadow-orange-500/25 active:scale-95"
                  >
                    <Flame className="w-5 h-5" />
                    Find Out — It&apos;s Free
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link
                    href="/auth/login"
                    className="flex items-center justify-center gap-2 border border-app-2 text-muted hover:border-orange-500/40 hover:text-orange-400 px-7 py-4 rounded-2xl font-semibold text-base transition-all"
                  >
                    Sign In
                  </Link>
                </div>

                {/* Live stats */}
                {heroStats.plates > 0 && (
                  <div className="flex flex-wrap gap-5 mt-8 justify-center lg:justify-start">
                    {[
                      { value: heroStats.chefs, label: "chefs", icon: <ChefHat className="w-4 h-4 text-violet-400" /> },
                      { value: heroStats.plates, label: "plates rated", icon: <TrendingUp className="w-4 h-4 text-orange-400" /> },
                      { value: heroStats.ratings, label: "community ratings", icon: <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> },
                    ].map(({ value, label, icon }) => (
                      <div key={label} className="flex items-center gap-2">
                        {icon}
                        <span className="text-sm font-black text-app">{value >= 1000 ? `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k` : value}</span>
                        <span className="text-xs text-faint">{label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT — AI critique demo card */}
              <div className="flex-shrink-0 w-full max-w-[320px] lg:max-w-[340px]">
                <div className="relative rounded-3xl border border-orange-500/20 bg-surface-1 overflow-hidden shadow-2xl shadow-orange-500/10">
                  {/* Plate image placeholder with gradient */}
                  <div className="relative h-44 bg-gradient-to-br from-amber-900/40 via-orange-900/30 to-rose-900/40 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-7xl select-none">🍝</span>
                    </div>
                    {/* Rating badge */}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-amber-500/30 rounded-2xl px-3 py-1.5 flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-black text-amber-400">8.4</span>
                      <span className="text-xs text-amber-400/60">/10</span>
                    </div>
                    {/* User tag */}
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-2.5 py-1 flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-[10px] font-black text-white">J</div>
                      <span className="text-xs font-bold text-white">@jamie_eats</span>
                    </div>
                  </div>

                  {/* AI critique */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">👨‍🍳</span>
                      </div>
                      <div>
                        <p className="text-xs font-black text-app">AI Food Critic</p>
                        <p className="text-[10px] text-faint">Gordon Ramsay mode</p>
                      </div>
                      <div className="ml-auto flex items-center gap-0.5">
                        {"★★★★☆".split("").map((s, i) => (
                          <span key={i} className={`text-xs ${s === "★" ? "text-amber-400" : "text-surface-2"}`}>{s}</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted leading-relaxed italic">
                      &ldquo;Finally — pasta cooked with some soul. The sauce clings beautifully, though I&apos;d lose the dried parsley. This is actually good. <strong className="text-orange-400 not-italic">8.4/10.</strong>&rdquo;
                    </p>
                    <div className="mt-3 flex items-center gap-3 pt-3 border-t border-app-1">
                      <div className="flex items-center gap-1 text-xs text-rose-400">
                        <Flame className="w-3.5 h-3.5 fill-rose-400" />
                        <span className="font-bold">24</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-faint">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>8 comments</span>
                      </div>
                      <div className="ml-auto text-[10px] font-bold bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full">
                        🔒 Sign up to rate
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating avatars below card — social proof */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="flex -space-x-2">
                    {["🧑‍🍳","👩‍🍳","👨‍🍳","🧑‍🍳","👩‍🍳"].map((emoji, i) => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-app bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-xs select-none">{emoji}</div>
                    ))}
                  </div>
                  <p className="text-xs text-faint"><span className="text-app font-bold">{heroStats.chefs > 0 ? `${heroStats.chefs.toLocaleString()}` : "Hundreds of"}</span> chefs already rated</p>
                </div>
              </div>
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
              initialCommentMap={initialCommentMap}
              initialFollowingIds={initialFollowingIds}
              currentUserAvatar={currentUserAvatar}
              currentUsername={currentUsername}
            />
          ) : (
            <div className="max-w-[680px] mx-auto py-10 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/20 rounded-3xl flex items-center justify-center mx-auto mb-5">
                <Users className="w-10 h-10 text-blue-400" />
              </div>
              <p className="text-xl font-black text-app mb-2">Your feed is empty</p>
              <p className="text-sm text-muted mb-8">Follow some chefs to see their plates here. Start with our top creators:</p>
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
            initialCommentMap={initialCommentMap}
            initialFollowingIds={initialFollowingIds}
            currentUserAvatar={currentUserAvatar}
            currentUsername={currentUsername}
          />
        ) : (
          <div className="max-w-[680px] mx-auto text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-500/20 to-rose-500/20 border border-orange-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <ChefHat className="w-12 h-12 text-orange-400" />
            </div>
            <p className="text-2xl font-black text-app mb-2">
              {activeCategory !== "all" ? `No ${activeCategory} plates yet` : "No plates yet"}
            </p>
            <p className="text-muted mb-2">
              {activeCategory !== "all"
                ? `Be the first to share a ${activeCategory} dish and get rated!`
                : "Be the first to share your food and get an honest AI rating."}
            </p>
            <p className="text-sm text-faint mb-8">It only takes 30 seconds.</p>
            <Link
              href={user ? "/upload" : "/auth/signup"}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-8 py-4 rounded-2xl font-black text-base hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/20"
            >
              <Upload className="w-5 h-5" />
              {user ? "Upload a Plate" : "Join & Upload Free"}
            </Link>
          </div>
        )}
      </div>

      {/* Sticky mobile CTA bar for guests */}
      {!user && (
        <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-nav/95 backdrop-blur-xl border-t border-nav safe-area-pb">
          <div className="px-4 pt-2.5 pb-3">
            <p className="text-center text-[11px] text-faint mb-2">👨‍🍳 What would the AI say about your cooking?</p>
            <div className="flex gap-2">
              <Link
                href="/auth/signup"
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-sm rounded-xl shadow-md shadow-orange-500/20"
              >
                <Flame className="w-4 h-4" /> Find Out Free
              </Link>
              <Link
                href="/auth/login"
                className="px-5 py-3 border border-app-2 text-muted font-semibold text-sm rounded-xl"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
