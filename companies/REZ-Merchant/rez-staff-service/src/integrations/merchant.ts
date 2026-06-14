/**
 * Merchant Service Integration for Staff Service
 * Manages connection to the merchant service
 */

import { getMerchantClient, MerchantClient } from '../clients/merchantClient';

export interface MerchantIntegrationConfig {
  serviceUrl: string;
  timeout: number;
  retries: number;
}

const defaultConfig: MerchantIntegrationConfig = {
  serviceUrl: process.env.MERCHANT_SERVICE_URL || 'http://localhost:3004',
  timeout: 10000,
  retries: 3,
};

/**
 * Merchant Integration class
 * Provides high-level integration with the merchant service
 */
export class MerchantIntegration {
  private client: MerchantClient;
  private config: MerchantIntegrationConfig;

  constructor(config: Partial<MerchantIntegrationConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.client = getMerchantClient();
  }

  /**
   * Get the merchant client instance
   */
  getClient(): MerchantClient {
    return this.client;
  }

  /**
   * Health check for the merchant service
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const start = Date.now();
    try {
      const healthy = await this.client.healthCheck();
      return {
        healthy,
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync all staff for a merchant
   */
  async syncMerchantStaff(merchantId: string): Promise<{
    synced: number;
    errors: string[];
  }> {
    return this.client.syncStaffWithMerchant(merchantId);
  }

  /**
   * Get staff for scheduling
   */
  async getStaffForScheduling(storeId: string): Promise<{
    staff: Array<{
      id: string;
      name: string;
      role: string;
      permissions: string[];
    }>;
  }> {
    try {
      const staff = await this.client.getStoreStaff(storeId);
      return {
        staff: staff.map((s) => ({
          id: s._id,
          name: `${s.firstName} ${s.lastName}`,
          role: s.role,
          permissions: s.permissions,
        })),
      };
    } catch (error) {
      console.error('[MerchantIntegration] Error getting staff for scheduling:', error);
      return { staff: [] };
    }
  }

  /**
   * Get merchant info for a staff member
   */
  async getMerchantForStaff(userId: string): Promise<{
    merchantId?: string;
    merchantName?: string;
    stores: string[];
  } | null> {
    try {
      const staff = await this.client.getStaffByUserId(userId);
      if (!staff) {
        return null;
      }

      const merchant = await this.client.getMerchant(staff.merchantId);
      return {
        merchantId: staff.merchantId,
        merchantName: merchant.name,
        stores: staff.storeIds,
      };
    } catch (error) {
      console.error('[MerchantIntegration] Error getting merchant for staff:', error);
      return null;
    }
  }

  /**
   * Validate staff role for a store
   */
  async validateStaffRole(userId: string, storeId: string, requiredRole?: string): Promise<boolean> {
    try {
      const staff = await this.client.getStaffByUserId(userId);
      if (!staff || !staff.isActive) {
        return false;
      }

      if (!staff.storeIds.includes(storeId)) {
        return false;
      }

      if (requiredRole && staff.role !== requiredRole) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let merchantIntegration: MerchantIntegration | null = null;

export function getMerchantIntegration(): MerchantIntegration {
  if (!merchantIntegration) {
    merchantIntegration = new MerchantIntegration();
  }
  return merchantIntegration;
}

export default MerchantIntegration;
