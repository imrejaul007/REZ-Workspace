import { DemandTrend, IDemandTrend } from '../models/DemandTrend';
import { Forecast } from '../models/Forecast';
import { logger } from '../utils/logger';
import { forecastRequestsTotal } from '../utils/metrics';

// Trend response interface
export interface TrendResponse {
  success: boolean;
  data?: IDemandTrend[];
  error?: string;
}

// Trend summary interface
export interface TrendSummary {
  eventId: string;
  eventName: string;
  currentTrend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  velocity: number;
  momentum: number;
  averageDemand: number;
  peakDemand: number;
  daysTracked: number;
  signals: {
    social: number;
    search: number;
    ticket: number;
    weather: number;
    competitor: number;
  };
}

// Create trend request
export interface CreateTrendRequest {
  eventId: string;
  eventName: string;
  category: string;
  location: string;
  date: Date;
  actualDemand: number;
  predictedDemand: number;
  signals?: {
    social?: number;
    search?: number;
    ticket?: number;
    weather?: number;
    competitor?: number;
  };
}

// Trend Service
class TrendService {
  /**
   * Get demand trend for an event
   */
  async getTrend(eventId: string, days: number = 30): Promise<TrendResponse> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trends = await DemandTrend.find({
        eventId,
        date: { $gte: startDate }
      })
        .sort({ date: -1 })
        .limit(days);

      if (trends.length === 0) {
        forecastRequestsTotal.inc({ type: 'trend', status: 'not_found' });
        return {
          success: false,
          error: `No trend data found for event ${eventId}`
        };
      }

