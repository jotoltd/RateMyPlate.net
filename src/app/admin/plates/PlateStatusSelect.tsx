"use client";

import { useTransition } from "react";
import { adminChangePlateStatus } from "@/app/actions/admin";

export default function PlateStatusSelect({ plateId, current }: { plateId: string; current: string }) {
  const [isPending, startTransition] = useTransition();

  const colors: Record<string, string> = {
    approved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    pending: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    rejected: "text-red-400 bg-red-500/10 border-red-500/30",
  };

  return (
    <select
      defaultValue={current}
      disabled={isPending}
      onChange={(e) => {
        const val = e.target.value as "approved" | "pending" | "rejected";
        startTransition(async () => { await adminChangePlateStatus(plateId, val); });
      }}
      className={`text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer disabled:opacity-50 transition-colors ${colors[current] ?? "text-faint bg-surface-1 border-app-1"}`}
    >
      <option value="approved">approved</option>
      <option value="pending">pending</option>
      <option value="rejected">rejected</option>
    </select>
  );
}
