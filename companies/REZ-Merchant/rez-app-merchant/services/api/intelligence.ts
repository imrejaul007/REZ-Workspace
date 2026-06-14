import { apiClient } from './client';

export interface DeadHoursData {
  hours: Array<{ hour: number; revenue: number; count: number }>;
  deadHours: Array<{ hour: number; revenue: number; count: number }>;
  peakHour: { hour: number; revenue: number; count: number };
}

export interface ROIHeroData {
  totalRevenue: number;
  totalCoinsIssued: number;
  totalCoinsCost: number;
  totalCashbackPaid: number;
  netRevenue: number;
  roi: number;
  uniqueCustomers: number;
  repeatCustomers: number;
  avgOrderValue: number;
  topPerformingOffer?: {
    title: string;
    redemptions: number;
    revenue: number;
  };
}

export interface ActionCenterItem {
  id: string;
  type: 'opportunity' | 'alert' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
  actionRoute?: string;
  metric?: string;
  metricValue?: number;
}

export interface ActionCenterData {
  actions: ActionCenterItem[];
  lastUpdated: string;
}

export interface NetworkStatsData {
  totalCustomers: number;
  newCustomersThisMonth: number;
  repeatRate: number;
  avgVisitsPerCustomer: number;
  topSourceChannels: Array<{ channel: string; customers: number }>;
}

export interface AttributionSummary {
  period: string;
  revenue: number;
  customers: number;
  coinsIssued: number;
}

class IntelligenceService {
  async getDeadHours(storeId: string): Promise<DeadHoursData> {
    try {
      const response = await apiClient.get<DeadHoursData>(
        `merchant/intelligence/dead-hours?storeId=${storeId}`
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to fetch dead hours');
    } catch (error) {
      if (__DEV__) console.error('Dead hours error:', error);
      throw new Error(error.message || 'Failed to fetch dead hours');
    }
  }

  async getROIHero(storeId: string): Promise<ROIHeroData> {
    try {
      const response = await apiClient.get<ROIHeroData>(
        `merchant/intelligence/roi-hero?storeId=${storeId}`
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to fetch ROI data');
    } catch (error) {
      if (__DEV__) console.error('ROI hero error:', error);
      throw new Error(error.message || 'Failed to fetch ROI data');
    }
  }

  async getActionCenter(storeId: string): Promise<ActionCenterData> {
    try {
      const response = await apiClient.get<ActionCenterData>(
        `merchant/intelligence/action-center?storeId=${storeId}`
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to fetch action center');
    } catch (error) {
      if (__DEV__) console.error('Action center error:', error);
      throw new Error(error.message || 'Failed to fetch action center');
    }
  }

  async getNetworkStats(storeId: string): Promise<NetworkStatsData> {
    try {
      const response = await apiClient.get<NetworkStatsData>(
        `merchant/intelligence/network-stats?storeId=${storeId}`
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to fetch network stats');
    } catch (error) {
      if (__DEV__) console.error('Network stats error:', error);
      throw new Error(error.message || 'Failed to fetch network stats');
    }
  }

  async getAttribution(storeId: string, period: string = '30d'): Promise<AttributionSummary> {
    try {
      const response = await apiClient.get<AttributionSummary>(
        `merchant/attribution/summary?storeId=${storeId}&period=${period}`
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to fetch attribution');
    } catch (error) {
      if (__DEV__) console.error('Attribution error:', error);
      throw new Error(error.message || 'Failed to fetch attribution');
    }
  }
}

export const intelligenceService = new IntelligenceService();
export default intelligenceService;
