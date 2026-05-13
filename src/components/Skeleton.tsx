export function PlateCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white/5 animate-pulse" style={{ aspectRatio: "3/4" }}>
      <div className="w-full h-full bg-white/[0.04]" />
    </div>
  );
}

export function FeedSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PlateCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
      <div className="bg-white/[0.03] rounded-3xl border border-white/5 p-8 mb-8">
        <div className="flex gap-6">
          <div className="w-24 h-24 rounded-3xl bg-white/10 flex-shrink-0" />
          <div className="flex-1 space-y-3 pt-2">
            <div className="h-6 bg-white/10 rounded w-1/3" />
            <div className="h-4 bg-white/5 rounded w-1/2" />
            <div className="h-4 bg-white/5 rounded w-1/4" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <PlateCardSkeleton key={i} />)}
      </div>
    </div>
  );
}

export function ListRowSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] animate-pulse">
          <div className="w-7 h-4 bg-white/10 rounded flex-shrink-0" />
          <div className="w-14 h-14 rounded-xl bg-white/10 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded w-2/3" />
            <div className="h-3 bg-white/5 rounded w-1/3" />
          </div>
          <div className="w-12 h-7 bg-white/10 rounded-lg flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}
