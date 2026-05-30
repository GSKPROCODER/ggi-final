/**
 * Shared UI tokens — single source of truth for sentiment/risk/emotion colors,
 * labels, and types. Previously duplicated across 4+ dashboard pages.
 */

export const SENTIMENT_COLORS = {
  Positive: '#10b981',
  Neutral: '#6b7280',
  Negative: '#ef4444',
} as const;

export const RISK_COLORS = {
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#ef4444',
} as const;

export const EMOTION_PALETTE = [
  '#8b5cf6',
  '#3b82f6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#84cc16',
] as const;

export type Sentiment = keyof typeof SENTIMENT_COLORS;
export type Risk = keyof typeof RISK_COLORS;

export const SENTIMENT_BADGE_CLASS: Record<Sentiment, string> = {
  Positive: 'bg-emerald-500/20 text-emerald-400',
  Neutral: 'bg-secondary text-muted-foreground',
  Negative: 'bg-red-500/20 text-red-400',
};

export const RISK_BADGE_CLASS: Record<Risk, string> = {
  Low: 'text-emerald-400',
  Medium: 'text-amber-400',
  High: 'text-red-400',
};

export const RISK_TILE_CLASS: Record<Risk, string> = {
  Low: 'bg-emerald-500/10 text-emerald-400',
  Medium: 'bg-amber-500/10 text-amber-400',
  High: 'bg-red-500/10 text-red-400',
};
