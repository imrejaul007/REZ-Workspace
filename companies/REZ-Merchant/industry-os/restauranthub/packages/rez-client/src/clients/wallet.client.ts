import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance } from 'axios';
import { RezHttpClient } from '../rez-http.client';
import type {
  RezWalletBalance,
  RezTransaction,
  RezCreditScore,
} from '../types/rez.types';

const SERVICE_KEY = 'rez-wallet';

@Injectable()
export class RezWalletClient {
  private readonly logger = new Logger(RezWalletClient.name);
  private readonly http: AxiosInstance;

  constructor(
    private readonly client: RezHttpClient,
    private readonly config: ConfigService,
  ) {
    const baseURL = this.config.get<string>('REZ_WALLET_URL', 'https://rez-wallet-service-36vo.onrender.com');
    if (!baseURL) {
      this.logger.warn('REZ_WALLET_URL not set, using default');
    }
    this.http = this.client.buildInstance(baseURL);
  }

  async getWalletBalance(merchantId: string): Promise<RezWalletBalance | null> {
    return this.client.get<RezWalletBalance>(
      SERVICE_KEY,
      this.http,
      `/wallet/merchants/${merchantId}/balance`,
    );
  }

  async getTransactions(
    merchantId: string,
    limit = 50,
  ): Promise<RezTransaction[]> {
    const result = await this.client.get<RezTransaction[]>(
      SERVICE_KEY,
      this.http,
      `/wallet/merchants/${merchantId}/transactions`,
      { limit },
    );
    return result ?? [];
  }

  async getMerchantCreditScore(
    merchantId: string,
  ): Promise<RezCreditScore | null> {
    return this.client.get<RezCreditScore>(
      SERVICE_KEY,
      this.http,
      `/wallet/merchants/${merchantId}/credit-score`,
    );
  }
}
