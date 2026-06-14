import logger from './utils/logger';

import { apiClient } from './client';
import { Linking } from 'react-native';

export interface MerchantIntegrationItem {
  _id: string;
  integrationType: string;
  provider: string;
  status: 'active' | 'paused' | 'error' | 'pending_setup';
  syncMode: 'realtime' | 'batch';
  lastSyncAt?: string;
  lastSyncStatus?: string;
  errorCount: number;
  createdAt: string;
}

export interface IntegrationStatus {
  integrations: MerchantIntegrationItem[];
  recentTransactions: number;
  pendingTransactions: number;
}

export interface AggregatorCredentials {
  platform: 'swiggy' | 'zomato' | 'dunzo';
  apiKey: string;
  apiSecret: string;
}

export interface AggregatorOrder {
  id: string;
  platform: 'swiggy' | 'zomato' | 'dunzo';
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';
  createdAt: string;
}

class IntegrationApiService {
  async getStatus(storeId: string): Promise<IntegrationStatus> {
    try {
      const response = await apiClient.get<IntegrationStatus>(
        `merchant/integrations/status?storeId=${storeId}`
      );
      if (response.success && response.data) {
        return response.data;
      }
      return { integrations: [], recentTransactions: 0, pendingTransactions: 0 };
    } catch {
      return { integrations: [], recentTransactions: 0, pendingTransactions: 0 };
    }
  }

  async uploadBatch(
    storeId: string,
    csvData: string
  ): Promise<{ processed: number; failed: number; duplicates: number }> {
    try {
      const response = await apiClient.post<{
        processed: number;
        failed: number;
        duplicates: number;
      }>('merchant/integrations/batch-upload', { storeId, csvData });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Batch upload failed');
    } catch (error) {
      throw new Error(error.message || 'Batch upload failed');
    }
  }

  async connectAggregator(storeId: string, credentials: AggregatorCredentials): Promise<void> {
    try {
      const response = await apiClient.post('merchant/integrations/aggregator/connect', {
        storeId,
        ...credentials,
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to connect aggregator');
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to connect aggregator');
    }
  }

  async disconnectAggregator(storeId: string, platform: string): Promise<void> {
    try {
      const response = await apiClient.post('merchant/integrations/aggregator/disconnect', {
        storeId,
        platform,
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to disconnect aggregator');
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to disconnect aggregator');
    }
  }

  async getAggregatorOrders(
    storeId: string,
    platform: string,
    page: number = 1
  ): Promise<AggregatorOrder[]> {
    try {
      const response = await apiClient.get<AggregatorOrder[]>(
        `merchant/integrations/aggregator/orders?storeId=${storeId}&platform=${platform}&page=${page}`
      );
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch {
      return [];
    }
  }

  // Open partner application URLs
  openPartnerPortal(platform: 'swiggy' | 'zomato' | 'dunzo'): void {
    const urls: Record<string, string> = {
      swiggy: 'https://partner.swiggy.com',
      zomato: 'https://partner.zomato.com',
      dunzo: 'https://business.dunzo.com',
    };
    Linking.openURL(urls[platform]).catch(() => {
      if (__DEV__) logger.error(`Failed to open ${platform} partner portal`);
    });
  }
}

export const integrationApiService = new IntegrationApiService();
export default integrationApiService;
