/**
 * ReZ Restaurant OS - Dynamic Pricing Module
 * Surge pricing, happy hour, demand-based pricing
 */

export interface PricingContext {
  storeId: string;
  time: Date;
  isLoyaltyMember?: boolean;
  demand?: number; // 0-100
}

export interface PriceResult {
  itemId: string;
  basePrice: number;
  currentPrice: number;
  discount: number;
  reason: string;
  validUntil: Date;
}

export class RestaurantPricing {
  /**
   * Get current price with dynamic adjustments
   */
  async getCurrentPrice(itemId: string, context: PricingContext): Promise<PriceResult> {
    const basePrice = await this.getBasePrice(itemId);
    let currentPrice = basePrice;
    let reason = 'Base price';

    // Happy hour (3 PM - 6 PM)
    if (this.isHappyHour(context.time)) {
      currentPrice = basePrice * 0.7; // 30% off
      reason = 'Happy Hour - 30% off!';
    }

    // Loyalty discount
    if (context.isLoyaltyMember) {
      currentPrice *= 0.95; // Additional 5% off
      reason += ' (Loyalty discount)';
    }

    // Surge pricing
    if (context.demand && context.demand > 80) {
      const surge = 1 + ((context.demand - 80) / 100);
      currentPrice *= Math.min(surge, 1.5);
      reason = 'High demand surge';
    }

    return {
      itemId,
      basePrice,
      currentPrice: Math.round(currentPrice),
      discount: basePrice - currentPrice,
      reason,
      validUntil: this.getNextPriceChange(context.time)
    };
  }

  /**
   * Apply happy hour pricing
   */
  async applyHappyHour(itemId: string): Promise<number> {
    const basePrice = await this.getBasePrice(itemId);
    return Math.round(basePrice * 0.7);
  }

  /**
   * Apply surge pricing
   */
  async applySurge(itemId: string, demand: number): Promise<number> {
    const basePrice = await this.getBasePrice(itemId);
    if (demand > 80) {
      const surge = 1 + ((demand - 80) / 100);
      return Math.round(basePrice * Math.min(surge, 1.5));
    }
    return basePrice;
  }

  /**
   * Get all active pricing rules
   */
  async getActiveRules(storeId: string): Promise<{
    happyHour: boolean;
    surge: boolean;
    loyaltyDiscount: boolean;
    festivalDiscount?: string;
  }> {
    const now = new Date();

    return {
      happyHour: this.isHappyHour(now),
      surge: await this.isSurgeActive(storeId),
      loyaltyDiscount: true,
      festivalDiscount: await this.getFestivalDiscount(now)
    };
  }

  /**
   * Get pricing tiers for display
   */
  getPricingTiers(basePrice: number): { label: string; price: number; badge?: string }[] {
    return [
      { label: 'Regular', price: basePrice },
      { label: 'Happy Hour', price: Math.round(basePrice * 0.7), badge: '30% OFF' },
      { label: 'Peak Hour', price: Math.round(basePrice * 1.3), badge: 'Busy Pricing' }
    ];
  }

  private isHappyHour(time: Date): boolean {
    const hour = time.getHours();
    return hour >= 15 && hour < 18;
  }

  private async isSurgeActive(storeId: string): Promise<boolean> {
    // Check current demand
    const demand = await this.getCurrentDemand(storeId);
    return demand > 80;
  }

  private async getCurrentDemand(storeId: string): Promise<number> {
    // In production: calculate from orders
    return 50;
  }

  private async getFestivalDiscount(date: Date): Promise<string | undefined> {
    const festivals = ['2026-01-01', '2026-08-15', '2026-10-31', '2026-12-25'];
    const dateStr = date.toISOString().split('T')[0];

    if (festivals.includes(dateStr)) {
      return 'Festival special - 20% off';
    }
    return undefined;
  }

  private getNextPriceChange(time: Date): Date {
    const next = new Date(time);
    next.setMinutes(0);
    next.setSeconds(0);
    next.setHours(next.getHours() + 1);
    return next;
  }

  private async getBasePrice(itemId: string): Promise<number> {
    // In production: query database
    return 199;
  }
}

export const restaurantPricing = new RestaurantPricing();
