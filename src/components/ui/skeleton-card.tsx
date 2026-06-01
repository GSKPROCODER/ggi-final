import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonCardProps {
  className?: string;
}

/**
 * KPI-shaped loading skeleton that mirrors the layout of KpiCard
 * (icon tile, large value, title, subtitle) to avoid layout shift.
 */
export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('glass-card p-5 rounded-2xl border border-border/50', className)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl skeleton" />
        <div className="w-12 h-6 rounded-full skeleton" />
      </div>
      <div className="h-8 w-24 rounded-lg skeleton mb-2" />
      <div className="h-4 w-28 rounded skeleton mb-1.5" />
      <div className="h-3 w-20 rounded skeleton" />
    </div>
  );
}
