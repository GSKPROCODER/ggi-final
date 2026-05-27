'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Search, Loader2, AlertTriangle, Trash2, CheckCircle2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzeApi, type RecordResponse } from '@/lib/api';
import { toast } from 'sonner';

const SENTIMENT_COLORS = {
  Positive: 'text-emerald-400 bg-emerald-500/10',
  Neutral: 'text-muted-foreground bg-secondary',
  Negative: 'text-red-400 bg-red-500/10',
};

const RISK_COLORS = { 
  Low: 'text-emerald-400', 
  Medium: 'text-amber-400', 
  High: 'text-red-400' 
};

export default function ManageHistory() {
  const [records, setRecords] = useState<RecordResponse[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const loadRecords = async (query = '') => {
    setIsLoading(true);
    try {
      const res = await analyzeApi.getHistory(100, undefined, query);
      setRecords(res);
      // Clean up selected items that are no longer in the list (e.g. after search)
      if (selectedIds.size > 0) {
        const availableIds = new Set(res.map(r => r.id));
        const activeIds = new Set([...selectedIds].filter(x => availableIds.has(x)));
        setSelectedIds(activeIds);
      }
    } catch (e) {
      toast.error('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadRecords(searchQuery.trim());
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === records.length && records.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map(r => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const executeBulkDelete = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await analyzeApi.bulkDelete(Array.from(selectedIds));
      toast.success(`Successfully deleted ${selectedIds.size} records.`);
      setSelectedIds(new Set());
      setShowDeleteModal(false);
      setDeleteConfirmText('');
      await loadRecords(searchQuery.trim());
    } catch {
      toast.error('Failed to delete records.');
    } finally {
      setIsDeleting(false);
    }
  };

  const exportToCSV = () => {
    const selectedRecords = records.filter(r => selectedIds.has(r.id));
    if (selectedRecords.length === 0) return;

    // Build CSV Headers
    const headers = ['ID', 'Text', 'Sentiment', 'Emotion', 'Risk Level', 'Key Issues', 'Created At'];
    
    // Build Rows
    const rows = selectedRecords.map(r => {
      // Escape text with quotes if it contains commas, newlines, or quotes
      const cleanText = (str: string) => `"${str.replace(/"/g, '""')}"`;
      
      let keyIssuesStr = '';
      try {
        const issues = r.key_issues || [];
        keyIssuesStr = Array.isArray(issues) ? issues.join(', ') : '';
      } catch (e) {
        keyIssuesStr = '';
      }

      return [
        r.id,
        cleanText(r.text),
        r.sentiment,
        r.emotion,
        r.risk_level,
        cleanText(keyIssuesStr),
        new Date(r.created_at).toISOString()
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nexus_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selectedRecords.length} records to CSV`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1 z-10 relative">
          <div className="absolute top-0 left-0 -translate-x-4 -translate-y-4 w-24 h-24 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Database className="text-primary" size={28} />
            Data Management
          </h1>
          <p className="text-muted-foreground max-w-lg text-sm">
            Search, filter, and purge your analysis history. Note that deletion permanently removes AI insights linked to the data.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative w-full md:max-w-sm group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search record content..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-secondary/50 border border-border/50 text-foreground text-sm rounded-xl pl-10 pr-16 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all placeholder:text-muted-foreground/60"
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-primary/20 hover:bg-primary/30 text-primary p-1.5 rounded-lg transition-colors"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRightIcon size={16} />}
          </button>
        </form>
      </div>

      {/* Main Table Card */}
      <div className="glass-card rounded-2xl border border-border/50 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/20">
                <th className="px-4 py-4 w-[50px]">
                  <input 
                    type="checkbox" 
                    checked={records.length > 0 && selectedIds.size === records.length}
                    onChange={toggleSelectAll}
                    disabled={records.length === 0}
                    className="w-4 h-4 rounded border-border/50 text-primary focus:ring-primary focus:ring-offset-background bg-secondary cursor-pointer"
                  />
                </th>
                <th className="px-4 py-4 font-semibold text-muted-foreground">Preview Snippet</th>
                <th className="px-4 py-4 font-semibold text-muted-foreground">Sentiment</th>
                <th className="px-4 py-4 font-semibold text-muted-foreground w-1/6">Risk Level</th>
                <th className="px-4 py-4 font-semibold text-muted-foreground w-1/6">Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, i) => {
                const isSelected = selectedIds.has(record.id);
                // Extracting colors
                const sentColor = SENTIMENT_COLORS[record.sentiment as keyof typeof SENTIMENT_COLORS] || SENTIMENT_COLORS.Neutral;
                const riskColor = RISK_COLORS[record.risk_level as keyof typeof RISK_COLORS] || 'text-muted-foreground';

                return (
                  <tr 
                    key={record.id} 
                    className={cn(
                      'border-b border-border/30 hover:bg-secondary/30 transition-colors group cursor-pointer',
                      isSelected && 'bg-primary/5 hover:bg-primary/10'
                    )}
                    onClick={() => toggleSelect(record.id)}
                  >
                    <td className="px-4 py-3 border-r border-transparent">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelect(record.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-border/50 text-primary focus:ring-primary focus:ring-offset-background bg-secondary cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-white max-w-[200px] sm:max-w-md md:max-w-lg truncate">
                      {record.text}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2.5 py-1 rounded-md text-xs font-semibold', sentColor)}>
                        {record.sentiment}
                      </span>
                    </td>
                    <td className={cn('px-4 py-3 font-medium', riskColor)}>
                      {record.risk_level}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(record.created_at).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </td>
                  </tr>
                );
              })}
              
              {/* Empty state */}
              {!isLoading && records.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Database size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground mb-1">No analysis records found.</p>
                    <p className="text-xs text-muted-foreground/60">Upload some data or adjust your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-card/60 backdrop-blur-xl border border-border px-6 py-4 rounded-2xl shadow-2xl glass-edge"
          >
            <div className="flex items-center gap-2 text-primary font-semibold">
              <CheckCircle2 size={18} />
              <span>{selectedIds.size} records selected</span>
            </div>
            <div className="w-px h-6 bg-border mx-2" />
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white font-medium rounded-xl text-sm transition-all flex items-center gap-2 border border-transparent hover:border-indigo-400/50 shadow-lg shadow-indigo-500/10"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white font-medium rounded-xl text-sm transition-all flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete Selected
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setShowDeleteModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            {/* Modal */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden glass-card"
            >
              <div className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                  <AlertTriangle size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">Confirm Mass Deletion</h2>
                <p className="text-muted-foreground text-sm">
                  You are about to permanently delete <strong className="text-white">{selectedIds.size}</strong> records. 
                  This action cannot be undone and these insights will be lost forever.
                </p>
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Type 'DELETE' to confirm
                  </label>
                  <input 
                    type="text" 
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full bg-secondary/50 border border-border/50 text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-mono"
                  />
                </div>
              </div>
              <div className="p-4 bg-secondary/30 border-t border-border/30 flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeBulkDelete}
                  disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Purge Data
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// ChevronRightIcon helper
function ChevronRightIcon({ className, ...props }: React.ComponentProps<'svg'> & { size?: number | string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={props.size || "24"} 
      height={props.size || "24"} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className} 
      {...props}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  )
}
