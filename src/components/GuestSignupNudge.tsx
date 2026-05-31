"use client";

import Link from "next/link";
import { Flame, Star, ArrowRight } from "lucide-react";

export default function GuestSignupNudge({ context = "feed" }: { context?: "feed" | "plate" }) {
  const isFeed = context === "feed";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-rose-500/5 to-transparent p-6 my-4">
      {/* Glow */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-orange-500/15 blur-3xl pointer-events-none rounded-full" />

      <div className="relative">
        {/* Icon row */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20">
            <span className="text-base">👨‍🍳</span>
          </div>
          <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">
            {isFeed ? "What would Ramsay say about yours?" : "Join to rate & get rated"}
          </span>
        </div>

        <h3 className="text-xl font-black text-app mb-2 leading-tight">
          {isFeed
            ? "Is your cooking actually good?"
            : "Sign up — find out how your food really scores"}
        </h3>

        <p className="text-sm text-muted mb-4 leading-relaxed">
          {isFeed
            ? "Upload a photo, get a brutally honest Ramsay critique, and let the community rate it. You might be surprised."
            : "Get an instant Ramsay critique on your own plates. Rate others. See your score on the leaderboard."}
        </p>

        {/* Mini proof strip */}
        <div className="flex items-center gap-1.5 mb-5">
          {["★","★","★","★","★"].map((s, i) => (
            <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          ))}
          <span className="text-xs text-faint ml-1">Free forever · 30 seconds to join</span>
        </div>

        <div className="flex gap-3">
          <Link
            href="/auth/signup"
            className="group flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-sm rounded-xl hover:from-orange-400 hover:to-rose-400 transition-all shadow-md shadow-orange-500/20 active:scale-[0.98]"
          >
            <Flame className="w-4 h-4" />
            {isFeed ? "Find Out Now" : "Join Free"}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/auth/login"
            className="px-5 py-3.5 border border-app-1 text-muted font-semibold text-sm rounded-xl hover:bg-surface-1 hover:text-app transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
