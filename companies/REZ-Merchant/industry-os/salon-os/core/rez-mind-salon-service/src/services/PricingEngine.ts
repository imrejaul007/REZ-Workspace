import { z } from 'zod';
import { format, getDayOfYear, isWeekend } from 'date-fns';
import { logger } from '../utils/logger';

// Helper function to check if a time is peak hour
function checkIsPeakHour(hour: number): boolean {
  const peakHours = [9, 10, 11, 14, 15, 16, 17, 18];
  return peakHours.includes(hour);
}

// Request/Response schemas
const PricingRequestSchema = z.object({
  serviceId: z.string(),
  stylistId: z.string().optional(),
  appointmentDate: z.string().datetime(),
  customerId: z.string().optional(),
  basePrice: z.number().positive(),
});

const CompetitorPricingSchema = z.object({
  competitorId: z.string(),
  serviceId: z.string(),
  price: z.number().positive(),
  location: z.string().optional(),
  timestamp: z.string().datetime(),
});

export type PricingRequest = z.infer<typeof PricingRequestSchema>;
export type CompetitorPricing = z.infer<typeof CompetitorPricingSchema>;

interface PriceFactors {
  timeMultiplier: number;
  demandMultiplier: number;
  competitorAdjustment: number;
  stylistPremium: number;
  loyaltyDiscount: number;
}

interface PricingResult {
  originalPrice: number;
  finalPrice: number;
  factors: PriceFactors;
  confidence: number;
  validUntil: string;
}

export class PricingEngine {
  private basePriceCache: Map<string, number> = new Map();
  private competitorPrices: Map<string, CompetitorPricing[]> = new Map();

  constructor() {
    this.initializePriceCache();
  }

  private initializePriceCache(): void {
    // Default service base prices
    this.basePriceCache.set('haircut', 30);
    this.basePriceCache.set('coloring', 80);
    this.basePriceCache.set('styling', 40);
    this.basePriceCache.set('treatment', 60);
    this.basePriceCache.set('manicure', 25);
    this.basePriceCache.set('pedicure', 30);
    this.basePriceCache.set('facial', 50);
    this.basePriceCache.set('massage', 70);
  }

  /**
   * Calculate dynamic price based on multiple factors
   */
  async calculatePrice(request: PricingRequest): Promise<PricingResult> {
    try {
      const validated = PricingRequestSchema.parse(request);
      const appointmentDate = new Date(validated.appointmentDate);
      const factors = await this.analyzePriceFactors(validated, appointmentDate);

      // Combine multipliers
      const combinedMultiplier =
        factors.timeMultiplier *
        factors.demandMultiplier *
        factors.stylistPremium *
        factors.loyaltyDiscount;

      // Apply competitor adjustment
      let finalPrice = validated.basePrice * combinedMultiplier;
      finalPrice = finalPrice * (1 + factors.competitorAdjustment);

      // Round to 2 decimal places
      finalPrice = Math.round(finalPrice * 100) / 100;

      return {
        originalPrice: validated.basePrice,
        finalPrice,
        factors,
        confidence: this.calculateConfidence(factors),
        validUntil: this.getValidUntil(appointmentDate),
      };
    } catch (error) {
      logger.error('Pricing calculation error:', error);
      throw error;
    }
  }

  /**
   * Analyze all price factors
   */
  private async analyzePriceFactors(
    request: PricingRequest,
    date: Date
  ): Promise<PriceFactors> {
    const [timeMultiplier, isPeak] = this.calculateTimeMultiplier(date);
    const demandMultiplier = await this.calculateDemandMultiplier(
      request.serviceId,
      date
    );
    const competitorAdjustment = await this.getCompetitorAdjustment(
      request.serviceId
    );
    const stylistPremium = await this.getStylistPremium(request.stylistId);
    const loyaltyDiscount = await this.getLoyaltyDiscount(request.customerId);

    return {
      timeMultiplier,
      demandMultiplier,
      competitorAdjustment,
      stylistPremium,
      loyaltyDiscount,
    };
  }

