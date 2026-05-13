export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-4 w-24 bg-surface-2 rounded-lg mb-6" />
      <div className="h-7 w-32 bg-surface-2 rounded-xl mb-8" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-surface-2" />
            <div className="h-4 w-28 bg-surface-2 rounded-lg" />
          </div>
          <div className="bg-surface-1 border border-app-1 rounded-3xl p-6 space-y-3">
            <div className="h-4 w-3/4 bg-surface-2 rounded-lg" />
            <div className="h-4 w-1/2 bg-surface-2 rounded-lg" />
            <div className="h-9 w-full bg-surface-2 rounded-xl mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
