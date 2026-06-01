export default function AlertsLoading() {
  return (
    <div className="p-5 md:p-6 space-y-6" role="status" aria-label="Loading alerts">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="h-7 w-32 skeleton rounded-lg" />
          <div className="h-4 w-56 skeleton rounded" />
        </div>
        <div className="h-9 w-28 skeleton rounded-xl" />
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl border border-border/50 p-4">
            <div className="h-3 w-16 skeleton rounded mb-3" />
            <div className="h-7 w-10 skeleton rounded" />
          </div>
        ))}
      </div>
      {/* Alert cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl border border-border/50 p-4 flex items-start gap-4">
            <div className="w-2.5 h-2.5 rounded-full skeleton mt-1.5 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 skeleton rounded" />
              <div className="h-3 w-2/3 skeleton rounded" />
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
