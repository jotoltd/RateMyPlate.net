import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import FollowButton from "@/components/FollowButton";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("username").eq("id", id).single();
  return { title: `${data?.username ?? "Chef"}'s Followers – Rate My Plate` };
}

export default async function FollowersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase.from("profiles").select("id, username").eq("id", id).single();
  if (!profile) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: rows } = await supabase
    .from("follows")
    .select("follower:follower_id(id, username, avatar_url, bio, follower_count)")
    .eq("following_id", id)
    .order("created_at", { ascending: false });

  type FollowerProfile = { id: string; username: string; avatar_url: string | null; bio: string | null; follower_count: number };
  const followers = (rows ?? []).map((r) => r.follower) as unknown as FollowerProfile[];

  let myFollowingIds: Set<string> = new Set();
  if (user) {
    const { data: mf } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
    myFollowingIds = new Set((mf ?? []).map((r) => r.following_id));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href={`/profile/${id}`} className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-orange-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> @{profile.username}
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-rose-500 rounded-2xl flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Followers</h1>
          <p className="text-sm text-white/40">{followers.length} {followers.length === 1 ? "person" : "people"} follow @{profile.username}</p>
        </div>
      </div>

      {followers.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">No followers yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {followers.map((f) => (
            <div key={f.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
              <Link href={`/profile/${f.id}`} className="flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500">
                  {f.avatar_url
                    ? <Image src={f.avatar_url} alt={f.username} width={48} height={48} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-white font-black text-lg">{f.username[0].toUpperCase()}</div>
                  }
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${f.id}`} className="font-bold text-white hover:text-orange-400 transition-colors">@{f.username}</Link>
                {f.bio && <p className="text-xs text-white/40 truncate mt-0.5">{f.bio}</p>}
              </div>
              {user && user.id !== f.id && (
                <FollowButton
                  targetUserId={f.id}
                  initialFollowing={myFollowingIds.has(f.id)}
                  initialCount={f.follower_count ?? 0}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
