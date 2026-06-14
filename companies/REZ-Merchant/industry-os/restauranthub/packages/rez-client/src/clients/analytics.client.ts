import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance } from 'axios';
import { RezHttpClient } from '../rez-http.client';
import type {
  RezAnalytics,
  RezRevenueMetrics,
  RezFoodCostMetrics,
} from '../types/rez.types';

const SERVICE_KEY = 'rez-analytics';

@Injectable()
export class RezAnalyticsClient {
  private readonly logger = new Logger(RezAnalyticsClient.name);
  private readonly http: AxiosInstance;

  constructor(
    private readonly client: RezHttpClient,
    private readonly config: ConfigService,
  ) {
    const baseURL = this.config.get<string>('REZ_ANALYTICS_URL', 'https://analytics-events.onrender.com');
    if (!baseURL) {
      this.logger.warn('REZ_ANALYTICS_URL not set, using default');
    }
    this.http = this.client.buildInstance(baseURL);
  }

  async getMerchantAnalytics(
    merchantId: string,
    period: string,
  ): Promise<RezAnalytics | null> {
    return this.client.get<RezAnalytics>(
      SERVICE_KEY,
      this.http,
      `/analytics/merchants/${merchantId}`,
      { period },
    );
  }

  async getRevenueMetrics(merchantId: string): Promise<RezRevenueMetrics | null> {
    return this.client.get<RezRevenueMetrics>(
      SERVICE_KEY,
      this.http,
      `/analytics/merchants/${merchantId}/revenue`,
    );
  }

  async getFoodCostMetrics(merchantId: string): Promise<RezFoodCostMetrics | null> {
    return this.client.get<RezFoodCostMetrics>(
      SERVICE_KEY,
      this.http,
      `/analytics/merchants/${merchantId}/food-cost`,
    );
  }
}
