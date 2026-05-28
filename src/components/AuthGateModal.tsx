"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, Flame, Star, ChefHat, ArrowRight } from "lucide-react";

const COPY: Record<string, { emoji: string; headline: string; sub: string }> = {
  like:    { emoji: "❤️", headline: "Like this plate", sub: "Sign up free to like plates and show chefs some love." },
  comment: { emoji: "💬", headline: "Join the conversation", sub: "Sign up free to leave comments and chat with chefs." },
  rate:    { emoji: "⭐", headline: "Rate this plate", sub: "Sign up free to star-rate dishes and help rank the best food." },
  save:    { emoji: "🔖", headline: "Save this plate", sub: "Sign up free to bookmark plates to your collections." },
  follow:  { emoji: "👨‍🍳", headline: "Follow this chef", sub: "Sign up free to follow chefs and get their latest plates in your feed." },
  upload:  { emoji: "📸", headline: "Share your plate", sub: "Sign up free to upload your dishes and get a brutal AI critique." },
  default: { emoji: "🍽️", headline: "Join Rate My Plate", sub: "Sign up free to like, rate, comment and share your own plates." },
};

type Props = {
  action?: keyof typeof COPY;
  onClose: () => void;
};

export default function AuthGateModal({ action = "default", onClose }: Props) {
  const { emoji, headline, sub } = COPY[action] ?? COPY.default;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-sm bg-surface-1 border border-app-1 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-faint hover:text-app hover:bg-surface-2 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Emoji + headline */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500/20 to-rose-500/20 border border-orange-500/30 rounded-3xl flex items-center justify-center text-3xl mb-3">
            {emoji}
          </div>
          <h2 className="text-xl font-black text-app mb-1">{headline}</h2>
          <p className="text-sm text-muted leading-relaxed">{sub}</p>
        </div>

        {/* Proof strip */}
        <div className="flex items-center justify-center gap-1 mb-5">
          {[1,2,3,4,5].map((i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
          <span className="text-xs text-faint ml-2">Free forever · 30 seconds to join</span>
        </div>

        {/* CTAs */}
        <Link
          href="/auth/signup"
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black rounded-2xl hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/20 mb-2.5"
        >
          <Flame className="w-4 h-4" />
          Create Free Account
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-2 w-full py-3 border border-app-1 text-muted font-semibold text-sm rounded-2xl hover:bg-surface-2 hover:text-app transition-colors"
        >
          <ChefHat className="w-4 h-4" />
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}
