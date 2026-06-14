/**
 * Growth Score — merchant app API client (Phase H).
 */

import { apiClient } from './client';

export interface GrowthScoreBreakdown {
  gmvGrowth: number;
  newCustomerPct: number;
  retention: number;
  campaignCadence: number;
}

export interface GrowthScoreResponse {
  mode: 'off' | 'shadow' | 'primary';
  day: string;
  stale: boolean;
  total: number | null;
  breakdown: GrowthScoreBreakdown | null;
  computedAt: string | null;
  engineVersion: number | null;
}

function extractResponseData<T>(response: { success?: boolean; data?: T; message?: string }): T {
  if (response.success && response.data !== undefined) return response.data;
  throw new Error(response.message || 'Request failed');
}

export async function fetchGrowthScore(): Promise<GrowthScoreResponse> {
  const response = await apiClient.get<GrowthScoreResponse>('merchant/growth-score');
  return extractResponseData(response);
}
