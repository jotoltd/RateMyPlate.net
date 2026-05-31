"use client";

import { Upload, CheckCircle2, Loader2 } from "lucide-react";

interface UploadProgressProps {
  progress: number; // 0-100
  status: "uploading" | "processing" | "complete" | "error";
  error?: string;
}

export default function UploadProgress({ progress, status, error }: UploadProgressProps) {
  const steps = [
    { id: "uploading", label: "Uploading image...", icon: Upload },
    { id: "processing", label: "Getting Ramsay rating...", icon: Loader2 },
    { id: "complete", label: "Published!", icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === status);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress bar */}
      <div className="h-2 bg-surface-2 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-rose-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStepIndex;
          const isComplete = index < currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 transition-all duration-300 ${
                isActive ? "opacity-100" : isComplete ? "opacity-60" : "opacity-30"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-orange-500/20 text-orange-400 animate-pulse"
                    : isComplete
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-surface-2 text-faint"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive && step.id === "processing" ? "animate-spin" : ""}`} />
              </div>
              <span
                className={`text-sm font-medium ${
                  isActive ? "text-app" : isComplete ? "text-muted" : "text-faint"
                }`}
              >
                {step.label}
              </span>
              {isComplete && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
