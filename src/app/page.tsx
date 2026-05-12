import Link from "next/link";
import { Upload, Star, Users, Sparkles, TrendingUp, ChefHat } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PlateCard from "@/components/PlateCard";
import { Plate } from "@/lib/types";

export const revalidate = 60;

export default async function Home() {
  const supabase = await createClient();

  const { data: plates } = await supabase
    .from("plates")
    .select("*, profiles(id, username, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(24);

  const { data: topPlates } = await supabase
    .from("plates")
    .select("*, profiles(id, username, avatar_url)")
    .not("avg_user_rating", "is", null)
    .order("avg_user_rating", { ascending: false })
    .limit(3);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      {/* Hero */}
      {!user && (
        <section className="bg-gradient-to-br from-orange-50 via-white to-rose-50 border-b border-orange-100">
          <div className="max-w-4xl mx-auto px-4 py-20 text-center">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-powered food ratings
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              Show off your{" "}
              <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                best plates
              </span>
            </h1>
            <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload your meals, get instant AI critiques, and see how the
              community rates your cooking. Every plate tells a story.
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
                className="flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-2xl font-semibold text-lg hover:border-orange-300 hover:text-orange-500 transition-colors"
              >
                Browse Plates
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                AI Ratings
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Community Reviews
              </div>
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-green-400" />
                Food Critiques
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Top Rated */}
        {topPlates && topPlates.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-bold text-gray-900">Top Rated</h2>
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Latest Plates</h2>
            {user && (
              <Link
                href="/upload"
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity text-sm shadow-md"
              >
                <Upload className="w-4 h-4" />
                Upload
              </Link>
            )}
          </div>

          {plates && plates.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {plates.map((plate) => (
                <PlateCard key={plate.id} plate={plate as Plate} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 text-gray-400">
              <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No plates yet!</p>
              <p className="text-sm mt-1">Be the first to upload yours.</p>
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
