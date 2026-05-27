'use client';

import { useEffect, useState, type ElementType } from 'react';
import { motion } from 'motion/react';
import {
  AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar
} from 'recharts';
import {
  TrendingUp, TrendingDown, AlertTriangle, Brain, Database,
  RefreshCw, Upload, ArrowRight, ChevronRight, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { datasetsApi, analyzeApi, alertsApi } from '@/lib/api';
import type { BatchInsights, RecordResponse } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { format, subDays } from 'date-fns';

const EMOTION_COLORS = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];
const SENTIMENT_COLORS = { Positive: '#10b981', Neutral: '#6b7280', Negative: '#ef4444' };

function KpiCard({ title, value, sub, icon: Icon, trend, color }: {
  title: string; value: string; sub: string; icon: ElementType; trend?: 'up' | 'down'; color?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 rounded-2xl border border-border/50 hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color || 'bg-primary/10 text-primary')}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className={cn('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            trend === 'up' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10')}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold tracking-tight mb-1">{value}</p>
      <p className="text-sm font-medium text-foreground/80 mb-0.5">{title}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </motion.div>
  );
}

function SkeletonCard() {
  return <div className="glass-card p-5 rounded-2xl border border-border/50 h-36 skeleton" />;
}

// Synthesize a 30-day time series from real records
function buildTimeSeries(records: RecordResponse[], days = 30) {
  const series: { date: string; positive: number; negative: number; count: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(now, i);
    const dayLabel = format(d, 'MMM d');
    const dayRecords = records.filter(r => {
      const rd = new Date(r.created_at);
      return rd.toDateString() === d.toDateString();
    });
    const pos = dayRecords.filter(r => r.sentiment === 'Positive').length;
    const neg = dayRecords.filter(r => r.sentiment === 'Negative').length;
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
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [timeRange, setTimeRange] = useState(30);
  const { datasets, alerts, setDatasets, setAlerts, addAlert, batchInsights, setBatchInsights } = useStore();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dsRes, recRes, alertRes] = await Promise.all([
        datasetsApi.list(),
        analyzeApi.getHistory(100),
        alertsApi.list(),
      ]);
      setDatasets(dsRes);
      setRecords(recRes);
      setAlerts(alertRes);

      // Load insights from latest completed dataset
      const latestCompleted = dsRes.find(d => d.status === 'completed');
      if (latestCompleted) {
        try {
          const ins = await datasetsApi.getInsights(latestCompleted.id);
          setInsights(ins);
          setBatchInsights(ins);
        } catch { /* No insights yet */ }
      }
    } catch { /* Handled by API client */ } finally {
      setIsLoading(false);
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const newAlerts = await alertsApi.scan();
      setAlerts([...newAlerts, ...alerts]);
      newAlerts.forEach(a => addAlert(a));
    } catch { /* */ } finally {
      setIsScanning(false);
    }
  };

  const latestDataset = datasets.find(d => d.status === 'completed');
  const totalRecords = records.length;
  const negPct = totalRecords > 0
    ? Math.round((records.filter(r => r.sentiment === 'Negative').length / totalRecords) * 100)
    : 0;
  const sentimentScore = totalRecords > 0
    ? Math.round((records.filter(r => r.sentiment === 'Positive').length / totalRecords) * 100)
    : 0;
  const dominantEmotion = insights?.dominant_emotions?.[0]?.emotion || 'N/A';
  const riskLevel = insights?.risk_level || 'Low';

  const timeSeries = buildTimeSeries(records, timeRange);
  const pieData = insights?.dominant_emotions?.slice(0, 6).map((e, i) => ({
    name: e.emotion, value: e.percentage, fill: EMOTION_COLORS[i],
  })) || [];

  // Compute Risk Distribution directly from records
  const riskCounts = { Low: 0, Medium: 0, High: 0 };
  records.forEach(r => {
    if (r.risk_level === 'High') riskCounts.High++;
    else if (r.risk_level === 'Medium') riskCounts.Medium++;
    else riskCounts.Low++;
  });
  const riskData = [
    { name: 'Low', count: riskCounts.Low, fill: '#10b981' },
    { name: 'Medium', count: riskCounts.Medium, fill: '#f59e0b' },
    { name: 'High', count: riskCounts.High, fill: '#ef4444' }
  ];

  const noData = !isLoading && totalRecords === 0 && !latestDataset;

  if (noData) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] text-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Database size={36} />
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-2">No data yet</h2>
          <p className="text-muted-foreground max-w-md">Upload a CSV dataset to start seeing insights, trends, and analytics here.</p>
        </div>
        <button onClick={() => router.push('/dashboard/upload')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          <Upload size={18} /> Upload Dataset
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 space-y-6 max-w-7xl mx-auto min-h-full pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {latestDataset ? `Analyzing: ${latestDataset.original_filename}` : 'Overview of your text intelligence data'}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleScan} disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 text-sm text-muted-foreground hover:bg-secondary/30 transition-colors disabled:opacity-50">
            {isScanning ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {isScanning ? 'Scanning...' : 'Scan Anomalies'}
          </button>
          <button onClick={() => router.push('/dashboard/upload')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/20">
            <Upload size={16} /> Upload Data
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          <>
            <KpiCard title="Sentiment Score" value={`${sentimentScore}%`}
              sub={`${totalRecords} records analyzed`} icon={TrendingUp}
              trend={sentimentScore > 50 ? 'up' : 'down'} color="bg-emerald-500/10 text-emerald-400" />
            <KpiCard title="Negative Trend" value={`${negPct}%`}
              sub="of records flagged negative" icon={TrendingDown}
              trend={negPct > 30 ? 'down' : 'up'} color="bg-red-500/10 text-red-400" />
            <KpiCard title="Dominant Emotion" value={dominantEmotion}
              sub={`From batch insights`} icon={Brain} color="bg-violet-500/10 text-violet-400" />
            <KpiCard title="Risk Level" value={riskLevel}
              sub={`${alerts.length} active alerts`} icon={AlertTriangle}
              color={riskLevel === 'High' ? 'bg-red-500/10 text-red-400' : riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'} />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Sentiment Trend Chart */}
        <div className="glass-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Sentiment Over Time</h3>
              <p className="text-xs text-muted-foreground">Positive vs Negative trend</p>
            </div>
            <div className="flex gap-2">
              {[7, 14, 30].map(d => (
                <button key={d} onClick={() => setTimeRange(d)}
                  className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                    timeRange === d ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary')}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {isLoading ? <div className="h-48 skeleton rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timeSeries} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="negGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} interval={Math.floor(timeRange / 7)} />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ background: 'rgba(15,15,15,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="positive" stroke="#10b981" fill="url(#posGrad)" strokeWidth={2} name="Positive" />
                <Area type="monotone" dataKey="negative" stroke="#ef4444" fill="url(#negGrad)" strokeWidth={2} name="Negative" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Emotion Distribution */}
        <div className="glass-card rounded-2xl border border-border/50 p-6">
          <h3 className="font-semibold mb-1">Emotion Distribution</h3>
          <p className="text-xs text-muted-foreground mb-6">From batch AI analysis</p>
          {isLoading ? <div className="h-48 skeleton rounded-xl" /> : pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} contentStyle={{ background: 'rgba(15,15,15,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.slice(0, 4).map((e) => (
                  <div key={e.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: e.fill }} />
                      <span className="text-foreground/80">{e.name}</span>
                    </div>
                    <span className="font-semibold">{e.value.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              No insights available yet
            </div>
          )}
        </div>
        {/* Risk Level Distribution */}
        <div className="glass-card rounded-2xl border border-border/50 p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-1">Risk Level Distribution</h3>
            <p className="text-xs text-muted-foreground mb-6">Aggregated from active records</p>
          </div>
          {isLoading ? <div className="h-48 skeleton rounded-xl" /> : totalRecords > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={riskData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                  contentStyle={{ background: 'rgba(15,15,15,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} 
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              No structural risk data
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Alerts + Keywords + Recent Records */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top Keywords */}
        <div className="glass-card rounded-2xl border border-border/50 p-6">
          <h3 className="font-semibold mb-4">Top Keywords</h3>
          {isLoading ? <div className="h-32 skeleton rounded-xl" /> : (insights?.top_keywords?.length ?? 0) > 0 ? (
            <div className="flex flex-wrap gap-2">
              {insights!.top_keywords.map((kw, i) => (
                <span key={kw} className="px-3 py-1.5 rounded-full text-xs font-medium border border-border/50 transition-colors hover:border-primary/40"
                  style={{ opacity: 1 - i * 0.08, fontSize: `${Math.max(11, 14 - i)}px` }}>
                  {kw}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Process a dataset to see top keywords</p>
          )}
        </div>

        {/* Active Alerts */}
        <div className="glass-card rounded-2xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Active Alerts</h3>
            <button onClick={() => router.push('/dashboard/alerts')} className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </button>
          </div>
          {isLoading ? <div className="h-32 skeleton rounded-xl" /> : alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.slice(0, 3).map(a => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                    a.severity === 'high' ? 'bg-red-400' : a.severity === 'medium' ? 'bg-amber-400' : 'bg-emerald-400')} />
                  <div>
                    <p className="text-sm font-medium leading-tight">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No alerts. Run an anomaly scan to detect issues.</p>
          )}
        </div>

        {/* Recurring Issues */}
        <div className="glass-card rounded-2xl border border-border/50 p-6">
          <h3 className="font-semibold mb-4">Recurring Issues</h3>
          {isLoading ? <div className="h-32 skeleton rounded-xl" /> : (insights?.recurring_issues?.length ?? 0) > 0 ? (
            <div className="space-y-2">
              {insights!.recurring_issues.slice(0, 5).map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
                  <span className="text-foreground/80">{issue}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Process a dataset to discover recurring issues</p>
          )}
        </div>
      </div>

      {/* Recent Records */}
      <div className="glass-card rounded-2xl border border-border/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Recent Analysis Records</h3>
          <button onClick={() => router.push('/dashboard/analyze')} className="text-xs text-primary hover:underline flex items-center gap-1">
            Analyze more <ArrowRight size={12} />
          </button>
        </div>
        {isLoading ? <div className="h-40 skeleton rounded-xl" /> : records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  {['Text Preview', 'Sentiment', 'Emotion', 'Risk', 'Confidence'].map(h => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 8).map(r => (
                  <tr key={r.id} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                    <td className="py-3 pr-4 max-w-xs">
                      <p className="truncate text-foreground/80">{r.text.slice(0, 60)}...</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium',
                        r.sentiment === 'Positive' ? 'bg-emerald-500/20 text-emerald-400'
                          : r.sentiment === 'Negative' ? 'bg-red-500/20 text-red-400'
                            : 'bg-secondary text-muted-foreground')}>
                        {r.sentiment}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-foreground/70 text-xs">{r.emotion}</td>
                    <td className="py-3 pr-4">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium',
                        r.risk_level === 'High' ? 'text-red-400' : r.risk_level === 'Medium' ? 'text-amber-400' : 'text-emerald-400')}>
                        {r.risk_level}
                      </span>
                    </td>
                    <td className="py-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${r.confidence_score || 75}%` }} />
                        </div>
                        <span className="text-muted-foreground">{(r.confidence_score || 75).toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No records yet. <button onClick={() => router.push('/dashboard/analyze')} className="text-primary hover:underline">Analyze some text</button> or <button onClick={() => router.push('/dashboard/upload')} className="text-primary hover:underline">upload a dataset</button>.
          </p>
        )}
      </div>
    </div>
  );
}
