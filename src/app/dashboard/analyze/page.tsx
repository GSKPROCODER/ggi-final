'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Brain, Send, Loader2, History, ChevronDown, ChevronUp,
  Download, Layers, Sparkles, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzeApi } from '@/lib/api';
import type { MultiAnalyzeResponse, RecordResponse } from '@/lib/api';
import { ResultCard } from '@/components/ui/result-card';
import { SentimentBadge } from '@/components/ui/sentiment-badge';
import { toast } from 'sonner';

const SUGGESTED = [
  'A great product but shipping was delayed by 2 weeks and the packaging was damaged.',
  "I've been a customer for 3 years but after my last experience with support I am looking elsewhere. Nobody helped.",
  "The new features are incredible! My team's productivity went up 40% since we started using this.",
  'Complete waste of money. Product broke after 2 days and returns process is a nightmare.',
];

export default function Analyze() {
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [text, setText] = useState('');
  const [multiTexts, setMultiTexts] = useState('');
  const [result, setResult] = useState<RecordResponse | null>(null);
  const [multiResult, setMultiResult] = useState<MultiAnalyzeResponse | null>(null);
  const [history, setHistory] = useState<RecordResponse[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    analyzeApi
      .getHistory(20)
      .then((h) => {
        if (!cancelled) setHistory(h.items);
      })
      .catch(() => {
        /* silent — history is non-critical */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSingle = async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      const res = await analyzeApi.single(text.trim());
      setResult(res);
      setHistory((prev) => [res, ...prev.slice(0, 19)]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMulti = async () => {
    const texts = multiTexts.split(/\n---\n|\n\n\n/).map((t) => t.trim()).filter((t) => t.length > 5);
    if (texts.length === 0) {
      toast.error('Enter at least one text, separated by "---" on its own line.');
      return;
    }
    setIsAnalyzing(true);
    setMultiResult(null);
    try {
      const res = await analyzeApi.multi(texts);
      setMultiResult(res);
      const hist = await analyzeApi.getHistory(20);
      setHistory(hist.items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Multi-analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteHistory = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    try {
      await analyzeApi.delete(id);
      setHistory((prev) => prev.filter((r) => r.id !== id));
      if (result?.id === id) setResult(null);
    } catch {
      toast.error('Failed to delete history record.');
    }
  };

  const exportResults = () => {
    const data = mode === 'single' ? result : multiResult?.results;
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus-analysis.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 w-full pb-10">
      <div className="flex items-center justify-end flex-wrap gap-3">
        <button
          onClick={() => setShowHistory(!showHistory)}
          aria-expanded={showHistory}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-colors',
            showHistory
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'border-border/50 text-muted-foreground hover:bg-secondary/30',
          )}
        >
          <History size={16} aria-hidden /> History {showHistory ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
        </button>
      </div>

      <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-xl w-fit border border-border/30" role="tablist" aria-label="Analysis mode">
        {(['single', 'multi'] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setResult(null);
              setMultiResult(null);
            }}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize',
              mode === m ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {m === 'single' ? 'Single Text' : 'Multi Text'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="glass-card rounded-2xl border border-border/50 p-5 space-y-4">
            {mode === 'single' ? (
              <>
                <label htmlFor="single-text" className="block text-sm font-medium">
                  Text to Analyze
                </label>
                <textarea
                  id="single-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your text here... (customer review, feedback, social post, etc.)"
                  rows={8}
                  className="w-full bg-secondary/30 border border-border/40 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">{text.length} characters</span>
                  <div className="flex gap-3">
                    {(result || text) && (
                      <button
                        onClick={exportResults}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border/50 text-muted-foreground hover:bg-secondary/30 transition-colors"
                      >
                        <Download size={13} aria-hidden /> Export
                      </button>
                    )}
                    <button
                      onClick={handleSingle}
                      disabled={!text.trim() || isAnalyzing}
                      aria-busy={isAnalyzing}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-lg shadow-primary/20"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 size={16} className="animate-spin" aria-hidden /> Analyzing...
                        </>
                      ) : (
                        <>
                          <Send size={16} aria-hidden /> Analyze
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="multi-text" className="block text-sm font-medium mb-1">
                    Multiple Texts
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Separate each text with <code className="text-primary">---</code> on its own line
                  </p>
                </div>
                <textarea
                  id="multi-text"
                  value={multiTexts}
                  onChange={(e) => setMultiTexts(e.target.value)}
                  placeholder={
                    'Great product, love it!\n---\nDelivery was too slow, very disappointed.\n---\nOkay experience, nothing special.'
                  }
                  rows={12}
                  className="w-full bg-secondary/30 border border-border/40 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-mono"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleMulti}
                    disabled={!multiTexts.trim() || isAnalyzing}
                    aria-busy={isAnalyzing}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-lg shadow-primary/20"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" aria-hidden /> Analyzing all...
                      </>
                    ) : (
                      <>
                        <Layers size={16} aria-hidden /> Analyze All
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {!result && !multiResult && !isAnalyzing && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Sparkles size={12} className="text-primary" aria-hidden /> Try an example:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setText(s);
                      setMode('single');
                    }}
                    className="text-left p-3 rounded-xl border border-border/30 hover:border-primary/30 hover:bg-secondary/20 text-xs text-muted-foreground transition-all line-clamp-2"
                  >
                    &ldquo;{s.slice(0, 70)}...&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-1">
          <AnimatePresence>
            {showHistory && (
              <div
                className="glass-card rounded-2xl border border-border/50 p-4"
              >
                <h3 className="font-semibold text-sm mb-4">Recent Analyses</h3>
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No history yet</p>
                ) : (
                  <ul className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
                    {history.map((r) => (
                      <li key={r.id} className="group relative">
                        <button
                          onClick={() => {
                            setText(r.text);
                            setMode('single');
                          }}
                          className="w-full text-left p-3 rounded-xl hover:bg-secondary/30 transition-colors border border-border/20 space-y-1 pr-10"
                        >
                          <p className="text-xs text-foreground/80 line-clamp-2">{r.text.slice(0, 80)}</p>
                          <div className="flex items-center gap-2">
                            <SentimentBadge sentiment={r.sentiment} />
                            <span aria-hidden className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">{r.emotion}</span>
                          </div>
                        </button>
                        <button
                          onClick={(e) => handleDeleteHistory(r.id, e)}
                          aria-label={`Delete record ${r.id}`}
                          className="absolute top-2 right-2 p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all z-10 focus-visible:opacity-100"
                        >
                          <Trash2 size={14} aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isAnalyzing && (
          <motion.div
            key="analyzing-loader"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card rounded-2xl border border-border/50 p-12 text-center"
            role="status"
            aria-live="polite"
          >
            <Loader2 size={36} className="text-primary animate-spin mx-auto mb-4" aria-hidden />
            <p className="text-muted-foreground">Gemini is analyzing your text...</p>
          </motion.div>
        )}

        {!isAnalyzing && result && (
          <motion.div 
            key="single-result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">Analysis Result</h2>
              <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary rounded-full">Single analysis</span>
            </div>
            <ResultCard result={result} />
          </motion.div>
        )}

        {!isAnalyzing && multiResult && (
          <motion.div 
            key="multi-result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {multiResult.aggregate && (
              <div
                className="glass-card rounded-2xl border border-primary/20 bg-primary/5 p-6"
              >
                <h3 className="font-semibold mb-4">Aggregate Summary — {multiResult.aggregate.total} texts</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(multiResult.aggregate.sentiment_distribution).map(([k, v]) => (
                    <div key={k} className="text-center">
                      <p className="text-2xl font-bold tabular-nums">{v}%</p>
                      <p className="text-xs text-muted-foreground">{k}</p>
                    </div>
                  ))}
                  <div className="text-center">
                    <p className="text-2xl font-bold tabular-nums">{multiResult.aggregate.avg_confidence}%</p>
                    <p className="text-xs text-muted-foreground">Avg Confidence</p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <h2 className="font-semibold mb-4">Individual Results ({multiResult.results.length})</h2>
              <div className="space-y-4">
                {multiResult.results.map((r, i) => (
                  <ResultCard key={i} result={r} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
