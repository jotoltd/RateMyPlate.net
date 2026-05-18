"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChefHat, Mail, Lock, User, Flame, Eye, EyeOff, Star, Users, Sparkles } from "lucide-react";
import { signUp } from "@/app/actions/auth";
import GoogleSignInButton from "@/components/GoogleSignInButton";

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export default function SignupPage() {
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [stats, setStats] = useState<{ chefs: number; plates: number; ratings: number } | null>(null);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    startTransition(async () => {
      const result = await signUp(formData);
      if (result?.error) setError(result.error);
    });
  }

  const inputClass = "w-full pl-10 pr-4 py-3.5 bg-surface-1 border border-app-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-app placeholder-faint";

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-app relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-orange-600/20 to-transparent blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo + headline */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5 glow-fire">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-black text-app">Join Rate My Plate</h1>
          <p className="text-muted mt-1 text-sm">Free forever. No card needed.</p>
        </div>

        {/* Live social proof stats */}
        {stats && (
          <div className="flex items-center justify-center gap-5 mb-6">
            {[
              { icon: <Users className="w-3.5 h-3.5 text-orange-400" />, value: formatCount(stats.chefs), label: "chefs" },
              { icon: <Sparkles className="w-3.5 h-3.5 text-rose-400" />, value: formatCount(stats.plates), label: "plates" },
              { icon: <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />, value: formatCount(stats.ratings), label: "ratings" },
            ].map(({ icon, value, label }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1">
                  {icon}
                  <span className="text-base font-black text-app">{value}</span>
                </div>
                <span className="text-[10px] text-faint uppercase tracking-wide font-semibold">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Sample AI critique teaser */}
        <div className="mb-6 rounded-2xl border border-app-1 bg-surface-1 p-4 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center flex-shrink-0">
              <Flame className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">AI Ramsay says…</span>
          </div>
          <p className="text-sm text-muted italic leading-relaxed line-clamp-2 select-none">
            &ldquo;Finally, a pasta dish that doesn&apos;t make me want to throw it out the window — though the sauce is a tad watery. 7.4/10.&rdquo;
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            {[1,2,3,4].map(i => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
            <Star className="w-3.5 h-3.5 text-amber-400/40" />
            <span className="text-xs font-bold text-amber-400 ml-1">7.4 / 10</span>
          </div>
          {/* Blurred lock overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-1/60 backdrop-blur-[2px] rounded-2xl">
            <span className="text-2xl mb-1">🔒</span>
            <span className="text-xs font-bold text-app">Sign up to get yours</span>
          </div>
        </div>

        {/* Google OAuth */}
        <GoogleSignInButton label="Sign up with Google" />
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-app-1" />
          <span className="text-xs text-faintest font-semibold">or sign up with email</span>
          <div className="flex-1 h-px bg-app-1" />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {next && <input type="hidden" name="next" value={next} />}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
            <input name="username" type="text" required minLength={3} maxLength={30} placeholder="Choose a username" className={inputClass} autoComplete="username" autoFocus />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
            <input name="email" type="email" required placeholder="Email address" className={inputClass} autoComplete="email" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
            <input name="password" type={showPass ? "text" : "password"} required placeholder="Password (6+ characters)" className="w-full pl-10 pr-10 py-3.5 bg-surface-1 border border-app-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-app placeholder-faint" autoComplete="new-password" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-muted transition-colors">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white py-4 rounded-xl font-black text-base hover:from-orange-400 hover:to-rose-400 transition-all disabled:opacity-50 glow-fire mt-1 active:scale-[0.98]"
          >
            <Flame className="w-4 h-4" />
            {isPending ? "Creating account…" : "Create Free Account"}
          </button>
        </form>

        <p className="text-center text-[11px] text-faintest mt-4 leading-relaxed px-2">
          By signing up you agree to our{" "}
          <Link href="/legal#terms" target="_blank" className="text-faint hover:text-orange-400 underline">Terms</Link>
          {" "}and{" "}
          <Link href="/legal#privacy" target="_blank" className="text-faint hover:text-orange-400 underline">Privacy Policy</Link>.
        </p>

        <p className="text-center text-sm text-faint mt-5">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-bold text-orange-400 hover:text-orange-300 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
