export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-white/5 animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-32 bg-white/5 rounded animate-pulse" />
          <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
      <div className="bg-white/[0.03] rounded-3xl border border-white/10 p-5 mb-8 animate-pulse">
        <div className="h-3 w-28 bg-white/5 rounded mb-4" />
        <div className="h-10 bg-white/5 rounded-xl mb-3" />
        <div className="h-16 bg-white/5 rounded-xl mb-3" />
        <div className="h-9 w-36 bg-white/5 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-3xl bg-white/[0.03] border border-white/5 p-5 animate-pulse">
            <div className="w-10 h-10 rounded-2xl bg-white/10 mb-4" />
            <div className="h-5 bg-white/10 rounded w-3/4 mb-2" />
            <div className="h-3 bg-white/5 rounded w-1/2 mb-3" />
            <div className="h-3 bg-white/5 rounded w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
