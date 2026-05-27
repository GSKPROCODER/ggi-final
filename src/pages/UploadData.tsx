import { useState, useCallback, useRef, useEffect, type DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload, FileText, CheckCircle2, AlertCircle, ChevronRight,
  Table2, ArrowRight, Loader2, X, BarChart3, Columns
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { datasetsApi } from '@/lib/api';
import type { DatasetDetailResponse } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';

type Step = 'upload' | 'columns' | 'process' | 'done';

export default function UploadData() {
  const [step, setStep] = useState<Step>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dataset, setDataset] = useState<DatasetDetailResponse | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [error, setError] = useState('');
  const [processingTime, setProcessingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { setDatasets, setBatchProcessing, isBatchProcessing, processingDatasetId } = useStore();

  const STEPS: { id: Step; label: string }[] = [
    { id: 'upload', label: 'Upload' },
    { id: 'columns', label: 'Map Columns' },
    { id: 'process', label: 'Process' },
    { id: 'done', label: 'Complete' },
  ];

  const handleFile = useCallback(async (f: File) => {
    const fn = f.name.toLowerCase();
    if (!fn.endsWith('.csv') && !fn.endsWith('.xlsx')) {
      setError('Only CSV and Excel (.xlsx) files are supported.');
      return;
    }
    setError('');
    setFile(f);
    setIsUploading(true);
    try {
      const uploadRes = await datasetsApi.upload(f);
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

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const startPolling = (dsId: string, startTime: number) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const status = await datasetsApi.getStatus(dsId);
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setProcessingTime(elapsed);
        setProgress(status.percent);
        setProcessingStatus(`Analyzed ${status.processed_count} of ${status.row_count} records`);
        setBatchProcessing(true, status.percent, processingStatus, dsId);

        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(pollRef.current!);
          setBatchProcessing(false, 100, '');
          if (status.status === 'completed') {
            const datasets = await datasetsApi.list();
            setDatasets(datasets);
            setStep('done');
          } else {
            setError(status.error_message || 'Processing failed.');
            setStep('columns');
          }
        }
      } catch {
        clearInterval(pollRef.current!);
      }
    }, 2000);
  };

  const startProcessing = async () => {
    if (!dataset || selectedColumns.length === 0) return;
    setStep('process');
    const startTime = Date.now();
    setBatchProcessing(true, 0, 'Starting...', dataset.id);

    try {
      await datasetsApi.process(dataset.id, selectedColumns.join(', '));
      startPolling(dataset.id, startTime);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start processing.');
      setStep('columns');
    }
  };

  useEffect(() => {
    if (isBatchProcessing && processingDatasetId) {
      // Resume state
      setStep('process');
      datasetsApi.getById(processingDatasetId).then(detail => {
        setDataset(detail);
        startPolling(processingDatasetId, Date.now() - 5000); // Approximate resume time
      }).catch(console.error);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // ── Step Renderers ────────────────────────────────────────────────────────

  const renderUpload = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Upload Your Dataset</h2>
        <p className="text-muted-foreground">Upload a CSV or Excel (.xlsx) file containing your text data. Up to 50,000 rows supported.</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle size={16} />{error}
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300',
          isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border/50 hover:border-primary/50 hover:bg-secondary/20'
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
      </div>

      {/* Example datasets hint */}
      <div className="glass-card p-4 rounded-xl border border-border/40">
        <p className="text-sm font-medium mb-2 text-muted-foreground">💡 Works great with:</p>
        <div className="flex flex-wrap gap-2">
          {['Customer reviews', 'Social media posts', 'Support tickets', 'Survey responses', 'Product feedback', 'Employee feedback'].map(t => (
            <span key={t} className="text-xs px-3 py-1 bg-secondary/60 rounded-full border border-border/30">{t}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderColumnMapping = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Select Text Columns</h2>
        <p className="text-muted-foreground">
          Choose one or more columns that contain the text you want to analyze.
          <span className="text-primary font-medium"> {dataset?.original_filename}</span> has {dataset?.row_count?.toLocaleString()} rows and {dataset?.columns.length} columns.
        </p>
      </div>

      <div className="grid gap-3">
        {dataset?.columns.map((col) => {
          const sample = dataset.sample_rows.slice(0, 3).map(r => r[col]).filter(Boolean).join(' · ').slice(0, 80);
          const isLikely = /review|text|comment|feedback|content|message|body|description/i.test(col);
          return (
            <motion.div
              key={col}
              whileHover={{ scale: 1.01 }}
              onClick={() => setSelectedColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])}
              className={cn(
                'p-4 rounded-xl border cursor-pointer transition-all',
                selectedColumns.includes(col)
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                  : 'border-border/50 hover:border-primary/30 glass-card'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Columns size={16} className={selectedColumns.includes(col) ? 'text-primary' : 'text-muted-foreground'} />
                  <span className="font-semibold text-sm">{col}</span>
                  {isLikely && <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">Recommended</span>}
                </div>
                {selectedColumns.includes(col) && <CheckCircle2 size={18} className="text-primary" />}
              </div>
              {sample && <p className="text-xs text-muted-foreground truncate mt-1">{sample}...</p>}
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

  const renderProcessing = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 py-8">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
          <Loader2 size={36} className="text-primary animate-spin" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Analyzing Your Dataset</h2>
        <p className="text-muted-foreground">Gemini is processing your records. This may take a few minutes for large datasets.</p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{processingStatus || 'Initializing...'}</span>
          <span className="font-semibold text-primary">{progress.toFixed(0)}%</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>⏱ {processingTime}s elapsed</span>
          <span>Processing in chunks of 5</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
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

      <div className="grid grid-cols-3 gap-4">
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

  return (
    <div className="p-5 md:p-6 space-y-8 max-w-3xl mx-auto pb-10">
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
      <AnimatePresence mode="wait">
        <div key={step}>
          {step === 'upload' && renderUpload()}
          {step === 'columns' && renderColumnMapping()}
          {step === 'process' && renderProcessing()}
          {step === 'done' && renderDone()}
        </div>
      </AnimatePresence>
    </div>
  );
}
