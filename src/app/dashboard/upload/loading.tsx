export default function UploadLoading() {
  return (
    <div className="p-5 md:p-6 space-y-8 w-full" role="status" aria-label="Loading upload">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-40 skeleton rounded-lg" />
        <div className="h-4 w-72 max-w-full skeleton rounded" />
      </div>
      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-full skeleton shrink-0" />
            <div className="h-3 flex-1 skeleton rounded hidden sm:block" />
          </div>
        ))}
      </div>
      {/* Drop zone */}
      <div className="h-64 skeleton rounded-2xl" />
    </div>
  );
}
