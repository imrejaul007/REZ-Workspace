/**
 * REZ Retail OS - Unified SDK
 */

import axios, { AxiosInstance } from 'axios';

export interface RetailSDKConfig {
  baseURL?: string;
  apiKey?: string;
}

class BaseClient {
  protected client: AxiosInstance;

  constructor(baseURL: string, config: RetailSDKConfig) {
    this.client = axios.create({
      baseURL,
      timeout: config.timeout || 30000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  protected async get<T>(path: string, params?: object): Promise<T> {
    const response = await this.client.get(path, { params });
    return response.data;
  }

  protected async post<T>(path: string, data?: object): Promise<T> {
    const response = await this.client.post(path, data);
    return response.data;
  }
}

// =============================================================================
// Retail Main
// =============================================================================

export interface Store {
  id: string;
  name: string;
  address: string;
  type: 'flagship' | 'outlet' | 'kiosk';
}

export class RetailClient extends BaseClient {
  constructor(config: RetailSDKConfig) {
    super(config.baseURL || 'http://localhost:4601', config);
  }

  async getStores(): Promise<Store[]> {
    return this.get('/api/stores');
  }

  async getStore(id: string): Promise<Store> {
    return this.get(`/api/stores/${id}`);
  }
}

// =============================================================================
// POS
// =============================================================================

export interface Sale {
  id: string;
  storeId: string;
  items: SaleItem[];
  total: number;
  paymentMethod: 'card' | 'upi' | 'cash';
  createdAt: Date;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  discount?: number;
}

export class POSClient extends BaseClient {
  constructor(config: RetailSDKConfig) {
    super(config.baseURL || 'http://localhost:4602', config);
  }

  async createSale(data: { storeId: string; items: SaleItem[] }): Promise<Sale> {
    return this.post('/api/sales', data);
  }

  async getSale(id: string): Promise<Sale> {
    return this.get(`/api/sales/${id}`);
  }

  async processReturn(saleId: string, items: SaleItem[]): Promise<void> {
    await this.post(`/api/sales/${saleId}/return`, { items });
  }
}

// =============================================================================
// Inventory
// =============================================================================

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
}

export class InventoryClient extends BaseClient {
  constructor(config: RetailSDKConfig) {
    super(config.baseURL || 'http://localhost:4603', config);
  }

  async getProducts(): Promise<Product[]> {
    return this.get('/api/products');
  }

  async updateStock(productId: string, quantity: number): Promise<void> {
    await this.post(`/api/products/${productId}/stock`, { quantity });
  }

  async getLowStock(): Promise<Product[]> {
    return this.get('/api/products/low-stock');
  }
}

// =============================================================================
// Analytics
// =============================================================================

export interface SalesMetrics {
  totalSales: number;
  totalRevenue: number;
  avgTransaction: number;
  topProducts: Product[];
}

export class AnalyticsClient extends BaseClient {
  constructor(config: RetailSDKConfig) {
    super(config.baseURL || 'http://localhost:4604', config);
  }

  async getMetrics(storeId: string, period: 'day' | 'week' | 'month'): Promise<SalesMetrics> {
    return this.get('/api/metrics', { storeId, period });
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createRetailSDK(config: RetailSDKConfig = {}): {
  retail: RetailClient;
  pos: POSClient;
  inventory: InventoryClient;
  analytics: AnalyticsClient;
} {
  return {
    retail: new RetailClient(config),
    pos: new POSClient(config),
    inventory: new InventoryClient(config),
    analytics: new AnalyticsClient(config),
  };
}

export default createRetailSDK;
