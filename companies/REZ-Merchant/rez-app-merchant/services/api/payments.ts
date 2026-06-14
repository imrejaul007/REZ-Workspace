import { apiClient } from './client';

export interface StorePaymentRecord {
  id?: string;
  paymentId: string;
  storeId: string;
  storeName: string;
  storeLogo?: string;
  amount: number;
  coinsUsed: number;
  paymentMethod: string;
  status: string;
  rewards?: {
    cashbackEarned: number;
    coinsEarned: number;
    bonusCoins: number;
    firstVisitBonus?: number;
  };
  createdAt: string;
  completedAt?: string;
}

export interface PaymentsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaymentsResponse {
  success: boolean;
  data: {
    transactions: StorePaymentRecord[];
    pagination: PaymentsPagination;
  };
}

export interface PaymentStatsResponse {
  success: boolean;
  data: {
    today: {
      paymentCount: number;
      revenue: number;
    };
    thisMonth: {
      paymentCount: number;
      revenue: number;
      averageTransactionValue: number;
    };
    paymentMethods: Array<{
      method: string;
      count: number;
      total: number;
    }>;
  };
}

export interface PaymentSearchParams {
  page?: number;
  limit?: number;
  status?: string;
  dateStart?: string;
  dateEnd?: string;
}

class PaymentsService {
  async getPayments(storeId: string, params: PaymentSearchParams = {}): Promise<PaymentsResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('storeId', storeId);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.dateStart) queryParams.append('dateStart', params.dateStart);
      if (params.dateEnd) queryParams.append('dateEnd', params.dateEnd);

      const response = await apiClient.get<unknown>(`merchant/payments?${queryParams.toString()}`);
      const transactions: StorePaymentRecord[] = response.data?.payments || [];

      return {
        success: true,
        data: {
          transactions,
          pagination: response.data?.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to get payments');
    }
  }

  async getPaymentStats(storeId: string): Promise<PaymentStatsResponse> {
    try {
      const response = await apiClient.get<unknown>('merchant/payments/stats', {
        params: { storeId },
      });
      return {
        success: true,
        data: response.data ?? {
          today: { paymentCount: 0, revenue: 0 },
          thisMonth: { paymentCount: 0, revenue: 0, averageTransactionValue: 0 },
          paymentMethods: [],
        },
      };
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to get payment stats'
      );
    }
  }

  async getRecentPayments(_storeId: string, limit: number = 5): Promise<PaymentsResponse> {
    return this.getPayments(_storeId, { page: 1, limit });
  }
}

export const paymentsService = new PaymentsService();
export default paymentsService;
