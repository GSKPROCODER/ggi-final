export default function AlertsLoading() {
  return (
    <div className="p-5 md:p-8 space-y-6" role="status" aria-label="Loading alerts">
      <div className="h-9 w-32 skeleton rounded-lg" />
      <div className="grid grid-cols-3 gap-4">
        <div className="h-24 skeleton rounded-2xl" />
        <div className="h-24 skeleton rounded-2xl" />
        <div className="h-24 skeleton rounded-2xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 skeleton rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
