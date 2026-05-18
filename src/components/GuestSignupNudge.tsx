"use client";

import Link from "next/link";
import { Flame, Star, Zap } from "lucide-react";

export default function GuestSignupNudge({ context = "feed" }: { context?: "feed" | "plate" }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-rose-500/5 to-transparent p-6 my-4">
      <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-5 h-5 text-orange-400" />
          <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">
            {context === "plate" ? "Rate this plate" : "Join the community"}
          </span>
        </div>
        <h3 className="text-xl font-black text-app mb-1">
          {context === "plate"
            ? "Sign up to rate & comment"
            : "Want to upload your own plate?"}
        </h3>
        <p className="text-sm text-muted mb-4 leading-relaxed">
          {context === "plate"
            ? "Create a free account to rate plates, leave comments, and get your own food brutally critiqued by AI."
            : "Get instant AI ratings from Gordon Ramsay's digital twin. Free forever, takes 30 seconds."}
        </p>
        <div className="flex flex-wrap gap-3 mb-5">
          {[
            { icon: <Zap className="w-3.5 h-3.5 text-orange-400" />, text: "+10 pts per upload" },
            { icon: <Star className="w-3.5 h-3.5 text-yellow-400" />, text: "AI Ramsay critique" },
            { icon: <Flame className="w-3.5 h-3.5 text-rose-400" />, text: "Free forever" },
          ].map(({ icon, text }) => (
            <span key={text} className="flex items-center gap-1.5 text-xs text-muted bg-surface-1 border border-app-1 px-3 py-1.5 rounded-full">
              {icon}{text}
            </span>
          ))}
        </div>
        <div className="flex gap-3">
          <Link
            href="/auth/signup"
            className="flex-1 text-center py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-sm rounded-xl hover:opacity-90 transition-opacity"
          >
            Create Free Account
          </Link>
          <Link
            href="/auth/login"
            className="flex-1 text-center py-3 border border-app-1 text-muted font-semibold text-sm rounded-xl hover:bg-surface-1 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
