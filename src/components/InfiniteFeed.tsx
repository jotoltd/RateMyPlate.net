"use client";

import { useState, useTransition, useCallback } from "react";
import PlateCard from "@/components/PlateCard";
import { PlateCardSkeleton } from "@/components/Skeleton";
import { Plate } from "@/lib/types";
import { loadMorePlates } from "@/app/actions/feed";

const PAGE_SIZE = 12;

export default function InfiniteFeed({
  initialPlates,
  category,
}: {
  initialPlates: Plate[];
  category?: string;
}) {
  const [plates, setPlates] = useState<Plate[]>(initialPlates);
  const [offset, setOffset] = useState(initialPlates.length);
  const [hasMore, setHasMore] = useState(initialPlates.length === PAGE_SIZE);
  const [isPending, startTransition] = useTransition();

  const loadMore = useCallback(() => {
    startTransition(async () => {
      const more = await loadMorePlates(offset, PAGE_SIZE, category);
      if (more.length < PAGE_SIZE) setHasMore(false);
      setPlates((prev) => [...prev, ...more]);
      setOffset((prev) => prev + more.length);
    });
  }, [offset, category]);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {plates.map((plate) => (
          <PlateCard key={plate.id} plate={plate} />
        ))}
        {isPending &&
          Array.from({ length: 4 }).map((_, i) => <PlateCardSkeleton key={`sk-${i}`} />)}
      </div>

      {hasMore && !isPending && (
        <div className="flex justify-center mt-10">
          <button
            onClick={loadMore}
            className="px-8 py-3 rounded-2xl border-2 border-orange-200 text-orange-500 font-semibold hover:bg-orange-50 hover:border-orange-400 transition-all"
          >
            Load more plates
          </button>
        </div>
      )}

      {!hasMore && plates.length > PAGE_SIZE && (
        <p className="text-center text-sm text-gray-400 mt-10">You&apos;ve seen all the plates!</p>
      )}
    </div>
  );
}
