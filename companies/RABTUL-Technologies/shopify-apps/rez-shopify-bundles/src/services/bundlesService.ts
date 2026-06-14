import crypto from 'crypto';
import { Bundle, BundleItem, BundleRecommendation, BundleStats } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class BundlesService {
  private bundles: Map<string, Bundle> = new Map();
  private productBundles: Map<string, Set<string>> = new Map();

  createBundle(bundleData: Omit<Bundle, 'id'>): Bundle {
    const id = crypto.randomUUID();
    const fullBundle: Bundle = {
      ...bundleData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.bundles.set(id, fullBundle);
    this.productBundles.set(bundleData.shopifyProductId, new Set([...this.productBundles.get(bundleData.shopifyProductId) || [], id]));

    logger.info(`Bundle created: ${id} for product ${bundleData.shopifyProductId}`);
    return fullBundle;
  }

  getBundle(id: string): Bundle | undefined {
    return this.bundles.get(id);
  }

  getProductBundles(productId: string): Bundle[] {
    const bundleIds = this.productBundles.get(productId) || new Set();
    const now = new Date();

    return Array.from(bundleIds)
      .map(id => this.bundles.get(id))
      .filter((bundle): bundle is Bundle => {
        if (!bundle || !bundle.isActive) return false;
        if (bundle.startDate && new Date(bundle.startDate) > now) return false;
        if (bundle.endDate && new Date(bundle.endDate) < now) return false;
        return true;
      });
  }

  updateBundle(id: string, updates: Partial<Bundle>): Bundle | undefined {
    const bundle = this.bundles.get(id);
    if (!bundle) return undefined;

    const updated = { ...bundle, ...updates, id, updatedAt: new Date().toISOString() };
    this.bundles.set(id, updated);
    return updated;
  }

  deleteBundle(id: string): boolean {
    const bundle = this.bundles.get(id);
    if (!bundle) return false;

    this.productBundles.get(bundle.shopifyProductId)?.delete(id);
    this.bundles.delete(id);
    return true;
  }

  calculateBundlePrice(bundleId: string, productPrices: Map<string, number>): { originalPrice: number; bundlePrice: number; savings: number; savingsPercentage: number } | undefined {
    const bundle = this.bundles.get(bundleId);
    if (!bundle) return undefined;

    let originalPrice = 0;
    for (const item of bundle.items) {
      const price = productPrices.get(item.shopifyProductId) || 0;
      originalPrice += price * item.quantity;
    }

    const bundlePrice = bundle.discountPercentage > 0
      ? originalPrice * (1 - bundle.discountPercentage / 100)
      : originalPrice;

    const savings = originalPrice - bundlePrice;
    const savingsPercentage = originalPrice > 0 ? (savings / originalPrice) * 100 : 0;

    return { originalPrice: Math.round(originalPrice * 100) / 100, bundlePrice: Math.round(bundlePrice * 100) / 100, savings: Math.round(savings * 100) / 100, savingsPercentage: Math.round(savingsPercentage * 10) / 10 };
  }

  validateBundleItems(bundleId: string, selectedItems: Array<{ shopifyProductId: string; quantity: number }>): { valid: boolean; errors: string[] } {
    const bundle = this.bundles.get(bundleId);
    if (!bundle) return { valid: false, errors: ['Bundle not found'] };

    const errors: string[] = [];
    const selectedMap = new Map(selectedItems.map(i => [i.shopifyProductId, i.quantity]));

    for (const item of bundle.items) {
      const selected = selectedMap.get(item.shopifyProductId) || 0;
      if (selected < item.quantity) {
        errors.push(`Product ${item.shopifyProductId} requires quantity ${item.quantity}, got ${selected}`);
      }
    }

    const totalItems = selectedItems.reduce((sum, i) => sum + i.quantity, 0);
    if (bundle.minItems && totalItems < bundle.minItems) {
      errors.push(`Minimum ${bundle.minItems} items required, got ${totalItems}`);
    }
    if (bundle.maxItems && totalItems > bundle.maxItems) {
      errors.push(`Maximum ${bundle.maxItems} items allowed, got ${totalItems}`);
    }

    return { valid: errors.length === 0, errors };
  }

  getRecommendations(customerId: string, productId: string, cartItems: string[]): BundleRecommendation[] {
    const bundleIds = this.productBundles.get(productId) || new Set();
    const recommendations: BundleRecommendation[] = [];

    for (const bundleId of bundleIds) {
      const bundle = this.bundles.get(bundleId);
      if (!bundle || !bundle.isActive) continue;

      const matchingItems = bundle.items.filter(item => cartItems.includes(item.shopifyProductId));
      const confidence = matchingItems.length / bundle.items.length;

      if (confidence > 0.3) {
        recommendations.push({
          bundleId,
          shopifyProductId: bundle.shopifyProductId,
          confidence,
          reason: `You have ${matchingItems.length} of ${bundle.items.length} items from this bundle`,
          discountApplied: bundle.discountPercentage
        });
      }
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  getStats(bundleId: string): BundleStats | undefined {
    const bundle = this.bundles.get(bundleId);
    if (!bundle) return undefined;

    // STATISTICAL: mock bundle stats for display
    return {
      bundleId,
      totalOrders: Math.floor(Math.random() * 1000),
      totalRevenue: Math.round(Math.random() * 50000 * 100) / 100,
      avgOrderValue: Math.round(Math.random() * 100 * 100) / 100,
      conversionRate: Math.round(Math.random() * 30 * 10) / 10,
      topProducts: bundle.items.slice(0, 3).map(item => ({ shopifyProductId: item.shopifyProductId, count: Math.floor(Math.random() * 500) }))
    };
  }

  getAllBundles(filters?: { isActive?: boolean; bundleType?: string; tag?: string }): Bundle[] {
    let bundles = Array.from(this.bundles.values());

    if (filters?.isActive !== undefined) {
      bundles = bundles.filter(b => b.isActive === filters.isActive);
    }
    if (filters?.bundleType) {
      bundles = bundles.filter(b => b.bundleType === filters.bundleType);
    }
    if (filters?.tag) {
      bundles = bundles.filter(b => b.tags.includes(filters.tag!));
    }

    return bundles;
  }
}

export const bundlesService = new BundlesService();
