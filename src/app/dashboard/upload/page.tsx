'use client';

import { useState, useCallback, useRef, useEffect, type DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload, FileText, CheckCircle2, AlertCircle, ChevronRight,
  ArrowRight, Loader2, X, Columns, Search, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { datasetsApi } from '@/lib/api';
import type { DatasetDetailResponse } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Step = 'upload' | 'columns' | 'process' | 'done';

export default function UploadData() {
  const [step, setStep] = useState<Step>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dataset, setDataset] = useState<DatasetDetailResponse | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  const [rawCsvText, setRawCsvText] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const {
    setDatasets,
    setBatchProcessing,
    isBatchProcessing,
    batchProgress,
    batchStatus,
    batchError,
    processingDatasetId,
    datasets,
  } = useStore();

  const STEPS: { id: Step; label: string }[] = [
    { id: 'upload', label: 'Upload' },
    { id: 'columns', label: 'Map Columns' },
    { id: 'process', label: 'Process' },
    { id: 'done', label: 'Complete' },
  ];

  // Load datasets on mount if empty (for the Recent Uploads panel)
  useEffect(() => {
    if (datasets.length === 0) {
      datasetsApi.list().then(setDatasets).catch(console.error);
    }
  }, []);

  const handleFile = useCallback(async (f: File) => {
    const fn = f.name.toLowerCase();
    if (!fn.endsWith('.csv') && !fn.endsWith('.xlsx')) {
      setError('Only CSV and Excel (.xlsx) files are supported.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    setError('');
    setFile(f);
    setIsUploading(true);
    try {
      const uploadRes = await datasetsApi.upload(f);
      setRawCsvText(uploadRes.raw_csv_text);
      const detail = await datasetsApi.getById(uploadRes.id);
      setDataset(detail);
      // Auto-detect likely text columns
      const likely = detail.columns.filter(c =>
        /review|text|comment|feedback|content|message|body|description|title/i.test(c)
      );
      setSelectedColumns(likely.length > 0 ? likely : [detail.columns[0] || '']);
      setStep('columns');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const useSampleDataset = () => {
    const sampleCsv = `Feedback,Customer_Rating,Urgency_Level
Great customer support and extremely fast turnaround! Highly recommended.,5,Low
The server crashed twice today and we lost all customer transaction data. This is a disaster!,1,High
I received the package but it was slightly damaged on the side. The product inside works fine though.,3,Medium
I love the new dark mode design! It looks incredibly premium and is so easy on the eyes.,5,Low
The payment page keeps throwing a 500 error when I try to complete the checkout. Please fix it!,1,High
Great value for money. Will definitely buy again.,4,Low
`;
    const blob = new Blob([sampleCsv], { type: 'text/csv' });
    const sampleFile = new File([blob], 'nexus_ai_demo_feedback.csv', { type: 'text/csv' });
    handleFile(sampleFile);
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel the analysis? Active background tasks will be aborted.')) {
      setBatchProcessing(false, 0, '', null);
      setStep('upload');
      setFile(null);
      setDataset(null);
    }
  };

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const startProcessing = async () => {
    if (!dataset || selectedColumns.length === 0) return;
    setStep('process');
    setProcessingTime(0);
    setBatchProcessing(true, 0, 'Starting...', dataset.id);

    try {
      await datasetsApi.process(dataset.id, selectedColumns.join(', '), rawCsvText);
      // Handled globally by the Layout.tsx polling engine!
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start processing.');
      setBatchProcessing(false, 0, '', null, err instanceof Error ? err.message : 'Failed to start processing.');
      // Keep on the process step so the error shows in the analysis UI, or go back to columns
    }
  };

  // Keep track of processing time locally
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isBatchProcessing) {
      timer = setInterval(() => {
        setProcessingTime(prev => prev + 1);
      }, 1000);
    } else {
      setProcessingTime(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isBatchProcessing]);

  useEffect(() => {
    if (isBatchProcessing && processingDatasetId) {
      setStep('process');
      datasetsApi.getById(processingDatasetId).then(detail => {
        setDataset(detail);
      }).catch(console.error);
    }
  }, [isBatchProcessing, processingDatasetId]);

  // ── Step Renderers ────────────────────────────────────────────────────────

  const renderUpload = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Upload Your Dataset</h2>
          <p className="text-muted-foreground">Upload a CSV or Excel (.xlsx) file containing your text data. Up to 50,000 rows supported.</p>
        </div>
        <button
          onClick={useSampleDataset}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary hover:bg-primary/20 transition-all hover:scale-[1.01]"
        >
          ✨ Use Demo Dataset
        </button>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle size={16} />{error}
        </motion.div>
      )}

      <motion.div
        animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        onDragOver={(e: any) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300',
          isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border/50 hover:border-primary/50 hover:bg-secondary/20',
          error ? 'border-destructive/50 bg-destructive/5 hover:border-destructive' : ''
        )}
      >
        <input ref={fileInputRef} type="file" accept=".csv, .xlsx" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        <div className="flex flex-col items-center gap-4">
          {isUploading ? (
            <>
              <Loader2 size={48} className="text-primary animate-spin" />
              <p className="text-lg font-medium">Uploading & analyzing structure...</p>
            </>
          ) : (
            <>
              <div className={cn('w-20 h-20 rounded-2xl flex items-center justify-center transition-colors',
                isDragging ? 'bg-primary/20' : 'bg-secondary/50')}>
                <Upload size={36} className={isDragging ? 'text-primary' : 'text-muted-foreground'} />
              </div>
              <div>
                <p className="text-lg font-semibold mb-1">
                  {isDragging ? 'Drop your CSV here' : 'Drag & drop your CSV file'}
                </p>
                <p className="text-sm text-muted-foreground">or click to browse files</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="px-3 py-1 bg-secondary rounded-full">CSV</span>
                <span>Up to 50,000 rows</span>
                <span>Auto-encoding detection</span>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Example datasets hint */}
      <div className="glass-card p-4 rounded-xl border border-border/40">
        <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">💡 Works great with:</p>
        <div className="flex flex-wrap gap-2">
          {['Customer reviews', 'Social media posts', 'Support tickets', 'Survey responses', 'Product feedback', 'Employee feedback'].map(t => (
            <span key={t} className="text-xs px-3 py-1 bg-secondary/60 rounded-full border border-border/30">{t}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderColumnMapping = () => {
    const recommendedCols = dataset?.columns.filter(c => /review|text|comment|feedback|content|message|body|description|title/i.test(c)) || [];
    const filteredCols = dataset?.columns.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase())) || [];

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold mb-1">Select Text Columns</h2>
            <p className="text-muted-foreground text-sm">
              Choose one or more columns that contain the text you want to analyze.
              <span className="text-primary font-medium"> {dataset?.original_filename}</span> has {dataset?.row_count?.toLocaleString()} rows.
            </p>
          </div>
          <button
            onClick={() => {
              if (recommendedCols.length > 0) setSelectedColumns(recommendedCols);
            }}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary hover:bg-primary/20 transition-all hover:scale-[1.01]"
          >
            <Sparkles size={14} /> Select Recommended
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-secondary/30 p-3 rounded-xl border border-border/40">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search columns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-muted-foreground">{selectedColumns.length} selected</span>
            <span className="text-border">|</span>
            <button
              onClick={() => setSelectedColumns(dataset?.columns || [])}
              className="text-[11px] uppercase font-bold tracking-wider text-primary hover:underline"
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedColumns([])}
              className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground hover:underline ml-2"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
          {filteredCols.length === 0 && (
            <div className="text-center p-8 text-muted-foreground text-sm border rounded-xl border-dashed">
              No columns match "{searchQuery}"
            </div>
          )}
          {filteredCols.map((col) => {
            const isLikely = recommendedCols.includes(col);
            const isSelected = selectedColumns.includes(col);
            
            return (
              <motion.div
                key={col}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])}
                className={cn(
                  'p-4 rounded-xl border cursor-pointer transition-all',
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                    : 'border-border/50 hover:border-primary/30 glass-card'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Columns size={16} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                    <span className="font-semibold text-sm">{col}</span>
                    {isLikely && <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-primary/20 text-primary rounded-full tracking-wider">Recommended</span>}
                  </div>
                  {isSelected && <CheckCircle2 size={18} className="text-primary" />}
                </div>
                
                {/* Data Preview Grid */}
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none opacity-80 hover:opacity-100 transition-opacity">
                  {dataset?.sample_rows.slice(0, 3).map((r, i) => (
                    <div key={i} className={cn(
                      "shrink-0 max-w-[220px] p-2 rounded-lg text-[11px] truncate border",
                      isSelected ? "bg-background/80 border-primary/20 text-foreground" : "bg-background/50 border-border/30 text-muted-foreground"
                    )} title={String(r[col] || '')}>
                      {r[col] ? String(r[col]) : <span className="opacity-40 italic">null</span>}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

      <div className="flex gap-3 pt-2">
        <button onClick={() => setStep('upload')} className="px-5 py-2.5 rounded-xl border border-border/50 text-sm text-muted-foreground hover:bg-secondary/30 transition-colors">
          Back
        </button>
        <button
          onClick={startProcessing}
          disabled={selectedColumns.length === 0}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          Start Analysis <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
  };

  const renderProcessing = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 py-8">
      <div className="text-center">
        <div className={cn(
          "w-20 h-20 rounded-full border flex items-center justify-center mx-auto mb-6",
          batchError ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-primary/10 border-primary/20 text-primary"
        )}>
          {batchError ? (
            <AlertCircle size={36} />
          ) : (
            <Loader2 size={36} className="animate-spin" />
          )}
        </div>
        <h2 className="text-2xl font-semibold mb-2">
          {batchError ? "Analysis Failed" : "Analyzing Your Dataset"}
        </h2>
        <p className="text-muted-foreground">
          {batchError 
            ? batchError 
            : "AI is processing your records. This may take a few minutes for large datasets."}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className={cn(
            batchError ? "text-destructive/80 font-medium" : "text-muted-foreground"
          )}>
            {batchError ? "Process Halted" : (batchStatus || 'Initializing...')}
          </span>
          <span className={cn(
            "font-semibold",
            batchError ? "text-destructive" : "text-primary"
          )}>
            {batchProgress.toFixed(0)}%
          </span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              batchError ? "bg-destructive/60" : "bg-gradient-to-r from-primary to-blue-500"
            )}
            animate={{ width: `${batchProgress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>⏱ {processingTime}s elapsed</span>
          <span>Processing in chunks of 5</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        {[
          { label: 'Sentiment Analysis', icon: '😊' },
          { label: 'Emotion Detection', icon: '🎭' },
          { label: 'Risk Assessment', icon: '⚠️' },
        ].map(({ label, icon }) => (
          <div key={label} className="glass-card p-4 rounded-xl border border-border/40">
            <div className="text-2xl mb-2">{icon}</div>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-3 pt-4">
        <button
          onClick={handleCancel}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-destructive/20 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-all hover:scale-[1.01]"
        >
          <X size={14} /> {batchError ? "Reset" : "Cancel Analysis"}
        </button>
        {batchError ? (
          <button
            onClick={startProcessing}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all hover:scale-[1.01]"
          >
            Try Again <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-border/50 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all hover:scale-[1.01]"
          >
            Minimize to Background <ArrowRight size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );

  const renderDone = () => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 py-8 text-center">
      <div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
          className="w-24 h-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={48} className="text-primary" />
        </motion.div>
        <h2 className="text-2xl font-semibold mb-2">Analysis Complete!</h2>
        <p className="text-muted-foreground">
          Successfully analyzed <span className="text-primary font-semibold">{dataset?.original_filename}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Records Analyzed', value: dataset?.row_count?.toLocaleString() },
          { label: 'Processing Time', value: `${processingTime}s` },
          { label: 'Text Columns', value: selectedColumns.join(', ') },
        ].map(({ label, value }) => (
          <div key={label} className="glass-card p-5 rounded-xl border border-border/50">
            <p className="text-2xl font-bold text-primary mb-1">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-4">
        <button onClick={() => { setStep('upload'); setFile(null); setDataset(null); }}
          className="px-5 py-2.5 rounded-xl border border-border/50 text-sm hover:bg-secondary/30 transition-colors">
          Upload Another
        </button>
        <button onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          View Dashboard <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );

  const recentDatasets = datasets.slice(0, 3);

  return (
    <div className="p-5 md:p-6 space-y-8 w-full pb-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Upload size={20} />
          </div>
          Upload Dataset
        </h1>
        <p className="text-muted-foreground mt-1">Import your CSV and analyze it with Gemini AI</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const stepIndex = STEPS.findIndex(x => x.id === step);
          const isDone = i < stepIndex;
          const isCurrent = s.id === step;
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className={cn('flex items-center gap-2 text-xs font-medium transition-colors',
                isCurrent ? 'text-primary' : isDone ? 'text-primary/60' : 'text-muted-foreground/40')}>
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  isCurrent ? 'bg-primary text-primary-foreground'
                    : isDone ? 'bg-primary/20 text-primary'
                      : 'bg-secondary/50 text-muted-foreground')}>
                  {isDone ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <span className="hidden sm:block">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('flex-1 h-px mx-2 transition-colors',
                  isDone ? 'bg-primary/40' : 'bg-border/40')} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        >
          {step === 'upload' && renderUpload()}
          {step === 'columns' && renderColumnMapping()}
          {step === 'process' && renderProcessing()}
          {step === 'done' && renderDone()}
        </motion.div>
      </AnimatePresence>

      {/* QoL Recent Activity Panel (only shown on upload step for clean UI) */}
      {step === 'upload' && recentDatasets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-6 border-t border-border/40"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">📊 Recent Uploads</h3>
            <Link href="/dashboard/history" className="text-xs font-semibold text-primary hover:underline">
              View History
            </Link>
          </div>
          <div className="grid gap-3">
            {recentDatasets.map((ds) => (
              <div
                key={ds.id}
                onClick={() => router.push('/dashboard/history')}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border/30 hover:border-primary/20 bg-card/40 hover:bg-secondary/20 cursor-pointer transition-all duration-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ds.original_filename}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ds.row_count.toLocaleString()} rows · {new Date(ds.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                    ds.status === 'completed' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : ds.status === 'processing' ? "bg-primary/10 text-primary border-primary/20 animate-pulse"
                        : ds.status === 'failed' ? "bg-destructive/10 text-destructive border-destructive/20"
                          : "bg-secondary text-muted-foreground border-border/30"
                  )}>
                    {ds.status}
                  </span>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
