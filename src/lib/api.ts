/**
 * Typed API client for Nexus AI.
 * All requests are automatically authenticated via JWT Bearer tokens.
 * On 401, automatically attempts token refresh before retrying.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface DatasetUploadResponse {
  id: string;
  filename: string;
  original_filename: string;
  columns: string[];
  row_count: number;
  status: string;
  created_at: string;
}

export interface DatasetDetailResponse {
  id: string;
  original_filename: string;
  row_count: number;
  text_column: string | null;
  columns: string[];
  sample_rows: Record<string, string>[];
  status: string;
  processed_count: number;
  insights: BatchInsights | null;
  created_at: string;
}

export interface DatasetStatusResponse {
  id: string;
  status: string;
  processed_count: number;
  row_count: number;
  percent: number;
  error_message?: string;
}

export interface DatasetListItem {
  id: string;
  original_filename: string;
  row_count: number;
  status: string;
  text_column: string | null;
  created_at: string;
}

export interface AnalysisResult {
  summary: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  emotion: string;
  key_issues: string[];
  risk_level: 'Low' | 'Medium' | 'High';
  recommendations: string[];
  confidence_score: number;
}

export interface RecordResponse extends AnalysisResult {
  id: string;
  text: string;
  created_at: string;
}

export interface MultiAnalyzeResponse {
  results: AnalysisResult[];
  aggregate: {
    total: number;
    sentiment_distribution: Record<string, number>;
    avg_confidence: number;
    dominant_risk: string;
  } | null;
}

export interface EmotionPoint {
  emotion: string;
  percentage: number;
}

export interface BatchInsights {
  trends: string[];
  dominant_emotions: EmotionPoint[];
  recurring_issues: string[];
  overall_sentiment: { positive: number; neutral: number; negative: number };
  executive_summary: string;
  anomaly_signals: string[];
  risk_level: 'Low' | 'Medium' | 'High';
  top_keywords: string[];
}

export interface ReportMetric {
  label: string;
  value: string;
}

export interface ReportResponse {
  id: string;
  title: string;
  overview: string | null;
  trend_analysis: string | null;
  risk_assessment: string | null;
  key_findings: string[];
  recommendations: string[];
  metrics: ReportMetric[];
  created_at: string;
}

export interface ReportListItem {
  id: string;
  title: string;
  overview: string | null;
  created_at: string;
}

export interface AlertResponse {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  is_read: boolean;
  created_at: string;
}

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentLog {
  type: string;
  content: string;
}

export interface AgentChatResponse {
  message: string;
  thought_process: AgentLog[];
}

// ── Token Management ───────────────────────────────────────────────────────────

const TOKEN_KEY = 'nexus_access_token';
const REFRESH_KEY = 'nexus_refresh_token';

export const tokenStorage = {
  setTokens(access: string, refresh: string) {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  clearTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ── Fetch Wrapper ──────────────────────────────────────────────────────────────

const BASE_URL = '/api/v1';
let isRefreshing = false;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      tokenStorage.clearTokens();
      return null;
    }
    const data: TokenResponse = await res.json();
    tokenStorage.setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    tokenStorage.clearTokens();
    return null;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const token = tokenStorage.getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    cache: 'no-store',
    ...options,
    headers,
  });

  // Handle token refresh on 401
  if (response.status === 401 && !isRetry && !isRefreshing) {
    isRefreshing = true;
    const newToken = await refreshAccessToken();
    isRefreshing = false;

    if (newToken) {
      // Retry the original request with the new token
      return request<T>(endpoint, options, true);
    } else {
      // Refresh failed — redirect to auth
      window.location.href = '/auth';
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status}`;
    try {
      const error = await response.json();
      if (Array.isArray(error.detail)) {
        errorMessage = error.detail
          .map((e: any) => `${e.loc?.join('.')} ${e.msg}`)
          .join(', ');
      } else if (error.detail) {
        errorMessage = error.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
    } catch { /* ignore */ }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) return undefined as T;

  return response.json();
}

// ── API Namespaces ─────────────────────────────────────────────────────────────

export const authApi = {
  register: (full_name: string, email: string, password: string) =>
    request<TokenResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request<UserResponse>('/auth/me'),

  updateProfile: (data: { full_name?: string; email?: string }) =>
    request<UserResponse>('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
};

export const datasetsApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<DatasetUploadResponse>('/datasets/upload', {
      method: 'POST',
      body: formData,
    });
  },

  list: () => request<DatasetListItem[]>('/datasets/'),

  getById: (id: string) => request<DatasetDetailResponse>(`/datasets/${id}`),

  process: (id: string, text_column: string) =>
    request<{ message: string }>(`/datasets/${id}/process`, {
      method: 'POST',
      body: JSON.stringify({ text_column }),
    }),

  getStatus: (id: string) => request<DatasetStatusResponse>(`/datasets/${id}/status`),

  getInsights: (id: string) => request<BatchInsights>(`/datasets/${id}/insights`),

  delete: (id: string) => request<void>(`/datasets/${id}`, { method: 'DELETE' }),
};

export const analyzeApi = {
  single: (text: string, save_to_history = true) =>
    request<RecordResponse>('/analyze/single', {
      method: 'POST',
      body: JSON.stringify({ text, save_to_history }),
    }),

  multi: (texts: string[]) =>
    request<MultiAnalyzeResponse>('/analyze/multi', {
      method: 'POST',
      body: JSON.stringify({ texts }),
    }),

  getHistory: (limit = 50, sentiment?: string, search?: string) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (sentiment) params.set('sentiment', sentiment);
    if (search) params.set('search', search);
    return request<RecordResponse[]>(`/analyze/history?${params}`);
  },

  delete: (id: string) => request<void>(`/analyze/history/${id}`, { method: 'DELETE' }),

  bulkDelete: (recordIds: string[]) => request<void>('/analyze/history/bulk', {
    method: 'DELETE',
    body: JSON.stringify({ record_ids: recordIds }),
  }),

  getStats: () => request<Record<string, unknown>>('/analyze/stats'),
};

export const reportsApi = {
  list: () => request<ReportListItem[]>('/reports/'),
  generate: (title: string) =>
    request<ReportResponse>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
  getById: (id: string) => request<ReportResponse>(`/reports/${id}`),
  delete: (id: string) => request<void>(`/reports/${id}`, { method: 'DELETE' }),
};

export const alertsApi = {
  list: (severity?: string, unread_only?: boolean) => {
    const params = new URLSearchParams();
    if (severity) params.set('severity', severity);
    if (unread_only) params.set('unread_only', 'true');
    return request<AlertResponse[]>(`/alerts/?${params}`);
  },
  scan: () => request<AlertResponse[]>('/alerts/scan', { method: 'POST' }),
  markRead: (id: string) => request<AlertResponse>(`/alerts/${id}/read`, { method: 'PATCH' }),
  dismiss: (id: string) => request<void>(`/alerts/${id}`, { method: 'DELETE' }),
  clearAll: () => request<void>('/alerts/', { method: 'DELETE' }),
};

export const agentApi = {
  chat: (messages: AgentMessage[]) =>
    request<AgentChatResponse>('/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    }),
};

export const edaApi = {
  getEDAMetrics: (datasetId: string) => request<any>(`/eda/${datasetId}`),
};
