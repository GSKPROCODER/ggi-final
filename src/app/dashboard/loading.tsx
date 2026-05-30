import { SkeletonCard } from '@/components/ui/skeleton-card';

export default function DashboardLoading() {
  return (
    <div className="p-5 md:p-6 space-y-6" role="status" aria-label="Loading dashboard">
      <div className="space-y-2">
        <div className="h-8 w-64 skeleton rounded-lg" />
        <div className="h-4 w-96 max-w-full skeleton rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="h-80 skeleton rounded-2xl" />
        <div className="h-80 skeleton rounded-2xl" />
      </div>
    </div>
  );
}
