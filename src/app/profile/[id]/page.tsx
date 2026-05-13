import { notFound } from "next/navigation";
import { User, Calendar, Star, Upload, Heart, Pencil, Users, LayoutGrid } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import PlateCard from "@/components/PlateCard";
import FollowButton from "@/components/FollowButton";
import { Plate } from "@/lib/types";
import { formatDate, scoreToStars } from "@/lib/utils";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const activeTab = tab === "ratings" ? "ratings" : "plates";
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const { data: plates } = await supabase
    .from("plates")
    .select("*, profiles(id, username, avatar_url)")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const totalRatings =
    plates?.reduce((sum, p) => sum + (p.rating_count ?? 0), 0) ?? 0;
  const totalLikes =
    plates?.reduce((sum, p) => sum + (p.like_count ?? 0), 0) ?? 0;
  const avgRating =
    plates && plates.length > 0
      ? plates
          .filter((p) => p.avg_user_rating !== null)
          .reduce((sum, p, _, arr) =>
            arr.length === 0 ? sum : sum + p.avg_user_rating / arr.length
          , 0)
      : null;

  const isOwnProfile = user?.id === id;

  const isFollowing = user && !isOwnProfile
    ? !!(await supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", id).single()).data
    : false;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Profile header */}
      <div className="bg-surface-1 rounded-3xl border border-app-1 p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative w-24 h-24 rounded-3xl overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500 flex-shrink-0 shadow-lg">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" sizes="96px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white text-4xl font-extrabold">{profile.username[0].toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-extrabold text-app mb-1">
              @{profile.username}
            </h1>
            {profile.bio && (
              <p className="text-muted mb-2">{profile.bio}</p>
            )}
            <div className="flex flex-wrap justify-center sm:justify-start gap-6 text-sm text-muted">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Joined {formatDate(profile.created_at)}
              </div>
              <div className="flex items-center gap-1.5">
                <Upload className="w-4 h-4" />
                {plates?.length ?? 0} plates
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                {totalRatings} ratings received
              </div>
              {avgRating !== null && avgRating > 0 && (
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                  Avg {scoreToStars(avgRating).toFixed(1)}/5
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                {totalLikes} likes
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" />
                <Link href={`/profile/${id}/followers`} className="hover:text-app transition-colors">
                  {profile.follower_count ?? 0} followers
                </Link>
                <span>·</span>
                <Link href={`/profile/${id}/following`} className="hover:text-app transition-colors">
                  {profile.following_count ?? 0} following
                </Link>
              </div>
            </div>
          </div>
          {!isOwnProfile && user && (
            <FollowButton
              targetUserId={id}
              initialFollowing={isFollowing}
              initialCount={profile.follower_count ?? 0}
            />
          )}
          {isOwnProfile && (
            <div className="flex flex-col gap-2">
              <Link
                href="/upload"
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity text-sm shadow-md"
              >
                <Upload className="w-4 h-4" />
                Upload Plate
              </Link>
              <Link
                href="/profile/edit"
                className="flex items-center gap-2 border border-app-1 text-muted px-5 py-2.5 rounded-xl font-medium hover:border-orange-500/40 hover:text-orange-400 transition-all text-sm"
              >
                <Pencil className="w-4 h-4" />
                Edit Profile
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-surface-1 rounded-2xl p-1 mb-6 w-fit">
        {[
          { key: "plates", label: isOwnProfile ? "My Plates" : "Plates", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
          { key: "ratings", label: "Ratings Given", icon: <Star className="w-3.5 h-3.5" /> },
        ].map(({ key, label, icon }) => (
          <Link
            key={key}
            href={`/profile/${id}${key === "plates" ? "" : `?tab=${key}`}`}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === key
                ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow"
                : "text-muted hover:text-app"
            }`}
          >
            {icon}{label}
          </Link>
        ))}
      </div>

      {activeTab === "plates" && (
        plates && plates.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {plates.map((plate) => (
              <PlateCard key={plate.id} plate={plate as Plate} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-faint">
            <User className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No plates yet</p>
            {isOwnProfile && (
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 mt-6 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                <Upload className="w-4 h-4" />
                Upload Your First Plate
              </Link>
            )}
          </div>
        )
      )}

      {activeTab === "ratings" && <RatingsTab userId={id} />}
    </div>
  );
}

async function RatingsTab({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: ratings } = await supabase
    .from("ratings")
    .select("id, score, comment, created_at, plate:plate_id(id, title, image_url, avg_user_rating, ai_rating, like_count, rating_count, profiles(id, username, avatar_url))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = ratings ?? [];

  if (rows.length === 0) {
    return (
      <div className="text-center py-20 text-faint">
        <Star className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="font-medium">No ratings given yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const plate = r.plate as unknown as Plate & { profiles: { id: string; username: string; avatar_url: string | null } | null };
        if (!plate) return null;
        const stars = scoreToStars(r.score);
        return (
          <Link
            key={r.id}
            href={`/plate/${plate.id}`}
            className="flex items-center gap-4 p-4 bg-surface-1 border border-app-1 hover:border-orange-500/20 rounded-2xl transition-all"
          >
            <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-surface-2">
              <Image src={plate.image_url} alt={plate.title} fill className="object-cover" sizes="56px" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-app truncate">{plate.title}</p>
              <p className="text-xs text-faint">by @{plate.profiles?.username ?? "chef"} · {formatDate(r.created_at)}</p>
              {r.comment && <p className="text-xs text-muted line-clamp-1 mt-0.5 italic">"{r.comment}"</p>}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 bg-amber-500/10 px-2.5 py-1.5 rounded-xl">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold text-amber-300">{stars.toFixed(1)}</span>
              <span className="text-xs text-amber-500">/5</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
