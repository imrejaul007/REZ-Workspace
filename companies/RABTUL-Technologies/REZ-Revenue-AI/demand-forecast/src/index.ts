/**
 * REZ Revenue AI - Demand Forecasting Service
 * ML-powered demand prediction with multi-horizon support
 */

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { z } from 'zod';

// ================== LOGGING ==================

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// ================== TYPES ==================

interface HourlyForecast {
  hour: number;
  predictedDemand: number;
  confidence: number;
  isPeakHour: boolean;
  recommendedPricing: 'discount' | 'normal' | 'surge';
}

interface DailyForecast {
  date: string;
  dayOfWeek: number;
  totalDemand: number;
  peakHour: number;
  peakDemand: number;
  confidence: number;
  hourlyBreakdown: HourlyForecast[];
  events: { name: string; expectedImpact: number }[];
}

interface ForecastFactors {
  name: string;
  impact: number;
  description: string;
}

// ================== VALIDATION SCHEMAS ==================

const LocationSchema = z.object({
  city: z.string().min(1),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
  area: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  nearbyEvents: z.number().int().nonnegative().default(0),
  weather: z.enum(['clear', 'rainy', 'stormy', 'hot', 'cold', 'cloudy']).default('clear'),
  footfallIndex: z.number().min(0).max(100).default(50),
});

const ForecastRequestSchema = z.object({
  merchantId: z.string().min(1),
  vertical: z.enum(['restaurant', 'hotel', 'clinic', 'salon', 'gym', 'events', 'retail', 'home_services', 'corp_perks']),
  category: z.string().min(1),
  location: LocationSchema,
  horizon: z.enum(['day', 'week', 'month']),
  startDate: z.string().optional(),
  historicalDataPoints: z.number().int().min(1).max(365).optional(),
});

// ================== DEMAND FORECAST CLASS ==================

class DemandForecastEngine {
  private verticalPatterns: Record<string, {
    peakHours: number[];
    offPeakHours: number[];
    weekendBoost: number;
    seasonality: Record<number, number>;
  }>;

  constructor() {
    this.verticalPatterns = {
      restaurant: {
        peakHours: [12, 13, 19, 20, 21],
        offPeakHours: [14, 15, 16],
        weekendBoost: 1.25,
        seasonality: { 1: 0.8, 4: 1.0, 7: 1.3, 10: 1.5, 11: 1.8 }, // Jan, Apr, Jul, Oct, Nov
      },
      hotel: {
        peakHours: [9, 10, 11],
        offPeakHours: [14, 15, 21, 22],
        weekendBoost: 1.15,
        seasonality: { 1: 0.7, 4: 0.9, 10: 1.2, 11: 1.4 }, // Jan, Apr, Oct, Nov
      },
      salon: {
        peakHours: [10, 11, 18, 19, 20],
        offPeakHours: [13, 14, 15],
        weekendBoost: 1.3,
        seasonality: { 2: 0.8, 4: 0.9, 10: 1.2, 11: 1.4 }, // Feb, Apr, Oct, Nov (pre-wedding)
      },
      clinic: {
        peakHours: [10, 11, 17, 18, 19],
        offPeakHours: [13, 14, 20],
        weekendBoost: 1.1,
        seasonality: { 1: 0.9, 3: 1.1, 10: 1.0 }, // Jan (flu season), Mar, Oct
      },
      gym: {
        peakHours: [6, 7, 8, 18, 19, 20],
        offPeakHours: [12, 13, 14],
        weekendBoost: 0.85,
        seasonality: { 1: 1.1, 3: 0.9, 6: 1.2, 9: 0.95 }, // Jan (resolutions), Mar, Jun, Sep
      },
      events: {
        peakHours: [18, 19, 20, 21],
        offPeakHours: [10, 11, 12],
        weekendBoost: 1.4,
        seasonality: { 3: 1.3, 10: 1.5, 11: 1.4 }, // Mar (Holi), Oct, Nov
      },
      retail: {
        peakHours: [17, 18, 19, 20],
        offPeakHours: [9, 10, 14],
        weekendBoost: 1.2,
        seasonality: { 10: 1.4, 11: 1.6, 12: 1.3 }, // Oct, Nov (festivals), Dec
      },
      home_services: {
        peakHours: [9, 10, 11, 17, 18, 19],
        offPeakHours: [12, 13, 14],
        weekendBoost: 1.15,
        seasonality: { 1: 0.8, 6: 1.1, 10: 1.2 }, // Jan, Jun, Oct
      },
      corp_perks: {
        peakHours: [10, 11, 14, 15],
        offPeakHours: [9, 17, 18],
        weekendBoost: 0.9,
        seasonality: { 1: 1.2, 3: 1.1, 10: 1.3 }, // Jan (benefits), Mar, Oct (appraisal)
      },
    };
  }

