"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Send } from "lucide-react";
import StarRating from "./StarRating";
import { submitRating } from "@/app/actions/plates";

type RatingFormProps = {
  plateId: string;
  existingRating?: { score: number; comment: string | null } | null;
};

export default function RatingForm({ plateId, existingRating }: RatingFormProps) {
  const [score, setScore] = useState(existingRating?.score ?? 0);
  const [comment, setComment] = useState(existingRating?.comment ?? "");
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (score === 0) {
      setError("Please select a rating");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await submitRating(plateId, score, comment);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Your Rating
        </label>
        <StarRating value={score} onChange={setScore} size="md" />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
          <MessageSquare className="w-4 h-4" />
          Comment (optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What do you think of this plate?"
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || score === 0}
        className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-6 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
      >
        <Send className="w-4 h-4" />
        {isPending ? "Submitting..." : existingRating ? "Update Rating" : "Submit Rating"}
      </button>

      {success && (
        <p className="text-green-600 text-sm font-medium">
          Rating submitted! 🎉
        </p>
      )}
    </form>
  );
}
