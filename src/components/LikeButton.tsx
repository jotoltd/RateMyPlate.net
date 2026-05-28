"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleLike } from "@/app/actions/likes";
import AuthGateModal from "@/components/AuthGateModal";

type LikeButtonProps = {
  plateId: string;
  ownerId: string;
  initialCount: number;
  initialLiked: boolean;
  userId?: string | null;
};

export default function LikeButton({
  plateId,
  ownerId,
  initialCount,
  initialLiked,
  userId,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const [showGate, setShowGate] = useState(false);

  function handleClick() {
    if (!userId) { setShowGate(true); return; }
    startTransition(async () => {
      setLiked((prev) => !prev);
      setCount((prev) => (liked ? prev - 1 : prev + 1));
      await toggleLike(plateId, ownerId);
    });
  }

  return (
    <>
      {showGate && <AuthGateModal action="like" onClose={() => setShowGate(false)} />}
      <button
        onClick={handleClick}
        disabled={isPending}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
          liked
            ? "bg-rose-500/15 text-rose-400 hover:bg-rose-500/25"
            : "bg-surface-1 text-muted hover:bg-rose-500/10 hover:text-rose-400"
        }`}
      >
        <Heart
          className={`w-4 h-4 transition-all ${liked ? "fill-rose-500 text-rose-500 scale-110" : ""}`}
        />
        <span>{count}</span>
      </button>
    </>
  );
}
