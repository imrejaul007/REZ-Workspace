/**
 * Merchant Service Client for Staff Service
 * Provides typed access to the merchant service API
 */

import axios, { AxiosInstance } from 'axios';

// Configuration
const MERCHANT_SERVICE_URL = process.env.MERCHANT_SERVICE_URL || 'http://localhost:3004';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// Types
export interface MerchantStaff {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'owner' | 'manager' | 'cashier' | 'kitchen' | 'delivery' | 'other';
  permissions: string[];
  isActive: boolean;
  storeIds: string[];
  merchantId: string;
  hiredAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MerchantStore {
  _id: string;
  storeId: string;
  name: string;
  merchantId: string;
  address?: string;
  timezone?: string;
  isActive: boolean;
  settings?: Record<string, unknown>;
}

export interface Merchant {
  _id: string;
  merchantId: string;
  name: string;
  ownerId: string;
  stores: string[];
  settings?: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MerchantQueryParams {
  merchantId?: string;
  storeId?: string;
  role?: string;
  isActive?: boolean;
}

export class MerchantClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: MERCHANT_SERVICE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_SERVICE_TOKEN,
        'x-internal-service': 'rez-staff-service',
      },
    });
  }

  /**
   * Get merchant by ID
   */
  async getMerchant(merchantId: string): Promise<Merchant> {
    const response = await this.client.get(`/merchants/${merchantId}`);
    return response.data;
  }

  /**
   * Get all staff for a merchant
   */
  async getMerchantStaff(merchantId: string): Promise<MerchantStaff[]> {
    const response = await this.client.get(`/merchants/${merchantId}/staff`);
    return response.data.staff || response.data;
  }

  /**
   * Get staff by store
   */
  async getStoreStaff(storeId: string): Promise<MerchantStaff[]> {
    const response = await this.client.get(`/stores/${storeId}/staff`);
    return response.data.staff || response.data;
  }

  /**
   * Get store by ID
   */
  async getStore(storeId: string): Promise<MerchantStore> {
    const response = await this.client.get(`/stores/${storeId}`);
    return response.data;
  }

  /**
   * Get stores for a merchant
   */
  async getMerchantStores(merchantId: string): Promise<MerchantStore[]> {
    const response = await this.client.get(`/merchants/${merchantId}/stores`);
    return response.data.stores || response.data;
  }

  /**
   * Get staff member by user ID
   */
  async getStaffByUserId(userId: string): Promise<MerchantStaff | null> {
    try {
      const response = await this.client.get(`/staff/user/${userId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get staff by role
   */
  async getStaffByRole(merchantId: string, role: string): Promise<MerchantStaff[]> {
    const response = await this.client.get(`/merchants/${merchantId}/staff`, {
      params: { role },
    });
    return response.data.staff || response.data;
  }

  /**
   * Sync staff data with merchant
   */
  async syncStaffWithMerchant(merchantId: string): Promise<{
    synced: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      const staff = await this.getMerchantStaff(merchantId);
      for (const member of staff) {
        try {
          // This is where you'd update local staff records
          synced++;
        } catch (error) {
          errors.push(`Staff ${member._id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { synced, errors };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'ok' || response.data.status === 'healthy';
    } catch {
      return false;
    }
  }
}

// Singleton instance
let merchantClient: MerchantClient | null = null;

export function getMerchantClient(): MerchantClient {
  if (!merchantClient) {
    merchantClient = new MerchantClient();
  }
  return merchantClient;
}

export default MerchantClient;
