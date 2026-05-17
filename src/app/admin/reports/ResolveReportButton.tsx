"use client";

import { useTransition } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { adminResolveReport } from "@/app/actions/admin";

export default function ResolveReportButton({ reportId }: { reportId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(async () => { await adminResolveReport(reportId); })}
      disabled={isPending}
      title="Mark resolved"
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-colors disabled:opacity-40"
    >
      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
      Resolve
    </button>
  );
}