      forecastRequestsTotal.inc({ type: 'trend', status: 'success' });
      return {
        success: true,
        data: trends
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get trend', { error: errorMessage, eventId });
      forecastRequestsTotal.inc({ type: 'trend', status: 'error' });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get trend summary for an event
   */
  async getTrendSummary(eventId: string, days: number = 30): Promise<{
    success: boolean;
    data?: TrendSummary;
    error?: string;
  }> {
    try {
      const trends = await this.getTrend(eventId, days);

      if (!trends.success || !trends.data || trends.data.length === 0) {
        return {
          success: false,
          error: trends.error || 'No trend data found'
        };
      }

      const sortedTrends = [...trends.data].sort((a, b) => a.date.getTime() - b.date.getTime());

      // Calculate summary metrics
      const demands = sortedTrends.map(t => t.demand.actual);
      const averageDemand = demands.reduce((a, b) => a + b, 0) / demands.length;
      const peakDemand = Math.max(...demands);

      // Calculate velocity (average % change)
      let velocity = 0;
      for (let i = 1; i < sortedTrends.length; i++) {
        const prev = sortedTrends[i - 1].demand.actual;
        const curr = sortedTrends[i].demand.actual;
        if (prev > 0) {
          velocity += ((curr - prev) / prev) * 100;
        }
      }
      velocity = velocity / Math.max(1, sortedTrends.length - 1);

      // Calculate momentum (change in velocity)
      const momentum = this.calculateMomentum(sortedTrends);

      // Determine current trend direction
      const currentTrend = this.determineTrend(sortedTrends);

      // Average signals
      const signals = {
        social: sortedTrends.reduce((a, t) => a + t.signals.social, 0) / sortedTrends.length,
        search: sortedTrends.reduce((a, t) => a + t.signals.search, 0) / sortedTrends.length,
        ticket: sortedTrends.reduce((a, t) => a + t.signals.ticket, 0) / sortedTrends.length,
        weather: sortedTrends.reduce((a, t) => a + t.signals.weather, 0) / sortedTrends.length,
        competitor: sortedTrends.reduce((a, t) => a + t.signals.competitor, 0) / sortedTrends.length
      };

      const summary: TrendSummary = {
        eventId,
        eventName: sortedTrends[0].eventName,
        currentTrend,
        velocity,
        momentum,
        averageDemand,
        peakDemand,
        daysTracked: sortedTrends.length,
        signals
      };

      return {
        success: true,
        data: summary
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get trend summary', { error: errorMessage, eventId });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Create a new trend data point
   */
  async createTrend(request: CreateTrendRequest): Promise<{
    success: boolean;
    data?: IDemandTrend;
    error?: string;
  }> {
    try {
      // Get previous trend for comparison
      const previousTrend = await DemandTrend.findOne({
        eventId: request.eventId
      }).sort({ date: -1 });

      // Calculate variance
      const variance = request.actualDemand - request.predictedDemand;
      const variancePercent = request.predictedDemand > 0
        ? (variance / request.predictedDemand) * 100
        : 0;

      // Calculate trend direction and velocity
      let direction: 'increasing' | 'decreasing' | 'stable' | 'volatile' = 'stable';
      let velocity = 0;
      let momentum = 0;

      if (previousTrend) {
        const prevDemand = previousTrend.demand.actual;
        if (prevDemand > 0) {
          velocity = ((request.actualDemand - prevDemand) / prevDemand) * 100;
        }

        direction = this.determineDirection(velocity);
        momentum = this.calculateMomentum([previousTrend, {
          date: request.date,
          demand: { actual: request.actualDemand, predicted: request.predictedDemand, variance, variancePercent },
          trend: { direction: 'stable', velocity: 0, momentum: 0 },
          signals: request.signals || { social: 50, search: 50, ticket: 50, weather: 50, competitor: 50 },
          historical: previousTrend.historical,
          confidence: 0.5,
          metadata: { dataSources: [], lastUpdated: new Date() },
          eventId: request.eventId,
          eventName: request.eventName,
          category: request.category,
          location: request.location,
          createdAt: new Date(),
          updatedAt: new Date()
        } as unknown as IDemandTrend]);
      }

      // Get historical data
      const historical = await this.getHistoricalData(request.eventId, request.date);

      // Create trend
      const trend = new DemandTrend({
        eventId: request.eventId,
        eventName: request.eventName,
        category: request.category,
        location: request.location,
        date: request.date,
        demand: {
          actual: request.actualDemand,
          predicted: request.predictedDemand,
          variance,
          variancePercent
        },
        historical,
        trend: {
          direction,
          velocity,
          momentum
        },
        signals: request.signals || {
          social: 50,
          search: 50,
          ticket: 50,
          weather: 50,
          competitor: 50
        },
        confidence: this.calculateConfidence(request),
        metadata: {
          dataSources: this.getDataSources(request),
          lastUpdated: new Date()
        }
      });

      await trend.save();

      logger.info('Trend created', {
        eventId: request.eventId,
        date: request.date,
        actualDemand: request.actualDemand
      });

      return {
        success: true,
        data: trend
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to create trend', { error: errorMessage, request });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get category trends
   */
  async getCategoryTrends(category: string, days: number = 30): Promise<{
    success: boolean;
    data?: { date: string; avgDemand: number; avgPredicted: number; count: number }[];
    error?: string;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trends = await DemandTrend.aggregate([
        { $match: { category, date: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            avgDemand: { $avg: '$demand.actual' },
            avgPredicted: { $avg: '$demand.predicted' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      forecastRequestsTotal.inc({ type: 'category_trend', status: 'success' });
      return {
        success: true,
        data: trends
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get category trends', { error: errorMessage, category });
      forecastRequestsTotal.inc({ type: 'category_trend', status: 'error' });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get location trends
   */
  async getLocationTrends(location: string, days: number = 30): Promise<{
    success: boolean;
    data?: { date: string; avgDemand: number; totalDemand: number; count: number }[];
    error?: string;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trends = await DemandTrend.aggregate([
        { $match: { location, date: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            avgDemand: { $avg: '$demand.actual' },
            totalDemand: { $sum: '$demand.actual' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      forecastRequestsTotal.inc({ type: 'location_trend', status: 'success' });
      return {
        success: true,
        data: trends
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get location trends', { error: errorMessage, location });
      forecastRequestsTotal.inc({ type: 'location_trend', status: 'error' });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Calculate momentum from trend data
   */
  private calculateMomentum(trends: IDemandTrend[]): number {
    if (trends.length < 2) return 0;

    const sorted = [...trends].sort((a, b) => a.date.getTime() - b.date.getTime());
    const recent = sorted.slice(-7); // Last 7 days

    if (recent.length < 2) return 0;

    // Calculate velocity for each period
    const velocities: number[] = [];
    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1].demand.actual;
      const curr = recent[i].demand.actual;
      if (prev > 0) {
        velocities.push((curr - prev) / prev);
      }
    }

    if (velocities.length < 2) return 0;

    // Momentum is the change in velocity
    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const recentVelocity = velocities[velocities.length - 1];

    return (recentVelocity - avgVelocity) * 100;
  }

  /**
   * Determine trend direction from sorted trends
   */
  private determineTrend(trends: IDemandTrend[]): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
    if (trends.length < 3) return 'stable';

    const recent = trends.slice(-7);
    const demands = recent.map(t => t.demand.actual);

    // Calculate variance
    const mean = demands.reduce((a, b) => a + b, 0) / demands.length;
    const variance = demands.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / demands.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;

    // Volatile if CV > 0.3
    if (coefficientOfVariation > 0.3) return 'volatile';

    // Calculate overall change
    const firstHalf = demands.slice(0, Math.floor(demands.length / 2));
    const secondHalf = demands.slice(Math.floor(demands.length / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const changePercent = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;

    if (changePercent > 10) return 'increasing';
    if (changePercent < -10) return 'decreasing';
    return 'stable';
  }

  /**
   * Determine direction from velocity
   */
  private determineDirection(velocity: number): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
    if (velocity > 5) return 'increasing';
    if (velocity < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Get historical data for comparison
   */
  private async getHistoricalData(eventId: string, currentDate: Date): Promise<{
    previousDay: number;
    previousWeek: number;
    previousMonth: number;
    sameDayLastYear: number;
  }> {
    const result = {
      previousDay: 0,
      previousWeek: 0,
      previousMonth: 0,
      sameDayLastYear: 0
    };

    try {
      // Previous day
      const prevDay = new Date(currentDate);
      prevDay.setDate(prevDay.getDate() - 1);
      const prevDayTrend = await DemandTrend.findOne({ eventId, date: prevDay });
      if (prevDayTrend) result.previousDay = prevDayTrend.demand.actual;

      // Previous week
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      const prevWeekTrend = await DemandTrend.findOne({ eventId, date: prevWeek });
      if (prevWeekTrend) result.previousWeek = prevWeekTrend.demand.actual;

      // Previous month
      const prevMonth = new Date(currentDate);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      const prevMonthTrend = await DemandTrend.findOne({ eventId, date: prevMonth });
      if (prevMonthTrend) result.previousMonth = prevMonthTrend.demand.actual;

      // Same day last year
      const lastYear = new Date(currentDate);
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      const lastYearTrend = await DemandTrend.findOne({ eventId, date: lastYear });
      if (lastYearTrend) result.sameDayLastYear = lastYearTrend.demand.actual;
    } catch (error) {
      logger.warn('Failed to get historical data', { eventId, error });
    }

    return result;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(request: CreateTrendRequest): number {
    let score = 0.5;

    // Based on signal availability
    if (request.signals) {
      const signalCount = Object.values(request.signals).filter(v => v > 0).length;
      score += signalCount * 0.1;
    }

    return Math.min(0.95, score);
  }

  /**
   * Get data sources from signals
   */
  private getDataSources(request: CreateTrendRequest): string[] {
    const sources: string[] = ['historical'];

    if (request.signals) {
      if (request.signals.social > 0) sources.push('social');
      if (request.signals.search > 0) sources.push('search');
      if (request.signals.ticket > 0) sources.push('ticket');
      if (request.signals.weather > 0) sources.push('weather');
      if (request.signals.competitor > 0) sources.push('competitor');
    }

    return sources;
  }
}

export const trendService = new TrendService();
export default trendService;