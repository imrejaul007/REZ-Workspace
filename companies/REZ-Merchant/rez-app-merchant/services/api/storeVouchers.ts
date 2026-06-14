import { apiClient, ApiResponse } from './client';
import { getApiUrl } from '../../config/api';
import { logger } from '../../utils/logger';

// Types for Store Vouchers
export interface StoreVoucherStore {
  _id: string;
  name: string;
  logo?: string;
}

export interface StoreVoucherRestrictions {
  isOfflineOnly: boolean;
  notValidAboveStoreDiscount: boolean;
  singleVoucherPerBill: boolean;
}

export interface StoreVoucherMetadata {
  displayText?: string;
  badgeText?: string;
  backgroundColor?: string;
}

export interface MerchantStoreVoucher {
  _id: string;
  code: string;
  name: string;
  description?: string;
  store: StoreVoucherStore;
  type: 'store_visit' | 'promotional';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minBillAmount: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usedCount: number;
  claimedCount: number;
  usageLimitPerUser?: number;
  restrictions: StoreVoucherRestrictions;
  metadata: StoreVoucherMetadata;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoreVoucherRequest {
  storeId: string;
  code?: string;
  name: string;
  description?: string;
  type: 'store_visit' | 'promotional';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minBillAmount: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usageLimitPerUser?: number;
  restrictions?: Partial<StoreVoucherRestrictions>;
  metadata?: Partial<StoreVoucherMetadata>;
  isActive?: boolean;
}

export interface UpdateStoreVoucherRequest extends Partial<
  Omit<CreateStoreVoucherRequest, 'code'>
> {}

export interface StoreVoucherStats {
  totalVouchers: number;
  activeVouchers: number;
  totalClaimed: number;
  totalRedeemed: number;
  redemptionRate: number;
}

export interface StoreVoucherListResponse {
  vouchers: MerchantStoreVoucher[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface StoreVoucherListParams {
  storeId?: string;
  isActive?: boolean;
  type?: 'store_visit' | 'promotional';
  page?: number;
  limit?: number;
}

class StoreVouchersService {
  private get baseUrl() {
    return getApiUrl('merchant/store-vouchers');
  }

  /**
   * Get all vouchers for merchant's stores
   */
  async getVouchers(
    params?: StoreVoucherListParams
  ): Promise<ApiResponse<StoreVoucherListResponse>> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.storeId) queryParams.append('storeId', params.storeId);
      if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
      if (params?.type) queryParams.append('type', params.type);
      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.limit) queryParams.append('limit', String(params.limit));

      const url = queryParams.toString()
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl;

      const response = await apiClient.get<StoreVoucherListResponse>(url);

      return {
        success: response.success,
        data: {
          vouchers: response.data?.vouchers || [],
          pagination: response.data?.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
          },
        },
        message: response.message,
      };
    } catch (error) {
      logger.error('[STORE VOUCHERS SERVICE] Error fetching vouchers:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch vouchers',
        error: error.message,
      };
    }
  }

  /**
   * Get voucher statistics for a store
   */
  async getVoucherStats(storeId: string): Promise<ApiResponse<StoreVoucherStats>> {
    try {
      const response = await apiClient.get<StoreVoucherStats>(`${this.baseUrl}/stats/${storeId}`);
      return response;
    } catch (error) {
      logger.error('[STORE VOUCHERS SERVICE] Error fetching stats:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch voucher statistics',
        error: error.message,
      };
    }
  }

  /**
   * Get single voucher by ID
   */
  async getVoucherById(id: string): Promise<ApiResponse<MerchantStoreVoucher>> {
    try {
      const response = await apiClient.get<MerchantStoreVoucher>(`${this.baseUrl}/${id}`);
      return response;
    } catch (error) {
      if (__DEV__) console.error(`[STORE VOUCHERS SERVICE] Error fetching voucher ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Failed to fetch voucher',
        error: error.message,
      };
    }
  }

  /**
   * Create new voucher
   */
  async createVoucher(data: CreateStoreVoucherRequest): Promise<ApiResponse<MerchantStoreVoucher>> {
    try {
      const response = await apiClient.post<MerchantStoreVoucher>(this.baseUrl, data);
      return response;
    } catch (error) {
      if (__DEV__) console.error('[STORE VOUCHERS SERVICE] Error creating voucher:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create voucher',
        error: error.message,
      };
    }
  }

  /**
   * Update existing voucher
   */
  async updateVoucher(
    id: string,
    data: UpdateStoreVoucherRequest
  ): Promise<ApiResponse<MerchantStoreVoucher>> {
    try {
      const response = await apiClient.put<MerchantStoreVoucher>(`${this.baseUrl}/${id}`, data);
      return response;
    } catch (error) {
      if (__DEV__) console.error(`[STORE VOUCHERS SERVICE] Error updating voucher ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to update voucher',
        error: error.message,
      };
    }
  }

  /**
   * Delete voucher
   */
  async deleteVoucher(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<void>(`${this.baseUrl}/${id}`);
      return response;
    } catch (error) {
      if (__DEV__) console.error(`[STORE VOUCHERS SERVICE] Error deleting voucher ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to delete voucher',
        error: error.message,
      };
    }
  }

  /**
   * Toggle voucher active status
   */
  async toggleVoucherActive(id: string): Promise<ApiResponse<{ _id: string; isActive: boolean }>> {
    try {
      const response = await apiClient.post<{ _id: string; isActive: boolean }>(
        `${this.baseUrl}/${id}/toggle-active`,
        {}
      );
      return response;
    } catch (error) {
      if (__DEV__) console.error(`[STORE VOUCHERS SERVICE] Error toggling voucher ${id}:`, error);
      return {
        success: false,
        message:
          error.response?.data?.message || error.message || 'Failed to toggle voucher status',
        error: error.message,
      };
    }
  }
}

// Create and export singleton instance
export const storeVouchersService = new StoreVouchersService();
export default storeVouchersService;
