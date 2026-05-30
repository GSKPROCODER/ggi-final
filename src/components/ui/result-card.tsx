'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SentimentBadge } from './sentiment-badge';
import { RiskBadge } from './risk-badge';
import { ConfidenceBar } from './confidence-bar';
import type { AnalysisResult } from '@/lib/api';

export interface ResultCardProps {
  result: AnalysisResult;
  className?: string;
}

function ResultCardImpl({ result, className }: ResultCardProps) {
  const reduce = useReducedMotion();
  const copyJson = () => {
    void navigator.clipboard.writeText(JSON.stringify(result, null, 2));
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('glass-card rounded-2xl border border-border/50 p-6 space-y-5', className)}
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <SentimentBadge sentiment={result.sentiment} size="md" />
          <span className="px-3 py-1.5 bg-secondary/50 border border-border/30 rounded-full text-sm font-medium">
            {result.emotion}
          </span>
          <RiskBadge risk={result.risk_level} withIcon className="text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <ConfidenceBar score={result.confidence_score} className="min-w-32" />
          <button
            onClick={copyJson}
            className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
            title="Copy JSON"
            aria-label="Copy result as JSON"
          >
            <Copy size={14} aria-hidden />
          </button>
        </div>
      </div>

      <div className="p-4 bg-secondary/30 rounded-xl border border-border/30">
        <p className="text-sm text-foreground/90 leading-relaxed">{result.summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {result.key_issues.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Key Issues
            </h4>
            <ul className="space-y-1.5">
              {result.key_issues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span aria-hidden className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                  <span className="text-foreground/80">{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.recommendations.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Recommendations
            </h4>
            <ul className="space-y-1.5">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span aria-hidden className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-foreground/80">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export const ResultCard = React.memo(ResultCardImpl);