  /**
   * Generate demand forecast
   */
  forecast(request: z.infer<typeof ForecastRequestSchema>): {
    merchantId: string;
    forecasts: DailyForecast[];
    summary: {
      avgDailyDemand: number;
      peakDay: string;
      lowestDay: string;
      totalPredictedOrders: number;
      confidence: number;
    };
    factors: ForecastFactors[];
  } {
    const { merchantId, vertical, category, location, horizon, startDate } = request;
    const pattern = this.verticalPatterns[vertical] || this.verticalPatterns.restaurant;

    const start = startDate ? new Date(startDate) : new Date();
    const days = horizon === 'day' ? 1 : horizon === 'week' ? 7 : 30;

    const forecasts: DailyForecast[] = [];
    let totalDemand = 0;
    let peakDay = { date: '', demand: 0 };
    let lowestDay = { date: '', demand: Infinity };
    const factors: ForecastFactors[] = [];

    // Add location factor
    factors.push({
      name: 'city_tier',
      impact: location.tier === 1 ? 1.2 : location.tier === 2 ? 1.0 : 0.85,
      description: `Tier ${location.tier} city demand multiplier`,
    });

    // Add weather factor
    const weatherMultiplier = this.getWeatherMultiplier(location.weather);
    factors.push({
      name: 'weather',
      impact: weatherMultiplier,
      description: `${location.weather} weather impact`,
    });

    // Add events factor
    if (location.nearbyEvents > 0) {
      factors.push({
        name: 'nearby_events',
        impact: 1 + (location.nearbyEvents * 0.15),
        description: `${location.nearbyEvents} events in area`,
      });
    }

    for (let d = 0; d < days; d++) {
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + d);
      const dayOfWeek = currentDate.getDay();
      const month = currentDate.getMonth() + 1;

      // Calculate base demand
      let dailyMultiplier = 1.0;

      // Day of week factor
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        dailyMultiplier *= pattern.weekendBoost;
      } else if (dayOfWeek === 1) {
        dailyMultiplier *= 0.85; // Monday dip
      }

      // Seasonality factor
      const seasonMultiplier = pattern.seasonality[month] || 1.0;
      dailyMultiplier *= seasonMultiplier;

      // Weather factor
      dailyMultiplier *= weatherMultiplier;

      // Events factor
      if (location.nearbyEvents > 0) {
        dailyMultiplier *= (1 + location.nearbyEvents * 0.15);
      }

      // Location footfall factor
      dailyMultiplier *= (location.footfallIndex / 50);

      // Calculate hourly breakdown
      const hourlyBreakdown: HourlyForecast[] = [];
      let dayTotalDemand = 0;
      let peakHour = 0;
      let peakHourDemand = 0;

      for (let hour = 0; hour < 24; hour++) {
        let hourMultiplier = 1.0;

        // Peak hours
        if (pattern.peakHours.includes(hour)) {
          hourMultiplier *= 1.4;
        }

        // Off-peak hours
        if (pattern.offPeakHours.includes(hour)) {
          hourMultiplier *= 0.7;
        }

        // Calculate demand for this hour
        const baseHourlyDemand = 4.17; // 100/24
        const predictedDemand = Math.min(100, baseHourlyDemand * dailyMultiplier * hourMultiplier);
        dayTotalDemand += predictedDemand;

        // Determine pricing recommendation
        let recommendedPricing: 'discount' | 'normal' | 'surge' = 'normal';
        if (predictedDemand > 70) {
          recommendedPricing = 'surge';
        } else if (predictedDemand < 30) {
          recommendedPricing = 'discount';
        }

        // Track peak hour
        if (predictedDemand > peakHourDemand) {
          peakHourDemand = predictedDemand;
          peakHour = hour;
        }

        hourlyBreakdown.push({
          hour,
          predictedDemand: Math.round(predictedDemand * 10) / 10,
          confidence: this.calculateHourConfidence(hour, predictedDemand),
          isPeakHour: pattern.peakHours.includes(hour),
          recommendedPricing,
        });
      }

      // Add events for this day (simplified)
      const events: { name: string; expectedImpact: number }[] = [];
      if (dayOfWeek === 5 && location.nearbyEvents > 0) {
        events.push({ name: 'Weekend approaching', expectedImpact: 0.1 });
      }

