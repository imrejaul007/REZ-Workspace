import api from './client';

export interface MerchantCoinDrop {
  _id: string;
  storeId: string;
  storeName: string;
  storeLogo?: string;
  multiplier: number;
  normalCashback: number;
  boostedCashback: number;
  category: string;
  startTime: string;
  endTime: string;
  minOrderValue?: number;
  maxCashback?: number;
  isActive: boolean;
  priority: number;
  usageCount: number;
  status?: 'running' | 'upcoming' | 'expired' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CoinDropStats {
  usageCount: number;
  totalCashbackAwarded: number;
}

export interface CoinDropListResponse {
  coinDrops: MerchantCoinDrop[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class CoinDropService {
  async getStoreCoinDrops(storeId: string, page = 1, limit = 20) {
    const response = await api.get(
      `/merchant/stores/${storeId}/coin-drops?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  async getCoinDrop(storeId: string, coinDropId: string) {
    const response = await api.get(`/merchant/stores/${storeId}/coin-drops/${coinDropId}`);
    return response.data;
  }

  async createCoinDrop(storeId: string, data: Partial<MerchantCoinDrop>) {
    const response = await api.post(`/merchant/stores/${storeId}/coin-drops`, data);
    return response.data;
  }

  async updateCoinDrop(storeId: string, coinDropId: string, data: Partial<MerchantCoinDrop>) {
    const response = await api.put(`/merchant/stores/${storeId}/coin-drops/${coinDropId}`, data);
    return response.data;
  }

  async deleteCoinDrop(storeId: string, coinDropId: string) {
    const response = await api.delete(`/merchant/stores/${storeId}/coin-drops/${coinDropId}`);
    return response.data;
  }

  async getCoinDropStats(storeId: string, coinDropId: string) {
    const response = await api.get(`/merchant/stores/${storeId}/coin-drops/${coinDropId}/stats`);
    return response.data;
  }
}

export const coinDropService = new CoinDropService();
export default coinDropService;
