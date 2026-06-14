/**
 * Dynamic Pricing Service for ReZ Restaurant OS
 * Implements surge pricing, happy hour, and demand-based pricing
 */

export interface PriceModifier {
  type: 'surge' | 'happy_hour' | 'demand' | 'event' | 'loyalty';
  factor: number;
  reason: string;
  expiresAt?: Date;
}

export interface DynamicPrice {
  itemId: string;
  basePrice: number;
  currentPrice: number;
  modifiers: PriceModifier[];
  validUntil: Date;
}

export interface PricingConfig {
  surgeMultiplier: number;
  happyHourDiscount: number;
  peakHourMultiplier: number;
  loyaltyDiscount: number;
}

/**
 * Dynamic Pricing Service
 * Adjusts menu prices based on demand, time, and events
 */
export class DynamicPricingService {
  private config: PricingConfig = {
    surgeMultiplier: 1.5,      // Max 50% surge
    happyHourDiscount: 0.7,   // 30% off during happy hour
    peakHourMultiplier: 1.3,  // 30% markup during peak hours
    loyaltyDiscount: 0.9       // 10% off for loyalty members
  };

  /**
   * Calculate dynamic price for an item
   */
  async calculatePrice(
    itemId: string,
    basePrice: number,
    context: {
      storeId: string;
      userId?: string;
      isLoyaltyMember?: boolean;
      time?: Date;
    }
  ): Promise<DynamicPrice> {
    const now = context.time || new Date();
    const modifiers: PriceModifier[] = [];

    // Happy Hour (3 PM - 6 PM daily)
    if (this.isHappyHour(now)) {
      modifiers.push({
        type: 'happy_hour',
        factor: this.config.happyHourDiscount,
        reason: 'Happy Hour: 30% off',
        expiresAt: this.getHappyHourEnd()
      });
    }

    // Peak Hours (12-2 PM, 7-9 PM)
    if (this.isPeakHour(now)) {
      modifiers.push({
        type: 'peak_hour',
        factor: this.config.peakHourMultiplier,
        reason: 'Peak hour pricing'
      });
    }

    // Loyalty discount
    if (context.isLoyaltyMember) {
      modifiers.push({
        type: 'loyalty',
        factor: this.config.loyaltyDiscount,
        reason: 'Loyalty member discount'
      });
    }

    // Calculate final price
    let currentPrice = basePrice;
    for (const modifier of modifiers) {
      currentPrice *= modifier.factor;
    }

    return {
      itemId,
      basePrice,
      currentPrice: Math.round(currentPrice * 100) / 100,
      modifiers,
      validUntil: this.getNextPriceChange(now)
    };
  }

  /**
   * Surge pricing during high demand
   */
  async applySurge(
    storeId: string,
    itemId: string,
    basePrice: number,
    demand: number  // 0-100 demand percentage
  ): Promise<DynamicPrice> {
    let surgeFactor = 1;

    if (demand > 80) {
      surgeFactor = 1 + ((demand - 80) / 100);
      surgeFactor = Math.min(surgeFactor, this.config.surgeMultiplier);
    }

    return {
      itemId,
      basePrice,
      currentPrice: Math.round(basePrice * surgeFactor * 100) / 100,
      modifiers: [{
        type: 'demand',
        factor: surgeFactor,
        reason: `High demand surge (${demand}% occupancy)`
      }],
      validUntil: this.getNextPriceChange(new Date())
    };
  }

  /**
   * Event-based pricing (festivals, special occasions)
   */
  async applyEventPricing(
    itemId: string,
    basePrice: number,
    event: { name: string; discount: number; multiplier?: number }
  ): Promise<DynamicPrice> {
    const factor = event.multiplier || (1 - event.discount / 100);

    return {
      itemId,
      basePrice,
      currentPrice: Math.round(basePrice * factor * 100) / 100,
      modifiers: [{
        type: 'event',
        factor,
        reason: event.name
      }],
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  /**
   * Time-based pricing helper
   */
  private isHappyHour(time: Date): boolean {
    const hour = time.getHours();
    return hour >= 15 && hour < 18;  // 3 PM - 6 PM
  }

  private isPeakHour(time: Date): boolean {
    const hour = time.getHours();
    return (hour >= 12 && hour < 14) || (hour >= 19 && hour < 21);
  }

  private getHappyHourEnd(): Date {
    const end = new Date();
    end.setHours(18, 0, 0, 0);
    return end;
  }

  private getNextPriceChange(time: Date): Date {
    const next = new Date(time);
    next.setMinutes(0);
    next.setSeconds(0);
    next.setHours(next.getHours() + 1);
    return next;
  }

  /**
   * Get pricing tiers for menu display
   */
  getPricingTiers(basePrice: number): { label: string; price: number; badge?: string }[] {
    return [
      { label: 'Regular', price: basePrice },
      { label: 'Happy Hour', price: basePrice * this.config.happyHourDiscount, badge: '30% OFF' },
      { label: 'Peak Hour', price: basePrice * this.config.peakHourMultiplier, badge: 'Busy Pricing' }
    ];
  }

  /**
   * Configure pricing rules
   */
  configure(config: Partial<PricingConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const dynamicPricing = new DynamicPricingService();
