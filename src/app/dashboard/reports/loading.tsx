export default function ReportsLoading() {
  return (
    <div className="p-5 md:p-6 space-y-6" role="status" aria-label="Loading reports">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="h-7 w-40 skeleton rounded-lg" />
          <div className="h-4 w-64 skeleton rounded" />
        </div>
        <div className="h-9 w-36 skeleton rounded-xl" />
      </div>
      {/* Report rows */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl border border-border/50 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl skeleton shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 skeleton rounded" />
              <div className="h-3 w-1/4 skeleton rounded" />
            </div>
            <div className="flex gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg skeleton" />
              <div className="w-8 h-8 rounded-lg skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
