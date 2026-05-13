export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="h-8 w-24 bg-white/5 rounded-xl animate-pulse mb-6" />
      <div className="h-12 bg-white/5 rounded-2xl animate-pulse mb-8" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] animate-pulse">
            <div className="w-16 h-16 rounded-xl bg-white/10 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-2/3" />
              <div className="h-3 bg-white/5 rounded w-1/3" />
            </div>
            <div className="w-14 h-8 bg-white/10 rounded-lg flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
