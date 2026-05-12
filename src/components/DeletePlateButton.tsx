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
        <span className="text-sm text-gray-600">Delete?</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {isPending ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-medium text-red-500 hover:border-red-300 hover:bg-red-50 transition-all"
    >
      <Trash2 className="w-4 h-4" />
      Delete
    </button>
  );
}
