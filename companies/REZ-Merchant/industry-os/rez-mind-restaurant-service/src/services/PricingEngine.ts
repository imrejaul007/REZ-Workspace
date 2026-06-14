import { getHour, getDayOfWeek, isWeekend } from 'date-fns';

export interface PricingConfig {
  basePrice: number;
  peakHourMultiplier: number;
  weekendMultiplier: number;
  weatherMultiplier: number;
  demandMultiplier: number;
  minPrice: number;
  maxPrice: number;
}

export interface PriceCalculation {
  originalPrice: number;
  finalPrice: number;
  appliedMultipliers: {
    peakHour: number;
    weekend: number;
    weather: number;
    demand: number;
  };
  breakdown: {
    peakHourSavings?: number;
    weekendSurcharge?: number;
    weatherAdjustment?: number;
    demandAdjustment?: number;
  };
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  popularityScore: number;
  preparationTime: number;
  ingredients: string[];
  calories?: number;
}

export interface WeatherData {
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  temperature: number;
  humidity: number;
}

export interface DemandLevel {
  level: 'low' | 'medium' | 'high' | 'critical';
  multiplier: number;
}

const DEFAULT_CONFIG: PricingConfig = {
  basePrice: 0,
  peakHourMultiplier: 1.25,
  weekendMultiplier: 1.15,
  weatherMultiplier: 1.1,
  demandMultiplier: 1.2,
  minPrice: 0,
  maxPrice: 10000,
};

export class PricingEngine {
  private config: PricingConfig;
  private peakHours: Set<number>;
  private competitorPrices: Map<string, number>;

  constructor(config: Partial<PricingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.peakHours = new Set([11, 12, 13, 18, 19, 20, 21]);
    this.competitorPrices = new Map();
  }

  /**
   * Calculate dynamic price for a menu item based on multiple factors
   */
  calculatePrice(
    item: MenuItem,
    date: Date = new Date(),
    weather?: WeatherData,
    demandLevel: DemandLevel = { level: 'medium', multiplier: 1.0 }
  ): PriceCalculation {
    const multipliers = {
      peakHour: this.isPeakHour(date) ? this.config.peakHourMultiplier : 1.0,
      weekend: isWeekend(date) ? this.config.weekendMultiplier : 1.0,
      weather: weather ? this.getWeatherMultiplier(weather) : 1.0,
      demand: demandLevel.multiplier,
    };

    const combinedMultiplier =
      multipliers.peakHour *
      multipliers.weekend *
      multipliers.weather *
      multipliers.demand;

    let finalPrice = Math.round(item.basePrice * combinedMultiplier * 100) / 100;

    // Apply price bounds
    finalPrice = Math.max(this.config.minPrice, Math.min(this.config.maxPrice, finalPrice));

    const breakdown = {
      peakHourSavings:
        multipliers.peakHour < 1
          ? Math.round((1 - multipliers.peakHour) * item.basePrice * 100) / 100
          : undefined,
      weekendSurcharge:
        multipliers.weekend > 1
          ? Math.round((multipliers.weekend - 1) * item.basePrice * 100) / 100
          : undefined,
      weatherAdjustment:
        multipliers.weather !== 1.0
          ? Math.round((multipliers.weather - 1) * item.basePrice * 100) / 100
          : undefined,
      demandAdjustment:
        multipliers.demand !== 1.0
          ? Math.round((multipliers.demand - 1) * item.basePrice * 100) / 100
          : undefined,
    };

    return {
      originalPrice: item.basePrice,
      finalPrice,
      appliedMultipliers: multipliers,
      breakdown,
    };
  }

  /**
   * Determine if current hour is a peak dining hour
   */
  private isPeakHour(date: Date): boolean {
    const hour = getHour(date);
    return this.peakHours.has(hour);
  }

  /**
   * Calculate weather-based price multiplier
   */
  private getWeatherMultiplier(weather: WeatherData): number {
    let multiplier = 1.0;

    // Rainy/stormy weather increases comfort food demand
    if (weather.condition === 'rainy' || weather.condition === 'stormy') {
      multiplier *= this.config.weatherMultiplier;
    }

    // Cold weather increases hot food demand
    if (weather.temperature < 15) {
      multiplier *= 1.05;
    }

    // Hot weather increases cold beverage demand
    if (weather.temperature > 30) {
      multiplier *= 1.08;
    }

    return multiplier;
  }

  /**
   * Set competitor prices for analysis
   */
  setCompetitorPrice(competitorId: string, price: number): void {
    this.competitorPrices.set(competitorId, price);
  }

