import express, { Router } from 'express';
import { z } from 'zod';
import { format, addDays, startOfWeek, getDay } from 'date-fns';
import { logger } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';

export interface ForecastData {
  date: string;
  predictedBookings: number;
  confidence: number;
  peakHours: PeakHourPrediction[];
  recommendedStaffing: number;
  factors: string[];
}

export interface PeakHourPrediction {
  hour: number;
  expectedDemand: number;
  waitTimeEstimate: number;
}

export interface StylistProductivity {
  stylistId: string;
  name: string;
  servicesCompleted: number;
  avgServiceTime: number;
  customerSatisfaction: number;
  utilizationRate: number;
  revenue: number;
  trends: {
    weeklyChange: number;
    monthlyChange: number;
  };
}

const ForecastRequestSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  serviceType: z.string().optional(),
});

export class DemandForecast {
  private historicalData: Map<string, number[]> = new Map();
  private router: Router;

  constructor() {
    this.router = express.Router();
    this.router.use(authenticateToken); // Apply auth to all routes
    this.initializeRoutes();
    this.initializeHistoricalData();
  }

  private initializeRoutes(): void {
    this.router.get('/peak-hours', this.getPeakHours.bind(this));
    this.router.get('/weekly', this.getWeeklyForecast.bind(this));
    this.router.get('/staffing', this.getStaffingRecommendations.bind(this));
    this.router.post('/predict', this.getPrediction.bind(this));
  }

  private initializeHistoricalData(): void {
    // Generate sample historical data for demonstration
    const daysOfWeek = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];

