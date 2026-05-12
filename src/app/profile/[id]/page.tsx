import { notFound } from "next/navigation";
import { User, Calendar, Star, Upload, Heart, Pencil, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import PlateCard from "@/components/PlateCard";
import FollowButton from "@/components/FollowButton";
import { Plate } from "@/lib/types";
import { formatDate, scoreToStars } from "@/lib/utils";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 mb-8">
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
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
              @{profile.username}
            </h1>
            {profile.bio && (
              <p className="text-gray-500 dark:text-gray-400 mb-2">{profile.bio}</p>
            )}
            <div className="flex flex-wrap justify-center sm:justify-start gap-6 text-sm text-gray-500">
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
                {profile.follower_count ?? 0} followers · {profile.following_count ?? 0} following
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
                className="flex items-center gap-2 border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl font-medium hover:border-orange-300 hover:text-orange-500 transition-all text-sm"
              >
                <Pencil className="w-4 h-4" />
                Edit Profile
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Plates grid */}
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        {isOwnProfile ? "Your Plates" : `${profile.username}'s Plates`}
      </h2>

      {plates && plates.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {plates.map((plate) => (
            <PlateCard key={plate.id} plate={plate as Plate} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
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
      )}
    </div>
  );
}
