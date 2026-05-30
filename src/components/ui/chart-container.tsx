'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChartContainerProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
  /** Optional content rendered in the top-right (e.g. range tabs). */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

function ChartContainerImpl({
  title,
  description,
  icon: Icon,
  className,
  actions,
  children,
}: ChartContainerProps) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('glass-card rounded-2xl border border-border/50 p-6', className)}
      aria-label={title}
    >
      <header className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Icon size={18} aria-hidden />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </header>
      {children}
    </motion.section>
  );
}

export const ChartContainer = React.memo(ChartContainerImpl);
