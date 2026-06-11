/**
 * ShopFlow Merchant OS Connector
 * Integrates ShopFlow AI with Merchant OS (REZ or standalone)
 */

import { BaseConnector, ConnectorConfig, ApiResponse } from '../types';

export interface MerchantProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  reorderPoint: number;
  supplierId?: string;
}

export interface MerchantCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  loyaltyPoints: number;
  purchaseHistory: Array<{
    productId: string;
    date: string;
    amount: number;
  }>;
}

export interface MerchantLoyaltyTransaction {
  id: string;
  customerId: string;
  type: 'earn' | 'redeem';
  points: number;
  orderId?: string;
  createdAt: string;
}

export class MerchantOSConnector extends BaseConnector {
  private baseUrl: string;

  constructor(config: ConnectorConfig) {
    super(config);
    this.baseUrl = config.merchantOsUrl || 'https://merchant.hojai.ai';
  }

  /**
   * Product Operations
   */
  async getProducts(category?: string): Promise<ApiResponse<MerchantProduct[]>> {
    try {
      const params = category ? `?category=${encodeURIComponent(category)}` : '';
      const response = await this.request<MerchantProduct[]>(
        `${this.baseUrl}/api/products${params}`
      );
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: this.handleError(error) };
    }
  }

  async getProduct(id: string): Promise<ApiResponse<MerchantProduct>> {
    try {
      const response = await this.request<MerchantProduct>(
        `${this.baseUrl}/api/products/${id}`
      );
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: this.handleError(error) };
    }
  }

  async updateStock(productId: string, quantity: number): Promise<ApiResponse<void>> {
    try {
      await this.request(`${this.baseUrl}/api/products/${productId}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: this.handleError(error) };
    }
  }

  async createProduct(product: Omit<MerchantProduct, 'id'>): Promise<ApiResponse<MerchantProduct>> {
    try {
      const response = await this.request<MerchantProduct>(
        `${this.baseUrl}/api/products`,
        { method: 'POST', body: JSON.stringify(product) }
      );
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Customer Operations
   */
  async getCustomers(): Promise<ApiResponse<MerchantCustomer[]>> {
    try {
      const response = await this.request<MerchantCustomer[]>(
        `${this.baseUrl}/api/customers`
      );
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: this.handleError(error) };
    }
  }

  async getCustomer(id: string): Promise<ApiResponse<MerchantCustomer>> {
    try {
      const response = await this.request<MerchantCustomer>(
        `${this.baseUrl}/api/customers/${id}`
      );
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: this.handleError(error) };
    }
  }

  async updateLoyaltyPoints(
    customerId: string,
    points: number,
    type: 'earn' | 'redeem'
  ): Promise<ApiResponse<MerchantLoyaltyTransaction>> {
    try {
      const response = await this.request<MerchantLoyaltyTransaction>(
        `${this.baseUrl}/api/customers/${customerId}/loyalty`,
        { method: 'POST', body: JSON.stringify({ points, type }) }
      );
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Purchase History
   */
  async recordPurchase(
    customerId: string,
    orderId: string,
    products: Array<{ productId: string; amount: number }>
  ): Promise<ApiResponse<void>> {
    try {
      await this.request(`${this.baseUrl}/api/customers/${customerId}/purchases`, {
        method: 'POST',
        body: JSON.stringify({ orderId, products }),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: this.handleError(error) };
    }
  }

  /**
   * Supplier Operations
   */
  async getSuppliers(): Promise<ApiResponse<Array<{ id: string; name: string; email: string }>>> {
    try {
      const response = await this.request<
        Array<{ id: string; name: string; email: string }>
      >(`${this.baseUrl}/api/suppliers`);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: this.handleError(error) };
    }
  }

  async createPurchaseOrder(
    supplierId: string,
    items: Array<{ productId: string; quantity: number; unitPrice: number }>
  ): Promise<ApiResponse<{ orderId: string }>> {
    try {
      const response = await this.request<{ orderId: string }>(
        `${this.baseUrl}/api/purchase-orders`,
        { method: 'POST', body: JSON.stringify({ supplierId, items }) }
      );
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: this.handleError(error) };
    }
  }

  private handleError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return 'Unknown merchant OS error';
  }
}

export default MerchantOSConnector;
