export default function HistoryLoading() {
  return (
    <div className="p-5 md:p-6 space-y-6" role="status" aria-label="Loading history">
      {/* Header + search */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="h-7 w-48 skeleton rounded-lg" />
          <div className="h-4 w-64 skeleton rounded" />
        </div>
        <div className="h-10 w-full sm:w-72 skeleton rounded-xl" />
      </div>
      {/* Table */}
      <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border/50">
          <div className="w-5 h-5 skeleton rounded shrink-0" />
          <div className="h-3 flex-1 max-w-[40%] skeleton rounded" />
          <div className="h-3 w-20 skeleton rounded" />
          <div className="h-3 w-16 skeleton rounded" />
          <div className="h-3 w-24 skeleton rounded" />
        </div>
        {/* Rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-border/30">
            <div className="w-5 h-5 skeleton rounded shrink-0" />
            <div className="h-4 flex-1 max-w-[40%] skeleton rounded" />
            <div className="h-6 w-20 skeleton rounded-full" />
            <div className="h-6 w-16 skeleton rounded-full" />
            <div className="h-3 w-24 skeleton rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
