import { requireAdmin } from "@/lib/admin";
import { formatDate, scoreToStars } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Heart, MessageSquare, ImageIcon, Calendar, ArrowLeft } from "lucide-react";
import AdminUserActions from "../AdminUserActions";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: profile }, { data: plates }, { data: comments }, { data: ratings }] = await Promise.all([
    supabase.from("profiles").select("id, username, email, avatar_url, is_admin, banned, created_at, follower_count, following_count, bio").eq("id", id).single(),
    supabase.from("plates").select("id, title, image_url, like_count, rating_count, status, created_at, category").eq("user_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("comments").select("id, body, created_at, plate_id").eq("user_id", id).order("created_at", { ascending: false }).limit(30),
    supabase.from("ratings").select("id, score, created_at, plate_id, plates(title)").eq("user_id", id).order("created_at", { ascending: false }).limit(30),
  ]);

  if (!profile) notFound();

  const statusColors: Record<string, string> = {
    approved: "bg-emerald-500/10 text-emerald-400",
    pending: "bg-amber-500/10 text-amber-400",
    rejected: "bg-red-500/10 text-red-400",
  };

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="flex items-center gap-1.5 text-sm text-faint hover:text-app transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </Link>

      {/* Profile header */}
      <div className="bg-surface-1 border border-app-1 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500 flex-shrink-0 flex items-center justify-center">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-white text-xl font-black">{profile.username[0].toUpperCase()}</span>
              }
            </div>
            <div>
              <p className="font-black text-app text-lg">@{profile.username}</p>
              <p className="text-sm text-faint">{profile.email ?? "No email"}</p>
              {profile.bio && <p className="text-xs text-muted mt-1">{profile.bio}</p>}
            </div>
          </div>
          <AdminUserActions userId={profile.id} isBanned={profile.banned ?? false} isAdmin={profile.is_admin ?? false} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Joined", value: formatDate(profile.created_at), icon: Calendar },
            { label: "Plates", value: plates?.length ?? 0, icon: ImageIcon },
            { label: "Followers", value: profile.follower_count ?? 0, icon: Star },
            { label: "Following", value: profile.following_count ?? 0, icon: Heart },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-surface-2 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-app">{value}</p>
              <p className="text-xs text-faint">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Plates */}
      <div className="bg-surface-1 border border-app-1 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-app-1 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-orange-400" />
          <h3 className="font-bold text-app">Plates ({plates?.length ?? 0})</h3>
        </div>
        {(plates ?? []).length === 0 ? (
          <p className="px-5 py-8 text-sm text-faint text-center">No plates</p>
        ) : (
          <div className="divide-y divide-app-1">
            {(plates ?? []).map((plate) => (
              <div key={plate.id} className="px-5 py-3 flex items-center gap-3">
                <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-surface-2">
                  <Image src={plate.image_url} alt={plate.title} fill className="object-cover" sizes="40px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-app truncate">{plate.title}</p>
                  <p className="text-xs text-faint">{plate.category} · {formatDate(plate.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[plate.status] ?? ""}`}>{plate.status}</span>
                  <span className="flex items-center gap-1 text-xs text-faint"><Heart className="w-3 h-3 text-rose-400" />{plate.like_count}</span>
                  <Link href={`/plate/${plate.id}`} target="_blank" className="text-faint hover:text-orange-400 transition-colors text-xs underline">view</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="bg-surface-1 border border-app-1 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-app-1 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-app">Recent Comments ({comments?.length ?? 0})</h3>
        </div>
        {(comments ?? []).length === 0 ? (
          <p className="px-5 py-8 text-sm text-faint text-center">No comments</p>
        ) : (
          <div className="divide-y divide-app-1">
            {(comments ?? []).map((c) => (
              <div key={c.id} className="px-5 py-3">
                <p className="text-sm text-app">{c.body}</p>
                <p className="text-xs text-faint mt-1">{formatDate(c.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ratings given */}
      <div className="bg-surface-1 border border-app-1 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-app-1 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-app">Ratings Given ({ratings?.length ?? 0})</h3>
        </div>
        {(ratings ?? []).length === 0 ? (
          <p className="px-5 py-8 text-sm text-faint text-center">No ratings</p>
        ) : (
          <div className="divide-y divide-app-1">
            {(ratings ?? []).map((r) => {
              const plate = r.plates as unknown as { title: string } | null;
              return (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-app truncate">{plate?.title ?? "Unknown plate"}</p>
                    <p className="text-xs text-faint">{formatDate(r.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg flex-shrink-0">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-bold text-amber-400">{scoreToStars(r.score).toFixed(1)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
