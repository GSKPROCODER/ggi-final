import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Thin wrapper around the .glass-card utility. Use instead of repeating the
 * raw class string in pages.
 */
const GlassCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function GlassCard({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn('glass-card rounded-2xl border border-border/50 p-6', className)}
        {...props}
      />
    );
  },
);

export { GlassCard };
