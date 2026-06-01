'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KpiCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  /** Tailwind classes for the icon tile background+text */
  color?: string;
}

function KpiCardImpl({ title, value, sub, icon: Icon, trend, color }: KpiCardProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card glass-card-interactive p-4 md:p-5 rounded-2xl border border-border/50"
    >
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div
          className={cn(
            'w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center',
            color || 'bg-primary/10 text-primary',
          )}
        >
          <Icon size={18} aria-hidden />
        </div>
        {trend && (
          <span
            aria-label={trend === 'up' ? 'Trending up' : 'Trending down'}
            className={cn(
              'flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 md:px-2 md:py-1 rounded-full',
              trend === 'up' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10',
            )}
          >
            {trend === 'up' ? <TrendingUp size={11} aria-hidden /> : <TrendingDown size={11} aria-hidden />}
          </span>
        )}
      </div>
      <p className="text-2xl md:text-3xl font-bold tracking-tight mb-0.5">{value}</p>
      <p className="text-sm font-medium text-foreground/80 mb-0.5">{title}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}

export const KpiCard = React.memo(KpiCardImpl);
