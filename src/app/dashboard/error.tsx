'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[dashboard error]', error);
    }
  }, [error]);

  return (
    <div
      role="alert"
      className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center text-center p-6 gap-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
        <AlertTriangle size={32} aria-hidden />
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-1">Something went wrong</h2>
        <p className="text-muted-foreground max-w-md">
          {error.message || 'An unexpected error occurred. Try again, or refresh the page.'}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 mt-2 font-mono">Ref: {error.digest}</p>
        )}
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
      >
        <RefreshCw size={16} aria-hidden /> Try again
      </button>
    </div>
  );
}
