export class DynamicPricingService {
  private occupancyThresholds = {
    low: 0.4,
    medium: 0.7,
    high: 0.85,
    critical: 0.95,
  };

  private surgeMultipliers = {
    weekday: 1.0,
    weekend: 1.25,
    holiday: 1.5,
  };

  private leadTimeFactors = {
    sameDay: 1.3,
    dayBefore: 1.2,
    twoDays: 1.1,
    week: 1.0,
    month: 0.95,
    offPeak: 0.9,
  };

  async calculateRate(params: {
    hotelId: string;
    roomTypeId: string;
    checkIn: Date;
    checkOut: Date;
    occupancy?: number;
    competitorRates?: number[];
    specialEvents?: string[];
    basePrice?: number;
  }): Promise<{
    basePrice: number;
    finalPrice: number;
    currency: string;
    breakdown: {
      baseRate: number;
      occupancyAdjustment: number;
      leadTimeAdjustment: number;
      dayOfWeekAdjustment: number;
      competitorAdjustment: number;
      eventAdjustment: number;
    };
  }> {
    const basePrice = params.basePrice || 3000;
    const occupancy = params.occupancy || 0.5;

    // Calculate occupancy surge
    const occupancyMultiplier = this.getOccupancyMultiplier(occupancy);

    // Lead time adjustment
    const leadTimeDays = this.getLeadTimeDays(params.checkIn);
    const leadTimeMultiplier = this.getLeadTimeMultiplier(leadTimeDays);

    // Day of week adjustment
    const dayOfWeekMultiplier = this.getDayOfWeekMultiplier(params.checkIn);

    // Competitor adjustment
    const competitorAdjustment = this.getCompetitorAdjustment(params.competitorRates || [], basePrice);

    // Event adjustment
    const eventMultiplier = this.getEventMultiplier(params.specialEvents || []);

    // Calculate final price
    let finalPrice = basePrice;
    finalPrice *= occupancyMultiplier;
    finalPrice *= leadTimeMultiplier;
    finalPrice *= dayOfWeekMultiplier;
    finalPrice *= (1 + competitorAdjustment);
    finalPrice *= eventMultiplier;

    // Ensure minimum price (50% of base) and maximum (3x base)
    finalPrice = Math.max(basePrice * 0.5, Math.min(basePrice * 3, finalPrice));

    return {
      basePrice,
      finalPrice: Math.round(finalPrice * 100) / 100,
      currency: 'INR',
      breakdown: {
        baseRate: basePrice,
        occupancyAdjustment: occupancyMultiplier - 1,
        leadTimeAdjustment: leadTimeMultiplier - 1,
        dayOfWeekAdjustment: dayOfWeekMultiplier - 1,
        competitorAdjustment,
        eventAdjustment: eventMultiplier - 1,
      },
    };
  }

  private getOccupancyMultiplier(occupancy: number): number {
    if (occupancy >= this.occupancyThresholds.critical) return 1.5;
    if (occupancy >= this.occupancyThresholds.high) return 1.25;
    if (occupancy >= this.occupancyThresholds.medium) return 1.1;
    if (occupancy >= this.occupancyThresholds.low) return 1.0;
    return 0.9; // Discount when low occupancy
  }

  private getLeadTimeMultiplier(days: number): number {
    if (days <= 0) return this.leadTimeFactors.sameDay;
    if (days <= 1) return this.leadTimeFactors.dayBefore;
    if (days <= 2) return this.leadTimeFactors.twoDays;
    if (days <= 7) return this.leadTimeFactors.week;
    if (days <= 30) return this.leadTimeFactors.month;
    return this.leadTimeFactors.offPeak;
  }

  private getDayOfWeekMultiplier(date: Date): number {
    const day = date.getDay();
    // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) {
      return this.surgeMultipliers.weekend;
    }
    return this.surgeMultipliers.weekday;
  }

  private getCompetitorAdjustment(competitorRates: number[], basePrice: number): number {
    if (competitorRates.length === 0) return 0;

    const avgCompetitor = competitorRates.reduce((a, b) => a + b, 0) / competitorRates.length;
    const diff = (avgCompetitor - basePrice) / basePrice;

    // Match up to 10% of competitor rates
    return Math.max(-0.1, Math.min(0.1, diff * 0.5));
  }

  private getEventMultiplier(events: string[]): number {
    if (events.length === 0) return 1.0;

    // Major events increase price
    const multipliers = {
      festival: 1.3,
      conference: 1.2,
      concert: 1.25,
      sports: 1.15,
      wedding: 1.1,
      holiday: 1.4,
    };

    let maxMultiplier = 1.0;
    for (const event of events) {
      const mult = multipliers[event as keyof typeof multipliers] || 1.0;
      maxMultiplier = Math.max(maxMultiplier, mult);
    }

    return maxMultiplier;
  }

  private getLeadTimeDays(checkIn: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(checkIn);
    checkInDate.setHours(0, 0, 0, 0);

    return Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
}
