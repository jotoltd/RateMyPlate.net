"use client";

import { useSearchParams } from "next/navigation";
import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { ChefHat, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { verifyEmail, resendConfirmation } from "@/app/actions/auth";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isResending, startResend] = useTransition();
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input
  useEffect(() => { refs.current[0]?.focus(); }, []);

  function handleChange(i: number, val: string) {
    // Handle paste of full code
    if (val.length === 6 && /^\d{6}$/.test(val)) {
      const next = val.split("");
      setDigits(next);
      refs.current[5]?.focus();
      return;
    }
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = digit;
    setDigits(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      refs.current[5]?.focus();
      e.preventDefault();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < 6) { setError("Please enter the full 6-digit code."); return; }
    setError("");
    const fd = new FormData();
    fd.set("email", email);
    fd.set("code", code);
    startTransition(async () => {
      const res = await verifyEmail(fd);
      if (res?.error) {
        setError(res.error);
        setDigits(["", "", "", "", "", ""]);
        refs.current[0]?.focus();
      }
    });
  }

  function handleResend() {
    setResent(false);
    startResend(async () => {
      await resendConfirmation(email);
      setResent(true);
      setDigits(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
    });
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 bg-app relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-b from-orange-600/15 to-transparent blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center mb-10">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25 glow-fire">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-app mb-2">One last step 🔥</h1>
          <p className="text-muted text-sm leading-relaxed">
            We emailed a 6-digit code to
          </p>
          {email && (
            <p className="font-bold text-orange-400 text-sm mt-1 break-all">{email}</p>
          )}
          <p className="text-xs text-faintest mt-2">Check your spam folder if you don&apos;t see it.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 6-digit OTP inputs */}
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-2xl font-black rounded-xl border-2 bg-surface-1 text-app transition-all focus:outline-none focus:ring-0 ${
                  d
                    ? "border-orange-500 bg-orange-500/5"
                    : "border-app-1 focus:border-orange-500"
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-rose-400 text-sm font-semibold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending || digits.join("").length < 6}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black py-4 rounded-2xl text-base hover:from-orange-400 hover:to-rose-400 transition-all disabled:opacity-40 shadow-lg shadow-orange-500/20 active:scale-[0.98]"
          >
            {isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
              : "Confirm my account →"
            }
          </button>
        </form>

        {/* Resend */}
        <div className="mt-6 text-center">
          {resent ? (
            <p className="text-emerald-400 text-sm font-semibold">✓ New code sent!</p>
          ) : (
            <button
              onClick={handleResend}
              disabled={isResending}
              className="flex items-center gap-2 mx-auto text-sm text-faint hover:text-muted font-semibold transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
              {isResending ? "Sending…" : "Didn't get it? Resend code"}
            </button>
          )}
          <p className="text-faintest text-xs mt-2">Code expires in 15 minutes. Check spam too.</p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/auth/signup" className="inline-flex items-center gap-2 text-sm text-faint hover:text-app font-semibold transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
