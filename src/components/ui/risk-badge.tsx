import * as React from 'react';
import { cn } from '@/lib/utils';
import { RISK_BADGE_CLASS, type Risk } from '@/lib/types/ui';

export interface RiskBadgeProps {
  risk: string;
  withIcon?: boolean;
  className?: string;
}

function RiskBadgeImpl({ risk, withIcon, className }: RiskBadgeProps) {
  const isKnown = risk === 'Low' || risk === 'Medium' || risk === 'High';
  const cls = isKnown ? RISK_BADGE_CLASS[risk as Risk] : 'text-muted-foreground';
  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', cls, className)}>
      {withIcon ? `⚠ ${risk} Risk` : risk}
    </span>
  );
}

export const RiskBadge = React.memo(RiskBadgeImpl);
