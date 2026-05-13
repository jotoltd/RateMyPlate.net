import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EditProfileForm from "./EditProfileForm";

export default async function EditProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, bio, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link href={`/profile/${user.id}`} className="inline-flex items-center gap-2 text-sm text-faint hover:text-orange-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to profile
      </Link>
      <h1 className="text-2xl font-bold text-app mb-6">Edit Profile</h1>
      <EditProfileForm
        initialUsername={profile?.username ?? ""}
        initialBio={profile?.bio ?? ""}
        initialAvatarUrl={profile?.avatar_url ?? null}
      />
    </div>
  );
}
