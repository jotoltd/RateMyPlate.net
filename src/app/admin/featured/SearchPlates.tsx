"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { FeaturedToggle } from "./FeaturedToggle";

interface Plate {
  id: string;
  title: string;
  image_url: string;
  like_count: number;
  rating_count: number;
  profiles: { username: string } | null;
}

export function SearchPlates({
  initialQuery,
  results,
  featuredIds,
}: {
  initialQuery: string;
  results: Plate[] | null;
  featuredIds: Set<string>;
}) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/admin/featured?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search plates by title..."
            className="w-full pl-9 pr-4 py-2.5 bg-surface-2 border border-app-1 rounded-xl text-app placeholder:text-faint text-sm focus:outline-none focus:border-orange-500/50"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Search
        </button>
      </form>

      {results && (
        <div className="border border-app-1 rounded-xl overflow-hidden divide-y divide-app-1">
          {results.length === 0 ? (
            <p className="p-4 text-sm text-faint text-center">No plates found</p>
          ) : (
            results.map((plate) => (
              <div key={plate.id} className="p-3 flex items-center gap-3 bg-surface-2/50">
                <div className="w-10 h-10 rounded-lg bg-surface-2 overflow-hidden flex-shrink-0">
                  {plate.image_url && (
                    <img src={plate.image_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-app truncate">{plate.title}</p>
                  <p className="text-xs text-faint">
                    @{plate.profiles?.username ?? "?"} • {plate.like_count} likes
                  </p>
                </div>
                <FeaturedToggle
                  plateId={plate.id}
                  isFeatured={featuredIds.has(plate.id)}
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
