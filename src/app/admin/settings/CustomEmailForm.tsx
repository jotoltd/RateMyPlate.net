"use client";

import { useState, useTransition } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";

export default function CustomEmailForm({
  action,
}: {
  action: (fd: FormData) => Promise<{ sent?: number; error?: string } | undefined>;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ sent?: number; error?: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await action(fd);
      setResult(res ?? null);
    });
  }

  if (result?.sent !== undefined) {
    return (
      <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm py-2">
        <CheckCircle2 className="w-4 h-4" /> Sent to {result.sent} users
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        name="subject"
        required
        placeholder="Subject line"
        className="w-full bg-surface-2 border border-app-1 rounded-xl px-4 py-2.5 text-app text-sm focus:outline-none focus:border-violet-500/60 transition-colors"
      />
      <textarea
        name="body"
        required
        rows={4}
        placeholder="Email body (plain text, newlines preserved)"
        className="w-full bg-surface-2 border border-app-1 rounded-xl px-4 py-2.5 text-app text-sm focus:outline-none focus:border-violet-500/60 transition-colors resize-none"
      />
      {result?.error && <p className="text-xs text-red-400">{result.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {isPending ? "Sending…" : "Send to All Users"}
      </button>
    </form>
  );
}
