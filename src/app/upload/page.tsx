"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Upload, ImagePlus, Sparkles, X, ChefHat, Star, Zap, Share2, Check, ArrowRight, Flame } from "lucide-react";
import { uploadPlate } from "@/app/actions/plates";
import { CATEGORIES } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import OnboardingModal from "@/components/OnboardingModal";

type GuestResult = { rating: number; comment: string; notFood?: boolean; previewUrl: string; title: string };

export default function UploadPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedName, setCompressedName] = useState("image.jpg");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadCount, setUploadCount] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "1";

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [guestResult, setGuestResult] = useState<GuestResult | null>(null);
  const [guestPending, setGuestPending] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setIsLoggedIn(!!user);
      if (!user) return;
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("plates")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", since);
      setUploadCount(count ?? 0);
    });
  }, []);

  async function handleGuestSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!compressedBlob) { setError("Please upload an image"); return; }
    setError("");
    setGuestPending(true);
    const fd = new FormData(e.currentTarget);
    fd.set("image", compressedBlob, compressedName);
    try {
      const res = await fetch("/api/rate-guest", { method: "POST", body: fd });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setGuestResult({ ...data, previewUrl: preview!, title: titleValue || "Your Plate" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setGuestPending(false);
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.origin + "/auth/signup?next=/upload").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve) => {
      const MAX = 1200;
      const img = new window.Image();
      img.onload = () => {
        const ratio = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", 0.82);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  function processFile(file: File) {
    if (!file.type.startsWith("image/")) { setError("Please upload an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Image must be under 10MB"); return; }
    setError("");
    compressImage(file).then((blob) => {
      setCompressedBlob(blob);
      setCompressedName(file.name.replace(/\.[^.]+$/, ".jpg"));
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!compressedBlob) {
      setError("Please upload an image");
      return;
    }
    setError("");
    const formData = new FormData(e.currentTarget);
    formData.set("image", compressedBlob, compressedName);
    startTransition(async () => {
      const result = await uploadPlate(formData);
      if (result?.error) setError(result.error);
    });
  }

  // Guest result screen
  if (guestResult) {
    const stars = Math.round((guestResult.rating / 10) * 5 * 2) / 2;
    const scoreLabel = stars >= 4.5 ? "Exceptional! 🌟" : stars >= 4 ? "Great! 🔥" : stars >= 3 ? "Good 👍" : stars >= 2 ? "Needs Work 😬" : "Disaster 💀";
    const scoreColor = stars >= 4 ? "text-emerald-400" : stars >= 3 ? "text-amber-400" : "text-red-400";
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-10 bg-app relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-b from-orange-600/15 to-transparent blur-3xl pointer-events-none" />
        <div className="relative w-full max-w-lg">
          {/* Result card */}
          <div className="bg-surface-1 border border-app-1 rounded-3xl overflow-hidden shadow-2xl shadow-orange-500/10 mb-6">
            <div className="relative h-56 overflow-hidden">
              <Image src={guestResult.previewUrl} alt={guestResult.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <p className="text-white font-black text-xl">{guestResult.title}</p>
                <div className="bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-2xl px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2">
                  <Star className="w-5 h-5 fill-white" />{guestResult.rating}<span className="text-sm font-semibold opacity-70">/10</span>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">👨‍🍳</span>
                </div>
                <div>
                  <p className="text-xs font-black text-app">AI Food Critic</p>
                  <p className={`text-xs font-bold ${scoreColor}`}>{scoreLabel}</p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(stars) ? "fill-amber-400 text-amber-400" : i < stars ? "fill-amber-400/50 text-amber-400" : "text-surface-2"}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted leading-relaxed italic">&ldquo;{guestResult.comment}&rdquo;</p>
            </div>
          </div>

          {/* Sign up gate */}
          <div className="bg-gradient-to-br from-orange-500/10 to-rose-500/10 border border-orange-500/30 rounded-3xl p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-black text-app">Save &amp; share your rating</p>
                <p className="text-xs text-muted">Create a free account to post this publicly and collect community ratings</p>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 mb-4">
              {[
                { icon: <Zap className="w-3.5 h-3.5 text-orange-400" />, text: "Your plate stays on your profile permanently" },
                { icon: <Star className="w-3.5 h-3.5 text-amber-400" />, text: "Community members star-rate your dishes" },
                { icon: <ChefHat className="w-3.5 h-3.5 text-violet-400" />, text: "Earn points and climb the leaderboard" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-xs text-muted">{icon}{text}</div>
              ))}
            </div>
            <a
              href="/auth/signup?next=/upload"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white py-3.5 rounded-2xl font-black text-base hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/20"
            >
              <ChefHat className="w-5 h-5" /> Save My Rating — Free
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setGuestResult(null)}
              className="flex-1 py-3 border border-app-1 text-muted rounded-2xl font-semibold text-sm hover:bg-surface-1 transition-colors"
            >
              Rate another plate
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-3 border border-app-1 text-muted rounded-2xl font-semibold text-sm hover:bg-surface-1 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              {copied ? "Copied!" : "Share"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {isWelcome && <OnboardingModal />}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-app mb-2">Upload Your Plate</h1>
          <p className="text-muted">Share your creation and get brutally honest AI ratings</p>
        </div>
        {uploadCount !== null && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${
            uploadCount >= 5
              ? "border-red-500/30 bg-red-500/10 text-red-400"
              : uploadCount >= 3
              ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
              : "border-app-1 bg-surface-1 text-muted"
          }`}>
            <Upload className="w-3.5 h-3.5" />
            {uploadCount}/5 today
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-6">
          {error}
        </div>
      )}

      <form ref={formRef} onSubmit={isLoggedIn ? handleSubmit : handleGuestSubmit} className="space-y-6">
        {/* Image upload */}
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-3">Plate Photo *</label>
          {preview ? (
            <div className="relative rounded-2xl overflow-hidden bg-white/5 aspect-square max-w-sm mx-auto" onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}>
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setCompressedBlob(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full p-1.5 hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`w-full aspect-square max-w-sm mx-auto hidden sm:flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl transition-colors cursor-pointer ${isDragging ? "border-orange-500/60 bg-orange-500/10" : "border-app-1 bg-surface-1 hover:bg-orange-500/5 hover:border-orange-500/40"}`}
              >
                <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center">
                  <ImagePlus className="w-8 h-8 text-orange-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-muted">Click to upload or drag & drop</p>
                  <p className="text-sm text-faint mt-0.5">JPG, PNG, WEBP up to 10MB</p>
                </div>
              </button>
              {/* Mobile: large tap-friendly button */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="sm:hidden w-full flex flex-col items-center justify-center gap-4 py-12 border-2 border-dashed border-orange-500/40 bg-orange-500/5 rounded-2xl active:bg-orange-500/10 transition-colors cursor-pointer"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-rose-500 rounded-3xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <ImagePlus className="w-10 h-10 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-black text-app text-lg">Tap to add your photo</p>
                  <p className="text-sm text-faint mt-1">From camera or gallery</p>
                </div>
              </button>
            </>
          )}
          <input
            ref={fileRef}
            name="image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Category</label>
          <select
            name="category"
            className="w-full px-4 py-3 bg-surface-1 border border-app-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-app capitalize"
            defaultValue="other"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Dish Name *</label>
          <input
            name="title"
            type="text"
            required
            maxLength={100}
            placeholder="e.g. Spaghetti Carbonara"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            className="w-full px-4 py-3 bg-surface-1 border border-app-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-app placeholder-faint"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Description <span className="font-normal normal-case tracking-normal text-faintest">(optional)</span></label>
          <textarea
            name="description"
            rows={3}
            maxLength={500}
            placeholder="Tell us about this dish — ingredients, how you made it, any special touches..."
            className="w-full px-4 py-3 bg-surface-1 border border-app-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-app placeholder-faint resize-none"
          />
        </div>

        {/* AI notice */}
        <div className="flex items-start gap-3 bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
          <Sparkles className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-300">
              AI Rating Included
            </p>
            <p className="text-xs text-orange-400/70 mt-0.5">
              Your plate will be instantly reviewed by our AI food critic. Get
              a score out of 10 and a written critique!
            </p>
          </div>
        </div>

        {!isLoggedIn && (
          <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3">
            <Sparkles className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <p className="text-xs text-orange-300"><span className="font-bold">No account needed</span> — get your AI rating instantly. Sign up free to save it publicly.</p>
          </div>
        )}
        <button
          type="submit"
          disabled={isPending || guestPending || !compressedBlob}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white py-4 rounded-2xl font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg"
        >
          <Upload className="w-5 h-5" />
          {isPending || guestPending ? "Analysing your plate..." : isLoggedIn ? "Upload & Get Rated" : "Get My AI Rating"}
        </button>
      </form>
    </div>
  );
}
