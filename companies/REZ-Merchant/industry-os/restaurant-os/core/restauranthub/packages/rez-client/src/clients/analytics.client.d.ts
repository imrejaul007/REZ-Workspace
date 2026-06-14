import { ConfigService } from '@nestjs/config';
import { RezHttpClient } from '../rez-http.client';
import type { RezAnalytics, RezRevenueMetrics, RezFoodCostMetrics } from '../types/rez.types';
export declare class RezAnalyticsClient {
    private readonly client;
    private readonly config;
    private readonly logger;
    private readonly http;
    constructor(client: RezHttpClient, config: ConfigService);
    getMerchantAnalytics(merchantId: string, period: string): Promise<RezAnalytics | null>;
    getRevenueMetrics(merchantId: string): Promise<RezRevenueMetrics | null>;
    getFoodCostMetrics(merchantId: string): Promise<RezFoodCostMetrics | null>;
}
