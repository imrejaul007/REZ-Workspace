import { apiClient } from './client';

export interface CustomerSearchResult {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  avatar?: string;
}

export interface RecentCustomer extends CustomerSearchResult {
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
}

export interface CoinAwardRequest {
  userId: string;
  storeId: string;
  amount: number;
  reason?: string;
}

export interface CoinAwardResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    amount: number;
    storeName: string;
    reason: string;
    newBrandedBalance: number;
    merchantWalletBalance?: {
      total: number;
      available: number;
    };
  };
}

export interface WalletBalanceResponse {
  available: number;
  total: number;
}

export interface CoinAwardHistoryItem {
  id: string;
  user: {
    _id: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
    phoneNumber: string;
  };
  amount: number;
  reason: string;
  storeName: string;
  storeId: string;
  createdAt: string;
}

export interface CoinAwardHistoryResponse {
  transactions: CoinAwardHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CoinStats {
  overall: {
    totalCoinsAwarded: number;
    totalAwards: number;
    uniqueCustomers: number;
    avgCoinsPerAward: number;
  };
  today: {
    coinsAwarded: number;
    awardCount: number;
  };
  monthlyBreakdown: Array<{
    year: number;
    month: number;
    coinsAwarded: number;
    awardCount: number;
  }>;
  limits: {
    maxCoinsPerAward: number;
  };
}

class CoinsService {
  // Search for customers by name, phone, or email
  async searchCustomer(query: string): Promise<CustomerSearchResult[]> {
    try {
      const response = await apiClient.get<CustomerSearchResult[]>(
        `merchant/coins/search-customer?q=${encodeURIComponent(query)}`
      );
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to search customers');
    } catch (error) {
      if (__DEV__) console.error('Search customer error:', error);
      throw new Error(error.message || 'Failed to search customers');
    }
  }

  // Get recent customers who purchased from this store
  async getRecentCustomers(storeId?: string): Promise<RecentCustomer[]> {
    try {
      let url = 'merchant/coins/recent-customers';
      if (storeId) url += `?storeId=${storeId}`;

      const response = await apiClient.get<RecentCustomer[]>(url);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to get recent customers');
    } catch (error) {
      if (__DEV__) console.error('Get recent customers error:', error);
      throw new Error(error.message || 'Failed to get recent customers');
    }
  }

  // Award coins to customer
  async awardCoins(request: CoinAwardRequest): Promise<CoinAwardResponse> {
    try {
      const response = await apiClient.post<CoinAwardResponse['data']>(
        'merchant/coins/award',
        request
      );
      return {
        success: response.success,
        message: response.message || 'Coins awarded successfully',
        data: response.data,
      };
    } catch (error) {
      if (__DEV__) console.error('Award coins error:', error);
      throw new Error(error.message || 'Failed to award coins');
    }
  }

  // Get award history
  async getAwardHistory(
    page: number = 1,
    limit: number = 20,
    storeId?: string
  ): Promise<CoinAwardHistoryResponse> {
    try {
      let url = `merchant/coins/history?page=${page}&limit=${limit}`;
      if (storeId) url += `&storeId=${storeId}`;

      const response = await apiClient.get<CoinAwardHistoryResponse>(url);
      if (response.success && response.data) {
        return response.data;
      }
      return {
        transactions: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    } catch (error) {
      if (__DEV__) console.error('Get award history error:', error);
      throw new Error(error.message || 'Failed to get award history');
    }
  }

  // Get coin statistics
  async getStats(storeId?: string): Promise<CoinStats> {
    try {
      let url = 'merchant/coins/stats';
      if (storeId) url += `?storeId=${storeId}`;

      const response = await apiClient.get<CoinStats>(url);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to get coin stats');
    } catch (error) {
      if (__DEV__) console.error('Get coin stats error:', error);
      throw new Error(error.message || 'Failed to get coin stats');
    }
  }

  // Get merchant wallet balance
  async getWalletBalance(): Promise<WalletBalanceResponse> {
    try {
      const response = await apiClient.get<WalletBalanceResponse>('merchant/coins/wallet-balance');
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to get wallet balance');
    } catch (error) {
      if (__DEV__) console.error('Get wallet balance error:', error);
      throw new Error(error.message || 'Failed to get wallet balance');
    }
  }
}

// Create and export singleton instance
export const coinsService = new CoinsService();
export default coinsService;
