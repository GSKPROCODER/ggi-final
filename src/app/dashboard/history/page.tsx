'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Database, Search, Loader2, AlertTriangle, Trash2, CheckCircle2,
  Download, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzeApi, type RecordResponse } from '@/lib/api';
import { toast } from 'sonner';
import { SentimentBadge } from '@/components/ui/sentiment-badge';
import { RiskBadge } from '@/components/ui/risk-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ManageHistory() {
  const [records, setRecords] = useState<RecordResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const reduce = useReducedMotion();

  const loadRecords = async (query = '') => {
    setIsLoading(true);
    try {
      const res = await analyzeApi.getHistory(100, undefined, query);
      setRecords(res.items);
      setTotal(res.total);
      setSelectedIds((prev) => {
        if (prev.size === 0) return prev;
        const availableIds = new Set(res.items.map((r) => r.id));
        return new Set([...prev].filter((x) => availableIds.has(x)));
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    loadRecords(searchQuery.trim());
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === records.length && records.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map((r) => r.id)));
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
    const selectedRecords = records.filter((r) => selectedIds.has(r.id));
    if (selectedRecords.length === 0) return;

    const cleanText = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const headers = ['ID', 'Text', 'Sentiment', 'Emotion', 'Risk Level', 'Key Issues', 'Created At'];
    const rows = selectedRecords.map((r) => {
      const issues = Array.isArray(r.key_issues) ? r.key_issues.join(', ') : '';
      return [
        r.id,
        cleanText(r.text),
        r.sentiment,
        r.emotion,
        r.risk_level,
        cleanText(issues),
        new Date(r.created_at).toISOString(),
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
    <div className="w-full space-y-6 lg:space-y-8 p-5 md:p-6">
      <form onSubmit={handleSearch} className="relative w-full md:max-w-sm group" role="search">
          <label htmlFor="history-search" className="sr-only">
            Search records
          </label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} aria-hidden />
          <input
            id="history-search"
            type="search"
            placeholder="Search record content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary/50 border border-border/50 text-foreground text-sm rounded-xl pl-10 pr-16 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all placeholder:text-muted-foreground/60"
          />
          <button
            type="submit"
            disabled={isLoading}
            aria-label="Run search"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-primary/20 hover:bg-primary/30 text-primary p-1.5 rounded-lg transition-colors"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <ChevronRight size={16} aria-hidden />}
          </button>
      </form>

      {!isLoading && total > 0 && (
        <p className="text-xs text-muted-foreground -mt-2">
          Showing <span className="text-foreground font-medium">{records.length}</span> of{' '}
          <span className="text-foreground font-medium">{total}</span> record{total === 1 ? '' : 's'}
        </p>
      )}

      <div className="glass-card rounded-2xl border border-border/50 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/20">
                <th scope="col" className="px-4 py-4 w-[50px]">
                  <input
                    type="checkbox"
                    checked={records.length > 0 && selectedIds.size === records.length}
                    onChange={toggleSelectAll}
                    disabled={records.length === 0}
                    aria-label="Select all records"
                    className="w-4 h-4 rounded border-border/50 text-primary focus:ring-primary focus:ring-offset-background bg-secondary cursor-pointer"
                  />
                </th>
                <th scope="col" className="px-4 py-4 font-semibold text-muted-foreground">Preview Snippet</th>
                <th scope="col" className="px-4 py-4 font-semibold text-muted-foreground">Sentiment</th>
                <th scope="col" className="px-4 py-4 font-semibold text-muted-foreground w-1/6">Risk Level</th>
                <th scope="col" className="px-4 py-4 font-semibold text-muted-foreground w-1/6">Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const isSelected = selectedIds.has(record.id);
                return (
                  <tr
                    key={record.id}
                    className={cn(
                      'border-b border-border/30 hover:bg-secondary/30 transition-colors group cursor-pointer',
                      isSelected && 'bg-primary/5 hover:bg-primary/10',
                    )}
                    onClick={() => toggleSelect(record.id)}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(record.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select record ${record.id}`}
                        className="w-4 h-4 rounded border-border/50 text-primary focus:ring-primary focus:ring-offset-background bg-secondary cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-foreground max-w-[200px] sm:max-w-md md:max-w-lg truncate">
                      {record.text}
                    </td>
                    <td className="px-4 py-3">
                      <SentimentBadge sentiment={record.sentiment} />
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge risk={record.risk_level} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(record.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                );
              })}

              {!isLoading && records.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Database size={40} className="mx-auto text-muted-foreground/30 mb-4" aria-hidden />
                    <p className="text-muted-foreground mb-1">No analysis records found.</p>
                    <p className="text-xs text-muted-foreground/60">Upload some data or adjust your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedIds.size > 0 && (
          <div
            className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:bottom-6 md:-translate-x-1/2 z-50 flex items-center gap-3 bg-card/80 backdrop-blur-xl border border-border px-4 py-3 md:px-6 md:py-4 rounded-2xl shadow-2xl flex-wrap justify-center"
            role="region"
            aria-label="Bulk actions"
          >
            <div className="flex items-center gap-2 text-primary font-semibold">
              <CheckCircle2 size={18} aria-hidden />
              <span>{selectedIds.size} records selected</span>
            </div>
            <div aria-hidden className="w-px h-6 bg-border mx-2" />
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white font-medium rounded-xl text-sm transition-all flex items-center gap-2 border border-transparent hover:border-indigo-400/50 shadow-lg shadow-indigo-500/10"
            >
              <Download size={16} aria-hidden />
              Export CSV
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white font-medium rounded-xl text-sm transition-all flex items-center gap-2"
            >
              <Trash2 size={16} aria-hidden />
              Delete Selected
            </button>
          </div>
        )}
      </AnimatePresence>

      <Dialog open={showDeleteModal} onOpenChange={(open) => !isDeleting && setShowDeleteModal(open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
              <AlertTriangle size={24} aria-hidden />
            </div>
            <DialogTitle>Confirm Mass Deletion</DialogTitle>
            <DialogDescription>
              You are about to permanently delete <strong className="text-foreground">{selectedIds.size}</strong> records. This action cannot be undone and these insights will be lost forever.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            <label htmlFor="delete-confirm" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Type &lsquo;DELETE&rsquo; to confirm
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              aria-invalid={deleteConfirmText !== '' && deleteConfirmText !== 'DELETE'}
              className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-mono"
            />
          </div>
          <DialogFooter>
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
              {isDeleting ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Trash2 size={16} aria-hidden />}
              Purge Data
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
