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
          ? "bg-violet-50 border-violet-200 text-violet-600 hover:bg-violet-100 dark:bg-violet-900/20 dark:border-violet-700 dark:text-violet-400"
          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600 dark:bg-gray-800 dark:border-gray-700"
      }`}
    >
      {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
      {saved ? "Saved" : "Save"}
    </button>
  );
}
