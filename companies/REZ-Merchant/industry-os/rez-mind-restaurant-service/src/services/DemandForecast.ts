import { getHour, getDayOfWeek, startOfWeek, addDays, format } from 'date-fns';

export interface ForecastConfig {
  historyDays: number;
  forecastHours: number;
  confidenceThreshold: number;
}

export interface HistoricalData {
  date: Date;
  hour: number;
  orders: number;
  revenue: number;
  avgOrderValue: number;
  peakHour: boolean;
  weekend: boolean;
}

export interface DemandForecast {
  timestamp: Date;
  predictedOrders: number;
  predictedRevenue: number;
  confidence: number;
  factors: ForecastFactor[];
  demandLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface ForecastFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
}

export interface HourlyForecast {
  hour: number;
  date: Date;
  forecasts: DemandForecast[];
}

export interface WeeklyForecast {
  weekStart: Date;
  dailyForecasts: DailyForecast[];
  totalPredictedOrders: number;
  totalPredictedRevenue: number;
  peakDays: { day: string; orders: number }[];
}

export interface DailyForecast {
  date: Date;
  dayName: string;
  predictedOrders: number;
  predictedRevenue: number;
  isWeekend: boolean;
  hourlyBreakdown: { hour: number; predictedOrders: number }[];
}

export interface WeatherImpact {
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  temperature: number;
  impactOnDemand: number; // percentage change
  affectedCategories: string[];
}

const DEFAULT_CONFIG: ForecastConfig = {
  historyDays: 30,
  forecastHours: 24,
  confidenceThreshold: 0.7,
};

export class DemandForecastService {
  private config: ForecastConfig;
  private historicalData: HistoricalData[];
  private weatherForecasts: Map<string, WeatherImpact>;

  constructor(config: Partial<ForecastConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.historicalData = [];
    this.weatherForecasts = new Map();
  }

  /**
   * Load historical order data for pattern analysis
   */
  loadHistoricalData(data: HistoricalData[]): void {
    this.historicalData = data.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Set weather forecast for impact analysis
   */
  setWeatherForecast(date: Date, weather: WeatherImpact): void {
    const key = format(date, 'yyyy-MM-dd');
    this.weatherForecasts.set(key, weather);
  }

  /**
   * Generate demand forecast for a specific time
   */
  forecast(date: Date, weather?: WeatherImpact): DemandForecast {
    const hour = getHour(date);
    const dayOfWeek = getDayOfWeek(date);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Calculate baseline from historical data
    const baseline = this.getBaselineForTimeSlot(date);
    const weatherImpact = this.calculateWeatherImpact(weather);
    const seasonalFactor = this.calculateSeasonalFactor(date);

    // Predict orders
    const baseOrders = baseline?.orders || 50;
    let predictedOrders = Math.round(
      baseOrders * weatherImpact.impactOnDemand * seasonalFactor
    );

    // Apply peak hour multiplier
    if (this.isPeakHour(hour)) {
      predictedOrders = Math.round(predictedOrders * 1.5);
    }

    // Calculate predicted revenue
    const avgOrderValue = baseline?.avgOrderValue || 350;
    const predictedRevenue = Math.round(predictedOrders * avgOrderValue * 100) / 100;

    // Calculate confidence
    const confidence = this.calculateConfidence(date, weather);

    // Determine demand level
    const demandLevel = this.getDemandLevel(predictedOrders, baseOrders);

    // Generate factors and recommendations
    const factors = this.analyzeFactors(date, weather, baseline);
    const recommendations = this.generateRecommendations(
      predictedOrders,
      demandLevel,
      factors
    );

    return {
      timestamp: date,
      predictedOrders,
      predictedRevenue,
      confidence,
      demandLevel,
      factors,
      recommendations,
    };
  }

  /**
   * Generate hourly forecast for a specific day
   */
  forecastDay(date: Date, weather?: WeatherImpact): HourlyForecast {
    const forecasts: DemandForecast[] = [];
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    for (let hour = 6; hour <= 23; hour++) {
      const forecastTime = new Date(startOfDay);
      forecastTime.setHours(hour);

      const hourlyForecast = this.forecast(forecastTime, weather);
      forecasts.push(hourlyForecast);
    }

    return {
      hour: getHour(new Date()),
      date,
      forecasts,
    };
  }

  /**
   * Generate weekly forecast with daily breakdowns
   */
  forecastWeek(startDate: Date, weatherForecasts?: WeatherImpact[]): WeeklyForecast {
    const dailyForecasts: DailyForecast[] = [];
    const weekStart = startOfWeek(startDate);

    let totalPredictedOrders = 0;
    let totalPredictedRevenue = 0;
    const peakDays: { day: string; orders: number }[] = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const hourlyBreakdown: { hour: number; predictedOrders: number }[] = [];

      for (let hour = 6; hour <= 23; hour++) {
        const forecastTime = new Date(date);
        forecastTime.setHours(hour);
        const forecast = this.forecast(forecastTime);
        hourlyBreakdown.push({ hour, predictedOrders: forecast.predictedOrders });
      }

      const dayTotal = hourlyBreakdown.reduce((sum, h) => sum + h.predictedOrders, 0);
      const avgOrderValue = 350;
      const dayRevenue = dayTotal * avgOrderValue;

      dailyForecasts.push({
        date,
        dayName: format(date, 'EEEE'),
        predictedOrders: dayTotal,
        predictedRevenue: dayRevenue,
        isWeekend: getDayOfWeek(date) === 0 || getDayOfWeek(date) === 6,
        hourlyBreakdown,
      });

      totalPredictedOrders += dayTotal;
      totalPredictedRevenue += dayRevenue;

      if (dayTotal > 0) {
        peakDays.push({ day: format(date, 'EEEE'), orders: dayTotal });
      }
    }

    peakDays.sort((a, b) => b.orders - a.orders);

    return {
      weekStart,
      dailyForecasts,
      totalPredictedOrders,
      totalPredictedRevenue: Math.round(totalPredictedRevenue * 100) / 100,
      peakDays: peakDays.slice(0, 3),
    };
  }

