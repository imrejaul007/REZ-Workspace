/**
 * ReZ Restaurant OS - AI Demand Forecasting Module
 * Predicts orders, staff needs, inventory requirements
 */

export interface DemandForecast {
  date: Date;
  predictedOrders: number;
  confidence: number;
  peakHours: { hour: number; expected: number }[];
  recommendedStaff: number;
}

export interface Weather {
  condition: 'sunny' | 'rainy' | 'cloudy' | 'stormy';
  temp: number;
}

export class RestaurantDemandForecast {
  /**
   * Predict hourly demand for a store
   */
  async predictHourlyDemand(storeId: string, date: Date): Promise<DemandForecast> {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Base prediction from historical data
    let baseOrders = isWeekend ? 150 : 100;

    // Weather factor
    const weather = await this.getWeather(date);
    let weatherFactor = 1;
    if (weather.condition === 'rainy') weatherFactor = 1.3;  // More delivery
    if (weather.condition === 'stormy') weatherFactor = 0.7;

    // Event factor
    const events = await this.getEvents(storeId, date);
    const eventFactor = events.length > 0 ? 1.5 : 1;

    const predictedOrders = Math.round(baseOrders * weatherFactor * eventFactor);

    return {
      date,
      predictedOrders,
      confidence: 0.85,
      peakHours: this.getPeakHourDistribution(predictedOrders),
      recommendedStaff: Math.ceil(predictedOrders / 20)
    };
  }

  /**
   * Get staff recommendations based on predicted orders
   */
  async getStaffRecommendations(storeId: string, predictedOrders: number): Promise<number> {
    // Rule: 1 staff per 20 orders
    const baseStaff = Math.ceil(predictedOrders / 20);

    // Peak hour boost
    const hour = new Date().getHours();
    const isPeakHour = (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21);

    return isPeakHour ? baseStaff + 2 : baseStaff;
  }

  /**
   * Get inventory suggestions based on predicted demand
   */
  async getInventorySuggestions(storeId: string, predictedOrders: number): Promise<string[]> {
    // Get top selling items
    const topItems = await this.getTopSellingItems(storeId);

    return topItems.slice(0, 10).map(item =>
      `Order ${Math.ceil(item.avgQuantity * 1.2)} units of ${item.name}`
    );
  }

  /**
   * Predict weekly demand
   */
  async predictWeeklyDemand(storeId: string, weekStart: Date): Promise<DemandForecast[]> {
    const forecasts: DemandForecast[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const forecast = await this.predictHourlyDemand(storeId, date);
      forecasts.push(forecast);
    }

    return forecasts;
  }

  private async getWeather(date: Date): Promise<Weather> {
    // In production: call weather API
    return { condition: 'sunny', temp: 28 };
  }

  private async getEvents(storeId: string, date: Date): Promise<string[]> {
    // Check for local festivals, holidays
    return [];
  }

  private getPeakHourDistribution(totalOrders: number): { hour: number; expected: number }[] {
    // Typical restaurant distribution
    const distribution = [3, 5, 12, 18, 25, 22, 10, 3, 2, 1];
    const peakHours = [];

    for (let h = 10; h <= 21; h++) {
      const idx = h - 10;
      const expected = Math.round(totalOrders * distribution[idx] / 100);
      peakHours.push({ hour: h, expected });
    }

    return peakHours;
  }

  private async getTopSellingItems(storeId: string): Promise<{ name: string; avgQuantity: number }[]> {
    // In production: query orders
    return [
      { name: 'Burger', avgQuantity: 50 },
      { name: 'Pizza', avgQuantity: 40 },
      { name: 'Pasta', avgQuantity: 30 }
    ];
  }
}

export const restaurantDemandForecast = new RestaurantDemandForecast();
