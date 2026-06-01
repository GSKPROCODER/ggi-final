'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { AlertTriangle, RefreshCw, Loader2, X, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { alertsApi } from '@/lib/api';
import type { AlertResponse } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { format } from 'date-fns';
import { toast } from 'sonner';

type SeverityFilter = 'all' | 'high' | 'medium' | 'low';

const SEVERITY_CONFIG = {
  high: { label: 'High', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', dot: 'bg-red-400' },
  medium: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', dot: 'bg-amber-400' },
  low: { label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', dot: 'bg-emerald-400' },
};

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertResponse[]>([]);
  const [filter, setFilter] = useState<SeverityFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const storeSetAlerts = useStore((s) => s.setAlerts);
  const reduce = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    const loadAlerts = async () => {
      setIsLoading(true);
      try {
        const data = await alertsApi.list();
        if (cancelled) return;
        setAlerts(data);
        storeSetAlerts(data);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : '';
          if (msg && !msg.includes('Database') && !msg.includes('unavailable')) {
            toast.error(msg || 'Failed to load alerts.');
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadAlerts();
    return () => {
      cancelled = true;
    };
  }, [storeSetAlerts]);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const newAlerts = await alertsApi.scan();
      setAlerts((prev) => {
        const merged = [...newAlerts, ...prev];
        storeSetAlerts(merged);
        return merged;
      });
      toast.success(`Scan complete: ${newAlerts.length} new alert${newAlerts.length === 1 ? '' : 's'}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Anomaly scan failed.');
    } finally {
      setIsScanning(false);
    }
  };

  const dismiss = async (id: string) => {
    try {
      await alertsApi.dismiss(id);
      const updated = alerts.filter((a) => a.id !== id);
      setAlerts(updated);
      storeSetAlerts(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to dismiss alert.');
    }
  };

  const clearAll = async () => {
    try {
      await alertsApi.clearAll();
      setAlerts([]);
      storeSetAlerts([]);
      toast.success('All alerts cleared.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to clear alerts.');
    }
  };

  const markRead = async (id: string) => {
    try {
      await alertsApi.markRead(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
    } catch {
      /* silent — mark-read failures are non-critical */
    }
  };

  const filtered = useMemo(
    () => (filter === 'all' ? alerts : alerts.filter((a) => a.severity === filter)),
    [filter, alerts],
  );
  const counts = useMemo(
    () => ({
      all: alerts.length,
      high: alerts.filter((a) => a.severity === 'high').length,
      medium: alerts.filter((a) => a.severity === 'medium').length,
      low: alerts.filter((a) => a.severity === 'low').length,
    }),
    [alerts],
  );

  return (
    <div className="p-5 md:p-6 space-y-6 w-full pb-10">
      {/* Actions row */}
      <div className="flex items-center justify-end gap-3">
          {alerts.length > 0 && (
            <button onClick={clearAll}
              className="px-4 py-2 rounded-xl border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors">
              Clear All
            </button>
          )}
          <button onClick={handleScan} disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 border border-primary/20 transition-colors disabled:opacity-50">
            {isScanning ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {isScanning ? 'Scanning...' : 'Scan Now'}
          </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['all', 'high', 'medium', 'low'] as const).map(s => {
          const cfg = s === 'all' ? null : SEVERITY_CONFIG[s];
          return (
            <div key={s} className={cn('glass-card p-4 rounded-xl border', s === 'all' ? 'border-border/50' : cfg?.border)}>
              <p className={cn('text-3xl font-bold', s === 'all' ? 'text-foreground' : cfg?.color)}>{counts[s]}</p>
              <p className="text-xs text-muted-foreground mt-1">{s === 'all' ? 'Total' : cfg?.label} Alerts</p>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-xl w-fit border border-border/30">
        {(['all', 'high', 'medium', 'low'] as SeverityFilter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all',
              filter === f ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {f} {counts[f] > 0 && <span className="ml-1 text-xs opacity-70">({counts[f]})</span>}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto">
            <Bell size={28} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No {filter !== 'all' ? filter : ''} alerts</p>
            <p className="text-sm text-muted-foreground mt-1">Run a scan to detect anomalies in your data.</p>
          </div>
          <button onClick={handleScan} disabled={isScanning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors mx-auto shadow-lg shadow-primary/20 disabled:opacity-50">
            {isScanning ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {isScanning ? 'Scanning...' : 'Run Anomaly Scan'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(alert => {
              const cfg = SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.low;
              const isExpanded = expandedId === alert.id;
              return (
                <motion.div key={alert.id} layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, marginTop: 0 }}
                  className={cn('glass-card rounded-2xl border p-5 transition-all', cfg.border, !alert.is_read && 'shadow-sm', alert.is_read && 'opacity-70')}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 cursor-pointer"
                      onClick={() => { setExpandedId(isExpanded ? null : alert.id); markRead(alert.id); }}>
                      <div className={cn('w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0', cfg.dot)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{alert.title}</h3>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', cfg.bg, cfg.color)}>
                            {cfg.label}
                          </span>
                          {!alert.is_read && <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded-full">New</span>}
                        </div>
                        <p className={cn('text-xs text-muted-foreground mt-1', !isExpanded && 'line-clamp-1')}>{alert.message}</p>
                        {!isExpanded && <p className="text-xs text-muted-foreground mt-1">{format(new Date(alert.created_at), 'PPp')}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                        className="p-2 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors">
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                      <button onClick={() => dismiss(alert.id)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <X size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={reduce ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        className="overflow-hidden">
                        <div className="mt-4 pt-4 border-t border-border/30 space-y-3">
                          <p className="text-sm text-foreground/90 leading-relaxed">{alert.message}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Detected: {format(new Date(alert.created_at), 'PPp')}</span>
                            <span className={cn('font-medium', cfg.color)}>Severity: {cfg.label}</span>
                          </div>
                          <div className={cn('p-3 rounded-xl text-xs', cfg.bg, cfg.border, 'border')}>
                            <span className="font-medium">Suggested Action:</span>
                            <span className="ml-1 text-foreground/80">
                              {alert.severity === 'high' ? 'Immediate attention required. Review affected records and escalate if needed.' :
                                alert.severity === 'medium' ? 'Monitor this trend. Consider investigating the root cause within 48 hours.' :
                                  'Keep an eye on this pattern. Schedule a review in your next data check.'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
