'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  /** Optional trend string like "+5.1%" or "-2.3%" */
  trend?: string;
  /** Icon accent color (hex) */
  color: string;
}

function StatCardImpl({ title, value, icon: Icon, trend, color }: StatCardProps) {
  const reduce = useReducedMotion();
  const isPositive = trend?.startsWith('+');
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden group glass-card p-6 rounded-2xl border border-border/50"
    >
      <div aria-hidden className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon size={80} color={color} />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/40 border border-border/40">
          <Icon size={20} color={color} aria-hidden />
        </div>
        <h3 className="text-muted-foreground font-medium text-xs uppercase tracking-[0.15em]">{title}</h3>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight">{value}</span>
        {trend && (
          <span className={cn('text-xs font-medium', isPositive ? 'text-emerald-400' : 'text-rose-400')}>
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export const StatCard = React.memo(StatCardImpl);
