/* eslint-disable react/no-unescaped-entities */
import { requireAdmin } from "@/lib/admin";
import { FeaturedToggle } from "./FeaturedToggle";
import { SearchPlates } from "./SearchPlates";
import { Star, Sparkles, Home, TrendingUp, Award } from "lucide-react";

export const metadata = { title: "Featured Plates – Admin" };

const categoryIcons = {
  homepage: Home,
  trending: TrendingUp,
  editor_pick: Award,
};

export default async function FeaturedPlatesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const { supabase } = await requireAdmin();
  const searchQuery = searchParams.q?.trim() ?? "";

  // Get currently featured plates
  const { data: featured } = await supabase
    .from("featured_plates")
    .select(`
      id,
      plate_id,
      featured_at,
      expires_at,
      reason,
      position,
      category,
      is_active,
      plates (id, title, image_url, like_count, profiles (username))
    `)
    .eq("is_active", true)
    .order("position", { ascending: true })
    .order("featured_at", { ascending: false });

  // Search for plates if query provided
  let searchResults: { id: string; title: string; image_url: string; like_count: number; rating_count: number; profiles: { username: string } | null }[] | null = null;
  if (searchQuery.length >= 2) {
    const { data } = await supabase
      .from("plates")
      .select("id, title, image_url, like_count, rating_count, profiles(username)")
      .ilike("title", `%${searchQuery}%`)
      .order("like_count", { ascending: false })
      .limit(10);
    // Supabase returns profiles as an array from the foreign key relation
    searchResults = (data ?? []).map((p: any) => ({
      ...p,
      profiles: p.profiles?.[0] ?? null,
    }));
  }

  // Get all featured plate IDs for quick lookup
  const featuredIds = new Set((featured ?? []).map((f) => f.plate_id));

  // Group featured by category
  const byCategory: Record<string, typeof featured> = {};
  for (const f of featured ?? []) {
    const cat = f.category ?? "homepage";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(f);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-app">Featured Plates</h2>
          <p className="text-sm text-faint mt-1">Curate plates to highlight on the homepage and special sections</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-app">{featured?.length ?? 0}</p>
          <p className="text-xs text-faint">currently featured</p>
        </div>
      </div>

      {/* Search section */}
      <div className="bg-surface-1 border border-app-1 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-app mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Search & Feature Plates
        </h3>
        <SearchPlates initialQuery={searchQuery} results={searchResults} featuredIds={featuredIds} />
      </div>

      {/* Featured by category */}
      {Object.entries(byCategory).map(([category, items]) => {
        const Icon = categoryIcons[category as keyof typeof categoryIcons] ?? Star;
        if (!items || items.length === 0) return null;
        return (
          <div key={category} className="bg-surface-1 border border-app-1 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-app-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-app capitalize">{category.replace("_", " ")}</h3>
              </div>
              <span className="text-xs text-faint">{items.length} plates</span>
            </div>
            <div className="divide-y divide-app-1">
              {items.map((item) => {
                const plate = item.plates as any;
                return (
                  <div key={item.id} className="px-5 py-3 flex items-center gap-4">
                    <span className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-sm font-bold text-faint">
                      {item.position || "-"}
                    </span>
                    <div className="w-12 h-12 rounded-lg bg-surface-2 overflow-hidden flex-shrink-0">
                      {plate?.image_url && (
                        <img src={plate.image_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-app truncate">{plate?.title ?? "Unknown"}</p>
                      <p className="text-xs text-faint">
                        by @{plate?.profiles?.username ?? "?"} • {plate?.like_count ?? 0} likes
                      </p>
                      {item.reason && (
                        <p className="text-xs text-orange-400 mt-1">{item.reason}</p>
                      )}
                    </div>
                    <FeaturedToggle
                      plateId={item.plate_id}
                      isFeatured={true}
                      featuredId={item.id}
                      category={item.category}
                      position={item.position}
                      reason={item.reason}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {featured?.length === 0 && (
        <div className="text-center py-12 bg-surface-1 border border-app-1 rounded-2xl">
          <Star className="w-12 h-12 text-faint mx-auto mb-4" />
          <p className="text-app font-semibold">No featured plates yet</p>
          <p className="text-sm text-faint mt-1">Search above to find plates to feature</p>
        </div>
      )}
    </div>
  );
}
