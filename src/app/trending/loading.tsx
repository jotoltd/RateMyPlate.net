import { ListRowSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-surface-2 animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-28 bg-surface-2 rounded animate-pulse" />
          <div className="h-3 w-20 bg-surface-2 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex gap-1 bg-surface-1 rounded-2xl p-1 mb-6 w-56 h-10 animate-pulse" />
      <div className="flex gap-2 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-7 w-16 rounded-full bg-surface-2 animate-pulse" />
        ))}
      </div>
      <ListRowSkeleton count={10} />
    </div>
  );
}
