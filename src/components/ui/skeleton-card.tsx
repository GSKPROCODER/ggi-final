import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('glass-card p-5 rounded-2xl border border-border/50 h-36 skeleton', className)}
    />
  );
}
