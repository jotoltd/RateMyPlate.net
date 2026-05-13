"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, ChefHat, ArrowLeft, RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { resendConfirmation } from "@/app/actions/auth";

export default function CheckEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [resent, setResent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleResend() {
    startTransition(async () => {
      await resendConfirmation(email);
      setResent(true);
    });
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 bg-app relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-b from-orange-600/15 to-transparent blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm text-center">
        {/* Logo */}
        <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-orange-500/25 glow-fire">
          <ChefHat className="w-7 h-7 text-white" />
        </div>

        {/* Email envelope animation */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-500/20 to-rose-500/20 border border-orange-500/30 rounded-3xl flex items-center justify-center">
            <Mail className="w-10 h-10 text-orange-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-orange-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <span className="text-white text-[10px] font-black">1</span>
          </div>
        </div>

        <h1 className="text-3xl font-black text-app mb-3">Check your email</h1>
        <p className="text-muted text-sm leading-relaxed mb-2">
          We sent a confirmation link to
        </p>
        {email && (
          <p className="font-bold text-orange-400 text-sm mb-5 break-all">{email}</p>
        )}
        <p className="text-faint text-sm leading-relaxed mb-8">
          Click the link in that email to activate your account and start getting rated.
        </p>

        {/* Steps */}
        <div className="bg-surface-1 border border-app-1 rounded-2xl p-5 mb-6 text-left space-y-3">
          {[
            { n: "1", text: "Open your email inbox" },
            { n: "2", text: `Find an email from Rate My Plate` },
            { n: "3", text: "Click \"Confirm your email\"" },
            { n: "4", text: "You'll be logged in automatically" },
          ].map(({ n, text }) => (
            <div key={n} className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-rose-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-black shadow-sm">
                {n}
              </div>
              <p className="text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>

        {/* Resend */}
        {resent ? (
          <p className="text-emerald-400 text-sm font-semibold mb-4">✓ Confirmation email resent!</p>
        ) : (
          <button
            onClick={handleResend}
            disabled={isPending}
            className="flex items-center gap-2 mx-auto text-sm text-faint hover:text-muted font-semibold transition-colors disabled:opacity-40 mb-4"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            Didn&apos;t get it? Resend email
          </button>
        )}

        <p className="text-faint text-xs mb-6">Check your spam folder if you don&apos;t see it within a minute.</p>

        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-app font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
