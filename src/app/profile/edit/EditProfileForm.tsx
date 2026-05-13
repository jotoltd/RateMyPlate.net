"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Save, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { updateProfile } from "@/app/actions/profile";
import { deleteAccount } from "@/app/actions/auth";

type Props = {
  initialUsername: string;
  initialBio: string;
  initialAvatarUrl: string | null;
};

export default function EditProfileForm({ initialUsername, initialBio, initialAvatarUrl }: Props) {
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [preview, setPreview] = useState<string | null>(initialAvatarUrl);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result?.error) setError(result.error);
      else {
        setSuccess(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link href=".." className="inline-flex items-center gap-2 text-sm text-faint hover:text-orange-400 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to profile
      </Link>

      <h1 className="text-2xl font-bold text-app mb-6">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-col items-center gap-3 mb-2">
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500 cursor-pointer shadow-lg group"
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <Image src={preview} alt="Avatar" fill className="object-cover" sizes="96px" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                {username[0]?.toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-xs text-faint">Click to change avatar</p>
          <input ref={fileRef} name="avatar" type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-1.5">Username</label>
          <input
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={30}
            required
            className="w-full bg-surface-1 border border-app-1 rounded-xl px-4 py-2.5 text-sm text-app focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-1.5">Bio</label>
          <textarea
            name="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={200}
            placeholder="Tell the world about your cooking…"
            className="w-full bg-surface-1 border border-app-1 rounded-xl px-4 py-2.5 text-sm text-app placeholder-faint focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
          <p className="text-xs text-faintest mt-1 text-right">{bio.length}/200</p>
        </div>

        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>}
        {success && <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2">Profile updated!</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
        >
          <Save className="w-4 h-4" />
          {isPending ? "Saving…" : "Save Profile"}
        </button>
      </form>

      {/* Danger zone */}
      <div className="mt-10 border border-red-500/20 rounded-2xl p-5">
        <p className="text-sm font-bold text-red-400 uppercase tracking-widest mb-1">Danger Zone</p>
        <p className="text-xs text-white/30 mb-4">Permanently delete your account, all your plates, ratings and data. This cannot be undone.</p>
        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="flex items-center gap-2 text-sm font-semibold text-red-400 border border-red-500/30 px-4 py-2 rounded-xl hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete my account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-300 font-semibold">Are you absolutely sure? This is irreversible.</p>
            <div className="flex gap-3">
              <button
                onClick={() => startDeleteTransition(async () => { await deleteAccount(); })}
                disabled={isDeleting}
                className="flex items-center gap-2 text-sm font-bold text-white bg-red-500 px-4 py-2 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> {isDeleting ? "Deleting…" : "Yes, delete everything"}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="text-sm text-white/40 hover:text-white px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
