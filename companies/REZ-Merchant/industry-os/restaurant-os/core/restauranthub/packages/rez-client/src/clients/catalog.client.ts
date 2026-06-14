import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance } from 'axios';
import { RezHttpClient } from '../rez-http.client';
import type {
  RezProduct,
  RezCategory,
  RezSupplier,
} from '../types/rez.types';

const SERVICE_KEY = 'rez-catalog';

@Injectable()
export class RezCatalogClient {
  private readonly logger = new Logger(RezCatalogClient.name);
  private readonly http: AxiosInstance;

  constructor(
    private readonly client: RezHttpClient,
    private readonly config: ConfigService,
  ) {
    const baseURL = this.config.get<string>('REZ_CATALOG_URL', 'https://rez-catalog-service.onrender.com');
    if (!baseURL) {
      this.logger.warn('REZ_CATALOG_URL not set, using default');
    }
    this.http = this.client.buildInstance(baseURL);
  }

  async getProducts(storeId: string): Promise<RezProduct[]> {
    const result = await this.client.get<RezProduct[]>(
      SERVICE_KEY,
      this.http,
      `/catalog/stores/${storeId}/products`,
    );
    return result ?? [];
  }

  async getCategories(merchantId: string): Promise<RezCategory[]> {
    const result = await this.client.get<RezCategory[]>(
      SERVICE_KEY,
      this.http,
      `/catalog/merchants/${merchantId}/categories`,
    );
    return result ?? [];
  }

  async getSuppliers(merchantId: string): Promise<RezSupplier[]> {
    const result = await this.client.get<RezSupplier[]>(
      SERVICE_KEY,
      this.http,
      `/catalog/merchants/${merchantId}/suppliers`,
    );
    return result ?? [];
  }
}
