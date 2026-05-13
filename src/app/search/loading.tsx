export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="h-8 w-24 bg-surface-2 rounded-xl animate-pulse mb-6" />
      <div className="h-12 bg-surface-2 rounded-2xl animate-pulse mb-8" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-surface-1 animate-pulse">
            <div className="w-16 h-16 rounded-xl bg-surface-2 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surface-2 rounded w-2/3" />
              <div className="h-3 bg-surface-2 rounded w-1/3" />
            </div>
            <div className="w-14 h-8 bg-surface-2 rounded-lg flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
