"use client";

import { useState, useTransition } from "react";
import { UserPlus, UserMinus } from "lucide-react";
import { toggleFollow } from "@/app/actions/follows";

export default function FollowButton({
  targetUserId,
  initialFollowing,
  initialCount,
}: {
  targetUserId: string;
  initialFollowing: boolean;
  initialCount: number;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function handle() {
    startTransition(async () => {
      setFollowing((f) => !f);
      setCount((c) => (following ? c - 1 : c + 1));
      await toggleFollow(targetUserId);
    });
  }

  return (
    <button
      onClick={handle}
      disabled={isPending}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
        following
          ? "bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-500"
          : "bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:opacity-90"
      }`}
    >
      {following ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
      {following ? "Unfollow" : "Follow"}
      <span className="ml-1 opacity-70">({count})</span>
    </button>
  );
}