  /**
   * Get price analysis compared to competitors
   */
  analyzeCompetitorPricing(item: MenuItem): {
    yourPrice: number;
    averageCompetitorPrice: number;
    lowestCompetitorPrice: number;
    highestCompetitorPrice: number;
    pricePosition: 'low' | 'mid' | 'high';
    recommendation: string;
  } {
    const prices = Array.from(this.competitorPrices.values());
    const yourPrice = item.basePrice;

    if (prices.length === 0) {
      return {
        yourPrice,
        averageCompetitorPrice: yourPrice,
        lowestCompetitorPrice: yourPrice,
        highestCompetitorPrice: yourPrice,
        pricePosition: 'mid',
        recommendation: 'No competitor data available',
      };
    }

    const averageCompetitorPrice =
      Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100;
    const lowestCompetitorPrice = Math.min(...prices);
    const highestCompetitorPrice = Math.max(...prices);

    let pricePosition: 'low' | 'mid' | 'high';
    let recommendation: string;

    if (yourPrice < lowestCompetitorPrice) {
      pricePosition = 'low';
      recommendation = 'Consider raising prices slightly - room for margin improvement';
    } else if (yourPrice > highestCompetitorPrice) {
      pricePosition = 'high';
      recommendation = 'Premium positioning - ensure value justification is clear';
    } else {
      pricePosition = 'mid';
      recommendation = 'Competitive pricing - focus on differentiation';
    }

    return {
      yourPrice,
      averageCompetitorPrice,
      lowestCompetitorPrice,
      highestCompetitorPrice,
      pricePosition,
      recommendation,
    };
  }

  /**
   * Generate dynamic pricing for a full menu
   */
  generateMenuPricing(
    menuItems: MenuItem[],
    date: Date = new Date(),
    weather?: WeatherData,
    demandLevel: DemandLevel = { level: 'medium', multiplier: 1.0 }
  ): Map<string, PriceCalculation> {
    const pricingMap = new Map<string, PriceCalculation>();

    for (const item of menuItems) {
      pricingMap.set(item.id, this.calculatePrice(item, date, weather, demandLevel));
    }

    return pricingMap;
  }

  /**
   * Calculate optimal discount for off-peak hours to boost traffic
   */
  calculateOffPeakDiscount(item: MenuItem, targetMarginPercent: number = 0.2): number {
    const hour = getHour(new Date());

    // Define off-peak hours (early lunch, late afternoon, late night)
    const offPeakHours = [10, 14, 15, 16, 22, 23];
    const isOffPeak = offPeakHours.includes(hour) || (!this.peakHours.has(hour) && !isWeekend(new Date()));

    if (!isOffPeak) {
      return 0;
    }

    // Calculate maximum discount while maintaining target margin
    const minAcceptablePrice = item.basePrice * (1 - targetMarginPercent);
    const maxDiscountPercent = ((item.basePrice - minAcceptablePrice) / item.basePrice) * 100;

    // Suggest moderate discount to attract price-sensitive customers
    const suggestedDiscount = Math.min(maxDiscountPercent, 15);
    const discountAmount = Math.round(item.basePrice * (suggestedDiscount / 100) * 100) / 100;

    return discountAmount;
  }

  /**
   * Get pricing strategy based on time and conditions
   */
  getPricingStrategy(date: Date, weather?: WeatherData): {
    strategy: string;
    keyFactors: string[];
    suggestedPromotions: string[];
  } {
    const factors: string[] = [];
    const promotions: string[] = [];

    if (this.isPeakHour(date)) {
      factors.push('Peak dining hours - premium pricing active');
    } else {
      factors.push('Off-peak hours - consider discounts');
      promotions.push('Early bird specials', 'Late afternoon deals');
    }

    if (isWeekend(date)) {
      factors.push('Weekend - elevated demand');
      promotions.push('Weekend family packages');
    }

    if (weather) {
      if (weather.condition === 'rainy' || weather.condition === 'stormy') {
        factors.push('Inclement weather - comfort food focus');
        promotions.push('Warm soup combo deals');
      }
      if (weather.temperature < 15) {
        factors.push('Cold weather - hot beverages priority');
      }
      if (weather.temperature > 30) {
        factors.push('Hot weather - cold drinks promotion');
      }
    }

    return {
      strategy: factors.length > 2 ? 'Premium' : factors.length > 0 ? 'Standard' : 'Discount',
      keyFactors: factors,
      suggestedPromotions: promotions,
    };
  }
}

export const pricingEngine = new PricingEngine();
