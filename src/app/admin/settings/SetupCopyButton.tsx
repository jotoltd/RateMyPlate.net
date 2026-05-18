"use client";

import { useState } from "react";
import { Copy, CheckCircle2 } from "lucide-react";

export default function SetupCopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-2 bg-surface-2 border border-app-1 rounded-xl px-4 py-2.5">
      <code className="flex-1 text-xs text-orange-400 font-mono break-all">{value}</code>
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1.5 text-xs font-bold text-faint hover:text-app transition-colors flex-shrink-0"
      >
        {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Copied" : label}
      </button>
    </div>
  );
}
