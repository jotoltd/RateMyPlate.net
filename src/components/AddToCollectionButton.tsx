"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FolderPlus, Check, ChevronDown } from "lucide-react";
import { addPlateToCollection } from "@/app/actions/collections-boards";

type Collection = { id: string; name: string };

export default function AddToCollectionButton({
  plateId,
  collections,
}: {
  plateId: string;
  collections: Collection[];
}) {
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(collectionId: string) {
    startTransition(async () => {
      await addPlateToCollection(collectionId, plateId);
      setAdded(collectionId);
      setTimeout(() => { setAdded(null); setOpen(false); }, 1500);
    });
  }

  if (collections.length === 0) {
    return (
      <Link
        href="/collections"
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-app-1 text-sm font-medium text-muted bg-surface-1 hover:border-violet-500/40 hover:text-violet-400 transition-all"
      >
        <FolderPlus className="w-4 h-4" />
        Collections
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-app-1 text-sm font-medium text-muted bg-surface-1 hover:border-violet-500/40 hover:text-violet-400 transition-all"
      >
        <FolderPlus className="w-4 h-4" />
        Collect
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-56 bg-nav border border-app-1 rounded-2xl shadow-2xl overflow-hidden z-10">
          <p className="text-xs font-bold text-faint uppercase tracking-widest px-4 pt-3 pb-2">Add to collection</p>
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => handleAdd(col.id)}
              disabled={isPending}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-muted hover:bg-surface-1 hover:text-app transition-colors text-left"
            >
              <span className="truncate">{col.name}</span>
              {added === col.id && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 ml-2" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