      const dailyForecast: DailyForecast = {
        date: currentDate.toISOString().split('T')[0],
        dayOfWeek,
        totalDemand: Math.round(dayTotalDemand * 10) / 10,
        peakHour,
        peakDemand: Math.round(peakHourDemand * 10) / 10,
        confidence: this.calculateDayConfidence(dailyMultiplier, pattern),
        hourlyBreakdown,
        events,
      };

      forecasts.push(dailyForecast);
      totalDemand += dailyForecast.totalDemand;

      // Track peak/lowest days
      if (dailyForecast.totalDemand > peakDay.demand) {
        peakDay = { date: dailyForecast.date, demand: dailyForecast.totalDemand };
      }
      if (dailyForecast.totalDemand < lowestDay.demand) {
        lowestDay = { date: dailyForecast.date, demand: dailyForecast.totalDemand };
      }
    }

    const avgDailyDemand = totalDemand / days;
    const confidence = this.calculateOverallConfidence(factors, days);

    logger.info('Forecast generated', {
      merchantId,
      vertical,
      horizon,
      days,
      avgDailyDemand: avgDailyDemand.toFixed(2),
      confidence,
    });

    return {
      merchantId,
      forecasts,
      summary: {
        avgDailyDemand: Math.round(avgDailyDemand * 10) / 10,
        peakDay: peakDay.date,
        lowestDay: lowestDay.date,
        totalPredictedOrders: Math.round(totalDemand),
        confidence,
      },
      factors,
    };
  }

  /**
   * Get weather impact multiplier
   */
  private getWeatherMultiplier(weather: string): number {
    const multipliers: Record<string, number> = {
      clear: 1.0,
      cloudy: 0.95,
      rainy: 1.1,    // More indoor activity
      stormy: 0.7,  // People stay home
      hot: 1.05,    // Increased demand for cold items
      cold: 1.08,   // Increased demand for warm items
    };
    return multipliers[weather] || 1.0;
  }

  /**
   * Calculate hourly confidence
   */
  private calculateHourConfidence(hour: number, demand: number): number {
    let confidence = 0.7;

    // Higher confidence for peak/off-peak hours
    if (demand > 70 || demand < 30) {
      confidence += 0.1;
    }

    // Lower confidence for late night/early morning
    if (hour >= 23 || hour <= 5) {
      confidence -= 0.1;
    }

    return Math.min(0.95, Math.max(0.5, confidence));
  }

  /**
   * Calculate daily confidence
   */
  private calculateDayConfidence(multiplier: number, pattern: typeof this.verticalPatterns.restaurant): number {
    let confidence = 0.75;

    // Higher multiplier = more predictable
    if (multiplier > 1.2) {
      confidence += 0.1;
    }

    // Weekend boost is more predictable
    if (multiplier > 1.15) {
      confidence += 0.05;
    }

    return Math.min(0.92, Math.max(0.65, confidence));
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(factors: ForecastFactors[], days: number): number {
    let confidence = 0.6;

    // More days = more data = higher confidence
    if (days >= 7) confidence += 0.1;
    if (days >= 30) confidence += 0.1;

    // More factors = more comprehensive
    confidence += Math.min(0.1, factors.length * 0.02);

    return Math.min(0.88, Math.max(0.7, confidence));
  }

  /**
   * Get recommended staffing based on forecast
   */
  getStaffingRecommendation(forecast: DailyForecast, baseStaff: number = 5): {
    recommendedStaff: number;
    peakHours: number[];
    offPeakReduction: number;
  } {
    const peakHours = forecast.hourlyBreakdown
      .filter(h => h.predictedDemand > 60)
      .map(h => h.hour);

    const avgDemand = forecast.hourlyBreakdown.reduce((sum, h) => sum + h.predictedDemand, 0) / 24;
    const demandRatio = forecast.totalDemand / (avgDemand * 24);

    const recommendedStaff = Math.ceil(baseStaff * demandRatio);

    return {
      recommendedStaff,
      peakHours,
      offPeakReduction: Math.max(1, Math.floor(baseStaff * 0.3)),
    };
  }

  /**
   * Get inventory recommendations based on forecast
   */
  getInventoryRecommendation(forecast: DailyForecast, avgDailyConsumption: number = 100): {
    recommendedStock: number;
    peakItems: string[];
    lowDemandHours: number[];
  } {
    const peakHours = forecast.hourlyBreakdown
      .filter(h => h.predictedDemand > 70)
      .map(h => h.hour);

    const lowDemandHours = forecast.hourlyBreakdown
      .filter(h => h.predictedDemand < 30)
      .map(h => h.hour);

    const demandMultiplier = forecast.totalDemand / (avgDailyConsumption * 24);
    const recommendedStock = Math.ceil(avgDailyConsumption * demandMultiplier * 1.2); // 20% buffer

    return {
      recommendedStock,
      peakItems: ['Peak demand items - stock up'],
      lowDemandHours,
    };
  }
}

