/**
 * ROI Summary — merchant app API client (Phase G).
 *
 * Wraps GET /api/merchant/roi-summary. Shape mirrors the backend
 * RoiReport DTO so the card can render without a transform pass.
 */

import { apiClient } from './client';

export interface RoiSpendBreakdown {
  subscriptionFees: number;
  coinRedemptionValue: number;
  broadcastCosts: number;
}

export interface RoiEarnedBreakdown {
  totalGMV: number;
  uniqueCustomers: number;
  newCustomerGMV: number;
  returningCustomerGMV: number;
}

export interface RoiSummary {
  window: { from: string; to: string };
  spent: { total: number; breakdown: RoiSpendBreakdown };
  earned: { total: number; breakdown: RoiEarnedBreakdown };
  netLift: number;
  roiMultiple: number;
  isEstimate: boolean;
  computedAt: string;
}

export interface RoiSummaryResponse {
  mode: 'off' | 'shadow' | 'primary';
  data: RoiSummary;
}

function extractResponseData<T>(response: { success?: boolean; data?: T; message?: string }): T {
  if (response.success && response.data !== undefined) return response.data;
  throw new Error(response.message || 'Request failed');
}

export async function fetchRoiSummary(windowDays = 30): Promise<RoiSummaryResponse> {
  const response = (await apiClient.get<RoiSummary>(
    `merchant/roi-summary?windowDays=${encodeURIComponent(String(windowDays))}`,
  )) as unknown as { success?: boolean; mode?: 'off' | 'shadow' | 'primary'; data?: RoiSummary; message?: string };
  const data = extractResponseData<RoiSummary>(response);
  return { mode: response.mode ?? 'primary', data };
}
