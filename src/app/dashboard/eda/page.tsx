'use client';

import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from "recharts";
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon, 
  AlertTriangle, 
  Activity,
  ArrowRight,
  RefreshCw,
  Search,
  Sparkles,
  Download,
  Filter
} from "lucide-react";
import { motion } from 'motion/react';
import { edaApi, datasetsApi, type EdaMetrics, type DatasetListItem } from "@/lib/api";
import { toast } from "sonner";

// Premium Color Palette
const COLORS = {
  primary: "#6366f1", // Indigo
  secondary: "#a855f7", // Purple
  accent: "#22d3ee", // Cyan
  danger: "#ef4444", // Red
  warning: "#f59e0b", // Amber
  success: "#10b981", // Emerald
  neutral: "#94a3b8", // Slate
};

const CHART_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.success, COLORS.warning];

import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  color: string;
}

const StatCard = ({ title, value, icon: Icon, trend, color }: StatCardProps) => (
  <div className="relative overflow-hidden group glass-card border border-border/50 p-6 rounded-2xl">
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon size={80} color={color} />
    </div>
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-secondary/50 border border-border/50">
        <Icon size={20} color={color} />
      </div>
      <h3 className="text-muted-foreground font-medium text-xs uppercase tracking-[0.15em]">{title}</h3>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-bold text-foreground tracking-tight">{value}</span>
      {trend && (
        <span className={`text-xs font-medium ${trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trend}
        </span>
      )}
    </div>
  </div>
);

interface ChartContainerProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

const ChartContainer = ({ title, description, children, icon: Icon }: ChartContainerProps) => (
  <div className="glass-card border border-border/50 rounded-2xl p-6">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Icon size={18} className="text-primary" />
          </div>
        )}
        <div>
          <h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
          {description && <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{description}</p>}
        </div>
      </div>
      <button className="p-2 rounded-md hover:bg-secondary/50 text-muted-foreground transition-colors">
        <Download size={14} />
      </button>
    </div>
    <div className="h-[280px] w-full">
      {children}
    </div>
  </div>
);

const EDA: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EdaMetrics | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [datasets, setDatasets] = useState<DatasetListItem[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const ds = await datasetsApi.list();
      setDatasets(ds);
      if (ds.length > 0) {
        setSelectedDataset(ds[0].id);
        const stats = await edaApi.getEDAMetrics(ds[0].id);
        setData(stats);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg && !msg.includes('Database') && !msg.includes('unavailable')) {
        toast.error(msg || 'Failed to load analytics engine.');
      }
      console.error('[EDA]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDatasetChange = async (id: string) => {
    setSelectedDataset(id);
    try {
      setLoading(true);
      const stats = await edaApi.getEDAMetrics(id);
      setData(stats);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg && !msg.includes('Database') && !msg.includes('unavailable')) {
        toast.error(msg || 'Could not load analytics for this dataset.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw size={40} className="text-indigo-500" />
        </motion.div>
        <p className="text-muted-foreground font-medium tracking-tight animate-pulse">Loading analytics…</p>
      </div>
    );
  }

  // Map Backend Keys to Dashboard
  const overview: Partial<EdaMetrics['overview']> = data?.overview ?? {};
  const distributions: Partial<EdaMetrics['distributions']> = data?.distributions ?? {};

  return (
    <div className="w-full space-y-8 pb-12 p-5 md:p-6">
      <div className="flex items-center justify-end gap-3">
          <div className="flex items-center gap-2 bg-secondary/50 border border-border/50 rounded-xl px-4 py-2 focus-within:border-primary/50 transition-all">
            <Filter size={14} className="text-muted-foreground" />
            <select
              value={selectedDataset}
              onChange={(e) => handleDatasetChange(e.target.value)}
              className="bg-transparent text-foreground text-xs outline-none cursor-pointer appearance-none pr-4"
            >
              {datasets.map(ds => (
                <option key={ds.id} value={ds.id}>{ds.original_filename}</option>
              ))}
            </select>
          </div>
          <button
            onClick={loadInitialData}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg active:scale-95"
          >
            <RefreshCw size={16} />
          </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Records" 
          value={overview.total_records?.toLocaleString() || "0"} 
          icon={Activity}
          color={COLORS.primary}
        />
        <StatCard 
          title="Avg Chars" 
          value={overview.avg_chars || "0"} 
          icon={BarChart3}
          trend="+5.1%"
          color={COLORS.success}
        />
        <StatCard 
          title="Status" 
          value={overview.status?.toUpperCase() || "N/A"} 
          icon={AlertTriangle}
          color={overview.status === 'processed' ? COLORS.success : COLORS.warning}
        />
        <StatCard 
          title="Missing Analysis" 
          value={(overview.missing_analysis_pct || 0).toFixed(1) + "%"} 
          icon={Search}
          color={COLORS.warning}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer 
          title="Sentiment Mapping" 
          description="Emotional spectrum analysis"
          icon={PieChartIcon}
        >
          <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distributions.sentiment}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={10}
                dataKey="value"
              >
                {distributions.sentiment?.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="rgba(0,0,0,0)" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
          </div>
        </ChartContainer>

        <ChartContainer
          title="Risk Profile" 
          description="Security vulnerability assessment"
          icon={AlertTriangle}
        >
          <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributions.risk}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {distributions.risk?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name === 'High' ? COLORS.danger : (entry.name === 'Medium' ? COLORS.warning : COLORS.success)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
        </ChartContainer>

        <ChartContainer
          title="Information Density" 
          description="Semantic richness (text length)"
          icon={LineChartIcon}
        >
          <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={distributions.length}>
              <defs>
                <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke={COLORS.primary} 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorArea)" 
              />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        </ChartContainer>

        <div className="glass-card border border-border/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <Sparkles className="text-primary mb-6" size={48} />
          <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">Insights Ready</h3>
          <p className="text-muted-foreground text-sm max-w-xs mb-6 leading-relaxed">
            Your dataset has been analyzed. Ask the Nexus Agent about the findings.
          </p>
          <a href="/dashboard/agent" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-medium transition-all group">
            Ask Agent
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default EDA;
