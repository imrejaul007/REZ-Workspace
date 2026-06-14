/**
 * Demand Forecasting Service
 * Predicts orders, staffing needs, inventory requirements
 */

export interface Forecast {
  date: Date;
  predictedOrders: number;
  confidence: number;
  peakHours: { hour: number; expected: number }[];
  staff: number;
  inventory: { itemId: string; quantity: number }[];
}

export interface Weather {
  temp: number;
  condition: 'sunny' | 'rainy' | 'cloudy' | 'stormy';
}

/**
 * Demand Forecast Service
 */
export class DemandForecastService {
  /**
   * Predict orders for a day
   */
  async predictDay(storeId: string, date: Date): Promise<Forecast> {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Base predictions
    let baseOrders = isWeekend ? 150 : 100;

    // Get historical average
    const historical = await this.getHistoricalAverage(storeId, dayOfWeek);
    baseOrders = historical?.avg || baseOrders;

    // Weather factor
    const weather = await this.getWeather(date);
    let weatherFactor = 1;
    if (weather.condition === 'rainy') weatherFactor = 1.3; // More delivery orders
    if (weather.condition === 'stormy') weatherFactor = 0.7;

    // Events factor
    const events = await this.getEvents(storeId, date);
    const eventFactor = events.length > 0 ? 1.5 : 1;

    const predictedOrders = Math.round(baseOrders * weatherFactor * eventFactor);

    // Peak hours
    const peakHours = this.getPeakHourDistribution(predictedOrders);

    // Staff recommendation
    const staff = Math.ceil(predictedOrders / 20);

    // Inventory predictions
    const inventory = await this.predictInventory(storeId, predictedOrders);

    return {
      date,
      predictedOrders,
      confidence: 0.85,
      peakHours,
      staff,
      inventory,
    };
  }

  private async getHistoricalAverage(storeId: string, dayOfWeek: number): Promise<{ avg: number } | null> {
    // Mock implementation
    return { avg: 100 };
  }

  private async getWeather(date: Date): Promise<Weather> {
    return { temp: 25, condition: 'sunny' };
  }

  private async getEvents(storeId: string, date: Date): Promise<string[]> {
    return [];
  }

  private getPeakHourDistribution(predictedOrders: number): { hour: number; expected: number }[] {
    const distribution: { hour: number; expected: number }[] = [];
    for (let h = 8; h <= 22; h++) {
      let factor = 1;
      if (h >= 12 && h <= 14) factor = 1.5; // Lunch rush
      if (h >= 19 && h <= 21) factor = 1.8; // Dinner rush
      distribution.push({ hour: h, expected: Math.round(predictedOrders * factor * 0.1) });
    }
    return distribution;
  }

  private async predictInventory(storeId: string, predictedOrders: number): Promise<{ itemId: string; quantity: number }[]> {
    // Mock implementation - return empty array
    return [];
  }
}

export const demandForecast = new DemandForecastService();
