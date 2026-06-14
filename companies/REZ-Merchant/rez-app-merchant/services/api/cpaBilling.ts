/**
 * CPA Billing — merchant app API client (Phase J).
 */

import { apiClient } from './client';

export interface CpaRateCard {
  newCustomerConversion: number;
  lapsedReactivation: number;
  scanConversion: number;
}

export interface CpaBillingPlan {
  isActive: boolean;
  rates: CpaRateCard;
  monthlyCap: number;
  lastBilledAt: string | null;
}

export interface CpaBillingKindBucket {
  subtotal: number;
  count: number;
}

export interface CpaBillingSummary {
  plan: CpaBillingPlan;
  monthToDate: {
    total: number;
    count: number;
    byKind: Record<string, CpaBillingKindBucket>;
    monthStart: string;
  };
}

export interface CpaBillingResponse {
  mode: 'off' | 'shadow' | 'primary';
  data: CpaBillingSummary;
}

function extractResponseData<T>(response: { success?: boolean; data?: T; message?: string }): T {
  if (response.success && response.data !== undefined) return response.data;
  throw new Error(response.message || 'Request failed');
}

export async function fetchCpaBilling(): Promise<CpaBillingResponse> {
  const response = (await apiClient.get<CpaBillingSummary>('merchant/cpa-billing')) as unknown as {
    success?: boolean;
    mode?: 'off' | 'shadow' | 'primary';
    data?: CpaBillingSummary;
    message?: string;
  };
  const data = extractResponseData<CpaBillingSummary>(response);
  return { mode: response.mode ?? 'primary', data };
}
