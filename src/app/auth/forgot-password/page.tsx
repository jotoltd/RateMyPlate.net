"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Flame, CheckCircle2 } from "lucide-react";
import { forgotPassword } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await forgotPassword(fd);
      if (result?.error) setError(result.error);
      else setSent(true);
    });
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-app relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-orange-600/20 to-transparent blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-faint hover:text-orange-400 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-orange-500/25">
            <Flame className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-black text-app">Forgot password?</h1>
          <p className="text-muted mt-1 text-sm">We&apos;ll send a reset link to your email</p>
        </div>

        {sent ? (
          <div className="border border-app-1 bg-surface-1 rounded-3xl p-7 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <p className="text-app font-bold text-lg mb-2">Check your inbox</p>
            <p className="text-muted text-sm mb-6">
              We sent a reset link to <span className="text-app font-medium">{email}</span>
            </p>
            <Link href="/auth/login" className="text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors">
              Back to sign in
            </Link>
          </div>
        ) : (
          <div className="border border-app-1 bg-surface-1 rounded-3xl p-7">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-5">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                  <input
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-surface-1 border border-app-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-app placeholder-faint"
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
