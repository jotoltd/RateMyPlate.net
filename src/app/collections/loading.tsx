export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-surface-2 animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-32 bg-surface-2 rounded animate-pulse" />
          <div className="h-3 w-20 bg-surface-2 rounded animate-pulse" />
        </div>
      </div>
      <div className="bg-surface-1 rounded-3xl border border-app-1 p-5 mb-8 animate-pulse">
        <div className="h-3 w-28 bg-surface-2 rounded mb-4" />
        <div className="h-10 bg-surface-2 rounded-xl mb-3" />
        <div className="h-16 bg-surface-2 rounded-xl mb-3" />
        <div className="h-9 w-36 bg-surface-2 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-3xl bg-surface-1 border border-app-1 p-5 animate-pulse">
            <div className="w-10 h-10 rounded-2xl bg-surface-2 mb-4" />
            <div className="h-5 bg-surface-2 rounded w-3/4 mb-2" />
            <div className="h-3 bg-surface-2 rounded w-1/2 mb-3" />
            <div className="h-3 bg-surface-2 rounded w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
