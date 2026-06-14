import axios, { AxiosInstance, AxiosError } from 'axios';
import { SyncProductRequest, LowStockNotification } from '../types';

export class POSClient {
  private client: AxiosInstance;
  private serviceToken: string;

  constructor() {
    const baseURL = process.env.RETAIL_POS_URL || 'http://localhost:4020';
    this.serviceToken = process.env.POS_SERVICE_TOKEN || '';

    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Token': this.serviceToken,
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[POSClient] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[POSClient] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('[POSClient] Response error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  async syncProduct(data: SyncProductRequest): Promise<{ success: boolean; synced: number }> {
    try {
      const response = await this.client.post('/api/products/sync', {
        storeId: data.storeId,
        products: data.products,
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new Error(
        `Failed to sync products for store ${data.storeId}: ${axiosError.message}`
      );
    }
  }

  async updatePrice(sku: string, price: number): Promise<{ success: boolean }> {
    try {
      const response = await this.client.patch(`/api/products/${sku}/price`, {
        price,
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new Error(
        `Failed to update price for SKU ${sku}: ${axiosError.message}`
      );
    }
  }

  async setAvailability(sku: string, available: boolean): Promise<{ success: boolean }> {
    try {
      const response = await this.client.patch(`/api/products/${sku}/availability`, {
        available,
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new Error(
        `Failed to set availability for SKU ${sku}: ${axiosError.message}`
      );
    }
  }

  async notifyLowStock(data: LowStockNotification): Promise<{ success: boolean }> {
    try {
      const response = await this.client.post('/api/notifications/low-stock', {
        storeId: data.storeId,
        sku: data.sku,
        productName: data.productName,
        currentStock: data.currentStock,
        reorderPoint: data.reorderPoint,
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new Error(
        `Failed to notify low stock for SKU ${data.sku}: ${axiosError.message}`
      );
    }
  }

  async getProducts(storeId: string): Promise<Array<{ sku: string; name: string; price: number }>> {
    try {
      const response = await this.client.get('/api/products', {
        params: { storeId },
      });
      return response.data.products || [];
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new Error(
        `Failed to get products for store ${storeId}: ${axiosError.message}`
      );
    }
  }

  async getProduct(sku: string): Promise<{ sku: string; name: string; price: number; available: boolean }> {
    try {
      const response = await this.client.get(`/api/products/${sku}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new Error(
        `Failed to get product ${sku}: ${axiosError.message}`
      );
    }
  }
}

export const posClient = new POSClient();
