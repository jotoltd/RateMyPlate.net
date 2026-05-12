"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { updateProfile } from "@/app/actions/profile";

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
      <Link href=".." className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to profile
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>

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
          <p className="text-xs text-gray-500">Click to change avatar</p>
          <input ref={fileRef} name="avatar" type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
          <input
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={30}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bio</label>
          <textarea
            name="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={200}
            placeholder="Tell the world about your cooking…"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/200</p>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>}
        {success && <p className="text-sm text-green-600 bg-green-50 rounded-xl px-4 py-2">Profile updated!</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
        >
          <Save className="w-4 h-4" />
          {isPending ? "Saving…" : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
