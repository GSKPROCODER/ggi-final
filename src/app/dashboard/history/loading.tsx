export default function HistoryLoading() {
  return (
    <div className="p-5 md:p-6 space-y-6" role="status" aria-label="Loading history">
      <div className="h-9 w-56 skeleton rounded-lg" />
      <div className="h-12 skeleton rounded-xl" />
      <div className="h-96 skeleton rounded-2xl" />
    </div>
  );
}
