import { apiClient, ApiResponse } from './client';
import { getApiUrl } from '../../config/api';
import { logger } from '../../utils/logger';

// Types for Outlets
export interface OutletStore {
  _id: string;
  name: string;
  logo?: string;
}

export interface OutletLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface OutletOpeningHours {
  open: string; // "09:00"
  close: string; // "21:00"
}

export interface MerchantOutlet {
  _id: string;
  store: OutletStore;
  name: string;
  address: string;
  location: OutletLocation;
  phone: string;
  email?: string;
  openingHours: Array<{
    day: string;
    open: string;
    close: string;
    isClosed: boolean;
  }>;
  openingHoursSimple: OutletOpeningHours; // Simplified format returned by backend
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOutletRequest {
  storeId: string;
  name: string;
  address: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  phone: string;
  email?: string;
  openingHours: OutletOpeningHours;
  isActive?: boolean;
}

export interface UpdateOutletRequest extends Partial<CreateOutletRequest> {}

export interface OutletListResponse {
  outlets: MerchantOutlet[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface OutletListParams {
  storeId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

class OutletsService {
  private get baseUrl() {
    return getApiUrl('merchant/outlets');
  }

  /**
   * Get all outlets for merchant's stores
   */
  async getOutlets(params?: OutletListParams): Promise<ApiResponse<OutletListResponse>> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.storeId) queryParams.append('storeId', params.storeId);
      if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.limit) queryParams.append('limit', String(params.limit));

      const url = queryParams.toString()
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl;

      const response = await apiClient.get<OutletListResponse>(url);

      return {
        success: response.success,
        data: {
          outlets: response.data?.outlets || [],
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
      logger.error('[OUTLETS SERVICE] Error fetching outlets:', { error: error.message });
      return {
        success: false,
        message: error.message || 'Failed to fetch outlets',
        error: error.message,
      };
    }
  }

  /**
   * Get single outlet by ID
   */
  async getOutletById(id: string): Promise<ApiResponse<MerchantOutlet>> {
    try {
      const response = await apiClient.get<MerchantOutlet>(`${this.baseUrl}/${id}`);
      return response;
    } catch (error) {
      logger.error(`[OUTLETS SERVICE] Error fetching outlet ${id}:`, { error: error.message });
      return {
        success: false,
        message: error.message || 'Failed to fetch outlet',
        error: error.message,
      };
    }
  }

  /**
   * Create new outlet
   */
  async createOutlet(data: CreateOutletRequest): Promise<ApiResponse<MerchantOutlet>> {
    try {
      const response = await apiClient.post<MerchantOutlet>(this.baseUrl, data);
      return response;
    } catch (error) {
      logger.error('[OUTLETS SERVICE] Error creating outlet:', { error: error.message });
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create outlet',
        error: error.message,
      };
    }
  }

  /**
   * Update existing outlet
   */
  async updateOutlet(id: string, data: UpdateOutletRequest): Promise<ApiResponse<MerchantOutlet>> {
    try {
      const response = await apiClient.put<MerchantOutlet>(`${this.baseUrl}/${id}`, data);
      return response;
    } catch (error) {
      logger.error(`[OUTLETS SERVICE] Error updating outlet ${id}:`, { error: error.message });
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to update outlet',
        error: error.message,
      };
    }
  }

  /**
   * Delete outlet
   */
  async deleteOutlet(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<void>(`${this.baseUrl}/${id}`);
      return response;
    } catch (error) {
      logger.error(`[OUTLETS SERVICE] Error deleting outlet ${id}:`, { error: error.message });
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to delete outlet',
        error: error.message,
      };
    }
  }

  /**
   * Toggle outlet active status
   */
  async toggleOutletActive(id: string): Promise<ApiResponse<{ _id: string; isActive: boolean }>> {
    try {
      const response = await apiClient.patch<{ _id: string; isActive: boolean }>(
        `${this.baseUrl}/${id}/toggle-active`,
        {}
      );
      return response;
    } catch (error) {
      logger.error(`[OUTLETS SERVICE] Error toggling outlet ${id}:`, { error: error.message });
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to toggle outlet status',
        error: error.message,
      };
    }
  }
}

// Create and export singleton instance
export const outletsService = new OutletsService();
export default outletsService;
