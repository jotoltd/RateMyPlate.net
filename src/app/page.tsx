import Link from "next/link";
import { Upload, Star, Users, Sparkles, TrendingUp, ChefHat, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PlateCard from "@/components/PlateCard";
import InfiniteFeed from "@/components/InfiniteFeed";
import { Plate, CATEGORIES } from "@/lib/types";

const PAGE_SIZE = 12;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory = category && CATEGORIES.includes(category as never) ? category : "all";

  const supabase = await createClient();

  let feedQuery = supabase
    .from("plates")
    .select("*, profiles(id, username, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (activeCategory !== "all") {
    feedQuery = feedQuery.eq("category", activeCategory);
  }

  const [{ data: plates }, { data: topPlates }, { data: { user } }] = await Promise.all([
    feedQuery,
    supabase
      .from("plates")
      .select("*, profiles(id, username, avatar_url)")
      .not("avg_user_rating", "is", null)
      .order("avg_user_rating", { ascending: false })
      .limit(3),
    supabase.auth.getUser(),
  ]);

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
              <div className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /> Community Reviews</div>
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
        </div>

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

          {/* Category filter tabs */}
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

          {plates && plates.length > 0 ? (
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
