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
      className="glass-card p-5 rounded-2xl border border-border/50 hover:border-primary/30 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            color || 'bg-primary/10 text-primary',
          )}
        >
          <Icon size={20} aria-hidden />
        </div>
        {trend && (
          <span
            aria-label={trend === 'up' ? 'Trending up' : 'Trending down'}
            className={cn(
              'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
              trend === 'up' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10',
            )}
          >
            {trend === 'up' ? <TrendingUp size={12} aria-hidden /> : <TrendingDown size={12} aria-hidden />}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold tracking-tight mb-1">{value}</p>
      <p className="text-sm font-medium text-foreground/80 mb-0.5">{title}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}

export const KpiCard = React.memo(KpiCardImpl);
