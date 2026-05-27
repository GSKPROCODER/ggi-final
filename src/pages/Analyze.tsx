import { useState, useEffect, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain, Send, Loader2, History, ChevronDown, ChevronUp,
  Copy, Download, Layers, Sparkles, AlertTriangle, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzeApi } from '@/lib/api';
import type { AnalysisResult, RecordResponse } from '@/lib/api';

const SUGGESTED = [
  "A great product but shipping was delayed by 2 weeks and the packaging was damaged.",
  "I've been a customer for 3 years but after my last experience with support I am looking elsewhere. Nobody helped.",
  "The new features are incredible! My team's productivity went up 40% since we started using this.",
  "Complete waste of money. Product broke after 2 days and returns process is a nightmare.",
];

const SENTIMENT_COLORS = {
  Positive: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Neutral: { bg: 'bg-secondary', text: 'text-muted-foreground', border: 'border-border/50' },
  Negative: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
};
const RISK_COLORS = { Low: 'text-emerald-400', Medium: 'text-amber-400', High: 'text-red-400' };

function ResultCard({ result }: { result: AnalysisResult }) {
  const sc = SENTIMENT_COLORS[result.sentiment as keyof typeof SENTIMENT_COLORS] || SENTIMENT_COLORS.Neutral;
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl border border-border/50 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className={cn('px-3 py-1.5 rounded-full text-sm font-semibold border', sc.bg, sc.text, sc.border)}>
            {result.sentiment}
          </span>
          <span className="px-3 py-1.5 bg-secondary/50 border border-border/30 rounded-full text-sm font-medium">
            {result.emotion}
          </span>
          <span className={cn('text-sm font-semibold', RISK_COLORS[result.risk_level as keyof typeof RISK_COLORS] || 'text-muted-foreground')}>
            ⚠ {result.risk_level} Risk
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-1.5 w-20 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${result.confidence_score}%` }} />
            </div>
            <span>{result.confidence_score.toFixed(0)}% confident</span>
          </div>
          <button onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
            className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors" title="Copy JSON">
            <Copy size={14} />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-secondary/30 rounded-xl border border-border/30">
        <p className="text-sm text-foreground/90 leading-relaxed">{result.summary}</p>
      </div>

      {/* Key Issues + Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {result.key_issues.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Issues</h4>
            <ul className="space-y-1.5">
              {result.key_issues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                  <span className="text-foreground/80">{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.recommendations.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recommendations</h4>
            <ul className="space-y-1.5">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
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

export default function Analyze() {
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [text, setText] = useState('');
  const [multiTexts, setMultiTexts] = useState('');
  const [result, setResult] = useState<RecordResponse | null>(null);
  const [multiResult, setMultiResult] = useState<{ results: AnalysisResult[]; aggregate: Record<string, unknown> } | null>(null);
  const [history, setHistory] = useState<RecordResponse[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    analyzeApi.getHistory(20).then(setHistory).catch(() => { });
  }, []);

  const handleSingle = async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setError('');
    setResult(null);
    try {
      const res = await analyzeApi.single(text.trim());
      setResult(res);
      setHistory(prev => [res, ...prev.slice(0, 19)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMulti = async () => {
    const texts = multiTexts.split(/\n---\n|\n\n\n/).map(t => t.trim()).filter(t => t.length > 5);
    if (texts.length === 0) { setError('Enter at least one text, separated by "---" on its own line.'); return; }
    setIsAnalyzing(true);
    setError('');
    setMultiResult(null);
    try {
      const res = await analyzeApi.multi(texts);
      setMultiResult(res);
      const hist = await analyzeApi.getHistory(20);
      setHistory(hist);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Multi-analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteHistory = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    try {
      await analyzeApi.delete(id);
      setHistory(prev => prev.filter(r => r.id !== id));
      if (result?.id === id) setResult(null);
    } catch (err) {
      setError('Failed to delete history record.');
    }
  };

  const exportResults = () => {
    const data = mode === 'single' ? result : multiResult?.results;
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'nexus-analysis.json'; a.click();
  };

  return (
    <div className="p-5 md:p-6 space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Brain size={20} />
            </div>
            Analyze Text
          </h1>
          <p className="text-muted-foreground mt-1">Real-time sentiment, emotion, and risk analysis powered by Gemini</p>
        </div>
        <button onClick={() => setShowHistory(!showHistory)}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-colors',
            showHistory ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border/50 text-muted-foreground hover:bg-secondary/30')}>
          <History size={16} /> History {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-xl w-fit border border-border/30">
        {(['single', 'multi'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setResult(null); setMultiResult(null); setError(''); }}
            className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize',
              mode === m ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {m === 'single' ? 'Single Text' : 'Multi Text'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Input area */}
        <div className="xl:col-span-2 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle size={16} />{error}
            </div>
          )}

          <div className="glass-card rounded-2xl border border-border/50 p-5 space-y-4">
            {mode === 'single' ? (
              <>
                <label className="block text-sm font-medium">Text to Analyze</label>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Paste your text here... (customer review, feedback, social post, etc.)"
                  rows={8}
                  className="w-full bg-secondary/30 border border-border/40 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{text.length} characters</span>
                  <div className="flex gap-3">
                    {(result || text) && (
                      <button onClick={exportResults} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border/50 text-muted-foreground hover:bg-secondary/30 transition-colors">
                        <Download size={13} /> Export
                      </button>
                    )}
                    <button onClick={handleSingle} disabled={!text.trim() || isAnalyzing}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-lg shadow-primary/20">
                      {isAnalyzing ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</>
                        : <><Send size={16} /> Analyze</>}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Multiple Texts</label>
                  <p className="text-xs text-muted-foreground">Separate each text with <code className="text-primary">---</code> on its own line</p>
                </div>
                <textarea
                  value={multiTexts}
                  onChange={e => setMultiTexts(e.target.value)}
                  placeholder={"Great product, love it!\n---\nDelivery was too slow, very disappointed.\n---\nOkay experience, nothing special."}
                  rows={12}
                  className="w-full bg-secondary/30 border border-border/40 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-mono"
                />
                <div className="flex justify-end">
                  <button onClick={handleMulti} disabled={!multiTexts.trim() || isAnalyzing}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-lg shadow-primary/20">
                    {isAnalyzing ? <><Loader2 size={16} className="animate-spin" /> Analyzing all...</>
                      : <><Layers size={16} /> Analyze All</>}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Suggested examples */}
          {!result && !multiResult && !isAnalyzing && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5"><Sparkles size={12} className="text-primary" /> Try an example:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED.map((s, i) => (
                  <button key={i} onClick={() => { setText(s); setMode('single'); }}
                    className="text-left p-3 rounded-xl border border-border/30 hover:border-primary/30 hover:bg-secondary/20 text-xs text-muted-foreground transition-all line-clamp-2">
                    "{s.slice(0, 70)}..."
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* History sidebar */}
        <div className="xl:col-span-1">
          <AnimatePresence>
            {showHistory && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="glass-card rounded-2xl border border-border/50 p-4">
                <h3 className="font-semibold text-sm mb-4">Recent Analyses</h3>
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No history yet</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
                    {history.map(r => (
                      <div key={r.id} className="group relative">
                        <button onClick={() => { setText(r.text); setMode('single'); }}
                          className="w-full text-left p-3 rounded-xl hover:bg-secondary/30 transition-colors border border-border/20 space-y-1 pr-10">
                          <p className="text-xs text-foreground/80 line-clamp-2">{r.text.slice(0, 80)}</p>
                          <div className="flex items-center gap-2">
                            <span className={cn('text-xs font-medium',
                              r.sentiment === 'Positive' ? 'text-emerald-400' : r.sentiment === 'Negative' ? 'text-red-400' : 'text-muted-foreground')}>
                              {r.sentiment}
                            </span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">{r.emotion}</span>
                          </div>
                        </button>
                        <button onClick={(e) => handleDeleteHistory(r.id, e)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all z-10">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="glass-card rounded-2xl border border-border/50 p-12 text-center">
            <Loader2 size={36} className="text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Gemini is analyzing your text...</p>
          </motion.div>
        )}

        {!isAnalyzing && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">Analysis Result</h2>
              <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary rounded-full">Single analysis</span>
            </div>
            <ResultCard result={result} />
          </div>
        )}

        {!isAnalyzing && multiResult && (
          <div className="space-y-4">
            {/* Aggregate summary */}
            {multiResult.aggregate && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl border border-primary/20 bg-primary/5 p-6">
                <h3 className="font-semibold mb-4">Aggregate Summary — {String(multiResult.aggregate.total)} texts</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(multiResult.aggregate.sentiment_distribution).map(([k, v]) => (
                    <div key={k} className="text-center">
                      <p className="text-2xl font-bold">{String(v)}%</p>
                      <p className="text-xs text-muted-foreground">{k}</p>
                    </div>
                  ))}
                  <div className="text-center">
                    <p className="text-2xl font-bold">{String(multiResult.aggregate.avg_confidence)}%</p>
                    <p className="text-xs text-muted-foreground">Avg Confidence</p>
                  </div>
                </div>
              </motion.div>
            )}
            <div>
              <h2 className="font-semibold mb-4">Individual Results ({multiResult.results.length})</h2>
              <div className="space-y-4">
                {multiResult.results.map((r, i) => <div key={i}><ResultCard result={r} /></div>)}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
