import apiClient from './client';

export interface Broadcast {
  _id: string;
  title: string;
  message: string;
  type: string;
  channel?: string;
  storeId?: string;
  targetAudience?: string;
  scheduledAt?: string;
  status: string;
  template?: string;
  imageUrl?: string;
  actionUrl?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  merchantId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastsResponse {
  success: boolean;
  data: {
    items: Broadcast[];
    pagination: { total: number; totalPages: number; page: number; limit: number };
  };
}

export interface BroadcastResponse {
  success: boolean;
  data: Broadcast;
}

export interface AudienceEstimateResponse {
  count: number;
}

export interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  failed: number;
  openRate: number;
}

export const broadcastsApi = {
  getAll: (params?: { page?: number; limit?: number; storeId?: string; status?: string }) =>
    apiClient.get<BroadcastsResponse['data']>('merchant/broadcasts', { params }),

  getById: (id: string) => apiClient.get<Broadcast>(`merchant/broadcasts/${id}`),

  create: (data: Partial<Broadcast>) => apiClient.post<Broadcast>('merchant/broadcasts', data),

  update: (id: string, data: Partial<Broadcast>) =>
    apiClient.put<Broadcast>(`merchant/broadcasts/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`merchant/broadcasts/${id}`),

  estimateAudience: (data: { storeId: string; segment: string }) =>
    apiClient.post<AudienceEstimateResponse>('merchant/broadcasts/estimate-audience', data),

  send: (data: {
    storeId: string;
    title: string;
    message: string;
    segment: string;
    channels: string[];
  }) => apiClient.post<Broadcast>('merchant/broadcasts/send', data),

  getStats: (id: string) => apiClient.get<CampaignStats>(`merchant/broadcasts/${id}/stats`),
};

export default broadcastsApi;

// ─── Web Push Broadcast (REZ Now store subscribers) ──────────────────────────

export interface WebPushBroadcastInput {
  title: string;
  body: string;
  url?: string;
}

export interface WebPushBroadcastResult {
  success: boolean;
  recipientCount: number;
}

export interface BroadcastLogEntry {
  _id: string;
  storeSlug: string;
  title: string;
  body: string;
  url?: string;
  sentAt: string;
  recipientCount: number;
}

export interface BroadcastLogsResult {
  success: boolean;
  data: {
    logs: BroadcastLogEntry[];
    dailyUsed: number;
    dailyLimit: number;
  };
}

export const webPushBroadcastApi = {
  /**
   * Send a push notification to all web-push subscribers of the store.
   * Rate-limited to 3 per store per 24h on the backend.
   */
  send: (storeSlug: string, payload: WebPushBroadcastInput) =>
    apiClient.post<WebPushBroadcastResult>(`web-ordering/store/${storeSlug}/broadcast`, payload),

  /**
   * Fetch last 10 broadcast log entries and current daily usage for the store.
   */
  getLogs: (storeSlug: string) =>
    apiClient.get<BroadcastLogsResult['data']>(`web-ordering/store/${storeSlug}/broadcasts`),
};
