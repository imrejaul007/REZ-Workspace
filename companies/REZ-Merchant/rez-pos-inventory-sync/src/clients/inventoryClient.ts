import axios, { AxiosInstance, AxiosError } from 'axios';
import { DeductStockRequest, AddStockRequest, Stock, Product } from '../types';

export class InventoryClient {
  private client: AxiosInstance;
  private serviceToken: string;

  constructor() {
    const baseURL = process.env.INVENTORY_ENGINE_URL || 'http://localhost:4021';
    this.serviceToken = process.env.INVENTORY_SERVICE_TOKEN || '';

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
        console.log(`[InventoryClient] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[InventoryClient] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('[InventoryClient] Response error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  async deductStock(data: DeductStockRequest): Promise<{ success: boolean; newQuantity: number }> {
    try {
      const response = await this.client.post('/api/inventory/deduct', {
        sku: data.sku,
        quantity: data.quantity,
        storeId: data.storeId,
        reason: data.reason,
        referenceId: data.referenceId,
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new Error(
        `Failed to deduct stock for SKU ${data.sku}: ${axiosError.message}`
      );
    }
  }

  async addStock(data: AddStockRequest): Promise<{ success: boolean; newQuantity: number }> {
    try {
      const response = await this.client.post('/api/inventory/add', {
        sku: data.sku,
        quantity: data.quantity,
        storeId: data.storeId,
        reason: data.reason,
        referenceId: data.referenceId,
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new Error(
        `Failed to add stock for SKU ${data.sku}: ${axiosError.message}`
      );
    }
  }

  async getStock(sku: string, storeId: string): Promise<Stock> {
    try {
      const response = await this.client.get(`/api/inventory/stock/${sku}`, {
        params: { storeId },
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        throw new Error(`Stock not found for SKU ${sku} in store ${storeId}`);
      }
      throw new Error(
        `Failed to get stock for SKU ${sku}: ${axiosError.message}`
      );
    }
  }

  async lookupBarcode(barcode: string): Promise<Product | null> {
    try {
      const response = await this.client.get('/api/inventory/lookup', {
        params: { barcode },
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        return null;
      }
      throw new Error(
        `Failed to lookup barcode ${barcode}: ${axiosError.message}`
      );
    }
  }

  async getProductsByStore(storeId: string): Promise<Product[]> {
    try {
      const response = await this.client.get('/api/inventory/products', {
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

  async getLowStockProducts(storeId: string, threshold: number = 10): Promise<Array<Stock & { reorderPoint: number }>> {
    try {
      const response = await this.client.get('/api/inventory/low-stock', {
        params: { storeId, threshold },
      });
      return response.data.products || [];
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new Error(
        `Failed to get low stock products: ${axiosError.message}`
      );
    }
  }
}

export const inventoryClient = new InventoryClient();
