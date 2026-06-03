'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  FileText, Plus, Trash2, Eye, EyeOff, Loader2, Download,
  Search, X, TrendingUp, AlertTriangle, Lightbulb, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { reportsApi } from '@/lib/api';
import type { ReportListItem, ReportResponse } from '@/lib/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Reports() {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [showGenerate, setShowGenerate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    const loadReports = async () => {
      setIsLoading(true);
      try {
        const data = await reportsApi.list();
        if (!cancelled) setReports(data);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : '';
          if (msg && !msg.includes('Database') && !msg.includes('unavailable')) {
            toast.error(msg || 'Failed to load reports.');
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadReports();
    return () => {
      cancelled = true;
    };
  }, []);

  const generateReport = async () => {
    if (!reportTitle.trim()) return;
    setIsGenerating(true);
    try {
      const report = await reportsApi.generate(reportTitle.trim());
      setReports((prev) => [
        { id: report.id, title: report.title, overview: report.overview, created_at: report.created_at },
        ...prev,
      ]);
      setSelectedReport(report);
      setIsPreviewOpen(true);
      setShowGenerate(false);
      setReportTitle('');
      toast.success('Report generated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Report generation failed. Ensure you have processed data first.');
    } finally {
      setIsGenerating(false);
    }
  };

  const openReport = async (id: string) => {
    try {
      const report = await reportsApi.getById(id);
      setSelectedReport(report);
      setIsPreviewOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open report.');
    }
  };

  const deleteReport = async (id: string) => {
    setDeletingId(id);
    try {
      await reportsApi.delete(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (selectedReport?.id === id) {
        setSelectedReport(null);
        setIsPreviewOpen(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete report.');
    } finally {
      setDeletingId(null);
    }
  };

  const exportReportAsPDF = async () => {
    if (!selectedReport) return;
    
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      
      const element = document.getElementById('report-content');
      if (!element) return;
      
      // Temporarily hide scrollbars for cleaner capture
      const originalOverflow = element.style.overflow;
      element.style.overflow = 'visible';
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#09090b' : '#ffffff'
      });
      
      element.style.overflow = originalOverflow;
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${selectedReport.title.replace(/\s+/g, '_')}.pdf`);
      toast.success('Report downloaded as PDF');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return reports.filter((r) => r.title.toLowerCase().includes(q));
  }, [reports, searchQuery]);

  return (
    <div className="p-5 md:p-6 space-y-6 w-full pb-10">
      {/* Actions row */}
      <div className="flex items-center justify-end">
        <button onClick={() => setShowGenerate(!showGenerate)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
          <Plus size={16} /> Generate Report
        </button>
      </div>

      {/* Generate Panel */}
      <AnimatePresence>
        {showGenerate && (
          <motion.div initial={reduce ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="glass-card rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-4">
              <h3 className="font-semibold">Generate New Report</h3>
              <div className="flex gap-3">
                <input
                  value={reportTitle}
                  onChange={e => setReportTitle(e.target.value)}
                  placeholder="Report title (e.g., Q4 Customer Feedback Analysis)"
                  className="flex-1 bg-secondary/30 border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  onKeyDown={e => { if (e.key === 'Enter') generateReport(); }}
                />
                <button onClick={generateReport} disabled={!reportTitle.trim() || isGenerating}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : 'Generate'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Q4 Customer Sentiment Review', 'Risk Assessment Report', 'Monthly Feedback Summary', 'Executive Intelligence Brief'].map(t => (
                  <button key={t} onClick={() => setReportTitle(t)}
                    className="text-xs px-3 py-1.5 rounded-full bg-secondary/50 border border-border/30 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search reports..."
          className="w-full bg-secondary/30 border border-border/40 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
        {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X size={14} />
        </button>}
      </div>

      {/* Reports list */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 && !isGenerating ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto">
            <FileText size={28} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{searchQuery ? 'No reports match your search' : 'No reports yet'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? 'Try a different search term' : 'Upload and process data, then generate your first report'}
            </p>
          </div>
          {!searchQuery && (
            <button onClick={() => setShowGenerate(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors mx-auto shadow-lg shadow-primary/20">
              <Plus size={16} /> Generate Report
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl border border-primary/30 p-5 flex items-center gap-4"
            >
              <Loader2 className="animate-spin text-primary shrink-0" size={20} />
              <div className="flex-1 min-w-0">
                <div className="skeleton h-4 w-48 max-w-full rounded mb-2" />
                <div className="skeleton h-3 w-32 max-w-full rounded" />
              </div>
              <span className="text-xs text-muted-foreground shrink-0">Generating…</span>
            </motion.div>
          )}
          {filtered.map(report => (
            <motion.div key={report.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-card glass-card-interactive rounded-2xl border border-border/50 p-5 group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold group-hover:text-primary transition-colors truncate">{report.title}</h3>
                  {report.overview && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{report.overview}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">{format(new Date(report.created_at), 'PPp')}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openReport(report.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors border border-primary/20">
                    <Eye size={13} /> Preview
                  </button>
                  <button onClick={() => deleteReport(report.id)} disabled={deletingId === report.id}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50">
                    {deletingId === report.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && selectedReport && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setIsPreviewOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-4 md:inset-8 lg:inset-12 bg-background rounded-3xl border border-border/50 shadow-2xl z-50 flex flex-col overflow-hidden max-w-6xl mx-auto">
              <div className="bg-background/95 backdrop-blur border-b border-border/50 p-6 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="font-bold text-xl">{selectedReport.title}</h2>
                  <p className="text-sm text-muted-foreground">{format(new Date(selectedReport.created_at), 'PPp')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={exportReportAsPDF}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                    <Download size={16} /> Export PDF
                  </button>
                  <button onClick={() => setIsPreviewOpen(false)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors bg-secondary/20">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div id="report-content" className="p-8 md:p-12 space-y-10 overflow-y-auto flex-1 bg-background relative">
                {/* Overview */}
                {selectedReport.overview && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Overview</h3>
                    <p className="text-foreground/90 leading-relaxed text-sm">{selectedReport.overview}</p>
                  </section>
                )}

                {/* Metrics */}
                {selectedReport.metrics.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <BarChart3 size={14} className="text-primary" /> Key Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedReport.metrics.map((m, i) => (
                        <div key={i} className="glass-card p-4 rounded-xl border border-border/40">
                          <p className="text-xl font-bold text-primary">{m.value}</p>
                          <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Key Findings */}
                {selectedReport.key_findings.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Search size={14} className="text-primary" /> Key Findings
                    </h3>
                    <ul className="space-y-2">
                      {selectedReport.key_findings.map((f, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
                          <span className="text-foreground/90">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Trend Analysis */}
                {selectedReport.trend_analysis && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <TrendingUp size={14} className="text-primary" /> Trend Analysis
                    </h3>
                    <div className="p-4 bg-secondary/30 rounded-xl border border-border/30">
                      <p className="text-sm text-foreground/90 leading-relaxed">{selectedReport.trend_analysis}</p>
                    </div>
                  </section>
                )}

                {/* Risk Assessment */}
                {selectedReport.risk_assessment && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-amber-400" /> Risk Assessment
                    </h3>
                    <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20">
                      <p className="text-sm text-foreground/90 leading-relaxed">{selectedReport.risk_assessment}</p>
                    </div>
                  </section>
                )}

                {/* Recommendations */}
                {selectedReport.recommendations.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Lightbulb size={14} className="text-primary" /> Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {selectedReport.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10 text-sm">
                          <span className="text-primary font-bold flex-shrink-0">{i + 1}.</span>
                          <span className="text-foreground/90">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
