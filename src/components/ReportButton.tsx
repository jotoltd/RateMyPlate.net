"use client";

import { useState, useTransition } from "react";
import { Flag, X, Loader2, CheckCircle2 } from "lucide-react";
import { submitReport } from "@/app/actions/admin";

const REASONS = [
  "Spam or misleading",
  "Not food",
  "Inappropriate or offensive",
  "Harassment",
  "Other",
];

export default function ReportButton({
  plateId,
  commentId,
}: {
  plateId?: string;
  commentId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!selected) return;
    const fd = new FormData();
    if (plateId) fd.set("plate_id", plateId);
    if (commentId) fd.set("comment_id", commentId);
    fd.set("reason", selected);
    startTransition(async () => {
      await submitReport(fd);
      setDone(true);
      setTimeout(() => { setOpen(false); setDone(false); setSelected(""); }, 1500);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Report"
        className="flex items-center gap-1 text-xs text-faint hover:text-red-400 transition-colors"
      >
        <Flag className="w-3.5 h-3.5" />
        Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-nav border border-app-1 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-app">Report {plateId ? "Plate" : "Comment"}</p>
              <button onClick={() => setOpen(false)} className="text-faint hover:text-app transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {done ? (
              <div className="flex items-center gap-2 text-emerald-400 font-semibold py-4">
                <CheckCircle2 className="w-5 h-5" /> Thanks, we&apos;ll review this.
              </div>
            ) : (
              <>
                <p className="text-sm text-muted mb-4">What&apos;s the issue?</p>
                <div className="space-y-2 mb-5">
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setSelected(r)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                        selected === r
                          ? "bg-red-500/15 border-red-500/40 text-red-400"
                          : "bg-surface-1 border-app-1 text-muted hover:border-red-500/20 hover:text-app"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!selected || isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl disabled:opacity-40 transition-colors"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                  Submit Report
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
