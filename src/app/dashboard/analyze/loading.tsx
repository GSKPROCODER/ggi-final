export default function AnalyzeLoading() {
  return (
    <div className="p-5 md:p-8 space-y-6" role="status" aria-label="Loading analyzer">
      <div className="h-9 w-48 skeleton rounded-lg" />
      <div className="h-10 w-48 skeleton rounded-xl" />
      <div className="h-48 skeleton rounded-2xl" />
      <div className="h-64 skeleton rounded-2xl" />
    </div>
  );
}
