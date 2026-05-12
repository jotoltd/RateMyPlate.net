"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleLike } from "@/app/actions/likes";

type LikeButtonProps = {
  plateId: string;
  ownerId: string;
  initialCount: number;
  initialLiked: boolean;
};

export default function LikeButton({
  plateId,
  ownerId,
  initialCount,
  initialLiked,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      setLiked((prev) => !prev);
      setCount((prev) => (liked ? prev - 1 : prev + 1));
      await toggleLike(plateId, ownerId);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
        liked
          ? "bg-rose-100 text-rose-600 hover:bg-rose-200"
          : "bg-gray-100 text-gray-500 hover:bg-rose-50 hover:text-rose-500"
      }`}
    >
      <Heart
        className={`w-4 h-4 transition-all ${liked ? "fill-rose-500 text-rose-500 scale-110" : ""}`}
      />
      <span>{count}</span>
    </button>
  );
}
