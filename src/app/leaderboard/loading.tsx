import { ListRowSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-surface-2 animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-36 bg-surface-2 rounded animate-pulse" />
          <div className="h-3 w-24 bg-surface-2 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex gap-1 bg-surface-1 rounded-2xl p-1 mb-6 w-64 h-10 animate-pulse" />
      <div className="flex gap-2 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-7 w-16 rounded-full bg-surface-2 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[1, 0, 2].map((i) => (
          <div key={i} className="rounded-3xl bg-surface-1 animate-pulse" style={{ height: i === 0 ? 220 : 180 }} />
        ))}
      </div>
      <ListRowSkeleton count={7} />
    </div>
  );
}
