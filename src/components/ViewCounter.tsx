"use client";

import { useEffect } from "react";
import { Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ViewCounter({ plateId, initialCount }: { plateId: string; initialCount: number }) {
  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("increment_view_count", { plate_id: plateId });
  }, [plateId]);

  return (
    <span className="flex items-center gap-1 text-white/30 text-sm">
      <Eye className="w-3.5 h-3.5" />
      {(initialCount + 1).toLocaleString()}
    </span>
  );
}
