/**
 * Nexus AI — Zustand store.
 * Acts as a fast UI cache for data fetched from the backend.
 * Only auth tokens and user profile persist to localStorage.
 * All heavy data (records, insights, alerts) lives in SQLite via the API.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AlertResponse,
  BatchInsights,
  DatasetListItem,
  RecordResponse,
  ReportListItem,
  UserResponse,
} from '@/lib/api';
import { tokenStorage } from '@/lib/api';

// ── State Shape ────────────────────────────────────────────────────────────────

interface NexusState {
  // Auth
  user: UserResponse | null;
  isAuthenticated: boolean;

  // UI cache — hydrated from API on page load
  datasets: DatasetListItem[];
  currentDatasetId: string | null;
  batchInsights: BatchInsights | null;
  records: RecordResponse[];
  reports: ReportListItem[];
  alerts: AlertResponse[];

  // Transient UI state
  isBatchProcessing: boolean;
  batchProgress: number; // 0-100
  batchStatus: string;
  processingDatasetId: string | null;

  // Actions
  setUser: (user: UserResponse | null) => void;
  login: (user: UserResponse, accessToken: string, refreshToken: string) => void;
  logout: () => void;

  setDatasets: (datasets: DatasetListItem[]) => void;
  setCurrentDatasetId: (id: string | null) => void;
  setBatchInsights: (insights: BatchInsights | null) => void;
  setRecords: (records: RecordResponse[]) => void;
  setReports: (reports: ReportListItem[]) => void;
  setAlerts: (alerts: AlertResponse[]) => void;
  addAlert: (alert: AlertResponse) => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;

  setBatchProcessing: (processing: boolean, progress?: number, status?: string, datasetId?: string | null) => void;
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useStore = create<NexusState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      isAuthenticated: false,

      // Data cache
      datasets: [],
      currentDatasetId: null,
      batchInsights: null,
      records: [],
      reports: [],
      alerts: [],

      // Processing state
      isBatchProcessing: false,
      batchProgress: 0,
      batchStatus: '',
      processingDatasetId: null,

      // ── Auth Actions ─────────────────────────────────────────────────────────
      setUser: (user) => set({ user }),

      login: (user, accessToken, refreshToken) => {
        tokenStorage.setTokens(accessToken, refreshToken);
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        tokenStorage.clearTokens();
        set({
          user: null,
          isAuthenticated: false,
          datasets: [],
          currentDatasetId: null,
          batchInsights: null,
          records: [],
          reports: [],
          alerts: [],
          isBatchProcessing: false,
          batchProgress: 0,
          processingDatasetId: null,
        });
      },

      // ── Data Actions ─────────────────────────────────────────────────────────
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

      setBatchProcessing: (processing, progress = 0, status = '', datasetId = null) =>
        set((state) => ({ 
          isBatchProcessing: processing, 
          batchProgress: progress, 
          batchStatus: status,
          processingDatasetId: processing ? (datasetId || state.processingDatasetId) : null 
        })),
    }),
    {
      name: 'nexus-ai-store',
      // Only persist auth state and active processing ID
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        processingDatasetId: state.processingDatasetId,
      }),
    },
  ),
);
