/**
 * Daily Actions — merchant app API client (Phase E).
 *
 * Thin wrapper around GET /api/merchant/daily-actions. The shape
 * mirrors the backend MerchantDailyAction document so the dashboard
 * card can render without a transform pass.
 */

import { apiClient } from './client';

export type DailyActionKind =
  | 'reengage-lapsed'
  | 'launch-weekend-rush'
  | 'launch-first-visit'
  | 'respond-reviews'
  | 'fill-empty-hour'
  | 'generic';

export type DailyActionCtaKind = 'launch-template' | 'deep-link' | 'external-url';

export interface DailyActionItem {
  actionId: string;
  kind: DailyActionKind;
  title: string;
  description: string;
  icon?: string;
  priority: number;
  cta: {
    kind: DailyActionCtaKind;
    target: string;
    params?: Record<string, unknown>;
  };
  data?: Record<string, unknown>;
  expiresAt?: string;
}

export interface DailyActionsResponse {
  mode: 'off' | 'shadow' | 'primary';
  /** YYYY-MM-DD of the row the server returned (today or yesterday). */
  day: string;
  generatedAt: string | null;
  /** true when the row's day < today → cron hasn't run yet for today. */
  stale: boolean;
  actions: DailyActionItem[];
  engineVersion: number | null;
}

function extractResponseData<T>(response: { success?: boolean; data?: T; message?: string }): T {
  if (response.success && response.data !== undefined) return response.data;
  throw new Error(response.message || 'Request failed');
}

export async function fetchDailyActions(): Promise<DailyActionsResponse> {
  const response = await apiClient.get<DailyActionsResponse>('merchant/daily-actions');
  return extractResponseData(response);
}

/**
 * On-demand regeneration — admin / debug surface. The happy path is
 * "cron ran at 6 AM", not this.
 */
export async function regenerateDailyActions(): Promise<{ count: number; mode: string }> {
  const response = (await apiClient.post<{ count: number; mode: string }>(
    'merchant/daily-actions/generate',
    {},
  )) as unknown as { success?: boolean; data?: { count: number; mode: string }; throttled?: boolean; message?: string };
  if (response.throttled) {
    return { count: 0, mode: 'throttled' };
  }
  return extractResponseData<{ count: number; mode: string }>(response);
}
