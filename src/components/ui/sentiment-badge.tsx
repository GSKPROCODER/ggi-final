import * as React from 'react';
import { cn } from '@/lib/utils';
import { SENTIMENT_BADGE_CLASS, type Sentiment } from '@/lib/types/ui';

export interface SentimentBadgeProps {
  sentiment: string;
  size?: 'sm' | 'md';
  className?: string;
}

function SentimentBadgeImpl({ sentiment, size = 'sm', className }: SentimentBadgeProps) {
  const isKnown = sentiment === 'Positive' || sentiment === 'Neutral' || sentiment === 'Negative';
  const cls = isKnown
    ? SENTIMENT_BADGE_CLASS[sentiment as Sentiment]
    : 'bg-secondary text-muted-foreground';
  return (
    <span
      className={cn(
        'rounded-full font-medium',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        cls,
        className,
      )}
    >
      {sentiment}
    </span>
  );
}

export const SentimentBadge = React.memo(SentimentBadgeImpl);
