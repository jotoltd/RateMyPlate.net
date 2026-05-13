"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { adminDeletePlate, adminDeleteComment } from "@/app/actions/admin";

export default function AdminDeleteButton({ id, type }: { id: string; type: "plate" | "comment" }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete this ${type}? This cannot be undone.`)) return;
    startTransition(async () => {
      if (type === "plate") await adminDeletePlate(id);
      else await adminDeleteComment(id);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      title={`Delete ${type}`}
      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