    const baseDemand: Record<string, number[]> = {
      sunday: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 3, 2, 3, 4, 5, 4, 3, 2, 1, 0, 0],
      monday: [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 4, 5, 4, 3, 2, 3, 4, 3, 2, 1, 1, 0, 0, 0],
      tuesday: [0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 5, 6, 5, 4, 3, 4, 5, 4, 3, 2, 1, 0, 0, 0],
      wednesday: [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 4, 5, 4, 3, 2, 3, 4, 4, 3, 2, 1, 0, 0, 0],
      thursday: [0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 5, 6, 5, 4, 3, 4, 5, 5, 4, 3, 2, 0, 0, 0],
      friday: [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 4, 5, 4, 3, 2, 3, 5, 6, 5, 4, 3, 2, 0, 0],
      saturday: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 4, 5, 6, 5, 4, 3, 3, 2, 2, 1, 0, 0, 0],
    };

    for (const day of daysOfWeek) {
      this.historicalData.set(day, baseDemand[day]);
    }
  }

  getRouter(): Router {
    return this.router;
  }

  /**
   * Get peak hours prediction
   */
  private async getPeakHours(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();
      const dayName = format(targetDate, 'EEEE').toLowerCase();

      const hourlyDemand = this.historicalData.get(dayName) || [];
      const peakHours: PeakHourPrediction[] = [];

      for (let hour = 0; hour < 24; hour++) {
        if (hourlyDemand[hour] >= 4) {
          peakHours.push({
            hour,
            expectedDemand: hourlyDemand[hour],
            waitTimeEstimate: this.estimateWaitTime(hourlyDemand[hour]),
          });
        }
      }

      res.json({
        date: format(targetDate, 'yyyy-MM-dd'),
        dayOfWeek: dayName,
        peakHours,
        overallPeak: this.findOverallPeak(hourlyDemand),
      });
    } catch (error) {
      logger.error('Peak hours error:', error);
      res.status(500).json({ error: 'Failed to get peak hours' });
    }
  }

  /**
   * Get weekly forecast
   */
  private async getWeeklyForecast(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : startOfWeek(new Date());

      const forecasts: ForecastData[] = [];

      for (let i = 0; i < 7; i++) {
        const currentDate = addDays(startDate, i);
        const dayName = format(currentDate, 'EEEE').toLowerCase();
        const hourlyDemand = this.historicalData.get(dayName) || [];

        const totalDemand = hourlyDemand.reduce((a, b) => a + b, 0);
        const peakHour = hourlyDemand.indexOf(Math.max(...hourlyDemand));

        forecasts.push({
          date: format(currentDate, 'yyyy-MM-dd'),
          predictedBookings: totalDemand,
          confidence: 0.85,
          peakHours: [
            {
              hour: peakHour,
              expectedDemand: hourlyDemand[peakHour],
              waitTimeEstimate: this.estimateWaitTime(hourlyDemand[peakHour]),
            },
          ],
          recommendedStaffing: Math.ceil(totalDemand / 4),
          factors: this.identifyFactors(dayName, currentDate),
        });
      }

      res.json({ forecasts });
    } catch (error) {
      logger.error('Weekly forecast error:', error);
      res.status(500).json({ error: 'Failed to get weekly forecast' });
    }
  }

  /**
   * Get staffing recommendations
   */
  private async getStaffingRecommendations(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const { date, serviceType } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();
      const dayName = format(targetDate, 'EEEE').toLowerCase();

      const hourlyDemand = this.historicalData.get(dayName) || [];
      const totalDemand = hourlyDemand.reduce((a, b) => a + b, 0);
      const maxHourly = Math.max(...hourlyDemand);

      const staffing = {
        minimum: Math.ceil(totalDemand / 6),
        recommended: Math.ceil(totalDemand / 4),
        peak: Math.ceil(maxHourly / 2),
        schedule: this.generateStaffSchedule(hourlyDemand),
      };

      res.json({
        date: format(targetDate, 'yyyy-MM-dd'),
        dayOfWeek: dayName,
        staffing,
      });
    } catch (error) {
      logger.error('Staffing recommendations error:', error);
      res.status(500).json({ error: 'Failed to get staffing recommendations' });
    }
  }

  /**
   * Get custom prediction
   */
  private async getPrediction(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const validated = ForecastRequestSchema.parse(req.body);
      const startDate = new Date(validated.startDate);
      const endDate = new Date(validated.endDate);

      const predictions: ForecastData[] = [];
      let currentDate = startDate;

      while (currentDate <= endDate) {
        const dayName = format(currentDate, 'EEEE').toLowerCase();
        const hourlyDemand = this.historicalData.get(dayName) || [];
        const totalDemand = hourlyDemand.reduce((a, b) => a + b, 0);

        // Apply seasonal adjustment
        const seasonalFactor = this.getSeasonalFactor(currentDate);

        predictions.push({
          date: format(currentDate, 'yyyy-MM-dd'),
          predictedBookings: Math.round(totalDemand * seasonalFactor),
          confidence: 0.8,
          peakHours: this.getPeakHourPredictions(hourlyDemand),
          recommendedStaffing: Math.ceil((totalDemand * seasonalFactor) / 4),
          factors: this.identifyFactors(dayName, currentDate),
        });

        currentDate = addDays(currentDate, 1);
      }

      res.json({ predictions });
    } catch (error) {
      logger.error('Prediction error:', error);
      res.status(500).json({ error: 'Failed to generate prediction' });
    }
  }

  /**
   * Estimate wait time based on demand
   */
  private estimateWaitTime(demand: number): number {
    if (demand <= 2) return 0;
    if (demand <= 3) return 10;
    if (demand <= 4) return 20;
    if (demand <= 5) return 35;
    return 50;
  }

  /**
   * Find overall peak hour
   */
  private findOverallPeak(hourlyDemand: number[]): { hour: number; demand: number } {
    const maxDemand = Math.max(...hourlyDemand);
    const hour = hourlyDemand.indexOf(maxDemand);
    return { hour, demand: maxDemand };
  }

  /**
   * Identify factors affecting demand
   */
  private identifyFactors(dayName: string, date: Date): string[] {
    const factors: string[] = [];
    const dayOfWeek = getDay(date);

    // Day-based factors
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      factors.push('Weekend - higher demand');
    }
    if (dayOfWeek === 1) {
      factors.push('Monday - post-weekend lull');
    }
    if (dayOfWeek === 5) {
      factors.push('Friday - end of week boost');
    }

    // Check for special events (simplified)
    const month = date.getMonth();
    if (month === 11) {
      factors.push('Holiday season - increased grooming');
    }
    if (month === 4 || month === 5) {
      factors.push('Wedding season - styling demand');
    }

    return factors;
  }

  /**
   * Get seasonal factor for demand adjustment
   */
  private getSeasonalFactor(date: Date): number {
    const month = date.getMonth();

    // Seasonal adjustments
    const seasonalFactors: Record<number, number> = {
      0: 0.8, // January - post-holiday lull
      1: 0.85, // February
      2: 0.9, // March - spring starts
      3: 1.0, // April
      4: 1.1, // May - wedding season
      5: 1.15, // June - peak wedding
      6: 1.1, // July - summer
      7: 1.0, // August
      8: 0.95, // September
      9: 0.95, // October
      10: 1.0, // November
      11: 1.2, // December - holiday rush
    };

    return seasonalFactors[month] || 1.0;
  }

  /**
   * Get peak hour predictions
   */
  private getPeakHourPredictions(hourlyDemand: number[]): PeakHourPrediction[] {
    const peaks: PeakHourPrediction[] = [];

    for (let hour = 0; hour < 24; hour++) {
      if (hourlyDemand[hour] >= 3) {
        peaks.push({
          hour,
          expectedDemand: hourlyDemand[hour],
          waitTimeEstimate: this.estimateWaitTime(hourlyDemand[hour]),
        });
      }
    }

    return peaks;
  }

  /**
   * Generate optimal staff schedule
   */
  private generateStaffSchedule(
    hourlyDemand: number[]
  ): { hour: number; staff: number }[] {
    const schedule: { hour: number; staff: number }[] = [];

    for (let hour = 9; hour <= 20; hour++) {
      const demand = hourlyDemand[hour] || 0;
      const staff = Math.max(1, Math.ceil(demand / 2));
      schedule.push({ hour, staff });
    }

    return schedule;
  }
}