  /**
   * Calculate time-based multiplier (peak hours, weekends)
   */
  private calculateTimeMultiplier(date: Date): [number, boolean] {
    const hour = date.getHours();
    const isWeekendDay = isWeekend(date);

    let multiplier = 1.0;
    let isPeak = false;

    // Weekend premium
    if (isWeekendDay) {
      multiplier *= 1.15;
    }

    // Peak hours (10am-2pm, 5pm-8pm)
    if ((hour >= 10 && hour <= 14) || (hour >= 17 && hour <= 20)) {
      multiplier *= 1.2;
      isPeak = true;
    }

    // Off-peak discount (9am-10am, 2pm-5pm, after 8pm)
    if ((hour >= 9 && hour < 10) || (hour > 14 && hour < 17) || hour > 20) {
      multiplier *= 0.85;
    }

    // Very slow hours discount
    if (hour < 9 || hour > 21) {
      multiplier *= 0.7;
    }

    return [multiplier, isPeak];
  }

  /**
   * Calculate demand-based multiplier using historical data
   */
  private async calculateDemandMultiplier(
    serviceId: string,
    date: Date
  ): Promise<number> {
    // Simulate demand calculation based on historical patterns
    const dayOfYear = getDayOfYear(date);
    const season = this.getSeason(dayOfYear);

    let multiplier = 1.0;

    // Seasonal adjustments
    switch (season) {
      case 'summer':
        // Higher demand for cuts, lower for treatments
        if (['haircut', 'coloring'].includes(serviceId)) {
          multiplier *= 1.15;
        }
        break;
      case 'winter':
        // Higher demand for treatments, facials
        if (['treatment', 'facial', 'massage'].includes(serviceId)) {
          multiplier *= 1.2;
        }
        break;
      case 'spring':
        // Wedding season - higher coloring and styling
        if (['coloring', 'styling'].includes(serviceId)) {
          multiplier *= 1.1;
        }
        break;
    }

    // Simulate real-time demand from Redis/cache
    const realTimeDemand = await this.getRealTimeDemand(serviceId, date);
    multiplier *= realTimeDemand;

    return Math.max(0.7, Math.min(1.5, multiplier));
  }

