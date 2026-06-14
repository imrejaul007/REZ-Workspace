import api from './client';

export interface EarningAnalytics {
  coinsAwarded: {
    total: number;
    thisMonth: number;
    thisWeek: number;
  };
  coinDrops: {
    active: number;
    total: number;
    totalUsage: number;
  };
  brandedCoins: {
    inCirculation: number;
    totalAwarded: number;
    totalRedeemed: number;
  };
  customers: {
    totalWithCoins: number;
    repeatRate: number;
    topEarners: { userId: string; totalCoins: number; orderCount: number }[];
  };
}

class EarningAnalyticsService {
  async getStoreAnalytics(storeId: string): Promise<EarningAnalytics> {
    const response = await api.get(`/merchant/stores/${storeId}/earning-analytics`);
    return response.data;
  }
}

export const earningAnalyticsService = new EarningAnalyticsService();
export default earningAnalyticsService;