  /**
   * Get historical baseline for a specific time slot
   */
  private getBaselineForTimeSlot(date: Date): HistoricalData | null {
    const hour = getHour(date);
    const dayOfWeek = getDayOfWeek(date);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Find matching historical records
    const matches = this.historicalData.filter((h) => {
      return h.hour === hour && h.weekend === isWeekend;
    });

    if (matches.length === 0) {
      // Return overall average if no exact match
      const overallAvg = this.historicalData.reduce(
        (acc, h) => ({
          orders: acc.orders + h.orders / this.historicalData.length,
          revenue: acc.revenue + h.revenue / this.historicalData.length,
        }),
        { orders: 50, revenue: 17500 }
      );
      return {
        date,
        hour,
        orders: overallAvg.orders,
        revenue: overallAvg.revenue,
        avgOrderValue: overallAvg.revenue / overallAvg.orders,
        peakHour: this.isPeakHour(hour),
        weekend: isWeekend,
      };
    }

    // Calculate average from matches
    const avg = matches.reduce(
      (acc, h) => ({
        orders: acc.orders + h.orders / matches.length,
        revenue: acc.revenue + h.revenue / matches.length,
      }),
      { orders: 0, revenue: 0 }
    );

    return {
      date,
      hour,
      orders: Math.round(avg.orders),
      revenue: avg.revenue,
      avgOrderValue: avg.revenue / avg.orders,
      peakHour: this.isPeakHour(hour),
      weekend: isWeekend,
    };
  }

  /**
   * Check if hour is peak dining time
   */
  private isPeakHour(hour: number): boolean {
    return [11, 12, 13, 18, 19, 20, 21].includes(hour);
  }

  /**
   * Calculate weather impact on demand
   */
  private calculateWeatherImpact(weather?: WeatherImpact): WeatherImpact {
    if (!weather) {
      return {
        condition: 'sunny',
        temperature: 25,
        impactOnDemand: 1.0,
        affectedCategories: [],
      };
    }

    let impact = 1.0;
    const affectedCategories: string[] = [];

    switch (weather.condition) {
      case 'rainy':
      case 'stormy':
        impact = 0.7;
        affectedCategories.push('comfort food', 'home delivery', 'soup');
        break;
      case 'snowy':
        impact = 0.85;
        affectedCategories.push('hot beverages', 'warm food');
        break;
      case 'cloudy':
        impact = 0.95;
        break;
      case 'sunny':
        if (weather.temperature > 35) {
          impact = 0.8;
          affectedCategories.push('cold beverages', 'ice cream');
        } else if (weather.temperature < 20) {
          impact = 1.1;
          affectedCategories.push('warm food');
        } else {
          impact = 1.05;
          affectedCategories.push('outdoor dining');
        }
        break;
    }

    return {
      ...weather,
      impactOnDemand: impact,
      affectedCategories,
    };
  }

  /**
   * Calculate seasonal factor based on time of year
   */
  private calculateSeasonalFactor(date: Date): number {
    const month = date.getMonth();
    let factor = 1.0;

    // Holiday seasons
    if (month === 10 || month === 11) {
      factor = 1.3; // November-December festive season
    }
    if (month === 3 || month === 4) {
      factor = 1.2; // April festivals
    }
    if (month === 6 || month === 7) {
      factor = 0.9; // Summer slowdown
    }

    return factor;
  }

  /**
   * Calculate confidence level for forecast
   */
  private calculateConfidence(date: Date, weather?: WeatherImpact): number {
    let confidence = 0.7;

    // More data = higher confidence
    if (this.historicalData.length > 100) {
      confidence += 0.1;
    }

    // Weather forecast reduces confidence
    if (weather) {
      confidence -= 0.1;
    }

    // Peak hours have better prediction accuracy
    if (this.isPeakHour(getHour(date))) {
      confidence += 0.05;
    }

    return Math.max(0.5, Math.min(confidence, 0.95));
  }

