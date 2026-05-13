"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deletePlate } from "@/app/actions/plates";

export default function DeletePlateButton({ plateId }: { plateId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      await deletePlate(plateId);
      router.push("/");
    });
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">Delete?</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {isPending ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="px-3 py-1.5 rounded-xl border border-app-1 text-sm font-medium text-muted hover:bg-surface-2 transition-colors bg-surface-1"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-app-1 text-sm font-medium text-red-400 bg-surface-1 hover:border-red-500/40 hover:bg-red-500/10 transition-all"
    >
      <Trash2 className="w-4 h-4" />
      Delete
    </button>
  );
}
