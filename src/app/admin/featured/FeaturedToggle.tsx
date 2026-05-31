"use client";

import { useState } from "react";
import { Star, X, Check } from "lucide-react";
import { toggleFeaturePlate } from "./actions";

interface FeaturedToggleProps {
  plateId: string;
  isFeatured: boolean;
  featuredId?: string;
  category?: string;
  position?: number;
  reason?: string;
}

export function FeaturedToggle({
  plateId,
  isFeatured: initialFeatured,
  featuredId,
  category: initialCategory = "homepage",
  position: initialPosition = 0,
  reason: initialReason = "",
}: FeaturedToggleProps) {
  const [isFeatured, setIsFeatured] = useState(initialFeatured);
  const [isLoading, setIsLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [category, setCategory] = useState(initialCategory);
  const [position, setPosition] = useState(initialPosition);
  const [reason, setReason] = useState(initialReason);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const result = await toggleFeaturePlate({
        plateId,
        action: isFeatured ? "unfeature" : "feature",
        featuredId,
        category: isFeatured ? undefined : category,
        position: isFeatured ? undefined : position,
        reason: isFeatured ? undefined : reason,
      });
      if (result.success) {
        setIsFeatured(!isFeatured);
        setShowEdit(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isFeatured) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowEdit(!showEdit)}
          className="px-3 py-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className="p-1.5 text-faint hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {!showEdit ? (
        <button
          onClick={() => setShowEdit(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-400 border border-orange-500/30 rounded-lg hover:bg-orange-500/10 transition-colors"
        >
          <Star className="w-3.5 h-3.5" />
          Feature
        </button>
      ) : (
        <div className="flex flex-col gap-2 w-48">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-2 py-1.5 text-xs bg-surface-2 border border-app-1 rounded-lg text-app"
          >
            <option value="homepage">Homepage</option>
            <option value="trending">Trending</option>
            <option value="editor_pick">Editor Pick</option>
          </select>
          <input
            type="number"
            value={position}
            onChange={(e) => setPosition(parseInt(e.target.value) || 0)}
            placeholder="Position"
            className="px-2 py-1.5 text-xs bg-surface-2 border border-app-1 rounded-lg text-app"
          />
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="px-2 py-1.5 text-xs bg-surface-2 border border-app-1 rounded-lg text-app"
          />
          <div className="flex gap-2">
            <button
              onClick={handleToggle}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {isLoading ? "..." : "Add"}
            </button>
            <button
              onClick={() => setShowEdit(false)}
              className="px-2 py-1.5 text-xs text-faint hover:text-app transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
