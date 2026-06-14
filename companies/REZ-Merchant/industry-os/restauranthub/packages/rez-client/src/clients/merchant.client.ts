import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance } from 'axios';
import { RezHttpClient } from '../rez-http.client';
import type {
  RezMerchant,
  RezMerchantStats,
  RezStore,
  RezPurchaseOrder,
  RezPurchaseOrderSummary,
  RezStaffShift,
  RezShiftGap,
} from '../types/rez.types';

const SERVICE_KEY = 'rez-merchant';

@Injectable()
export class RezMerchantClient {
  private readonly logger = new Logger(RezMerchantClient.name);
  private readonly http: AxiosInstance;

  constructor(
    private readonly client: RezHttpClient,
    private readonly config: ConfigService,
  ) {
    const baseURL = this.config.get<string>('REZ_MERCHANT_SERVICE_URL', 'https://rez-merchant-service.onrender.com');
    if (!baseURL) {
      this.logger.warn('REZ_MERCHANT_SERVICE_URL not set, using default');
    }
    this.http = this.client.buildInstance(baseURL);
  }

  async getMerchant(merchantId: string): Promise<RezMerchant | null> {
    return this.client.get<RezMerchant>(
      SERVICE_KEY,
      this.http,
      `/merchants/${merchantId}`,
    );
  }

  async getMerchantStats(merchantId: string): Promise<RezMerchantStats | null> {
    return this.client.get<RezMerchantStats>(
      SERVICE_KEY,
      this.http,
      `/merchants/${merchantId}/stats`,
    );
  }

  async getMerchantStores(merchantId: string): Promise<RezStore[]> {
    const result = await this.client.get<RezStore[]>(
      SERVICE_KEY,
      this.http,
      `/merchants/${merchantId}/stores`,
    );
    return result ?? [];
  }

  async getPurchaseOrders(
    merchantId: string,
    days = 30,
  ): Promise<RezPurchaseOrder[]> {
    const result = await this.client.get<RezPurchaseOrder[]>(
      SERVICE_KEY,
      this.http,
      `/merchants/${merchantId}/purchase-orders`,
      { days },
    );
    return result ?? [];
  }

  async getPurchaseOrderSummary(
    merchantId: string,
  ): Promise<RezPurchaseOrderSummary | null> {
    return this.client.get<RezPurchaseOrderSummary>(
      SERVICE_KEY,
      this.http,
      `/merchants/${merchantId}/purchase-orders/summary`,
    );
  }

  async getStaffShifts(merchantId: string): Promise<RezStaffShift[]> {
    const result = await this.client.get<RezStaffShift[]>(
      SERVICE_KEY,
      this.http,
      `/merchants/${merchantId}/staff/shifts`,
    );
    return result ?? [];
  }

  async getShiftGaps(merchantId: string): Promise<RezShiftGap[]> {
    const result = await this.client.get<RezShiftGap[]>(
      SERVICE_KEY,
      this.http,
      `/merchants/${merchantId}/staff/shift-gaps`,
    );
    return result ?? [];
  }
}
