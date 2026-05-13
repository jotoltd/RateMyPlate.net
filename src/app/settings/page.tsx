import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowLeft,
  User,
  Lock,
  Bell,
  Trash2,
  Shield,
  Palette,
} from "lucide-react";
import EditProfileForm from "@/app/profile/edit/EditProfileForm";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = { title: "Settings – Rate My Plate" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, bio, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-faint hover:text-orange-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to feed
      </Link>

      <h1 className="text-2xl font-black text-app mb-8">Settings</h1>

      {/* ── Profile ── */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <User className="w-4 h-4 text-orange-400" />
          </div>
          <h2 className="font-bold text-app">Profile</h2>
        </div>
        <div className="bg-surface-1 border border-app-1 rounded-3xl p-6">
          <EditProfileForm
            initialUsername={profile?.username ?? ""}
            initialBio={profile?.bio ?? ""}
            initialAvatarUrl={profile?.avatar_url ?? null}
          />
        </div>
      </section>

      {/* ── Appearance ── */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Palette className="w-4 h-4 text-violet-400" />
          </div>
          <h2 className="font-bold text-app">Appearance</h2>
        </div>
        <div className="bg-surface-1 border border-app-1 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-app text-sm">Dark mode</p>
              <p className="text-xs text-faint mt-0.5">Switch between light and dark theme</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </section>

      {/* ── Account & Security ── */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <h2 className="font-bold text-app">Account &amp; Security</h2>
        </div>
        <div className="bg-surface-1 border border-app-1 rounded-3xl divide-y divide-app-1">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-app text-sm">Email address</p>
              <p className="text-xs text-faint mt-0.5">{user.email}</p>
            </div>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-app text-sm">Password</p>
              <p className="text-xs text-faint mt-0.5">Change your login password</p>
            </div>
            <Link
              href="/auth/forgot-password"
              className="text-sm font-semibold text-orange-400 hover:underline"
            >
              Reset
            </Link>
          </div>
        </div>
      </section>

      {/* ── Privacy ── */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <h2 className="font-bold text-app">Privacy</h2>
        </div>
        <div className="bg-surface-1 border border-app-1 rounded-3xl divide-y divide-app-1">
          <div className="p-5">
            <p className="font-semibold text-app text-sm">Your ratings</p>
            <p className="text-xs text-faint mt-1 leading-relaxed">
              Your star ratings are private — only you can see them. Comments and likes are visible to everyone.
            </p>
          </div>
          <div className="p-5">
            <p className="font-semibold text-app text-sm">Public profile</p>
            <p className="text-xs text-faint mt-1 leading-relaxed">
              Your profile, username, plates, and follower counts are public. Your email is never shared.
            </p>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-app text-sm">Blocked users</p>
              <p className="text-xs text-faint mt-0.5">Coming soon</p>
            </div>
            <span className="text-xs bg-surface-2 text-faint px-2.5 py-1 rounded-full font-medium">Soon</span>
          </div>
        </div>
      </section>

      {/* ── Notifications ── */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-blue-400" />
          </div>
          <h2 className="font-bold text-app">Notifications</h2>
        </div>
        <div className="bg-surface-1 border border-app-1 rounded-3xl p-5">
          <p className="text-sm text-muted">You get notified when someone likes, comments, or follows you.</p>
          <Link
            href="/notifications"
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-orange-400 hover:underline"
          >
            <Bell className="w-3.5 h-3.5" />
            View all notifications
          </Link>
        </div>
      </section>

      {/* ── Danger Zone ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-red-400" />
          </div>
          <h2 className="font-bold text-app">Danger Zone</h2>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6">
          <p className="font-semibold text-app text-sm mb-1">Delete account</p>
          <p className="text-xs text-faint mb-4 leading-relaxed">
            Permanently delete your account and all plates, ratings, and comments. This cannot be undone.
          </p>
          <DeleteAccountButton />
        </div>
      </section>
    </div>
  );
}
