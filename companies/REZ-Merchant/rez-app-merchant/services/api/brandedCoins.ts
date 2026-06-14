import api from './client';

export interface BrandedCoinAnalytics {
  totalInCirculation: number;
  totalAwarded: number;
  totalRedeemed: number;
  uniqueCustomers: number;
}

export interface BrandedCoinCustomer {
  userId: string;
  userName?: string;
  phoneNumber?: string;
  amount: number;
  earnedDate?: string;
  lastUsed?: string;
}

export interface BrandedCoinCustomerListResponse {
  customers: BrandedCoinCustomer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class BrandedCoinService {
  async getAnalytics(storeId: string) {
    try {
      const response = await api.get(`merchant/stores/${storeId}/branded-campaigns`);
      return response.data;
    } catch (error) {
      throw new Error(error?.message || 'Failed to fetch branded coin analytics');
    }
  }

  async getCustomers(storeId: string, page = 1, limit = 20) {
    try {
      const response = await api.get(
        `merchant/stores/${storeId}/branded-campaigns/customers?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw new Error(error?.message || 'Failed to fetch branded coin customers');
    }
  }

  async awardCoins(storeId: string, userId: string, amount: number, reason?: string) {
    try {
      const response = await api.post(`merchant/stores/${storeId}/branded-campaigns/award`, {
        userId,
        amount,
        reason,
      });
      return response.data;
    } catch (error) {
      throw new Error(error?.message || 'Failed to award branded coins');
    }
  }
}

export const brandedCoinService = new BrandedCoinService();
export default brandedCoinService;
