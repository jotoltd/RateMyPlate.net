"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { Upload, ImagePlus, Sparkles, X } from "lucide-react";
import { uploadPlate } from "@/app/actions/plates";
import { CATEGORIES } from "@/lib/types";

export default function UploadPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!preview) {
      setError("Please upload an image");
      return;
    }
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await uploadPlate(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Upload Your Plate
        </h1>
        <p className="text-gray-500">
          Share your creation and get rated by AI and the community
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-6">
          {error}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {/* Image upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Plate Photo *
          </label>
          {preview ? (
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-square max-w-sm mx-auto">
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
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-1.5 hover:bg-white transition-colors shadow-md"
              >
                <X className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-square max-w-sm mx-auto flex flex-col items-center justify-center gap-3 border-2 border-dashed border-orange-200 rounded-2xl bg-orange-50 hover:bg-orange-100 hover:border-orange-400 transition-colors cursor-pointer"
            >
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md">
                <ImagePlus className="w-8 h-8 text-orange-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700">Click to upload</p>
                <p className="text-sm text-gray-400 mt-0.5">
                  JPG, PNG, WEBP up to 10MB
                </p>
              </div>
            </button>
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Category
          </label>
          <select
            name="category"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white capitalize"
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Dish Name *
          </label>
          <input
            name="title"
            type="text"
            required
            maxLength={100}
            placeholder="e.g. Spaghetti Carbonara"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description{" "}
            <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            name="description"
            rows={3}
            maxLength={500}
            placeholder="Tell us about this dish — ingredients, how you made it, any special touches..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm resize-none"
          />
        </div>

        {/* AI notice */}
        <div className="flex items-start gap-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-4">
          <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-purple-700">
              AI Rating Included
            </p>
            <p className="text-xs text-purple-500 mt-0.5">
              Your plate will be instantly reviewed by our AI food critic. Get
              a score out of 10 and a written critique!
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || !preview}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white py-4 rounded-2xl font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg"
        >
          <Upload className="w-5 h-5" />
          {isPending ? "Uploading & rating..." : "Upload & Get Rated"}
        </button>
      </form>
    </div>
  );
}
