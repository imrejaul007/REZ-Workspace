import { apiClient } from './client';

export interface DealSnapshot {
  store?: string;
  storeId?: string;
  cashback?: string;
  discount?: string;
  coins?: string;
  bonus?: string;
  image?: string;
}

export interface CampaignSnapshot {
  title: string;
  badge?: string;
  subtitle?: string;
  type?: string;
  terms?: string[];
  minOrderValue?: number;
  maxBenefit?: number;
}

export interface DealRedemption {
  id: string;
  code: string;
  status: 'active' | 'used' | 'expired' | 'cancelled' | 'pending';
  redeemedAt?: string;
  createdAt?: string;
  usedAt?: string;
  expiresAt: string;
  dealSnapshot: DealSnapshot;
  campaignSnapshot: CampaignSnapshot;
  isPaid: boolean;
  benefitApplied?: number;
  orderAmount?: number;
  user: {
    name: string;
  };
}

export interface VerifyCodeResponse {
  valid: boolean;
  reason?: string;
  usedAt?: string;
  expiredAt?: string;
  redemption?: {
    id: string;
    code: string;
    status: string;
    expiresAt: string;
    dealSnapshot: DealSnapshot;
    campaignSnapshot: CampaignSnapshot;
    isPaid: boolean;
    user: { name: string };
  };
}

export interface UseCodeRequest {
  storeId: string;
  benefitApplied?: number;
  orderAmount?: number;
  notes?: string;
}

export interface UseCodeResponse {
  code: string;
  status: string;
  usedAt: string;
  benefitApplied?: number;
}

