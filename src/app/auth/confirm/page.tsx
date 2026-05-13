"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function confirm() {
      const supabase = createClient();

      // Supabase appends token_hash + type to the URL
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type") as "email" | "recovery" | "invite" | null;

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (error) {
          setErrorMsg(error.message);
          setStatus("error");
        } else {
          setStatus("success");
          setTimeout(() => router.push("/"), 2500);
        }
        return;
      }

      // Fallback: check if already signed in via magic link hash
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus("success");
        setTimeout(() => router.push("/"), 2500);
      } else {
        setErrorMsg("Invalid or expired confirmation link.");
        setStatus("error");
      }
    }
    confirm();
  }, [router, searchParams]);

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-app relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-orange-600/15 to-transparent blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm text-center">
        <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/25">
          <Flame className="w-7 h-7 text-white" />
        </div>

        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 text-orange-400 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-black text-app mb-2">Confirming your email…</h1>
            <p className="text-muted text-sm">Just a moment</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-2xl font-black text-app mb-2">Email confirmed!</h1>
            <p className="text-muted text-sm mb-6">Welcome to Rate My Plate. Redirecting you now…</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
              Go to feed
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-black text-app mb-2">Confirmation failed</h1>
            <p className="text-muted text-sm mb-6">{errorMsg}</p>
            <div className="flex gap-3 justify-center">
              <Link href="/auth/login" className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity text-sm">
                Sign in
              </Link>
              <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-surface-1 border border-app-1 text-muted px-5 py-2.5 rounded-xl font-bold hover:bg-surface-2 transition-colors text-sm">
                Sign up
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
