/**
 * Nexus AI — Zustand store.
 * UI cache for data fetched from the backend. Auth is handled by Clerk.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AlertResponse,
  BatchInsights,
  DatasetListItem,
  RecordResponse,
  ReportListItem,
} from '@/lib/api';

// ── State Shape ────────────────────────────────────────────────────────────────

interface NexusState {
  // UI cache — hydrated from API on page load
  datasets: DatasetListItem[];
  currentDatasetId: string | null;
  batchInsights: BatchInsights | null;
  records: RecordResponse[];
  reports: ReportListItem[];
  alerts: AlertResponse[];

  // Transient UI state
  isBatchProcessing: boolean;
  batchProgress: number;
  batchStatus: string;
  processingDatasetId: string | null;

  // Actions
  setDatasets: (datasets: DatasetListItem[]) => void;
  setCurrentDatasetId: (id: string | null) => void;
  setBatchInsights: (insights: BatchInsights | null) => void;
  setRecords: (records: RecordResponse[]) => void;
  setReports: (reports: ReportListItem[]) => void;
  setAlerts: (alerts: AlertResponse[]) => void;
  addAlert: (alert: AlertResponse) => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
  clearAll: () => void;

  setBatchProcessing: (processing: boolean, progress?: number, status?: string, datasetId?: string | null) => void;
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useStore = create<NexusState>()(
  persist(
    (set) => ({
      datasets: [],
      currentDatasetId: null,
      batchInsights: null,
      records: [],
      reports: [],
      alerts: [],

      isBatchProcessing: false,
      batchProgress: 0,
      batchStatus: '',
      processingDatasetId: null,

      setDatasets: (datasets) => set({ datasets }),
      setCurrentDatasetId: (id) => set({ currentDatasetId: id }),
      setBatchInsights: (insights) => set({ batchInsights: insights }),
      setRecords: (records) => set({ records }),
      setReports: (reports) => set({ reports }),
      setAlerts: (alerts) => set({ alerts }),

      addAlert: (alert) =>
        set((state) => ({ alerts: [alert, ...state.alerts] })),
      removeAlert: (id) =>
        set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),
      clearAlerts: () => set({ alerts: [] }),

      clearAll: () =>
        set({
          datasets: [],
          currentDatasetId: null,
          batchInsights: null,
          records: [],
          reports: [],
          alerts: [],
          isBatchProcessing: false,
          batchProgress: 0,
          processingDatasetId: null,
        }),

      setBatchProcessing: (processing, progress = 0, status = '', datasetId = null) =>
        set((state) => ({
          isBatchProcessing: processing,
          batchProgress: progress,
          batchStatus: status,
          processingDatasetId: processing ? (datasetId || state.processingDatasetId) : null,
        })),
    }),
    {
      name: 'nexus-ai-store',
      partialize: (state) => ({ processingDatasetId: state.processingDatasetId }),
    },
  ),
);
