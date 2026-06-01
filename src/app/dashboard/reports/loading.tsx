export default function ReportsLoading() {
  return (
    <div className="p-5 md:p-8 space-y-6" role="status" aria-label="Loading reports">
      <div className="h-9 w-40 skeleton rounded-lg" />
      <div className="h-12 skeleton rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 skeleton rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
