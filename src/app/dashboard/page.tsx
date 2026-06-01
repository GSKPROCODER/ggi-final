'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  TrendingUp, TrendingDown, AlertTriangle, Brain, Database,
  RefreshCw, Upload, ArrowRight, ChevronRight, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { datasetsApi, analyzeApi, alertsApi } from '@/lib/api';
import type { BatchInsights, RecordResponse } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';

import { KpiCard } from '@/components/ui/kpi-card';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { SentimentBadge } from '@/components/ui/sentiment-badge';
import { RiskBadge } from '@/components/ui/risk-badge';
import { ConfidenceBar } from '@/components/ui/confidence-bar';
import { EMOTION_PALETTE, RISK_TILE_CLASS, type Risk } from '@/lib/types/ui';

// Charts are heavy (~105KB recharts) — load only when this page renders.
const SentimentTrendChart = dynamic(() => import('./_components/sentiment-trend-chart'), {
  ssr: false,
  loading: () => <div className="h-[220px] skeleton rounded-xl" />,
});
const EmotionPieChart = dynamic(() => import('./_components/emotion-pie-chart'), {
  ssr: false,
  loading: () => <div className="h-[200px] skeleton rounded-xl" />,
});
const RiskBarChart = dynamic(() => import('./_components/risk-bar-chart'), {
  ssr: false,
  loading: () => <div className="h-[220px] skeleton rounded-xl" />,
});

function buildTimeSeries(records: RecordResponse[], days: number) {
  const series: { date: string; positive: number; negative: number; count: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(now, i);
    const dayLabel = format(d, 'MMM d');
    const dayRecords = records.filter((r) => {
      const rd = new Date(r.created_at);
      return rd.toDateString() === d.toDateString();
    });
    const pos = dayRecords.filter((r) => r.sentiment === 'Positive').length;
    const neg = dayRecords.filter((r) => r.sentiment === 'Negative').length;
    const total = dayRecords.length || 1;
    series.push({
      date: dayLabel,
      positive: Math.round((pos / total) * 100),
      negative: Math.round((neg / total) * 100),
      count: dayRecords.length,
    });
  }
  return series;
}

