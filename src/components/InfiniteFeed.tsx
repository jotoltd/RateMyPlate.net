"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";
import PlateCard from "@/components/PlateCard";
import FeedPost from "@/components/FeedPost";
import { PlateCardSkeleton } from "@/components/Skeleton";
import { Plate, Comment } from "@/lib/types";
import { loadMorePlates, loadFollowingFeed } from "@/app/actions/feed";
import { createClient } from "@/lib/supabase/client";
import GuestSignupNudge from "@/components/GuestSignupNudge";

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
  initialFollowingIds = [],
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
  initialCommentMap?: Record<string, Comment[]>;
  initialFollowingIds?: string[];
  currentUserAvatar?: string | null;
  currentUsername?: string | null;
}) {
  const [plates, setPlates] = useState<Plate[]>(initialPlates);
  const [likedIds, setLikedIds] = useState<string[]>(initialLikedIds);
  const [ratingMap, setRatingMap] = useState<Record<string, number>>(initialRatingMap);
  const [commentMap, setCommentMap] = useState<Record<string, Comment[]>>(initialCommentMap);
  const [followingIds] = useState<string[]>(initialFollowingIds);
  const [newPlateCount, setNewPlateCount] = useState(0);
  const [offset, setOffset] = useState(initialPlates.length);
  const [hasMore, setHasMore] = useState(initialPlates.length === PAGE_SIZE);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    if (isPending || !hasMore) return;
    startTransition(async () => {
      const batch =
        mode === "following"
          ? await loadFollowingFeed(offset, PAGE_SIZE)
          : await loadMorePlates(offset, PAGE_SIZE, category);
      if (batch.plates.length < PAGE_SIZE) setHasMore(false);
      setPlates((prev) => [...prev, ...batch.plates]);
      setLikedIds((prev) => [...prev, ...batch.likedIds]);
      setRatingMap((prev) => ({ ...prev, ...batch.ratingMap }));
      setCommentMap((prev) => ({ ...prev, ...batch.commentMap }));
      setOffset((prev) => prev + batch.plates.length);
      // followingIds don't change on loadMore — user's follows are stable
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

  // Realtime: notify when new plates are uploaded
  useEffect(() => {
    if (variant !== "feed" || mode === "following") return;
    const supabase = createClient();
    const channel = supabase
      .channel("feed-new-plates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "plates" }, () => {
        setNewPlateCount((n) => n + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [variant, mode]);

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

  function handleRefresh() {
    setNewPlateCount(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.location.reload();
  }

  return (
    <div className="max-w-[680px] mx-auto space-y-4">
      {newPlateCount > 0 && (
        <button
          onClick={handleRefresh}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-2xl text-sm font-bold hover:bg-orange-500/20 transition-all animate-in fade-in slide-in-from-top-2"
        >
          <ArrowUp className="w-4 h-4" />
          {newPlateCount} new {newPlateCount === 1 ? "plate" : "plates"} — tap to refresh
        </button>
      )}
      {plates.map((plate, idx) => (
        <div key={plate.id}>
          <FeedPost
            plate={plate}
            userId={userId}
            initialLiked={likedIds.includes(plate.id)}
            initialRating={ratingMap[plate.id] ?? null}
            initialComments={commentMap[plate.id] ?? []}
            initialFollowing={followingIds.includes(plate.user_id ?? "")}
            currentUserAvatar={currentUserAvatar}
            currentUsername={currentUsername}
          />
          {idx === 2 && !userId && <GuestSignupNudge context="feed" />}
        </div>
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
