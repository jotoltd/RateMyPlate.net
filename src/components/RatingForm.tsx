"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Send, CheckCircle2, Pencil } from "lucide-react";
import StarRating from "./StarRating";
import { submitRating } from "@/app/actions/plates";
import { scoreToStars, starsToScore, getStarLabel } from "@/lib/utils";

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
  const [error, setError] = useState("");
  // Track the last successfully submitted values for display
  const [submitted, setSubmitted] = useState<{ stars: number; comment: string } | null>(
    existingRating ? { stars: scoreToStars(existingRating.score), comment: existingRating.comment ?? "" } : null
  );
  const [editing, setEditing] = useState(!existingRating);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stars === 0) { setError("Please select a star rating"); return; }
    setError("");
    startTransition(async () => {
      const result = await submitRating(plateId, starsToScore(stars), comment);
      if (result?.error) {
        setError(result.error);
      } else {
        setSubmitted({ stars, comment });
        setEditing(false);
      }
    });
  }

  // Show submitted state — your rating confirmed
  if (submitted && !editing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <StarRating value={submitted.stars} readonly size="md" />
          <span className="text-sm font-bold text-amber-400">{getStarLabel(submitted.stars)}</span>
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold ml-auto">
            <CheckCircle2 className="w-3.5 h-3.5" /> Rated
          </div>
        </div>
        {submitted.comment && (
          <p className="text-xs text-faint italic border-l-2 border-app-1 pl-3">&quot;{submitted.comment}&quot;</p>
        )}
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
        >
          <Pencil className="w-3 h-3" /> Edit your rating
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-3">
          Tap to rate
        </label>
        <StarRating value={stars} onChange={setStars} size="lg" />
        {error && <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
          Comment <span className="font-normal normal-case tracking-normal text-faintest">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you think? Presentation, taste, vibes…"
          rows={3}
          maxLength={500}
          className="w-full bg-surface-1 border border-app-1 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-app placeholder-faint"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || stars === 0}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-6 py-3 rounded-2xl font-semibold hover:opacity-90 transition-all disabled:opacity-40 shadow-lg active:scale-95"
        >
          <Send className="w-4 h-4" />
          {isPending ? "Submitting…" : submitted ? "Update Rating" : "Submit Rating"}
        </button>
        {submitted && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="px-4 py-3 rounded-2xl text-sm font-semibold text-faint hover:text-app border border-app-1 hover:border-app-2 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
