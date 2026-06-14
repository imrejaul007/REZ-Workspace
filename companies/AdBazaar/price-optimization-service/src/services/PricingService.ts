import { v4 as uuidv4 } from 'uuid';
import { Pricing, IPricing, Strategy, IStrategy, Optimization, IOptimization } from '../models';
import { createServiceLogger } from '../utils/logger';

const logger = createServiceLogger('PricingService');

export class PricingService {
  async createPricing(data: Partial<IPricing>): Promise<IPricing> {
    const pricingId = `price_${uuidv4()}`;
    const pricing = new Pricing({ ...data, pricingId });
    await pricing.save();
    logger.info('Pricing created', { pricingId, productId: data.productId });
    return pricing;
  }

  async getPricingById(pricingId: string): Promise<IPricing | null> {
    return Pricing.findOne({ pricingId });
  }

  async getPricingByProduct(productId: string, companyId: string): Promise<IPricing | null> {
    return Pricing.findOne({ productId, companyId, status: 'active' });
  }

  async updatePricing(pricingId: string, data: Partial<IPricing>): Promise<IPricing | null> {
    const pricing = await Pricing.findOneAndUpdate({ pricingId }, data, { new: true });
    if (pricing) logger.info('Pricing updated', { pricingId });
    return pricing;
  }

  async getAllPricing(companyId: string): Promise<IPricing[]> {
    return Pricing.find({ companyId, status: 'active' }).sort({ createdAt: -1 });
  }

  async createStrategy(data: Partial<IStrategy>): Promise<IStrategy> {
    const strategyId = `strat_${uuidv4()}`;
    const strategy = new Strategy({ ...data, strategyId });
    await strategy.save();
    logger.info('Strategy created', { strategyId, name: data.name });
    return strategy;
  }

  async getStrategyById(strategyId: string): Promise<IStrategy | null> {
    return Strategy.findOne({ strategyId });
  }

  async getStrategiesByType(companyId: string, type: string): Promise<IStrategy[]> {
    return Strategy.find({ companyId, type, isActive: true });
  }

  async optimizePrice(pricingId: string, factors: Record<string, unknown>): Promise<IOptimization> {
    const pricing = await this.getPricingById(pricingId);
    if (!pricing) throw new Error('Pricing not found');

    const strategies = await Strategy.find({ companyId: pricing.companyId, isActive: true });
    let newPrice = pricing.currentPrice;
    let adjustmentType: 'percentage' | 'fixed' = 'percentage';
    let adjustmentValue = 0;
    let reason = 'No adjustment needed';

    for (const strategy of strategies.sort((a, b) => a.rules[0]?.priority - b.rules[0]?.priority)) {
      for (const rule of strategy.rules) {
        const fieldValue = factors[rule.condition.field];
        if (this.evaluateCondition(fieldValue, rule.condition.operator, rule.condition.value)) {
          if (rule.adjustment.type === 'percentage') {
            adjustmentValue = pricing.basePrice * (rule.adjustment.value / 100);
            newPrice = pricing.basePrice + adjustmentValue;
          } else {
            adjustmentValue = rule.adjustment.value;
            newPrice = pricing.currentPrice + adjustmentValue;
          }
          adjustmentType = rule.adjustment.type;
          reason = `${strategy.name}: ${rule.condition.field} ${rule.condition.operator} ${rule.condition.value}`;
          break;
        }
      }
    }

    // Apply min/max bounds
    const minPrice = pricing.basePrice * (strategy?.minPricePercent || 80) / 100;
    const maxPrice = pricing.basePrice * (strategy?.maxPricePercent || 120) / 100;
    newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));

    const optimizationId = `opt_${uuidv4()}`;
    const optimization = new Optimization({
      optimizationId,
      pricingId,
      productId: pricing.productId,
      companyId: pricing.companyId,
      previousPrice: pricing.currentPrice,
      newPrice,
      adjustmentType,
      adjustmentValue,
      reason,
      factors: factors as IOptimization['factors'],
      expectedRevenue: newPrice * 100,
      status: 'applied',
      appliedAt: new Date()
    });

    await optimization.save();

    // Update pricing current price
    pricing.currentPrice = newPrice;
    await pricing.save();

    logger.info('Price optimized', { optimizationId, from: pricing.currentPrice, to: newPrice });
    return optimization;
  }

  private evaluateCondition(value: unknown, operator: string, target: unknown): boolean {
    switch (operator) {
      case '>': return Number(value) > Number(target);
      case '<': return Number(value) < Number(target);
      case '>=': return Number(value) >= Number(target);
      case '<=': return Number(value) <= Number(target);
      case '==': return value === target;
      case '!=': return value !== target;
      case 'contains': return String(value).includes(String(target));
      default: return false;
    }
  }

  async getOptimizationHistory(pricingId: string): Promise<IOptimization[]> {
    return Optimization.find({ pricingId }).sort({ createdAt: -1 });
  }

  async revertOptimization(optimizationId: string): Promise<IOptimization | null> {
    const optimization = await Optimization.findOne({ optimizationId });
    if (!optimization) return null;

    optimization.status = 'reverted';
    optimization.revertedAt = new Date();
    await optimization.save();

    const pricing = await Pricing.findOne({ pricingId: optimization.pricingId });
    if (pricing) {
      pricing.currentPrice = optimization.previousPrice;
      await pricing.save();
    }

    logger.info('Optimization reverted', { optimizationId });
    return optimization;
  }

  async getPricingStats(pricingId: string): Promise<{ currentPrice: number; totalOptimizations: number; avgAdjustment: number }> {
    const optimizations = await Optimization.find({ pricingId, status: 'applied' });
    const totalAdjustment = optimizations.reduce((sum, o) => sum + Math.abs(o.newPrice - o.previousPrice), 0);
    return {
      currentPrice: (await this.getPricingById(pricingId))?.currentPrice || 0,
      totalOptimizations: optimizations.length,
      avgAdjustment: optimizations.length > 0 ? totalAdjustment / optimizations.length : 0
    };
  }
}

export const pricingService = new PricingService();