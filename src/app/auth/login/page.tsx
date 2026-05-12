"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChefHat, Mail, Lock, LogIn, Flame, Star, Users } from "lucide-react";
import { signIn } from "@/app/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signIn(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Fire glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-orange-600/25 via-rose-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-700/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-rose-700/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 pt-20 pb-12 flex flex-col items-center">

        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 border border-orange-500/30 bg-orange-500/10 text-orange-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
            <Flame className="w-3.5 h-3.5" />
            AI-Powered Food Critic
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tight mb-5">
            Dare to be
            <br />
            <span className="text-fire">Rated?</span>
          </h1>
          <p className="text-white/40 text-lg max-w-md mx-auto mb-8">
            Upload your plate. Get brutally honest AI critiques. Find out if your cooking is actually good.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-8 py-4 rounded-2xl font-black text-lg hover:from-orange-400 hover:to-rose-400 transition-all glow-fire active:scale-95"
          >
            <Flame className="w-5 h-5" />
            Create Free Account
          </Link>
          <div className="mt-10 flex flex-wrap justify-center gap-8">
            {[
              { icon: <Star className="w-4 h-4 text-amber-400 fill-amber-400" />, label: "AI Ratings" },
              { icon: <Flame className="w-4 h-4 text-orange-400" />, label: "Trending Feed" },
              { icon: <Users className="w-4 h-4 text-rose-400" />, label: "Chef Community" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-white/30 font-semibold uppercase tracking-wider">
                {icon}{label}
              </div>
            ))}
          </div>
        </div>

        {/* Login form card */}
        <div className="w-full max-w-sm">
          <div className="border border-white/10 bg-white/[0.03] rounded-3xl p-7 backdrop-blur-sm">
            <h2 className="text-lg font-black text-white mb-1">Sign in</h2>
            <p className="text-white/30 text-sm mb-6">Already have an account?</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-white placeholder-white/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-white placeholder-white/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white py-3.5 rounded-xl font-black hover:from-orange-400 hover:to-rose-400 transition-all disabled:opacity-40 glow-fire mt-2"
          >
            <LogIn className="w-4 h-4" />
            {isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>

            <p className="text-center text-sm text-white/30 mt-6">
              No account?{" "}
              <Link href="/auth/signup" className="font-bold text-orange-400 hover:text-orange-300 transition-colors">
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