export default function Dashboard() {
  const [insights, setInsights] = useState<BatchInsights | null>(null);
  const [records, setRecords] = useState<RecordResponse[]>([]);
  // Split loading: KPI cards show as soon as stats arrive; charts load after
  const [isKpiLoading, setIsKpiLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [timeRange, setTimeRange] = useState(30);
  const [dbError, setDbError] = useState(false);
  const [kpiStats, setKpiStats] = useState<Record<string, unknown> | null>(null);

  // Fine-grained Zustand selectors — pages don't re-render when unrelated slices change.
  const datasets = useStore((s) => s.datasets);
  const alerts = useStore((s) => s.alerts);
  const setDatasets = useStore((s) => s.setDatasets);
  const setAlerts = useStore((s) => s.setAlerts);
  const addAlert = useStore((s) => s.addAlert);
  const setBatchInsights = useStore((s) => s.setBatchInsights);

  const router = useRouter();

  // Ref so the interval can read latest datasets without being a dep of the effect.
  const datasetsRef = useRef(datasets);
  datasetsRef.current = datasets;

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setIsKpiLoading(true);
      setIsChartLoading(true);

      try {
        // Stage 1 — fast: stats aggregation + alerts (shows KPI cards immediately)
        const [statsRes, alertRes] = await Promise.all([
          analyzeApi.getStats(),
          alertsApi.list(),
        ]);
        if (cancelled) return;
        setKpiStats(statsRes);
        setAlerts(alertRes);
        setIsKpiLoading(false);

        // Stage 2 — slower: dataset list + history for chart (30 records is enough for trend)
        const [dsRes, recRes] = await Promise.all([
          datasetsApi.list(),
          analyzeApi.getHistory(50),
        ]);
        if (cancelled) return;
        setDatasets(dsRes);
        setRecords(recRes.items);

        const latestCompleted = dsRes.find((d) => d.status === 'completed');
        if (latestCompleted) {
          try {
            const ins = await datasetsApi.getInsights(latestCompleted.id);
            if (cancelled) return;
            setInsights(ins);
            setBatchInsights(ins);
          } catch { /* No insights yet */ }
        }
        if (!cancelled) setIsChartLoading(false);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : '';
          if (msg && (msg.includes('Database') || msg.includes('unavailable'))) {
            setDbError(true);
          } else if (msg) {
            toast.error(msg);
          }
          setIsKpiLoading(false);
          setIsChartLoading(false);
        }
      }
    };
    loadData();

    // Auto-refresh only while a dataset is processing — read via ref to avoid re-running the effect.
    const interval = setInterval(() => {
      if (!cancelled && datasetsRef.current.some((d) => d.status === 'processing')) {
        loadData();
      }
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setDatasets, setAlerts, setBatchInsights]);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const newAlerts = await alertsApi.scan();
      setAlerts([...newAlerts, ...alerts]);
      newAlerts.forEach((a) => addAlert(a));
      toast.success(`Scan complete: ${newAlerts.length} new alert${newAlerts.length === 1 ? '' : 's'}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Anomaly scan failed.');
    } finally {
      setIsScanning(false);
    }
  };

  const latestDataset = useMemo(() => datasets.find((d) => d.status === 'completed'), [datasets]);
  const totalRecords = records.length;

  // Derive KPI numbers from the fast stats endpoint (available before chart data)
  const { sentimentScore, negPct } = useMemo(() => {
    if (kpiStats) {
      const dist = (kpiStats.sentiment_distribution as Record<string, number>) ?? {};
      const total = (kpiStats.total_records as number) ?? 0;
      if (total === 0) return { sentimentScore: 0, negPct: 0 };
      return {
        sentimentScore: Math.round(((dist.Positive ?? 0) / total) * 100),
        negPct: Math.round(((dist.Negative ?? 0) / total) * 100),
      };
    }
    // Fallback to local records while stats load
    if (totalRecords === 0) return { sentimentScore: 0, negPct: 0 };
    const pos = records.filter((r) => r.sentiment === 'Positive').length;
    const neg = records.filter((r) => r.sentiment === 'Negative').length;
    return {
      sentimentScore: Math.round((pos / totalRecords) * 100),
      negPct: Math.round((neg / totalRecords) * 100),
    };
  }, [kpiStats, records, totalRecords]);

  const dominantEmotion = insights?.dominant_emotions?.[0]?.emotion ?? 'N/A';
  const riskLevel: Risk = insights?.risk_level ?? 'Low';

  const timeSeries = useMemo(() => buildTimeSeries(records, timeRange), [records, timeRange]);

  const pieData = useMemo(
    () =>
      insights?.dominant_emotions?.slice(0, 6).map((e, i) => ({
        name: e.emotion,
        value: e.percentage,
        fill: EMOTION_PALETTE[i % EMOTION_PALETTE.length],
      })) ?? [],
    [insights],
  );

  const riskData = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0 };
    for (const r of records) {
      if (r.risk_level === 'High') counts.High++;
      else if (r.risk_level === 'Medium') counts.Medium++;
      else counts.Low++;
    }
    return [
      { name: 'Low', count: counts.Low, fill: '#10b981' },
      { name: 'Medium', count: counts.Medium, fill: '#f59e0b' },
      { name: 'High', count: counts.High, fill: '#ef4444' },
    ];
  }, [records]);

  const isLoading = isKpiLoading; // keep for no-data check
  const noData = !isKpiLoading && !isChartLoading && totalRecords === 0 && !latestDataset && !kpiStats;

  if (noData) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] text-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Database size={36} aria-hidden />
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-2">No data yet</h2>
          <p className="text-muted-foreground max-w-md">
            Upload a CSV dataset to start seeing insights, trends, and analytics here.
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/upload')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <Upload size={18} aria-hidden /> Upload Dataset
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 space-y-6 w-full min-h-full pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        {latestDataset && (
          <p className="text-xs text-muted-foreground truncate max-w-[180px] md:max-w-xs">{latestDataset.original_filename}</p>
        )}
        <div className="flex gap-2 md:gap-3 flex-wrap ml-auto">
          <button
            onClick={handleScan}
            disabled={isScanning}
            aria-busy={isScanning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 text-sm text-muted-foreground hover:bg-secondary/30 transition-colors disabled:opacity-50"
          >
            {isScanning ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <RefreshCw size={16} aria-hidden />}
            {isScanning ? 'Scanning...' : 'Scan Anomalies'}
          </button>
          <button
            onClick={() => router.push('/dashboard/upload')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20"
          >
            <Upload size={16} aria-hidden /> Upload Data
          </button>
        </div>
      </div>

      {dbError && (
        <div className="glass-card rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-400">Database connecting…</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add <code className="bg-secondary/80 px-1 rounded text-foreground">DIRECT_URL</code> to your Vercel env vars (Supabase direct connection, port 5432) to enable auto-setup.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {isKpiLoading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          <>
            <KpiCard
              title="Sentiment Score"
              value={`${sentimentScore}%`}
              sub={`${totalRecords} records analyzed`}
              icon={TrendingUp}
              trend={sentimentScore > 50 ? 'up' : 'down'}
              color="bg-emerald-500/10 text-emerald-400"
            />
            <KpiCard
              title="Negative Trend"
              value={`${negPct}%`}
              sub="of records flagged negative"
              icon={TrendingDown}
              trend={negPct > 30 ? 'down' : 'up'}
              color="bg-red-500/10 text-red-400"
            />
            <KpiCard
              title="Dominant Emotion"
              value={dominantEmotion}
              sub="From batch insights"
              icon={Brain}
              color="bg-violet-500/10 text-violet-400"
            />
            <KpiCard
              title="Risk Level"
              value={riskLevel}
              sub={`${alerts.length} active alerts`}
              icon={AlertTriangle}
              color={RISK_TILE_CLASS[riskLevel]}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h3 className="font-semibold">Sentiment Over Time</h3>
              <p className="text-xs text-muted-foreground">Positive vs Negative trend</p>
            </div>
            <div className="flex gap-2" role="tablist" aria-label="Time range">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  role="tab"
                  aria-selected={timeRange === d}
                  onClick={() => setTimeRange(d)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                    timeRange === d
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary',
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {isChartLoading ? (
            <div className="h-48 skeleton rounded-xl" />
          ) : (
            <SentimentTrendChart data={timeSeries} timeRange={timeRange} />
          )}
        </div>

        <div className="glass-card rounded-2xl border border-border/50 p-6">
          <h3 className="font-semibold mb-1">Emotion Distribution</h3>
          <p className="text-xs text-muted-foreground mb-6">From batch AI analysis</p>
          {isChartLoading ? (
            <div className="h-48 skeleton rounded-xl" />
          ) : pieData.length > 0 ? (
            <EmotionPieChart data={pieData} />
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              No insights available yet
            </div>
          )}
        </div>

      </div>

      <div className="glass-card rounded-2xl border border-border/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Risk Level Distribution</h3>
            <p className="text-xs text-muted-foreground">Aggregated from active records</p>
          </div>
        </div>
        {isChartLoading ? (
          <div className="h-48 skeleton rounded-xl" />
        ) : totalRecords > 0 ? (
          <RiskBarChart data={riskData} />
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            No structural risk data
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl border border-border/50 p-6">
          <h3 className="font-semibold mb-4">Top Keywords</h3>
          {isChartLoading ? (
            <div className="h-32 skeleton rounded-xl" />
          ) : (insights?.top_keywords?.length ?? 0) > 0 ? (
            <div className="flex flex-wrap gap-2">
              {insights!.top_keywords.map((kw, i) => (
                <span
                  key={kw}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-border/50 transition-colors hover:border-primary/40"
                  style={{ opacity: 1 - i * 0.08, fontSize: `${Math.max(11, 14 - i)}px` }}
                >
                  {kw}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Process a dataset to see top keywords</p>
          )}
        </div>

        <div className="glass-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Active Alerts</h3>
            <button
              onClick={() => router.push('/dashboard/alerts')}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View all <ChevronRight size={12} aria-hidden />
            </button>
          </div>
          {isChartLoading ? (
            <div className="h-32 skeleton rounded-xl" />
          ) : alerts.length > 0 ? (
            <ul className="space-y-3">
              {alerts.slice(0, 3).map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <div
                    aria-hidden
                    className={cn(
                      'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                      a.severity === 'high'
                        ? 'bg-red-400'
                        : a.severity === 'medium'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400',
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium leading-tight">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No alerts. Run an anomaly scan to detect issues.</p>
          )}
        </div>

        <div className="glass-card rounded-2xl border border-border/50 p-6">
          <h3 className="font-semibold mb-4">Recurring Issues</h3>
          {isChartLoading ? (
            <div className="h-32 skeleton rounded-xl" />
          ) : (insights?.recurring_issues?.length ?? 0) > 0 ? (
            <ol className="space-y-2">
              {insights!.recurring_issues.slice(0, 5).map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span aria-hidden className="text-primary font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
                  <span className="text-foreground/80">{issue}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">Process a dataset to discover recurring issues</p>
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-border/50 p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-semibold">Recent Analysis Records</h3>
          <button
            onClick={() => router.push('/dashboard/analyze')}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Analyze more <ArrowRight size={12} aria-hidden />
          </button>
        </div>
        {isChartLoading ? (
          <div className="h-40 skeleton rounded-xl" />
        ) : records.length > 0 ? (
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  {['Text Preview', 'Sentiment', 'Emotion', 'Risk', 'Confidence'].map((h) => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold text-muted-foreground px-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 8).map((r) => (
                  <tr key={r.id} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                    <td className="py-3 px-2 max-w-xs">
                      <p className="truncate text-foreground/80">{r.text.slice(0, 60)}...</p>
                    </td>
                    <td className="py-3 px-2">
                      <SentimentBadge sentiment={r.sentiment} />
                    </td>
                    <td className="py-3 px-2 text-foreground/70 text-xs">{r.emotion}</td>
                    <td className="py-3 px-2">
                      <RiskBadge risk={r.risk_level} />
                    </td>
                    <td className="py-3 px-2 text-xs min-w-32">
                      <ConfidenceBar score={r.confidence_score || 75} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No records yet.{' '}
            <button onClick={() => router.push('/dashboard/analyze')} className="text-primary hover:underline">
              Analyze some text
            </button>{' '}
            or{' '}
            <button onClick={() => router.push('/dashboard/upload')} className="text-primary hover:underline">
              upload a dataset
            </button>
            .
          </p>
        )}
      </div>
    </div>
  );
}
