/**
 * Global type declarations for REZ Decision Service
 * Resolves common type conflicts
 */

declare global {
  interface CampaignMetrics {
    channel?: string;
    targeting?: Record<string, unknown>;
    impressions?: number;
    clicks?: number;
    conversions?: number;
    spend?: number;
    [key: string]: unknown;
  }

  interface BundlePurchase {
    refunded?: boolean;
    refundReason?: string;
    refundedAt?: Date;
    [key: string]: unknown;
  }

  interface CoinBundle {
    active?: boolean;
    [key: string]: unknown;
  }

  interface BundleGenerationEngine {
    getUserPurchaseHistory?: (userId: string) => Promise<unknown[]>;
    [key: string]: unknown;
  }
}

// Make this a module
export {};
