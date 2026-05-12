"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS = ["", "Poor 😬", "Okay 😐", "Good 👍", "Great 🔥", "Exceptional ✨"];

type StarRatingProps = {
  value: number; // 1-5
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
};

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-9 h-9",
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={cn(
              "transition-all duration-150",
              !readonly && "hover:scale-125 cursor-pointer active:scale-110",
              readonly && "cursor-default"
            )}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-all duration-150",
                star <= active
                  ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]"
                  : "text-white/10 fill-white/10"
              )}
            />
          </button>
        ))}
      </div>
      {!readonly && active > 0 && (
        <span className="ml-2 text-sm font-bold text-amber-400 whitespace-nowrap">
          {LABELS[active]}
        </span>
      )}
      {readonly && value > 0 && (
        <span className="ml-1 text-xs font-semibold text-white/30 whitespace-nowrap">
          {value}/5
        </span>
      )}
    </div>
  );
}