  /**
   * Get real-time demand factor from cache/Redis
   */
  private async getRealTimeDemand(serviceId: string, date: Date): Promise<number> {
    // In production, this would query Redis for current booking patterns
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    // Simulate based on typical patterns
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend - higher demand
      return 1.2;
    }
    if (dayOfWeek === 1) {
      // Monday - lower after weekend
      return 0.85;
    }
    return 1.0;
  }

  /**
   * Determine season from day of year
   */
  private getSeason(dayOfYear: number): 'spring' | 'summer' | 'fall' | 'winter' {
    if (dayOfYear >= 79 && dayOfYear < 172) return 'spring';
    if (dayOfYear >= 172 && dayOfYear < 265) return 'summer';
    if (dayOfYear >= 265 && dayOfYear < 355) return 'fall';
    return 'winter';
  }

  /**
   * Get competitor-based price adjustment
   */
  private async getCompetitorAdjustment(serviceId: string): Promise<number> {
    const competitors = this.competitorPrices.get(serviceId) || [];
    if (competitors.length === 0) return 0;

    const avgCompetitorPrice =
      competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length;
    const ourBasePrice = this.basePriceCache.get(serviceId) || 50;

    // Adjust to be competitive (within 10% of market)
    const diff = (avgCompetitorPrice - ourBasePrice) / ourBasePrice;

    // If competitors are 10%+ cheaper, adjust down
    if (diff < -0.1) return -0.05;
    // If competitors are 10%+ expensive, we can price higher
    if (diff > 0.1) return 0.05;

    return diff * 0.5;
  }

  /**
   * Get stylist premium based on experience/skill level
   */
  private async getStylistPremium(stylistId?: string): Promise<number> {
    if (!stylistId) return 1.0;

    // Simulate stylist levels
    const stylistLevels: Record<string, number> = {
      senior: 1.25,
      master: 1.4,
      trainee: 0.85,
    };

    // In production, query stylist profile
    const level = stylistLevels[stylistId] || 1.0;
    return level;
  }

  /**
   * Get loyalty discount for returning customers
   */
  private async getLoyaltyDiscount(customerId?: string): Promise<number> {
    if (!customerId) return 1.0;

    // Simulate loyalty tiers
    const loyaltyTiers: Record<string, number> = {
      bronze: 0.98,
      silver: 0.95,
      gold: 0.9,
      platinum: 0.85,
    };

    // In production, query customer loyalty status
    const tier = loyaltyTiers[customerId] || 1.0;
    return tier;
  }

  /**
   * Calculate confidence score for the price
   */
  private calculateConfidence(factors: PriceFactors): number {
    let confidence = 0.9; // Base confidence

    // Reduce confidence if factors are uncertain
    if (factors.competitorAdjustment === 0) confidence -= 0.1;
    if (factors.stylistPremium === 1.0) confidence -= 0.05;
    if (factors.loyaltyDiscount === 1.0) confidence -= 0.05;

    return Math.round(confidence * 100) / 100;
  }

  /**
   * Get price validity expiration
   */
  private getValidUntil(date: Date): string {
    const validUntil = new Date(date);
    validUntil.setMinutes(validUntil.getMinutes() + 15);
    return validUntil.toISOString();
  }

  /**
   * Update competitor pricing data
   */
  async updateCompetitorPricing(data: CompetitorPricing): Promise<void> {
    const validated = CompetitorPricingSchema.parse(data);
    const existing = this.competitorPrices.get(validated.serviceId) || [];

    // Keep last 100 competitor prices
    existing.push(validated);
    if (existing.length > 100) {
      existing.shift();
    }

    this.competitorPrices.set(validated.serviceId, existing);
    logger.info(`Updated competitor pricing for ${validated.serviceId}`);
  }

  /**
   * Get price recommendations for all services
   */
  async getPriceRecommendations(): Promise<Record<string, number>> {
    const recommendations: Record<string, number> = {};

    for (const [serviceId, basePrice] of this.basePriceCache.entries()) {
      // Calculate recommended price with typical factors
      const recommended = basePrice * 1.05; // 5% above base as default
      recommendations[serviceId] = Math.round(recommended * 100) / 100;
    }

    return recommendations;
  }

  /**
   * Analyze competitor pricing
   */
  async analyzeCompetitorPricing(serviceId: string): Promise<{
    ourPrice: number;
    avgCompetitorPrice: number;
    minCompetitorPrice: number;
    maxCompetitorPrice: number;
    recommendation: string;
  }> {
    const ourPrice = this.basePriceCache.get(serviceId) || 50;
    const competitors = this.competitorPrices.get(serviceId) || [];

    if (competitors.length === 0) {
      return {
        ourPrice,
        avgCompetitorPrice: ourPrice,
        minCompetitorPrice: ourPrice,
        maxCompetitorPrice: ourPrice,
        recommendation: 'Insufficient competitor data',
      };
    }

    const prices = competitors.map((c) => c.price);
    const avgCompetitorPrice =
      prices.reduce((a, b) => a + b, 0) / prices.length;
    const minCompetitorPrice = Math.min(...prices);
    const maxCompetitorPrice = Math.max(...prices);

    let recommendation: string;
    if (avgCompetitorPrice > ourPrice * 1.15) {
      recommendation = 'Price competitively - competitors are cheaper';
    } else if (avgCompetitorPrice < ourPrice * 0.85) {
      recommendation = 'Consider price increase - we are below market';
    } else {
      recommendation = 'Price is competitive';
    }

    return {
      ourPrice,
      avgCompetitorPrice,
      minCompetitorPrice,
      maxCompetitorPrice,
      recommendation,
    };
  }
}
