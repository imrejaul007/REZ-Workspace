import crypto from 'crypto';
import { PriceRule, TieredPricing, PriceRuleStats } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class PriceRulesService {
  private rules: Map<string, PriceRule> = new Map();
  private tieredPricing: Map<string, TieredPricing> = new Map();
  private ruleUsage: Map<string, number> = new Map();

  createRule(ruleData: Omit<PriceRule, 'id' | 'currentUses' | 'createdAt' | 'updatedAt'>): PriceRule {
    const id = crypto.randomUUID();
    const rule: PriceRule = {
      ...ruleData,
      id,
      currentUses: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.rules.set(id, rule);
    logger.info(`Price rule created`, { id, name: rule.name });
    return rule;
  }

  getRule(id: string): PriceRule | undefined {
    return this.rules.get(id);
  }

  getShopRules(shopId: string, activeOnly = false): PriceRule[] {
    let rules = Array.from(this.rules.values()).filter(r => r.shopifyShopId === shopId);
    if (activeOnly) {
      const now = new Date();
      rules = rules.filter(r => {
        if (!r.isActive) return false;
        if (r.startDate && new Date(r.startDate) > now) return false;
        if (r.endDate && new Date(r.endDate) < now) return false;
        return true;
      });
    }
    return rules.sort((a, b) => b.priority - a.priority);
  }

  updateRule(id: string, updates: Partial<PriceRule>): PriceRule | undefined {
    const rule = this.rules.get(id);
    if (!rule) return undefined;
    const updated = { ...rule, ...updates, id, updatedAt: new Date().toISOString() };
    this.rules.set(id, updated);
    return updated;
  }

  deleteRule(id: string): boolean {
    return this.rules.delete(id);
  }

  evaluateConditions(conditions: PriceRule['conditions'], context: {
    productId?: string; collectionIds?: string[]; customerTags?: string[];
    customerId?: string; country?: string; cartTotal?: number; quantity?: number
  }): boolean {
    for (const condition of conditions) {
      let matches = false;
      const value = condition.value;

      switch (condition.type) {
        case 'product':
          matches = context.productId === value;
          break;
        case 'collection':
          matches = context.collectionIds?.includes(value as string) || false;
          break;
        case 'customer_tag':
          matches = context.customerTags?.includes(value as string) || false;
          break;
        case 'cart_total':
          const threshold = typeof value === 'number' ? value : parseFloat(value as string);
          switch (condition.operator) {
            case 'greater_than': matches = (context.cartTotal || 0) > threshold; break;
            case 'less_than': matches = (context.cartTotal || 0) < threshold; break;
            case 'equals': matches = context.cartTotal === threshold; break;
            default: matches = false;
          }
          break;
        case 'quantity':
          const qty = typeof value === 'number' ? value : parseInt(value as string);
          switch (condition.operator) {
            case 'greater_than': matches = (context.quantity || 0) > qty; break;
            case 'less_than': matches = (context.quantity || 0) < qty; break;
            case 'equals': matches = context.quantity === qty; break;
            default: matches = false;
          }
          break;
        default:
          matches = true;
      }

      if (!matches) return false;
    }
    return true;
  }

  applyRule(ruleId: string, originalPrice: number, context: Parameters<typeof this.evaluateConditions>[1]): { discountedPrice: number; discountAmount: number; ruleId: string } | null {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.isActive) return null;

    if (rule.maxUses && (rule.currentUses >= rule.maxUses)) return null;

    if (rule.startDate && new Date(rule.startDate) > new Date()) return null;
    if (rule.endDate && new Date(rule.endDate) < new Date()) return null;

    if (!this.evaluateConditions(rule.conditions, context)) return null;

    let discountedPrice = originalPrice;
    let discountAmount = 0;

    switch (rule.discountType) {
      case 'percentage':
        discountAmount = originalPrice * (rule.value / 100);
        discountedPrice = originalPrice - discountAmount;
        break;
      case 'fixed_amount':
        discountAmount = Math.min(rule.value, originalPrice);
        discountedPrice = originalPrice - discountAmount;
        break;
      case 'fixed_price':
        discountedPrice = Math.min(rule.value, originalPrice);
        discountAmount = originalPrice - discountedPrice;
        break;
      case 'free_shipping':
        discountAmount = 0;
        break;
    }

    rule.currentUses++;
    this.rules.set(ruleId, rule);
    this.ruleUsage.set(ruleId, (this.ruleUsage.get(ruleId) || 0) + 1);

    return { discountedPrice: Math.round(discountedPrice * 100) / 100, discountAmount: Math.round(discountAmount * 100) / 100, ruleId };
  }

  findApplicableRules(shopId: string, context: Parameters<typeof this.evaluateConditions>[1]): PriceRule[] {
    return this.getShopRules(shopId, true).filter(rule => this.evaluateConditions(rule.conditions, context));
  }

  createTieredPricing(productId: string, tiers: TieredPricing['tiers']): TieredPricing {
    const id = crypto.randomUUID();
    const tiered: TieredPricing = { id, shopifyProductId: productId, tiers, isActive: true };
    this.tieredPricing.set(id, tiered);
    return tiered;
  }

  getTieredPricing(productId: string): TieredPricing | undefined {
    for (const tp of this.tieredPricing.values()) {
      if (tp.shopifyProductId === productId && tp.isActive) return tp;
    }
    return undefined;
  }

  calculateTieredPrice(productId: string, quantity: number, basePrice: number): { unitPrice: number; totalPrice: number; tier: { minQuantity: number; maxQuantity?: number; price: number } } | null {
    const tiered = this.getTieredPricing(productId);
    if (!tiered) return null;

    const applicableTier = tiered.tiers.find(t => quantity >= t.minQuantity && (!t.maxQuantity || quantity <= t.maxQuantity));
    if (!applicableTier) return null;

    return {
      unitPrice: applicableTier.price,
      totalPrice: Math.round(applicableTier.price * quantity * 100) / 100,
      tier: applicableTier
    };
  }

  getStats(ruleId: string): PriceRuleStats {
    const rule = this.rules.get(ruleId);
    const totalUses = this.ruleUsage.get(ruleId) || 0;
    const avgDiscount = rule?.value || 0;

    // STATISTICAL: mock price rule stats for display
    return {
      ruleId,
      totalUses,
      totalDiscount: Math.round(totalUses * avgDiscount * 100) / 100,
      avgDiscount,
      conversionRate: Math.round(Math.random() * 30 + 5),
      revenue: Math.round(totalUses * avgDiscount * 1.5 * 100) / 100
    };
  }
}

export const priceRulesService = new PriceRulesService();
