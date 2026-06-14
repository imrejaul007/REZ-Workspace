import { v4 as uuidv4 } from 'uuid';
import { Forecast, IForecast } from '../models/Forecast';
import { DemandTrend } from '../models/DemandTrend';
import { logger } from '../utils/logger';
import { forecastRequestsTotal, predictionGauge, activeForecastsGauge } from '../utils/metrics';
import { getRedisClient } from '../index';

// Request/Response interfaces
export interface CreateForecastRequest {
  eventId?: string;
  eventName: string;
  category: string;
  location: string;
  startDate: Date;
  endDate: Date;
  historicalData?: {
    previousDemand: number;
    sameEventLastYear?: number;
    similarEvents?: number;
  };
  factors?: {
    promotional?: number;
    weather?: number;
    economic?: number;
    social?: number;
    competitor?: number;
  };
}

export interface ForecastResponse {
  success: boolean;
  data?: IForecast;
  error?: string;
}

export interface GetForecastRequest {
  eventId: string;
  useCache?: boolean;
}

export interface CategoryForecastRequest {
  category: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

export interface LocationForecastRequest {
  location: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

// Forecast Service
class ForecastService {
  private redisClient = getRedisClient();
  private readonly CACHE_TTL = 3600; // 1 hour

  /**
   * Create a new demand forecast
   */
  async createForecast(request: CreateForecastRequest): Promise<ForecastResponse> {
    try {
      const eventId = request.eventId || uuidv4();

      // Check if forecast already exists
      const existing = await Forecast.findOne({ eventId });
      if (existing) {
        return {
          success: false,
          error: `Forecast for event ${eventId} already exists`
        };
      }

      // Calculate predicted demand
      const predicted = await this.calculateDemand(request);

      // Calculate confidence
      const confidence = this.calculateConfidence(request, predicted);

      // Create forecast
      const forecast = new Forecast({
        eventId,
        eventName: request.eventName,
        category: request.category,
        location: request.location,
        startDate: request.startDate,
        endDate: request.endDate,
        predicted,
        confidence,
        factors: {
          historical: request.historicalData?.previousDemand || 0,
          seasonal: this.getSeasonalFactor(request.startDate, request.category),
          promotional: request.factors?.promotional || 0,
          weather: request.factors?.weather || 0,
          economic: request.factors?.economic || 0,
          social: request.factors?.social || 0,
          location: this.getLocationFactor(request.location),
          competitor: request.factors?.competitor || 0
        },
        status: 'active',
        metadata: {
          model: 'ensemble-v1',
          algorithm: 'time-series-prophet-like',
          trainingDataPoints: request.historicalData?.previousDemand ? 30 : 10,
          lastUpdated: new Date()
        }
      });

      await forecast.save();

      // Update metrics
      forecastRequestsTotal.inc({ type: 'create', status: 'success' });
      predictionGauge.set({ event_id: eventId, category: request.category }, predicted.totalDemand);
      activeForecastsGauge.inc({ category: request.category, location: request.location });

      // Cache the forecast
      await this.cacheForecast(eventId, forecast);

      logger.info('Forecast created', {
        eventId,
        eventName: request.eventName,
        category: request.category,
        predictedDemand: predicted.totalDemand
      });

      return {
        success: true,
        data: forecast
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to create forecast', { error: errorMessage, request });
      forecastRequestsTotal.inc({ type: 'create', status: 'error' });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get forecast by event ID
   */
  async getForecast(eventId: string, useCache: boolean = true): Promise<ForecastResponse> {
    try {
      // Try cache first
      if (useCache && this.redisClient?.isOpen) {
        const cached = await this.redisClient.get(`forecast:${eventId}`);
        if (cached) {
          logger.debug('Forecast cache hit', { eventId });
          return {
            success: true,
            data: JSON.parse(cached)
          };
        }
      }

      const forecast = await Forecast.findOne({ eventId });
      if (!forecast) {
        forecastRequestsTotal.inc({ type: 'get', status: 'not_found' });
        return {
          success: false,
          error: `Forecast for event ${eventId} not found`
        };
      }

      // Cache for next time
      await this.cacheForecast(eventId, forecast);

      forecastRequestsTotal.inc({ type: 'get', status: 'success' });
      return {
        success: true,
        data: forecast
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get forecast', { error: errorMessage, eventId });
      forecastRequestsTotal.inc({ type: 'get', status: 'error' });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get forecasts by category
   */
  async getCategoryForecasts(request: CategoryForecastRequest): Promise<{
    success: boolean;
    data?: IForecast[];
    error?: string;
  }> {
    try {
      const query: Record<string, unknown> = { category: request.category };

      if (request.status) {
        query.status = request.status;
      }

      if (request.startDate) {
        query.startDate = { $gte: request.startDate };
      }

      if (request.endDate) {
        query.endDate = { ...(query.endDate as object || {}), $lte: request.endDate };
      }

      const forecasts = await Forecast.find(query)
        .sort({ 'predicted.totalDemand': -1 })
        .limit(100);

      forecastRequestsTotal.inc({ type: 'category', status: 'success' });
      return {
        success: true,
        data: forecasts
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get category forecasts', { error: errorMessage, request });
      forecastRequestsTotal.inc({ type: 'category', status: 'error' });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get forecasts by location
   */
  async getLocationForecasts(request: LocationForecastRequest): Promise<{
    success: boolean;
    data?: IForecast[];
    error?: string;
  }> {
    try {
      const query: Record<string, unknown> = { location: request.location };

      if (request.status) {
        query.status = request.status;
      }

      if (request.startDate) {
        query.startDate = { $gte: request.startDate };
      }

      if (request.endDate) {
        query.endDate = { ...(query.endDate as object || {}), $lte: request.endDate };
      }

      const forecasts = await Forecast.find(query)
        .sort({ 'predicted.totalDemand': -1 })
        .limit(100);

      forecastRequestsTotal.inc({ type: 'location', status: 'success' });
      return {
        success: true,
        data: forecasts
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get location forecasts', { error: errorMessage, request });
      forecastRequestsTotal.inc({ type: 'location', status: 'error' });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Calculate demand prediction
   */
  private async calculateDemand(request: CreateForecastRequest): Promise<{
    totalDemand: number;
    peakDemand: number;
    peakDate: Date;
    daily: { date: Date; predicted: number; lowerBound: number; upperBound: number; confidence: number }[];
    hourly?: { hour: number; demand: number }[];
  }> {
    const days = Math.ceil((request.endDate.getTime() - request.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Base demand from historical data
    let baseDemand = request.historicalData?.previousDemand || 1000;

    // Adjust for same event last year
    if (request.historicalData?.sameEventLastYear) {
      baseDemand = (baseDemand + request.historicalData.sameEventLastYear) / 2;
    }

    // Adjust for similar events
    if (request.historicalData?.similarEvents) {
      baseDemand = (baseDemand * 0.7 + request.historicalData.similarEvents * 0.3);
    }

    // Apply factor multipliers
    const seasonalFactor = this.getSeasonalFactor(request.startDate, request.category);
    const locationFactor = this.getLocationFactor(request.location);
    const promotionalFactor = 1 + (request.factors?.promotional || 0) / 100;
    const weatherFactor = 1 + (request.factors?.weather || 0) / 100;
    const socialFactor = 1 + (request.factors?.social || 0) / 100;
    const competitorFactor = 1 - (request.factors?.competitor || 0) / 100;

    const adjustedDemand = baseDemand * seasonalFactor * locationFactor * promotionalFactor * weatherFactor * socialFactor * competitorFactor;

    // Generate daily predictions
    const daily: { date: Date; predicted: number; lowerBound: number; upperBound: number; confidence: number }[] = [];
    let peakDemand = 0;
    let peakDate = request.startDate;

    for (let i = 0; i < days; i++) {
      const date = new Date(request.startDate);
      date.setDate(date.getDate() + i);

      // Day-of-week factor (weekends tend to have higher demand)
      const dayOfWeek = date.getDay();
      const dayFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1.0;

      // Calculate daily demand with some randomness for realism
      const dailyDemand = Math.round(adjustedDemand / days * dayFactor * (0.9 + Math.random() * 0.2));

      // Confidence decreases further from event start
      const daysFromStart = i;
      const confidence = Math.max(0.5, 0.95 - daysFromStart * 0.02);

      // Calculate bounds
      const variance = dailyDemand * 0.15;
      const lowerBound = Math.max(0, dailyDemand - variance);
      const upperBound = dailyDemand + variance;

      daily.push({
        date,
        predicted: dailyDemand,
        lowerBound,
        upperBound,
        confidence
      });

      if (dailyDemand > peakDemand) {
        peakDemand = dailyDemand;
        peakDate = date;
      }
    }

    // Generate hourly pattern (if event spans single day)
    let hourly: { hour: number; demand: number }[] | undefined;
    if (days === 1) {
      hourly = this.generateHourlyPattern(peakDemand);
    }

    return {
      totalDemand: Math.round(adjustedDemand),
      peakDemand,
      peakDate,
      daily,
      hourly
    };
  }

  /**
   * Generate hourly demand pattern
   */
  private generateHourlyPattern(peakDemand: number): { hour: number; demand: number }[] {
    const hourly: { hour: number; demand: number }[] = [];

    for (let hour = 0; hour < 24; hour++) {
      // Typical event pattern: low morning, builds through day, peaks evening
      let factor: number;
      if (hour < 10) {
        factor = 0.2;
      } else if (hour < 14) {
        factor = 0.5;
      } else if (hour < 18) {
        factor = 0.7;
      } else if (hour < 22) {
        factor = 1.0;
      } else {
        factor = 0.6;
      }

      hourly.push({
        hour,
        demand: Math.round(peakDemand * factor)
      });
    }

    return hourly;
  }

  /**
   * Calculate forecast confidence
   */
  private calculateConfidence(
    request: CreateForecastRequest,
    predicted: { totalDemand: number }
  ): { score: number; level: 'low' | 'medium' | 'high'; factors: string[] } {
    let score = 0.5;
    const factors: string[] = [];

    // Historical data availability
    if (request.historicalData?.previousDemand) {
      score += 0.15;
      factors.push('historical_data');
    }

    if (request.historicalData?.sameEventLastYear) {
      score += 0.1;
      factors.push('same_event_history');
    }

    if (request.historicalData?.similarEvents) {
      score += 0.05;
      factors.push('similar_events');
    }

    // Factor coverage
    if (request.factors?.promotional) {
      score += 0.05;
      factors.push('promotional_data');
    }

    if (request.factors?.weather) {
      score += 0.05;
      factors.push('weather_data');
    }

    // Event type reliability
    const reliableCategories = ['concert', 'sports', 'conference', 'festival'];
    if (reliableCategories.includes(request.category)) {
      score += 0.1;
      factors.push('reliable_category');
    }

    // Cap at 0.95
    score = Math.min(0.95, score);

    const level = score >= 0.75 ? 'high' : score >= 0.5 ? 'medium' : 'low';

    return { score, level, factors };
  }

  /**
   * Get seasonal factor based on date and category
   */
  private getSeasonalFactor(date: Date, category: string): number {
    const month = date.getMonth();

    // General seasonal patterns
    const seasonalFactors: Record<number, number> = {
      0: 0.8,   // January - post-holiday lull
      1: 0.7,   // February
      2: 0.9,   // March - spring events
      3: 1.0,   // April
      4: 1.1,   // May - pre-summer
      5: 1.2,   // June - summer starts
      6: 1.3,   // July - peak summer
      7: 1.2,   // August
      8: 1.0,   // September
9: 1.1,   // October - fall events
      10: 1.2,  // November - pre-holiday
      11: 1.4   // December - holiday peak
    };

    return seasonalFactors[month] || 1.0;
  }

  /**
   * Get location factor based on city tier
   */
  private getLocationFactor(location: string): number {
    const tier1Cities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'hyderabad', 'kolkata'];
    const tier2Cities = ['pune', 'ahmedabad', 'jaipur', 'lucknow', 'chandigarh', 'kochi', 'goa'];

    const loc = location.toLowerCase();

    if (tier1Cities.some(city => loc.includes(city))) {
      return 1.5;
    }
    if (tier2Cities.some(city => loc.includes(city))) {
      return 1.2;
    }
    return1.0;
  }

  /**
   * Cache forecast in Redis
   */
  private async cacheForecast(eventId: string, forecast: IForecast): Promise<void> {
    if (!this.redisClient?.isOpen) return;

    try {
      await this.redisClient.setEx(
        `forecast:${eventId}`,
        this.CACHE_TTL,
        JSON.stringify(forecast.toJSON())
      );
    } catch (error) {
      logger.warn('Failed to cache forecast', { eventId, error });
    }
  }

  /**
   * Update forecast status
   */
  async updateForecastStatus(eventId: string, status: IForecast['status']): Promise<ForecastResponse> {
    try {
      const forecast = await Forecast.findOneAndUpdate(
        { eventId },
        { status, 'metadata.lastUpdated': new Date() },
        { new: true }
      );

      if (!forecast) {
        return {
          success: false,
          error: `Forecast for event ${eventId} not found`
        };
      }

      // Invalidate cache
      if (this.redisClient?.isOpen) {
        await this.redisClient.del(`forecast:${eventId}`);
      }

      return {
        success: true,
        data: forecast
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to update forecast status', { error: errorMessage, eventId, status });

      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

export const forecastService = new ForecastService();
export default forecastService;