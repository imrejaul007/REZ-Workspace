import { apiClient } from './client';
import { getErrorMessage } from '../../utils/errors';

// ============================================
// TYPES
// ============================================

export interface AdCampaign {
  _id: string;
  title: string;
  headline: string;
  description: string;
  ctaText: string;
  ctaUrl?: string;
  imageUrl: string;
  placement: 'home_banner' | 'explore_feed' | 'store_listing' | 'search_result';
  targetSegment: 'all' | 'new' | 'loyal' | 'lapsed' | 'nearby';
  bidType: 'CPC' | 'CPM';
  bidAmount: number;
  dailyBudget: number;
  totalBudget: number;
  totalSpent: number;
  startDate: string;
  endDate?: string;
  status: 'draft' | 'pending_review' | 'active' | 'paused' | 'rejected' | 'completed';
  rejectionReason?: string;
  impressions: number;
  clicks: number;
  ctr: number;
  createdAt: string;
}

export interface AdAnalytics {
  totalImpressions: number;
  totalClicks: number;
  totalSpend: number;
  activeCount: number;
  pendingCount: number;
}

export type CreateAdPayload = Omit<
  AdCampaign,
  | '_id'
  | 'totalSpent'
  | 'impressions'
  | 'clicks'
  | 'ctr'
  | 'createdAt'
  | 'status'
  | 'rejectionReason'
>;
export type UpdateAdPayload = Partial<CreateAdPayload>;

// ============================================
// SERVICE
// ============================================

const BASE = 'merchant/ads';

export async function fetchAds(status?: AdCampaign['status']): Promise<AdCampaign[]> {
  try {
    const url = status ? `${BASE}?status=${status}` : BASE;
    const res = await apiClient.get<AdCampaign[]>(url);
    if (res.success && res.data) return Array.isArray(res.data) ? res.data : [];
    return [];
  } catch (err: unknown) {
    if (__DEV__) console.error('[AdCampaigns] fetchAds error:', getErrorMessage(err));
    throw err;
  }
}

export async function createAd(data: CreateAdPayload): Promise<AdCampaign | null> {
  try {
    const res = await apiClient.post<AdCampaign>(BASE, data);
    if (res.success && res.data) return res.data;
    throw new Error(res.message || 'Failed to create ad');
  } catch (err: unknown) {
    if (__DEV__) console.error('[AdCampaigns] createAd error:', getErrorMessage(err));
    throw err;
  }
}

export async function updateAd(id: string, data: UpdateAdPayload): Promise<AdCampaign | null> {
  try {
    const res = await apiClient.put<AdCampaign>(`${BASE}/${id}`, data);
    if (res.success && res.data) return res.data;
    throw new Error(res.message || 'Failed to update ad');
  } catch (err: unknown) {
    if (__DEV__) console.error('[AdCampaigns] updateAd error:', getErrorMessage(err));
    throw err;
  }
}

export async function submitAd(id: string): Promise<void> {
  try {
    const res = await apiClient.post(`${BASE}/${id}/submit`);
    if (!res.success) throw new Error(res.message || 'Failed to submit ad');
  } catch (err: unknown) {
    if (__DEV__) console.error('[AdCampaigns] submitAd error:', getErrorMessage(err));
    throw err;
  }
}

export async function pauseAd(id: string): Promise<void> {
  try {
    const res = await apiClient.post(`${BASE}/${id}/pause`);
    if (!res.success) throw new Error(res.message || 'Failed to pause ad');
  } catch (err: unknown) {
    if (__DEV__) console.error('[AdCampaigns] pauseAd error:', getErrorMessage(err));
    throw err;
  }
}

export async function activateAd(id: string): Promise<void> {
  try {
    const res = await apiClient.post(`${BASE}/${id}/activate`);
    if (!res.success) throw new Error(res.message || 'Failed to activate ad');
  } catch (err: unknown) {
    if (__DEV__) console.error('[AdCampaigns] activateAd error:', getErrorMessage(err));
    throw err;
  }
}

export async function deleteAd(id: string): Promise<void> {
  try {
    const res = await apiClient.delete(`${BASE}/${id}`);
    if (!res.success) throw new Error(res.message || 'Failed to delete ad');
  } catch (err: unknown) {
    if (__DEV__) console.error('[AdCampaigns] deleteAd error:', getErrorMessage(err));
    throw err;
  }
}

export async function fetchAdAnalytics(): Promise<AdAnalytics | null> {
  try {
    const res = await apiClient.get<AdAnalytics>(`${BASE}/analytics`);
    if (res.success && res.data) return res.data;
    return null;
  } catch (err: unknown) {
    if (__DEV__) console.error('[AdCampaigns] fetchAdAnalytics error:', getErrorMessage(err));
    throw err;
  }
}
