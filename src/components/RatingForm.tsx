"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Send, CheckCircle2 } from "lucide-react";
import StarRating from "./StarRating";
import { submitRating } from "@/app/actions/plates";
import { scoreToStars, starsToScore } from "@/lib/utils";

type RatingFormProps = {
  plateId: string;
  existingRating?: { score: number; comment: string | null } | null;
};

export default function RatingForm({ plateId, existingRating }: RatingFormProps) {
  const [stars, setStars] = useState(
    existingRating?.score ? scoreToStars(existingRating.score) : 0
  );
  const [comment, setComment] = useState(existingRating?.comment ?? "");
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stars === 0) {
      setError("Please select a star rating");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await submitRating(plateId, starsToScore(stars), comment);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
          Tap to rate
        </label>
        <StarRating value={stars} onChange={setStars} size="lg" />
        {error && (
          <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
          Comment <span className="font-normal normal-case tracking-normal text-white/20">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you think? Presentation, taste, vibes…"
          rows={3}
          maxLength={500}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-white placeholder-white/20"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || stars === 0}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-6 py-3 rounded-2xl font-semibold hover:opacity-90 transition-all disabled:opacity-40 shadow-lg active:scale-95"
      >
        <Send className="w-4 h-4" />
        {isPending ? "Submitting…" : existingRating ? "Update Rating" : "Submit Rating"}
      </button>

      {success && (
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4" />
          Rating submitted! 🎉
        </div>
      )}
    </form>
  );
}
