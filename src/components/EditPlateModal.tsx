"use client";

import { useState, useTransition } from "react";
import { Pencil, X } from "lucide-react";
import { updatePlate } from "@/app/actions/plates";

type EditPlateModalProps = {
  plateId: string;
  initialTitle: string;
  initialDescription: string;
};

export default function EditPlateModal({
  plateId,
  initialTitle,
  initialDescription,
}: EditPlateModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) return setError("Title is required");
    startTransition(async () => {
      const result = await updatePlate(plateId, title.trim(), description.trim());
      if (result?.error) setError(result.error);
      else setOpen(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-app-1 text-sm font-medium text-muted bg-surface-1 hover:border-orange-500/40 hover:text-orange-400 transition-all"
      >
        <Pencil className="w-4 h-4" />
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-app border border-app-1 rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-app">Edit Plate</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl hover:bg-surface-2 transition-colors"
              >
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-1.5">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-surface-1 border border-app-1 rounded-xl px-4 py-2.5 text-sm text-app focus:outline-none focus:ring-2 focus:ring-orange-500"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-surface-1 border border-app-1 rounded-xl px-4 py-2.5 text-sm text-app placeholder-faint focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  maxLength={500}
                />
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-app-1 text-sm font-medium text-muted hover:bg-surface-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
