import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ConfidenceBarProps {
  score: number;
  showLabel?: boolean;
  className?: string;
}

function ConfidenceBarImpl({ score, showLabel = true, className }: ConfidenceBarProps) {
  const value = Math.max(0, Math.min(100, score));
  return (
    <div
      className={cn('flex items-center gap-2 text-xs', className)}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Confidence score"
    >
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-[width] duration-300"
          style={{ width: `${value}%` }}
        />
      </div>
      {showLabel && <span className="text-muted-foreground tabular-nums">{value.toFixed(0)}%</span>}
    </div>
  );
}

export const ConfidenceBar = React.memo(ConfidenceBarImpl);
