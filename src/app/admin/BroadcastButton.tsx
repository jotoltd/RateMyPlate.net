"use client";

import { useState, useTransition } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";

export default function BroadcastButton({
  action,
  label,
  confirmText,
  colorClass = "bg-orange-600 hover:bg-orange-500",
  count,
}: {
  action: () => Promise<{ sent: number; error?: string }>;
  label: string;
  confirmText: string;
  colorClass?: string;
  count?: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ sent: number } | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function handleClick() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    startTransition(async () => {
      const res = await action();
      setResult(res);
      setConfirmed(false);
    });
  }

  if (result) {
    return (
      <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-bold rounded-xl">
        <CheckCircle2 className="w-4 h-4" />
        Sent to {result.sent} {result.sent === 1 ? "person" : "people"}
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 ${
        confirmed ? "bg-red-600 hover:bg-red-500 animate-pulse" : colorClass
      }`}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Send className="w-4 h-4" />
      )}
      {isPending
        ? "Sending…"
        : confirmed
        ? `⚠️ ${confirmText} — Click to confirm`
        : `${label}${count !== undefined ? ` (${count})` : ""}`}
    </button>
  );
}
