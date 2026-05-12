import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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
    <EditProfileForm
      initialUsername={profile?.username ?? ""}
      initialBio={profile?.bio ?? ""}
      initialAvatarUrl={profile?.avatar_url ?? null}
    />
  );
}
