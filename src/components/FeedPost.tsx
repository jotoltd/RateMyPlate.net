"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Heart, MessageSquare, CheckCircle2, Eye, Send, UserPlus, UserCheck, Trash2, Share2, Check } from "lucide-react";
import { Plate, Comment } from "@/lib/types";
import { scoreToStars, starsToScore, formatDate } from "@/lib/utils";
import { imgUrl } from "@/lib/imageUrl";
import { toggleLike } from "@/app/actions/likes";
import { submitRating } from "@/app/actions/plates";
import { addComment, deleteComment } from "@/app/actions/comments";
import { toggleFollow } from "@/app/actions/follows";
import { useToast } from "@/components/ToastProvider";

type FeedPostProps = {
  plate: Plate;
  initialLiked?: boolean;
  initialRating?: number | null;
  userId?: string | null;
  initialComments?: Comment[];
  currentUserAvatar?: string | null;
  currentUsername?: string | null;
  initialFollowing?: boolean;
};

const STAR_LABELS = ["", "Poor 😬", "Okay 😐", "Good 👍", "Great 🔥", "Exceptional ✨"];

export default function FeedPost({ plate, initialLiked = false, initialRating = null, userId, initialComments = [], currentUserAvatar, currentUsername, initialFollowing = false }: FeedPostProps) {
  const { toast } = useToast();
  const rawRating = plate.avg_user_rating ?? plate.ai_rating ?? null;
  const displayStars = rawRating !== null ? scoreToStars(rawRating) : null;
  const initial = (plate.profiles?.username ?? "C")[0].toUpperCase();
  const isOwn = userId === plate.user_id;

  // Like state
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(plate.like_count ?? 0);
  const [likePending, startLikeTransition] = useTransition();

  // Comments state
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentBody, setCommentBody] = useState("");
  const [commentFocused, setCommentFocused] = useState(false);
  const [commentPending, startCommentTransition] = useTransition();
  const [commentError, setCommentError] = useState("");
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [, startDeleteTransition] = useTransition();

  // Share/copy state
  const [copied, setCopied] = useState(false);

  function handleDeleteComment(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    startDeleteTransition(async () => {
      await deleteComment(commentId, plate.id);
    });
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/plate/${plate.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast("Link copied!", "success");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleComment(e: React.FormEvent) {
    e.preventDefault();
    const text = commentBody.trim();
    if (!text || !userId) return;
    setCommentError("");
    const optimistic: Comment = {
      id: `temp-${Date.now()}`,
      plate_id: plate.id,
      user_id: userId,
      parent_id: null,
      body: text,
      created_at: new Date().toISOString(),
      like_count: 0,
      profiles: { id: userId, username: currentUsername ?? "you", avatar_url: currentUserAvatar ?? null, bio: null, created_at: new Date().toISOString() },
      replies: [],
    };
    setComments((prev) => [...prev, optimistic]);
    setCommentBody("");
    setCommentFocused(false);
    startCommentTransition(async () => {
      const res = await addComment(plate.id, text, null);
      if (res?.error) {
        setCommentError(res.error);
        setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
        setCommentBody(text);
        toast(res.error, "error");
      }
    });
  }

  // Rating state
  const [hoverStar, setHoverStar] = useState(0);
  const [myRating, setMyRating] = useState<number | null>(
    initialRating !== null ? scoreToStars(initialRating) : null
  );
  const [ratingDone, setRatingDone] = useState(initialRating !== null);
  const [ratingPending, startRatingTransition] = useTransition();
  const [ratingError, setRatingError] = useState("");

  // Follow state
  const isOwner = userId === plate.user_id;
  const [following, setFollowing] = useState(initialFollowing);
  const [followPending, startFollowTransition] = useTransition();

  function handleFollow() {
    if (!userId || isOwner) return;
    startFollowTransition(async () => {
      const next = !following;
      setFollowing(next);
      await toggleFollow(plate.user_id);
      toast(next ? `Following @${plate.profiles?.username}` : `Unfollowed @${plate.profiles?.username}`);
    });
  }

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
        toast(res.error, "error");
      } else {
        setRatingDone(true);
        toast("Rating saved!");
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
        {userId && !isOwner && (
          <button
            onClick={handleFollow}
            disabled={followPending}
            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all disabled:opacity-50 ${
              following
                ? "bg-surface-2 text-faint hover:bg-red-500/10 hover:text-red-400"
                : "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
            }`}
          >
            {following ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
            {following ? "Following" : "Follow"}
          </button>
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

        {/* Share / copy link */}
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1 text-xs text-faint hover:text-orange-400 transition-colors"
          title="Copy link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
        </button>

        {(plate.view_count ?? 0) > 0 && (
          <span className="flex items-center gap-1 text-xs text-faintest">
            <Eye className="w-3.5 h-3.5" />
            {plate.view_count}
          </span>
        )}
      </div>

      {ratingError && (
        <p className="px-4 pb-2 text-xs text-red-400">{ratingError}</p>
      )}

      {/* Rating count summary */}
      {(plate.rating_count ?? 0) > 0 && (
        <p className="px-4 pb-2 text-xs text-faint">
          {plate.rating_count} {plate.rating_count === 1 ? "rating" : "ratings"}
          {displayStars !== null && <> · avg {displayStars.toFixed(1)}/5</>}
        </p>
      )}

      {/* ── Inline comments (Facebook-style) ── */}
      <div className="border-t border-app-1 px-4 pt-3 pb-3">
        {/* Preview: last 2 comments */}
        {comments.length > 0 && (
          <div className="space-y-2 mb-3">
            {comments.length > 2 && (
              <Link
                href={`/plate/${plate.id}#comments`}
                className="text-xs font-semibold text-faint hover:text-orange-400 transition-colors"
              >
                View all {comments.length} comments
              </Link>
            )}
            {comments.slice(-2).map((c) => {
              const uname = c.profiles?.username ?? "user";
              const isOwnComment = userId && c.user_id === userId;
              return (
                <div key={c.id} className="flex items-start gap-2 group/comment">
                  <div className="w-6 h-6 flex-shrink-0 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 overflow-hidden">
                    {c.profiles?.avatar_url ? (
                      <Image src={c.profiles.avatar_url} alt={uname} width={24} height={24} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white text-[9px] font-black">{uname[0].toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-surface-2 rounded-2xl px-3 py-1.5 text-xs text-app flex-1 min-w-0">
                    <span className="font-semibold text-app">{uname} </span>
                    <span className="text-muted break-words">{c.body}</span>
                  </div>
                  {isOwnComment && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="opacity-0 group-hover/comment:opacity-100 p-1 rounded-lg text-faint hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                      title="Delete comment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Input bar */}
        {userId ? (
          <form onSubmit={handleComment} className="flex items-center gap-2">
            <div className="w-7 h-7 flex-shrink-0 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 overflow-hidden">
              {currentUserAvatar ? (
                <Image src={currentUserAvatar} alt="you" width={28} height={28} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-black">{(currentUsername ?? "?")[0].toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="flex-1 relative">
              <input
                ref={commentInputRef}
                type="text"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                onFocus={() => setCommentFocused(true)}
                onBlur={() => { if (!commentBody.trim()) setCommentFocused(false); }}
                placeholder="Write a comment…"
                maxLength={500}
                className="w-full bg-surface-2 border border-app-1 rounded-full px-4 py-1.5 text-sm text-app placeholder-faint focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all pr-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleComment(e as unknown as React.FormEvent);
                  }
                }}
              />
              {(commentFocused || commentBody.trim()) && (
                <button
                  type="submit"
                  disabled={commentPending || !commentBody.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-orange-400 hover:text-orange-500 disabled:opacity-30 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        ) : (
          <Link
            href="/auth/login"
            className="flex items-center gap-2 text-xs text-faint hover:text-orange-400 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Sign in to comment
          </Link>
        )}
        {commentError && <p className="text-xs text-red-400 mt-1 pl-9">{commentError}</p>}
      </div>
    </article>
  );
}
