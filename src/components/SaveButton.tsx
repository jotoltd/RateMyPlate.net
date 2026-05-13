"use client";

import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toggleSave } from "@/app/actions/collections";

export default function SaveButton({
  plateId,
  initialSaved,
}: {
  plateId: string;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleSave(plateId);
      if (!result?.error && result.saved !== undefined) setSaved(result.saved);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      title={saved ? "Remove from saved" : "Save plate"}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all border disabled:opacity-50 ${
        saved
          ? "bg-violet-500/15 border-violet-500/30 text-violet-400 hover:bg-violet-500/25"
          : "bg-surface-1 border-app-1 text-muted hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-400"
      }`}
    >
      {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
      {saved ? "Saved" : "Save"}
    </button>
  );
}
