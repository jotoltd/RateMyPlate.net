"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Heart, MessageSquare, CheckCircle2, Eye } from "lucide-react";
import { Plate } from "@/lib/types";
import { scoreToStars, starsToScore, formatDate } from "@/lib/utils";
import { imgUrl } from "@/lib/imageUrl";
import { toggleLike } from "@/app/actions/likes";
import { submitRating } from "@/app/actions/plates";

type FeedPostProps = {
  plate: Plate;
  initialLiked?: boolean;
  initialRating?: number | null; // stored score (1-10)
  userId?: string | null;
};

const STAR_LABELS = ["", "Poor 😬", "Okay 😐", "Good 👍", "Great 🔥", "Exceptional ✨"];

export default function FeedPost({ plate, initialLiked = false, initialRating = null, userId }: FeedPostProps) {
  const rawRating = plate.avg_user_rating ?? plate.ai_rating ?? null;
  const displayStars = rawRating !== null ? scoreToStars(rawRating) : null;
  const initial = (plate.profiles?.username ?? "C")[0].toUpperCase();
  const isOwn = userId === plate.user_id;

  // Like state
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(plate.like_count ?? 0);
  const [likePending, startLikeTransition] = useTransition();

  // Rating state
  const [hoverStar, setHoverStar] = useState(0);
  const [myRating, setMyRating] = useState<number | null>(
    initialRating !== null ? scoreToStars(initialRating) : null
  );
  const [ratingDone, setRatingDone] = useState(initialRating !== null);
  const [ratingPending, startRatingTransition] = useTransition();
  const [ratingError, setRatingError] = useState("");

  function handleLike() {
    if (!userId) return;
    startLikeTransition(async () => {
      setLiked((p) => !p);
      setLikeCount((p) => (liked ? p - 1 : p + 1));
      await toggleLike(plate.id, plate.user_id);
    });
  }

  function handleRate(star: number) {
    if (!userId || isOwn) return;
    setMyRating(star);
    setRatingError("");
    startRatingTransition(async () => {
      const res = await submitRating(plate.id, starsToScore(star), "");
      if (res?.error) {
        setRatingError(res.error);
        setRatingDone(false);
      } else {
        setRatingDone(true);
      }
    });
  }

  const activeStar = hoverStar || myRating || 0;

  return (
    <article className="bg-surface-1 border border-app-1 rounded-3xl overflow-hidden hover:border-orange-500/20 transition-all">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Link href={`/profile/${plate.profiles?.id}`} className="flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 overflow-hidden flex items-center justify-center">
            {plate.profiles?.avatar_url ? (
              <Image src={plate.profiles.avatar_url} alt={initial} width={40} height={40} className="object-cover w-full h-full" />
            ) : (
              <span className="text-white font-black text-sm">{initial}</span>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${plate.profiles?.id}`} className="font-bold text-app text-sm hover:text-orange-400 transition-colors">
            @{plate.profiles?.username ?? "chef"}
          </Link>
          <p className="text-xs text-faint">{formatDate(plate.created_at)}</p>
        </div>
        {plate.category && plate.category !== "other" && (
          <span className="px-2.5 py-1 rounded-xl bg-orange-500/10 text-orange-400 text-[11px] font-bold uppercase tracking-wide flex-shrink-0">
            {plate.category}
          </span>
        )}
      </div>

      {/* Title */}
      <div className="px-4 pb-3">
        <Link href={`/plate/${plate.id}`}>
          <h2 className="font-bold text-app text-base leading-snug hover:text-orange-400 transition-colors">
            {plate.title}
          </h2>
        </Link>
        {plate.description && (
          <p className="text-sm text-muted mt-1 line-clamp-2">{plate.description}</p>
        )}
      </div>

      {/* Image */}
      <Link href={`/plate/${plate.id}`} className="block relative w-full" style={{ aspectRatio: "4/3" }}>
        <Image
          src={imgUrl(plate.image_url, { width: 720, quality: 85 })}
          alt={plate.title}
          fill
          className="object-cover"
          sizes="(max-width: 680px) 100vw, 680px"
        />
        {displayStars !== null && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-xl px-2.5 py-1.5 shadow-lg">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-sm font-black text-white leading-none">{displayStars.toFixed(1)}</span>
            <span className="text-xs text-white/50">/5</span>
          </div>
        )}
      </Link>

      {/* Action bar */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-3">
        {/* Like */}
        {userId ? (
          <button
            onClick={handleLike}
            disabled={likePending}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
              liked ? "bg-rose-500/15 text-rose-400" : "bg-surface-2 text-muted hover:text-rose-400 hover:bg-rose-500/10"
            }`}
          >
            <Heart className={`w-4 h-4 transition-all ${liked ? "fill-rose-500 text-rose-500 scale-110" : ""}`} />
            <span>{likeCount > 0 ? likeCount : ""}</span>
          </button>
        ) : (
          <Link href="/auth/login" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-surface-2 text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-all">
            <Heart className="w-4 h-4" />
            <span>{likeCount > 0 ? likeCount : ""}</span>
          </Link>
        )}

        {/* Inline rating stars */}
        {!isOwn && (
          <div className="flex items-center gap-1 ml-1">
            {ratingDone && !ratingPending ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-2 py-1 bg-emerald-500/10 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {myRating}/5
              </span>
            ) : (
              <>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    disabled={ratingPending || !userId}
                    onClick={() => handleRate(s)}
                    onMouseEnter={() => userId && setHoverStar(s)}
                    onMouseLeave={() => setHoverStar(0)}
                    className="p-0.5 disabled:cursor-default transition-transform hover:scale-125 active:scale-110"
                    title={userId ? STAR_LABELS[s] : "Sign in to rate"}
                  >
                    <Star
                      className={`w-5 h-5 transition-colors ${
                        s <= activeStar
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted fill-none"
                      }`}
                    />
                  </button>
                ))}
                {hoverStar > 0 && (
                  <span className="text-xs text-amber-400 font-semibold ml-1 whitespace-nowrap">{STAR_LABELS[hoverStar]}</span>
                )}
                {!userId && (
                  <Link href="/auth/login" className="text-xs text-faint ml-1 hover:text-orange-400 transition-colors whitespace-nowrap">
                    Sign in to rate
                  </Link>
                )}
              </>
            )}
          </div>
        )}

        {/* Comments link — rightmost */}
        <Link
          href={`/plate/${plate.id}#comments`}
          className="ml-auto flex items-center gap-1.5 text-sm text-faint hover:text-orange-400 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Comments</span>
        </Link>

        {(plate.view_count ?? 0) > 0 && (
          <span className="flex items-center gap-1 text-xs text-faintest">
            <Eye className="w-3.5 h-3.5" />
            {plate.view_count}
          </span>
        )}
      </div>

      {ratingError && (
        <p className="px-4 pb-3 text-xs text-red-400">{ratingError}</p>
      )}

      {/* Rating count summary */}
      {(plate.rating_count ?? 0) > 0 && (
        <p className="px-4 pb-3 text-xs text-faint">
          {plate.rating_count} {plate.rating_count === 1 ? "rating" : "ratings"}
          {displayStars !== null && <> · avg {displayStars.toFixed(1)}/5</>}
        </p>
      )}
    </article>
  );
}
