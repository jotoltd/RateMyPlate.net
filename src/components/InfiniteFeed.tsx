"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import PlateCard from "@/components/PlateCard";
import { PlateCardSkeleton } from "@/components/Skeleton";
import { Plate } from "@/lib/types";
import { loadMorePlates, loadFollowingFeed } from "@/app/actions/feed";

const PAGE_SIZE = 12;

export default function InfiniteFeed({
  initialPlates,
  category,
  mode = "all",
}: {
  initialPlates: Plate[];
  category?: string;
  mode?: "all" | "following";
}) {
  const [plates, setPlates] = useState<Plate[]>(initialPlates);
  const [offset, setOffset] = useState(initialPlates.length);
  const [hasMore, setHasMore] = useState(initialPlates.length === PAGE_SIZE);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    if (isPending || !hasMore) return;
    startTransition(async () => {
      const more =
        mode === "following"
          ? await loadFollowingFeed(offset, PAGE_SIZE)
          : await loadMorePlates(offset, PAGE_SIZE, category);
      if (more.length < PAGE_SIZE) setHasMore(false);
      setPlates((prev) => [...prev, ...more]);
      setOffset((prev) => prev + more.length);
    });
  }, [offset, category, mode, isPending, hasMore]);

  // Auto-trigger when sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {plates.map((plate) => (
          <PlateCard key={plate.id} plate={plate} />
        ))}
        {isPending &&
          Array.from({ length: 4 }).map((_, i) => <PlateCardSkeleton key={`sk-${i}`} />)}
      </div>

      {/* Invisible sentinel for auto-loading */}
      {hasMore && <div ref={sentinelRef} className="h-4 mt-8" />}

      {!hasMore && plates.length > 0 && (
        <p className="text-center text-sm text-gray-400 mt-10">You&apos;ve seen all the plates!</p>
      )}
    </div>
  );
}