// ================== EXPRESS APP ==================

const app = express();
const forecastEngine = new DemandForecastEngine();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;
  logger.info('Request received', { requestId, method: req.method, path: req.path });
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-revenue-ai-demand-forecast',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ================== API ROUTES ==================

/**
 * POST /api/v1/forecast
 * Generate demand forecast
 */
app.post('/api/v1/forecast', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    const validationResult = ForecastRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: validationResult.error.issues,
        },
        metadata: { requestId, timestamp: new Date() },
      });
    }

    const forecast = forecastEngine.forecast(validationResult.data);

    res.json({
      success: true,
      data: forecast,
      metadata: {
        requestId,
        timestamp: new Date(),
        calculationTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    logger.error('Forecast error', { error });
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: {
        code: 'FORECAST_ERROR',
        message: err.message || 'Failed to generate forecast',
      },
    });
  }
});

/**
 * GET /api/v1/forecast/:merchantId
 * Get forecast for existing merchant
 */
app.get('/api/v1/forecast/:merchantId', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { horizon = 'week', vertical = 'restaurant', category = 'general', startDate } = req.query;

    const forecastRequest: z.infer<typeof ForecastRequestSchema> = {
      merchantId,
      vertical: vertical as z.infer<typeof ForecastRequestSchema>['vertical'],
      category: category as string,
      location: {
        city: 'Bangalore',
        tier: 1,
        nearbyEvents: 0,
        weather: 'clear',
        footfallIndex: 50,
      },
      horizon: horizon as 'day' | 'week' | 'month',
      startDate: startDate as string | undefined,
    };

    const forecast = forecastEngine.forecast(forecastRequest);

    res.json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    logger.error('Forecast error', { error });
    const err = error as Error;
    res.status(500).json({
      success: false,
      error: {
        code: 'FORECAST_ERROR',
        message: err.message,
      },
    });
  }
});

/**
 * GET /api/v1/recommendations/:merchantId/staffing
 * Get staffing recommendations
 */
app.get('/api/v1/recommendations/:merchantId/staffing', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { baseStaff = '5' } = req.query;

    // Get today's forecast first
    const forecastRequest: z.infer<typeof ForecastRequestSchema> = {
      merchantId,
      vertical: 'restaurant',
      category: 'general',
      location: { city: 'Bangalore', tier: 1, nearbyEvents: 0, weather: 'clear', footfallIndex: 50 },
      horizon: 'day',
    };

    const forecast = forecastEngine.forecast(forecastRequest);
    const todayForecast = forecast.forecasts[0];
    const staffing = forecastEngine.getStaffingRecommendation(todayForecast, parseInt(baseStaff as string, 10));

    res.json({
      success: true,
      data: {
        merchantId,
        date: todayForecast.date,
        ...staffing,
      },
    });
  } catch (error) {
    logger.error('Staffing recommendation error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to generate staffing recommendation' },
    });
  }
});

/**
 * GET /api/v1/recommendations/:merchantId/inventory
 * Get inventory recommendations
 */
app.get('/api/v1/recommendations/:merchantId/inventory', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    const forecastRequest: z.infer<typeof ForecastRequestSchema> = {
      merchantId,
      vertical: 'restaurant',
      category: 'general',
      location: { city: 'Bangalore', tier: 1, nearbyEvents: 0, weather: 'clear', footfallIndex: 50 },
      horizon: 'day',
    };

    const forecast = forecastEngine.forecast(forecastRequest);
    const todayForecast = forecast.forecasts[0];
    const inventory = forecastEngine.getInventoryRecommendation(todayForecast);

    res.json({
      success: true,
      data: {
        merchantId,
        date: todayForecast.date,
        ...inventory,
      },
    });
  } catch (error) {
    logger.error('Inventory recommendation error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to generate inventory recommendation' },
    });
  }
});

// ================== SERVER START ==================

const PORT = process.env.PORT || 4302;

app.listen(PORT, () => {
  logger.info('REZ Revenue AI Demand Forecast started', { port: PORT });
});

export default app;
