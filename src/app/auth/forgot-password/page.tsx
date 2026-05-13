"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Flame, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) setError(error.message);
      else setSent(true);
    });
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-orange-600/20 to-transparent blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-orange-400 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-orange-500/25">
            <Flame className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">Forgot password?</h1>
          <p className="text-white/40 mt-1 text-sm">We'll send a reset link to your email</p>
        </div>

        {sent ? (
          <div className="border border-white/10 bg-white/[0.03] rounded-3xl p-7 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <p className="text-white font-bold text-lg mb-2">Check your inbox</p>
            <p className="text-white/40 text-sm mb-6">
              We sent a reset link to <span className="text-white/70 font-medium">{email}</span>
            </p>
            <Link href="/auth/login" className="text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors">
              Back to sign in
            </Link>
          </div>
        ) : (
          <div className="border border-white/10 bg-white/[0.03] rounded-3xl p-7">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-5">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-white placeholder-white/20"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white py-3.5 rounded-xl font-black hover:from-orange-400 hover:to-rose-400 transition-all disabled:opacity-40 mt-2"
              >
                {isPending ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
