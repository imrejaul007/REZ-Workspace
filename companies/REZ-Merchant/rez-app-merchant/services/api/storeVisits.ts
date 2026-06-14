import { apiClient } from './client';

export interface StoreVisitSearchParams {
  storeId: string;
  date?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface StoreVisit {
  _id: string;
  id?: string;
  storeId: string;
  userId?: {
    _id: string;
    name?: string;
    phoneNumber?: string;
    email?: string;
  };
  visitType: 'scheduled' | 'queue';
  status: 'pending' | 'checked_in' | 'completed' | 'cancelled';
  visitDate: string;
  visitTime?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  queueNumber?: number;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreVisitStats {
  totalToday: number;
  upcoming: number;
  checkedIn: number;
  completed: number;
  cancelled: number;
}

export interface StoreVisitListResponse {
  visits: StoreVisit[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UpdateVisitStatusRequest {
  status: string;
  notes?: string;
}

class StoreVisitsService {
  // Get visits with filtering and pagination
  async getVisits(params: StoreVisitSearchParams): Promise<StoreVisitListResponse> {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });

      const response = await apiClient.get<StoreVisitListResponse>(
        `merchant/store-visits?${searchParams.toString()}`
      );
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to get visits');
    } catch (error) {
      if (__DEV__) console.error('[VISITS] Get visits error:', error);
      throw new Error(error.message || 'Failed to get visits');
    }
  }

  // Get visit statistics for a store
  async getVisitStats(storeId: string): Promise<StoreVisitStats> {
    try {
      const response = await apiClient.get<StoreVisitStats>(
        `merchant/store-visits/stats?storeId=${storeId}`
      );
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to get visit stats');
    } catch (error) {
      if (__DEV__) console.error('[VISITS] Get visit stats error:', error);
      throw new Error(error.message || 'Failed to get visit stats');
    }
  }

  // Update visit status
  async updateVisitStatus(visitId: string, status: string, notes?: string): Promise<StoreVisit> {
    try {
      const body: UpdateVisitStatusRequest = { status };
      if (notes) body.notes = notes;

      const response = await apiClient.put<StoreVisit>(
        `merchant/store-visits/${visitId}/status`,
        body
      );
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to update visit status');
    } catch (error) {
      if (__DEV__) console.error('[VISITS] Update visit status error:', error);
      throw new Error(error.message || 'Failed to update visit status');
    }
  }
}

export const storeVisitsService = new StoreVisitsService();
export default storeVisitsService;
