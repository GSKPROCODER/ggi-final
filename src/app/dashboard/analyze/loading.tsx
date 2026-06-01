export default function AnalyzeLoading() {
  return (
    <div className="p-5 md:p-6 space-y-6" role="status" aria-label="Loading analyzer">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl skeleton shrink-0" />
        <div className="space-y-2">
          <div className="h-6 w-40 skeleton rounded-lg" />
          <div className="h-3 w-56 skeleton rounded" />
        </div>
      </div>
      {/* Mode tabs */}
      <div className="h-10 w-56 skeleton rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card rounded-2xl border border-border/50 p-6">
            <div className="h-40 skeleton rounded-xl mb-4" />
            <div className="h-10 w-32 skeleton rounded-lg" />
          </div>
        </div>
        <div className="glass-card rounded-2xl border border-border/50 p-6 space-y-3">
          <div className="h-4 w-24 skeleton rounded" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 skeleton rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
