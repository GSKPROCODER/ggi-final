import { SkeletonCard } from '@/components/ui/skeleton-card';

export default function DashboardLoading() {
  return (
    <div className="p-5 md:p-6 space-y-6" role="status" aria-label="Loading dashboard">
      <div className="space-y-2">
        <div className="h-8 w-64 skeleton rounded-lg" />
        <div className="h-4 w-96 max-w-full skeleton rounded-lg" />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl border border-border/50 p-6 lg:col-span-2">
          <div className="h-5 w-40 skeleton rounded mb-2" />
          <div className="h-3 w-28 skeleton rounded mb-6" />
          <div className="h-48 skeleton rounded-xl" />
        </div>
        <div className="glass-card rounded-2xl border border-border/50 p-6">
          <div className="h-5 w-36 skeleton rounded mb-2" />
          <div className="h-3 w-24 skeleton rounded mb-6" />
          <div className="h-48 skeleton rounded-xl" />
        </div>
      </div>
    </div>
  );
}