  /**
   * Determine demand level category
   */
  private getDemandLevel(
    predictedOrders: number,
    baselineOrders: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = predictedOrders / baselineOrders;

    if (ratio >= 1.5) return 'critical';
    if (ratio >= 1.2) return 'high';
    if (ratio >= 0.8) return 'medium';
    return 'low';
  }

  /**
   * Analyze factors affecting demand
   */
  private analyzeFactors(
    date: Date,
    weather?: WeatherImpact,
    baseline?: HistoricalData | null
  ): ForecastFactor[] {
    const factors: ForecastFactor[] = [];
    const hour = getHour(date);

    // Peak hour factor
    if (this.isPeakHour(hour)) {
      factors.push({
        name: 'Peak dining hours',
        impact: 'positive',
        weight: 0.3,
      });
    }

    // Weekend factor
    const dayOfWeek = getDayOfWeek(date);
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      factors.push({
        name: 'Weekend boost',
        impact: 'positive',
        weight: 0.2,
      });
    }

    // Weather factor
    if (weather) {
      const impact =
        weather.impactOnDemand > 1.0 ? 'positive' : weather.impactOnDemand < 1.0 ? 'negative' : 'neutral';
      factors.push({
        name: `${weather.condition} weather (${weather.temperature}C)`,
        impact,
        weight: Math.abs(weather.impactOnDemand - 1.0) * 2,
      });
    }

    // Historical performance
    if (baseline) {
      factors.push({
        name: 'Historical demand patterns',
        impact: 'neutral',
        weight: 0.25,
      });
    }

    return factors;
  }

  /**
   * Generate recommendations based on forecast
   */
  private generateRecommendations(
    predictedOrders: number,
    demandLevel: 'low' | 'medium' | 'high' | 'critical',
    factors: ForecastFactor[]
  ): string[] {
    const recommendations: string[] = [];

    if (demandLevel === 'low') {
      recommendations.push('Consider promoting off-peak specials');
      recommendations.push('Focus on delivery orders');
      recommendations.push('Implement happy hour discounts');
    }

    if (demandLevel === 'high' || demandLevel === 'critical') {
      recommendations.push('Prepare extra inventory');
      recommendations.push('Ensure sufficient staff');
      recommendations.push('Consider pre-order system');
      recommendations.push('Implement queue management');
    }

    const hasWeatherNegative = factors.some(
      (f) => f.name.includes('weather') && f.impact === 'negative'
    );
    if (hasWeatherNegative) {
      recommendations.push('Boost delivery capacity for rainy day orders');
      recommendations.push('Feature comfort food items');
    }

    const isPeakHour = factors.some((f) => f.name.includes('Peak'));
    if (isPeakHour && demandLevel === 'medium') {
      recommendations.push('Good time for premium menu promotions');
    }

    return recommendations;
  }

  /**
   * Get demand insights summary
   */
  getInsightsSummary(): {
    averageOrdersPerDay: number;
    busiestDay: string;
    busiestHour: number;
    averageRevenue: number;
    peakSeason: string;
    slowSeason: string;
  } {
    if (this.historicalData.length === 0) {
      return {
        averageOrdersPerDay: 0,
        busiestDay: 'Unknown',
        busiestHour: 12,
        averageRevenue: 0,
        peakSeason: 'Unknown',
        slowSeason: 'Unknown',
      };
    }

    // Calculate daily averages
    const dailyTotals = new Map<string, number>();
    for (const data of this.historicalData) {
      const dayName = format(data.date, 'EEEE');
      dailyTotals.set(dayName, (dailyTotals.get(dayName) || 0) + data.orders);
    }

    let busiestDay = 'Unknown';
    let maxOrders = 0;
    for (const [day, orders] of dailyTotals) {
      if (orders > maxOrders) {
        maxOrders = orders;
        busiestDay = day;
      }
    }

    // Calculate hourly averages
    const hourlyTotals = new Map<number, number>();
    for (const data of this.historicalData) {
      hourlyTotals.set(data.hour, (hourlyTotals.get(data.hour) || 0) + data.orders);
    }

    let busiestHour = 12;
    let maxHourOrders = 0;
    for (const [hour, orders] of hourlyTotals) {
      if (orders > maxHourOrders) {
        maxHourOrders = orders;
        busiestHour = hour;
      }
    }

    const totalOrders = this.historicalData.reduce((sum, d) => sum + d.orders, 0);
    const totalRevenue = this.historicalData.reduce((sum, d) => sum + d.revenue, 0);

    return {
      averageOrdersPerDay: Math.round(totalOrders / this.historicalData.length),
      busiestDay,
      busiestHour,
      averageRevenue: Math.round((totalRevenue / this.historicalData.length) * 100) / 100,
      peakSeason: 'November-December',
      slowSeason: 'June-July',
    };
  }
}

export const demandForecastService = new DemandForecastService();
