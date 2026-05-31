/* eslint-disable react/no-unescaped-entities */
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
import GuestSignupNudge from "@/components/GuestSignupNudge";
import { formatDate, getStarLabel, scoreToStars } from "@/lib/utils";
import { Comment, Plate } from "@/lib/types";
import PlateImageWithLightbox from "@/components/PlateImageWithLightbox";
import SaveButton from "@/components/SaveButton";
import ViewCounter from "@/components/ViewCounter";
import AddToCollectionButton from "@/components/AddToCollectionButton";
import PlateCard from "@/components/PlateCard";
import ReportButton from "@/components/ReportButton";

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
  const ratingStars = rating ? Math.round((Number(rating) / 10) * 5 * 2) / 2 : null;
  const description = plate.description
    ? plate.description
    : `Rated ${ratingStars ? `${ratingStars.toFixed(1)}/5 stars` : "on"} Rate My Plate by @${prof?.username ?? "a chef"}`;

  const ogImageUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://ratemyplate.net"}/plate/${id}/opengraph-image`;

  return {
    title: `${plate.title} – Rate My Plate`,
    description,
    openGraph: {
      title: plate.title,
      description,
      siteName: "Rate My Plate",
      type: "article",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: plate.title }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@ratemyplate",
      title: plate.title,
      description,
      images: [ogImageUrl],
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: myRatingRow } = user
    ? await supabase
        .from("ratings")
        .select("id, score, comment, created_at, user_id")
        .eq("plate_id", id)
        .eq("user_id", user.id)
        .single()
    : { data: null };

  const { data: comments } = await supabase
    .from("comments")
    .select("*, profiles(id, username)")
    .eq("plate_id", id)
    .order("created_at", { ascending: true });

  const userLike = user
    ? await supabase
        .from("likes")
        .select("id")
        .eq("plate_id", id)
        .eq("user_id", user.id)
        .single()
    : null;

  const existingRating = myRatingRow ?? null;

  const savedCheck = user
    ? await supabase.from("saved_plates").select("id").eq("user_id", user.id).eq("plate_id", id).single()
    : null;
  const initialSaved = !!savedCheck?.data;

  // User's collections for Add to Collection button
  const userCollections = user ? await supabase
    .from("collections")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .then(({ data }) => data ?? []) : [];

  // Related plates: same category, exclude current
  const { data: relatedRaw } = await supabase
    .from("plates")
    .select("*, profiles(id, username, avatar_url)")
    .eq("category", plate.category)
    .neq("id", id)
    .order("like_count", { ascending: false })
    .limit(4);
  const relatedPlates = (relatedRaw ?? []) as Plate[];

  const displayRating = plate.avg_user_rating ?? plate.ai_rating;
  const displayStars = displayRating ? scoreToStars(displayRating) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": plate.title,
    "description": plate.description ?? `A plate rated on Rate My Plate by @${plate.profiles?.username ?? "a chef"}`,
    "image": [plate.image_url],
    "author": { "@type": "Person", "name": plate.profiles?.username ?? "Chef" },
    "datePublished": plate.created_at,
    ...(plate.category ? { "recipeCategory": plate.category } : {}),
    ...(displayStars !== null && plate.rating_count > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": displayStars.toFixed(1),
        "bestRating": "5",
        "worstRating": "1",
        "ratingCount": plate.rating_count,
      }
    } : {}),
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-faint hover:text-orange-400 transition-colors mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to feed
      </Link>

      {/* Pending review notice — only visible to owner */}
      {user && user.id === plate.user_id && plate.status === "pending" && (
        <div className="mb-6 flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
          <span className="text-amber-400 text-lg mt-0.5">⏳</span>
          <div>
            <p className="font-bold text-amber-300 text-sm">Pending review</p>
            <p className="text-xs text-amber-400/80 mt-0.5">Your plate is in the queue and will appear publicly once approved by our team. This usually takes a short while.</p>
          </div>
        </div>
      )}
      {user && user.id === plate.user_id && plate.status === "rejected" && (
        <div className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <span className="text-red-400 text-lg mt-0.5">✕</span>
          <div>
            <p className="font-bold text-red-300 text-sm">Not approved</p>
            <p className="text-xs text-red-400/80 mt-0.5">This plate didn't meet our community guidelines and won't appear publicly. You can delete it and try uploading again.</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image with lightbox */}
        <PlateImageWithLightbox src={plate.image_url} alt={plate.title}>
          {displayStars !== null && (
            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-2xl px-3 py-2 flex items-center gap-1.5 shadow-xl pointer-events-none">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-base font-bold text-white">
                {displayStars.toFixed(1)}
              </span>
              <span className="text-xs text-white/40">/5</span>
            </div>
          )}
        </PlateImageWithLightbox>

        {/* Info */}
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-3xl font-extrabold text-app mb-2 leading-tight">
              {plate.title}
            </h1>
            {plate.description && (
              <p className="text-muted text-base leading-relaxed">
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

        <div className="flex flex-wrap gap-4 text-sm text-muted">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <Link
                href={`/profile/${plate.profiles?.id}`}
                className="font-medium text-muted hover:text-orange-400"
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
            <ViewCounter plateId={plate.id} initialCount={plate.view_count ?? 0} />
          </div>

          {/* Ramsay Rating */}
          {plate.ai_rating !== null && (
            <div className="bg-violet-500/5 border border-violet-500/20 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md shadow-violet-500/30">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-violet-300 text-sm">Ramsay</p>
                  <p className="text-xs text-violet-500">Ramsay Food Critic</p>
                </div>
                <div className="ml-auto flex items-baseline gap-0.5">
                  <span className="text-3xl font-black text-violet-300">{scoreToStars(plate.ai_rating).toFixed(1)}</span>
                  <span className="text-sm text-violet-500">/5</span>
                </div>
              </div>
              <StarRating value={scoreToStars(plate.ai_rating)} readonly size="sm" />
              {plate.ai_comment && (
                <p className="text-sm text-violet-300/80 mt-4 leading-relaxed italic border-l-2 border-violet-500/30 pl-3">
                  &quot;{plate.ai_comment}&quot;
                </p>
              )}
            </div>
          )}

          {/* Your private rating (only visible to you) */}
          {existingRating && user && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/30">
                  <Star className="w-4 h-4 text-white fill-white" />
                </div>
                <div>
                  <p className="font-bold text-amber-300 text-sm">Your Rating</p>
                  <p className="text-xs text-amber-500/70">Only visible to you</p>
                </div>
                <div className="ml-auto flex items-baseline gap-0.5">
                  <span className="text-3xl font-black text-amber-300">{scoreToStars(existingRating.score).toFixed(1)}</span>
                  <span className="text-sm text-amber-500">/5</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StarRating value={scoreToStars(existingRating.score)} readonly size="sm" />
                <span className="text-sm font-bold text-amber-400">
                  {getStarLabel(scoreToStars(existingRating.score))}
                </span>
              </div>
              {existingRating.comment && (
                <p className="text-xs text-amber-400/70 mt-3 italic border-l-2 border-amber-500/30 pl-3">
                  &quot;{existingRating.comment}&quot;
                </p>
              )}
            </div>
          )}

          {/* Rate it */}
          {user && user.id !== plate.user_id ? (
            <div className="bg-surface-1 border border-app-1 rounded-3xl p-5">
              <h3 className="font-bold text-app mb-1">
                {existingRating ? "Update Your Rating" : "Rate This Plate"}
              </h3>
              <p className="text-xs text-faint mb-4">Your opinion matters</p>
              <RatingForm
                plateId={plate.id}
                existingRating={existingRating}
              />
            </div>
          ) : !user ? (
            <div className="bg-surface-1 border border-app-1 rounded-3xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-xl flex-shrink-0">⭐</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-app text-sm">Rate this plate</p>
                <p className="text-xs text-faint">Sign up free to star-rate and help rank the best food</p>
              </div>
              <Link href="/auth/signup" className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-black px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">Join Free</Link>
            </div>
          ) : null}

          {/* Like + Save + Share */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <LikeButton
              plateId={plate.id}
              ownerId={plate.user_id}
              initialCount={plate.like_count ?? 0}
              initialLiked={userLike?.data != null}
              userId={user?.id ?? null}
            />
            <SaveButton plateId={plate.id} initialSaved={initialSaved} userId={user?.id ?? null} />
            {user && (
              <AddToCollectionButton plateId={plate.id} collections={userCollections} />
            )}
            <ShareButton title={plate.title} />
            {user && user.id !== plate.user_id && (
              <ReportButton plateId={plate.id} />
            )}
          </div>

        </div>
      </div>

      {/* Related plates */}
      {relatedPlates.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-app mb-5">
            More {plate.category} plates
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedPlates.map((p) => <PlateCard key={p.id} plate={p} />)}
          </div>
        </section>
      )}

      {/* Sticky mobile guest banner */}
      {!user && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 px-3 pb-1">
          <div className="bg-gradient-to-r from-orange-500 to-rose-500 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-xl shadow-orange-500/30">
            <p className="text-white text-sm font-bold leading-tight">Rate it. Roast it. Upload yours.</p>
            <Link
              href="/auth/signup"
              className="flex-shrink-0 bg-white text-orange-500 text-xs font-black px-4 py-2 rounded-xl hover:bg-orange-50 transition-colors active:scale-95"
            >
              Join Free
            </Link>
          </div>
        </div>
      )}

      {/* Comments */}
      <div id="comments" className="bg-surface-1 rounded-3xl border border-app-1 p-6 mt-10">
        <CommentSection
          plateId={plate.id}
          comments={(comments ?? []) as Comment[]}
          currentUserId={user?.id ?? null}
        />
      </div>
    </div>
  );
}
