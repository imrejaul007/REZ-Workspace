import { buildApiUrl } from '../../config/api';
import { apiClient } from './client';

export interface SettlementRecord {
  _id: string;
  merchant: string;
  store: { _id: string; name?: string; logo?: string } | string;
  campaign: { _id: string; title?: string; slug?: string } | null;
  campaignType: string;
  cycleId: string;
  rewardIssued: number;
  rewardRedeemed: number;
  pendingAmount: number;
  settledAmount: number;
  issuanceCount: number;
  redemptionCount: number;
  status: 'active' | 'pending_settlement' | 'settled' | 'disputed' | 'void';
  settlementDate: string | null;
  settlementTransactionId: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface SettlementSummary {
  totalIssued: number;
  totalRedeemed: number;
  totalPending: number;
  totalSettled: number;
  activeCount: number;
  pendingCount: number;
  settledCount: number;
  disputedCount: number;
  // MERCH-017: Add tax deduction field (18% GST)
  totalTax: number;
  gst: {
    platformFee: number;
    cgst: number;
    sgst: number;
    totalGst: number;
  };
  recentCycles: Array<{
    _id: string;
    totalSettled: number;
    totalPending: number;
    status: string;
    lastSettlementDate: string | null;
  }>;
}

export interface SettlementListResponse {
  records: SettlementRecord[];
  totals: {
    totalIssued: number;
    totalRedeemed: number;
    totalPending: number;
    totalSettled: number;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

type RawSettlementListResponse =
  | SettlementListResponse
  | {
      items?: SettlementRecord[];
      total?: number;
      page?: number;
      totalPages?: number;
    };

class SettlementService {
  private normalizeSettlementListResponse(
    data: RawSettlementListResponse | null | undefined
  ): SettlementListResponse {
    const typedData = data ?? {};
    const records = Array.isArray((typedData as SettlementListResponse).records)
      ? (typedData as SettlementListResponse).records
      : Array.isArray((typedData as { items?: SettlementRecord[] }).items)
        ? (typedData as { items: SettlementRecord[] }).items
        : [];

    const totals = (typedData as SettlementListResponse).totals ?? {
      totalIssued: 0,
      totalRedeemed: 0,
      totalPending: 0,
      totalSettled: 0,
    };

    const rawPagination = (typedData as SettlementListResponse).pagination;
    const currentPage = rawPagination?.currentPage ?? (typedData as { page?: number }).page ?? 1;
    const totalPages =
      rawPagination?.totalPages ?? (typedData as { totalPages?: number }).totalPages ?? 0;
    const totalItems =
      rawPagination?.totalItems ?? (typedData as { total?: number }).total ?? records.length;

    return {
      records,
      totals,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        hasNextPage: rawPagination?.hasNextPage ?? currentPage < totalPages,
        hasPrevPage: rawPagination?.hasPrevPage ?? currentPage > 1,
      },
    };
  }

  /** GET /api/merchant/liability — paginated settlement records */
  // BUG-038: Migrated from raw fetch to apiClient for centralised auth + error handling.
  async getSettlements(params?: {
    page?: number;
    limit?: number;
    status?: string;
    cycleId?: string;
  }): Promise<SettlementListResponse> {
    try {
      const qs: string[] = [];
      if (params?.page) qs.push(`page=${params.page}`);
      if (params?.limit) qs.push(`limit=${params.limit}`);
      if (params?.status && params.status !== 'all')
        qs.push(`status=${encodeURIComponent(params.status)}`);
      if (params?.cycleId) qs.push(`cycleId=${encodeURIComponent(params.cycleId)}`);

      const url = qs.length ? `merchant/liability?${qs.join('&')}` : 'merchant/liability';
      const data = await apiClient.get(url);
      if (data.success)
        return this.normalizeSettlementListResponse(data.data as RawSettlementListResponse);
      return this.normalizeSettlementListResponse(null);
    } catch (error) {
      if (__DEV__) console.error('[Settlement] Error fetching settlements:', error);
      throw error;
    }
  }

  /** GET /api/merchant/liability/summary — aggregated stats */
  // BUG-038: Migrated from raw fetch to apiClient.
  async getSummary(): Promise<SettlementSummary | null> {
    try {
      const data = await apiClient.get('merchant/liability/summary');
      if (data.success && data.data) {
        const summary = data.data;
        // Use server-provided totalTax only — do not fabricate with a hardcoded GST rate.
        // GST rates vary by category (5% for F&B, 18% for services, etc.).
        // If the server does not return totalTax, leave it null/undefined.
        if (!summary.totalTax) {
          summary.totalTax = null;
        }
        return summary;
      }
      return null;
    } catch (error) {
      if (__DEV__) console.error('[Settlement] Error fetching summary:', error);
      return null;
    }
  }

  /** Returns the download URL for a payout statement PDF */
  getPayoutStatementUrl(cycleId: string): string {
    return buildApiUrl(`merchant/liability/payout-statement/${encodeURIComponent(cycleId)}`);
  }

  /** Returns the download URL for a liability statement PDF */
  getLiabilityStatementUrl(cycleId: string): string {
    return buildApiUrl(`merchant/liability/statement/${encodeURIComponent(cycleId)}`);
  }

  /** Download payout statement as blob (for native share/save) */
  // MA-GAP-160: Use apiClient.downloadBlob() — passes through the request interceptor
  // so token refresh, device fingerprint, CSRF, and path routing all work correctly.
  // The merchant/ prefix routes this to MERCHANT_SERVICE_BASE_URL via shouldRouteToMerchantService().
  async downloadPayoutStatement(cycleId: string): Promise<Blob> {
    try {
      const blob = await apiClient.downloadBlob(
        `merchant/liability/payout-statement/${encodeURIComponent(cycleId)}`,
        'blob'
      );
      return blob as Blob;
    } catch (error) {
      if (error?.response?.status === 401) {
        throw new Error('Unauthorized - please log in again');
      }
      throw new Error(error?.message || `Download failed`);
    }
  }
}

export const settlementService = new SettlementService();
export default settlementService;
