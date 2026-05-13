"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { removePlateFromCollection } from "@/app/actions/collections-boards";

export default function RemovePlateButton({ collectionId, plateId }: { collectionId: string; plateId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => removePlateFromCollection(collectionId, plateId))}
      disabled={isPending}
      title="Remove from collection"
      className="w-7 h-7 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
    >
      <X className="w-3.5 h-3.5" />
    </button>
  );
}
