"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAccount } from "@/app/actions/auth";

export default function DeleteAccountButton() {
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteAccount();
    });
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="flex items-center gap-2 text-sm font-semibold text-red-400 border border-red-500/30 px-4 py-2.5 rounded-xl hover:bg-red-500/10 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Delete my account
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-red-300 font-semibold">Are you absolutely sure? This cannot be undone.</p>
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="flex items-center gap-2 text-sm font-bold text-white bg-red-500 px-4 py-2.5 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          {isPending ? "Deleting…" : "Yes, delete everything"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-sm text-muted hover:text-app px-4 py-2.5 rounded-xl border border-app-1 hover:bg-surface-2 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
