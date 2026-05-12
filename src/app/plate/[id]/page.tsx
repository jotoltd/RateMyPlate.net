import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Star,
  User,
  Calendar,
  MessageSquare,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import RatingForm from "@/components/RatingForm";
import StarRating from "@/components/StarRating";
import CommentSection from "@/components/CommentSection";
import LikeButton from "@/components/LikeButton";
import ShareButton from "@/components/ShareButton";
import EditPlateModal from "@/components/EditPlateModal";
import DeletePlateButton from "@/components/DeletePlateButton";
import { formatDate, getStarLabel, scoreToStars } from "@/lib/utils";
import { Comment } from "@/lib/types";
import PlateImageWithLightbox from "@/components/PlateImageWithLightbox";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: plate } = await supabase
    .from("plates")
    .select("title, description, image_url, ai_rating, avg_user_rating, profiles(username)")
    .eq("id", id)
    .single();

  if (!plate) return { title: "Plate Not Found" };

  const rating = plate.avg_user_rating ?? plate.ai_rating;
  const prof = plate.profiles as unknown as { username: string } | null;
  const description = plate.description
    ? plate.description
    : `Rated ${rating ? `${Number(rating).toFixed(1)}/10` : "on"} Rate My Plate by @${prof?.username ?? "a chef"}`;

  return {
    title: `${plate.title} – Rate My Plate`,
    description,
    openGraph: {
      title: plate.title,
      description,
      images: [{ url: plate.image_url, width: 1200, height: 630, alt: plate.title }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: plate.title,
      description,
      images: [plate.image_url],
    },
  };
}

export default async function PlatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: plate } = await supabase
    .from("plates")
    .select("*, profiles(id, username, avatar_url)")
    .eq("id", id)
    .single();

  if (!plate) notFound();

  const { data: ratings } = await supabase
    .from("ratings")
    .select("*, profiles(id, username)")
    .eq("plate_id", id)
    .order("created_at", { ascending: false });

  const { data: comments } = await supabase
    .from("comments")
    .select("*, profiles(id, username)")
    .eq("plate_id", id)
    .order("created_at", { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userLike = user
    ? await supabase
        .from("likes")
        .select("id")
        .eq("plate_id", id)
        .eq("user_id", user.id)
        .single()
    : null;

  const existingRating = user
    ? ratings?.find((r) => r.user_id === user.id) ?? null
    : null;

  const displayRating = plate.avg_user_rating ?? plate.ai_rating;
  const displayStars = displayRating ? scoreToStars(displayRating) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to feed
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image with lightbox */}
        <PlateImageWithLightbox src={plate.image_url} alt={plate.title}>
          {displayStars !== null && (
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl px-3 py-2 flex items-center gap-1.5 shadow-xl pointer-events-none">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-base font-bold text-gray-900">
                {displayStars.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400">/5</span>
            </div>
          )}
        </PlateImageWithLightbox>

        {/* Info */}
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
              {plate.title}
            </h1>
            {plate.description && (
              <p className="text-gray-500 text-base leading-relaxed">
                {plate.description}
              </p>
            )}
          </div>

          {/* Owner actions */}
          {user && user.id === plate.user_id && (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <EditPlateModal
                plateId={plate.id}
                initialTitle={plate.title}
                initialDescription={plate.description ?? ""}
              />
              <DeletePlateButton plateId={plate.id} />
            </div>
          )}

        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <Link
                href={`/profile/${plate.profiles?.id}`}
                className="font-medium text-gray-700 hover:text-orange-500"
              >
                {plate.profiles?.username ?? "Chef"}
              </Link>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(plate.created_at)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              <span>
                {plate.rating_count ?? 0} rating
                {(plate.rating_count ?? 0) !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* AI Rating */}
          {plate.ai_rating !== null && (
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-100 dark:border-violet-800 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-violet-800 dark:text-violet-300 text-sm">AI Critic</p>
                  <p className="text-xs text-violet-500">Gemini Vision</p>
                </div>
                <div className="ml-auto flex items-baseline gap-0.5">
                  <span className="text-3xl font-black text-violet-700 dark:text-violet-300">{scoreToStars(plate.ai_rating).toFixed(1)}</span>
                  <span className="text-sm text-violet-400">/5</span>
                </div>
              </div>
              <StarRating value={scoreToStars(plate.ai_rating)} readonly size="sm" />
              {plate.ai_comment && (
                <p className="text-sm text-violet-700 dark:text-violet-300 mt-3 leading-relaxed italic border-l-2 border-violet-200 pl-3">
                  &quot;{plate.ai_comment}&quot;
                </p>
              )}
            </div>
          )}

          {/* Community Rating */}
          {plate.avg_user_rating !== null && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                  <Star className="w-4 h-4 text-white fill-white" />
                </div>
                <div>
                  <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">Community</p>
                  <p className="text-xs text-amber-500">{plate.rating_count ?? 0} review{(plate.rating_count ?? 0) !== 1 ? "s" : ""}</p>
                </div>
                <div className="ml-auto flex items-baseline gap-0.5">
                  <span className="text-3xl font-black text-amber-700 dark:text-amber-300">{scoreToStars(plate.avg_user_rating).toFixed(1)}</span>
                  <span className="text-sm text-amber-400">/5</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StarRating value={scoreToStars(plate.avg_user_rating)} readonly size="sm" />
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {getStarLabel(scoreToStars(plate.avg_user_rating))}
                </span>
              </div>
            </div>
          )}

          {/* Rate it */}
          {user && user.id !== plate.user_id && (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                {existingRating ? "Update Your Rating" : "Rate This Plate"}
              </h3>
              <p className="text-xs text-gray-400 mb-4">Your opinion matters</p>
              <RatingForm
                plateId={plate.id}
                existingRating={existingRating}
              />
            </div>
          )}

          {/* Like + Share */}
          <div className="flex items-center gap-2 pt-1">
            <LikeButton
              plateId={plate.id}
              ownerId={plate.user_id}
              initialCount={plate.like_count ?? 0}
              initialLiked={userLike?.data != null}
            />
            <ShareButton title={plate.title} />
          </div>

          {!user && (
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 text-center">
              <p className="text-gray-600 text-sm mb-3">
                Sign in to rate this plate
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity text-sm shadow-md"
              >
                Sign In to Rate
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      {ratings && ratings.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Community Reviews ({ratings.length})
          </h2>
          <div className="space-y-4">
            {ratings.map((rating) => (
              <div
                key={rating.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-rose-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {(rating.profiles?.username ?? "U")[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <Link
                        href={`/profile/${rating.user_id}`}
                        className="font-semibold text-gray-800 text-sm hover:text-orange-500"
                      >
                        {rating.profiles?.username ?? "User"}
                      </Link>
                      <p className="text-xs text-gray-400">
                        {formatDate(rating.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1.5 rounded-xl">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                      {scoreToStars(rating.score).toFixed(1)}
                    </span>
                    <span className="text-xs text-amber-400">/5</span>
                  </div>
                </div>
                {rating.comment && (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {rating.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Comments */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mt-10">
        <CommentSection
          plateId={plate.id}
          comments={(comments ?? []) as Comment[]}
          currentUserId={user?.id ?? null}
        />
      </div>
    </div>
  );
}
