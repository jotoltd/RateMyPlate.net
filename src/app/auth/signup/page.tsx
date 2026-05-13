"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChefHat, Mail, Lock, User, Sparkles, Eye, EyeOff } from "lucide-react";
import { signUp } from "@/app/actions/auth";

export default function SignupPage() {
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    startTransition(async () => {
      const result = await signUp(formData);
      if (result?.error) setError(result.error);
    });
  }

  const inputClass = "w-full pl-10 pr-4 py-3 bg-surface-1 border border-app-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-app placeholder-faint";
  const labelClass = "block text-xs font-bold text-muted uppercase tracking-widest mb-2";

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-app relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-orange-600/20 to-transparent blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5 glow-fire">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-black text-app">Dare to be Rated?</h1>
          <p className="text-muted mt-1 text-sm">Create your free account</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
              <input name="username" type="text" required minLength={3} maxLength={30} placeholder="your_username" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
              <input name="email" type="email" required placeholder="you@example.com" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
              <input name="password" type={showPass ? "text" : "password"} required placeholder="Min. 6 characters" className="w-full pl-10 pr-10 py-3 bg-surface-1 border border-app-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-app placeholder-faint" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-muted transition-colors">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
              <input name="confirm" type={showPass ? "text" : "password"} required placeholder="Repeat your password" className={inputClass} />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white py-3.5 rounded-xl font-black hover:from-orange-400 hover:to-rose-400 transition-all disabled:opacity-40 glow-fire mt-2"
          >
            <Sparkles className="w-4 h-4" />
            {isPending ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-faint mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-bold text-orange-400 hover:text-orange-300 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
