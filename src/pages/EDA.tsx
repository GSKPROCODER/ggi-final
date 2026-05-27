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
import { motion } from "framer-motion";
import { edaApi, datasetsApi } from "../lib/api";
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

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden group bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl"
  >
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <Icon size={80} color={color} />
    </div>
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
        <Icon size={20} color={color} />
      </div>
      <h3 className="text-slate-400 font-medium text-xs uppercase tracking-[0.15em]">{title}</h3>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
      {trend && (
        <span className={`text-xs font-medium ${trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend}
        </span>
      )}
    </div>
  </motion.div>
);

const ChartContainer = ({ title, description, children, icon: Icon }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-2xl"
  >
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Icon size={18} className="text-indigo-400" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{description}</p>
        </div>
      </div>
      <button className="p-2 rounded-md hover:bg-white/5 text-slate-400 transition-colors">
        <Download size={14} />
      </button>
    </div>
    <div className="h-[280px] w-full">
      {children}
    </div>
  </motion.div>
);

const EDA: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [datasets, setDatasets] = useState<any[]>([]);

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
      toast.error("Failed to load analytics engine.");
      console.error(err);
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
      toast.error("Cloud analytics unreachable.");
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
        <p className="text-slate-400 font-medium tracking-tight animate-pulse">Initializing Synthetic Analytics Kernel...</p>
      </div>
    );
  }

  // Map Backend Keys to Dashboard
  const overview = data?.overview || {};
  const distributions = data?.distributions || {};

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.3em]">
            <Sparkles size={12} />
            Data Intelligence
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">EDA & Insights</h1>
          <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
            Exploratory analysis of latent patterns, sentiment distributions, and risk heatmaps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-4 py-2 focus-within:border-indigo-500/50 transition-all">
            <Filter size={14} className="text-slate-500" />
            <select 
              value={selectedDataset}
              onChange={(e) => handleDatasetChange(e.target.value)}
              className="bg-transparent text-white text-xs outline-none cursor-pointer appearance-none pr-4"
            >
              {datasets.map(ds => (
                <option key={ds.id} value={ds.id} className="bg-[#0f172a]">{ds.original_filename}</option>
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
                {distributions.sentiment?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="rgba(0,0,0,0)" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer 
          title="Risk Profile" 
          description="Security vulnerability assessment"
          icon={AlertTriangle}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributions.risk}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', border: 'none' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {distributions.risk?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.name === 'High' ? COLORS.danger : (entry.name === 'Medium' ? COLORS.warning : COLORS.success)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer 
          title="Information Density" 
          description="Semantic richness (text length)"
          icon={LineChartIcon}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={distributions.length}>
              <defs>
                <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', border: 'none' }}
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
        </ChartContainer>

        <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <Sparkles className="text-indigo-400 mb-6 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" size={56} />
          <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">AI Logic Core Active</h3>
          <p className="text-slate-400 text-sm max-w-xs mb-8 leading-relaxed">
            The Analyst-Critic loop has discovered systemic correlations in your latest upload.
          </p>
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all group shadow-xl active:scale-95">
            Discuss Findings
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EDA;