export interface RedemptionListResponse {
  redemptions: DealRedemption[];
  stats: {
    total: number;
    active: number;
    used: number;
    expired: number;
    pending?: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface RedemptionStats {
  today: { total: number; used: number; pending: number };
  thisWeek: { total: number; used: number; pending: number };
  thisMonth: { total: number; used: number; pending: number };
  totalRevenue: number;
  topDeals: Array<{ campaign: string; redemptions: number }>;
}

export interface RedemptionFilters {
  storeId?: string;
  status?: 'active' | 'used' | 'expired' | 'pending' | 'cancelled';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Pull the most useful human-readable error message from an axios/fetch
// failure. Backend validation errors come back as 4xx with a JSON body like
// `{ success: false, valid: false, reason: '...' }` or `{ message: '...' }`.
// Without this helper, the catch block falls through to a generic "Failed to
// verify code" string and the actual reason ("Invalid code format", "Already
// used", etc.) is lost.
function extractApiErrorMessage(error, fallback: string): string {
  const body = error?.response?.data;
  if (body) {
    if (typeof body.reason === 'string' && body.reason.trim()) return body.reason;
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
  }
  if (
    typeof error?.message === 'string' &&
    error.message.trim() &&
    error.message !== 'Network Error'
  ) {
    return error.message;
  }
  return fallback;
}

class DealRedemptionsService {
  async verifyCode(code: string): Promise<VerifyCodeResponse> {
    try {
      const data = await apiClient.get<VerifyCodeResponse>(
        `merchant/deal-redemptions/verify/${encodeURIComponent(code.trim().toUpperCase())}`
      );
      if (data.success) {
        // Extract response data — safely access nested properties
        const responseData = data.data as VerifyCodeResponse | undefined;
        return {
          valid: responseData?.valid ?? false,
          reason: responseData?.reason,
          usedAt: responseData?.usedAt,
          expiredAt: responseData?.expiredAt,
          redemption: responseData?.redemption,
        };
      }
      throw new Error(data.message || 'Failed to verify code');
    } catch (error) {
      if (__DEV__) console.error('Verify code error:', error);
      // If the backend returned a structured invalid-code response (4xx with
      // a `reason` field, e.g. format check failure), surface it as a normal
      // `valid: false` result so the modal shows the reason instead of an
      // alert with a generic error string.
      const body = error?.response?.data;
      if (body && (body.reason || body.valid === false)) {
        return {
          valid: false,
          reason: body.reason || body.message,
        };
      }
      throw new Error(extractApiErrorMessage(error, 'Failed to verify code'));
    }
  }

  async useCode(code: string, useData: UseCodeRequest): Promise<UseCodeResponse> {
    try {
      const data = await apiClient.post<UseCodeResponse>(
        `merchant/deal-redemptions/${encodeURIComponent(code.trim().toUpperCase())}/use`,
        useData
      );
      if (data.success && data.data) return data.data;
      throw new Error(data.message || 'Failed to use code');
    } catch (error) {
      if (__DEV__) console.error('Use code error:', error);
      throw new Error(extractApiErrorMessage(error, 'Failed to mark code as used'));
    }
  }

  async getRedemptions(filters?: RedemptionFilters): Promise<RedemptionListResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.storeId) params.append('storeId', filters.storeId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const data = await apiClient.get<RedemptionListResponse>(
        `merchant/deal-redemptions?${params.toString()}`
      );
      if (data.success && data.data) {
        const payload: unknown = data.data;
        return {
          redemptions: Array.isArray(payload.redemptions)
            ? payload.redemptions
            : Array.isArray(payload.items)
              ? payload.items
              : [],
          stats: payload.stats || { total: 0, active: 0, used: 0, expired: 0, pending: 0 },
          pagination: payload.pagination || {
            page: payload.page || 1,
            limit: filters?.limit || 20,
            total: payload.total || 0,
            totalPages: payload.totalPages || 0,
          },
        };
      }
      throw new Error(data.message || 'Failed to get redemptions');
    } catch (error) {
      if (__DEV__) console.error('Get redemptions error:', error);
      throw new Error(error.message || 'Failed to get redemptions');
    }
  }

  async getStats(storeId?: string): Promise<RedemptionStats> {
    try {
      const params = new URLSearchParams();
      if (storeId) params.append('storeId', storeId);

      const query = params.toString();
      const data = await apiClient.get<RedemptionStats>(
        `merchant/deal-redemptions/stats${query ? `?${query}` : ''}`
      );
      if (data.success && data.data) {
        return {
          today: {
            total: data.data.today?.total ?? 0,
            used: data.data.today?.used ?? 0,
            pending: data.data.today?.pending ?? 0,
          },
          thisWeek: {
            total: data.data.thisWeek?.total ?? 0,
            used: data.data.thisWeek?.used ?? 0,
            pending: data.data.thisWeek?.pending ?? 0,
          },
          thisMonth: {
            total: data.data.thisMonth?.total ?? 0,
            used: data.data.thisMonth?.used ?? 0,
            pending: data.data.thisMonth?.pending ?? 0,
          },
          totalRevenue: data.data.totalRevenue ?? 0,
          topDeals: Array.isArray(data.data.topDeals) ? data.data.topDeals : [],
        };
      }
      throw new Error(data.message || 'Failed to get stats');
    } catch (error) {
      if (__DEV__) console.error('Get stats error:', error);
      return {
        today: { total: 0, used: 0, pending: 0 },
        thisWeek: { total: 0, used: 0, pending: 0 },
        thisMonth: { total: 0, used: 0, pending: 0 },
        totalRevenue: 0,
        topDeals: [],
      };
    }
  }

  getStatusInfo(status: string): { label: string; color: string; bgColor: string } {
    switch (status) {
      case 'active':
        return { label: 'Active', color: '#0F9F6E', bgColor: '#DDF9EE' };
      case 'used':
        return { label: 'Used', color: '#5B34DA', bgColor: '#EEE7FF' };
      case 'expired':
        return { label: 'Expired', color: '#64748B', bgColor: '#EEF2F6' };
      case 'pending':
        return { label: 'Pending', color: '#D97706', bgColor: '#FEF3C7' };
      case 'cancelled':
        return { label: 'Cancelled', color: '#DC2626', bgColor: '#FEE2E2' };
      default:
        return { label: status, color: '#64748B', bgColor: '#EEF2F6' };
    }
  }
}

export const dealRedemptionsService = new DealRedemptionsService();
export default dealRedemptionsService;
