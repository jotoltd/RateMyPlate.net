"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import PlateCard from "@/components/PlateCard";
import FeedPost from "@/components/FeedPost";
import { PlateCardSkeleton } from "@/components/Skeleton";
import { Plate } from "@/lib/types";
import { loadMorePlates, loadFollowingFeed } from "@/app/actions/feed";

const PAGE_SIZE = 12;

export default function InfiniteFeed({
  initialPlates,
  category,
  mode = "all",
  variant = "feed",
  userId,
  initialLikedIds = [],
  initialRatingMap = {},
  initialCommentMap = {},
  currentUserAvatar,
  currentUsername,
}: {
  initialPlates: Plate[];
  category?: string;
  mode?: "all" | "following";
  variant?: "feed" | "grid";
  userId?: string | null;
  initialLikedIds?: string[];
  initialRatingMap?: Record<string, number>;
  initialCommentMap?: Record<string, import("@/lib/types").Comment[]>;
  currentUserAvatar?: string | null;
  currentUsername?: string | null;
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

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (variant === "grid") {
    return (
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {plates.map((plate) => <PlateCard key={plate.id} plate={plate} />)}
          {isPending && Array.from({ length: 4 }).map((_, i) => <PlateCardSkeleton key={`sk-${i}`} />)}
        </div>
        {hasMore && <div ref={sentinelRef} className="h-4 mt-8" />}
        {!hasMore && plates.length > 0 && (
          <p className="text-center text-sm text-faint mt-10">You&apos;ve seen all the plates!</p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[680px] mx-auto space-y-4">
      {plates.map((plate) => (
      <FeedPost
        key={plate.id}
        plate={plate}
        userId={userId}
        initialLiked={initialLikedIds.includes(plate.id)}
        initialRating={initialRatingMap[plate.id] ?? null}
        initialComments={initialCommentMap[plate.id] ?? []}
        currentUserAvatar={currentUserAvatar}
        currentUsername={currentUsername}
      />
    ))}
      {isPending && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`sk-${i}`} className="bg-surface-1 border border-app-1 rounded-3xl overflow-hidden animate-pulse">
              <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-surface-2" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-24 bg-surface-2 rounded-lg" />
                  <div className="h-3 w-16 bg-surface-2 rounded-lg" />
                </div>
              </div>
              <div className="px-4 pb-3 space-y-1.5">
                <div className="h-4 w-3/4 bg-surface-2 rounded-lg" />
                <div className="h-3 w-1/2 bg-surface-2 rounded-lg" />
              </div>
              <div className="w-full bg-surface-2" style={{ aspectRatio: "4/3" }} />
              <div className="flex gap-4 px-4 py-3 border-t border-app-1">
                <div className="h-3.5 w-12 bg-surface-2 rounded-lg" />
                <div className="h-3.5 w-16 bg-surface-2 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}
      {hasMore && <div ref={sentinelRef} className="h-4" />}
      {!hasMore && plates.length > 0 && (
        <p className="text-center text-sm text-faint py-10">You&apos;ve seen all the plates! 🍽️</p>
      )}
    </div>
  );
}
