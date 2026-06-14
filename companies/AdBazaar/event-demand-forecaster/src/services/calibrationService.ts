import { Calibration, ICalibration } from '../models/Calibration';
import { Forecast } from '../models/Forecast';
import { logger } from '../utils/logger';
import { calibrationCounter } from '../utils/metrics';

// Calibration request interface
export interface CalibrationRequest {
  eventId: string;
  adjustments: {
    factor: string;
    original: number;
    adjusted: number;
    reason: string;
  }[];
  method: 'manual' | 'automatic' | 'ai_recommended';
  source: {
    type: 'historical' | 'real_time' | 'expert' | 'ai';
    details: string;
  };
  notes?: string;
}

// Calibration response interface
export interface CalibrationResponse {
  success: boolean;
  data?: ICalibration;
  error?: string;
}

// Calibrate forecast request
export interface CalibrateForecastRequest {
  eventId: string;
  adjustments: {
    factor: string;
    value: number;
    reason: string;
  }[];
  method?: 'manual' | 'automatic' | 'ai_recommended';
  source?: {
    type: 'historical' | 'real_time' | 'expert' | 'ai';
    details: string;
  };
  notes?: string;
}

// Calibration Service
class CalibrationService {
  /**
   * Calibrate a forecast with adjustments
   */
  async calibrateForecast(request: CalibrateForecastRequest): Promise<CalibrationResponse> {
    try {
      // Get the forecast
      const forecast = await Forecast.findOne({ eventId: request.eventId });
      if (!forecast) {
        calibrationCounter.inc({ event_id: request.eventId, status: 'not_found' });
        return {
          success: false,
          error: `Forecast for event ${request.eventId} not found`
        };
      }

      // Store before state
      const beforeState = {
        totalDemand: forecast.predicted.totalDemand,
        peakDemand: forecast.predicted.peakDemand,
        confidence: forecast.confidence.score
      };

      // Process adjustments
      const processedAdjustments = request.adjustments.map(adj => {
        const impact = ((adj.value - adj.original) / adj.original) * 100;
        return {
          factor: adj.factor,
          original: adj.original,
          adjusted: adj.value,
          reason: adj.reason,
          impact
        };
      });

      // Calculate total impact
      const totalImpact = processedAdjustments.reduce((sum, adj) => sum + adj.impact, 0);

      // Apply adjustments to forecast
      let adjustedDemand = forecast.predicted.totalDemand;
      let adjustedPeak = forecast.predicted.peakDemand;

      for (const adj of processedAdjustments) {
        const factorMap: Record<string, keyof typeof forecast.factors> = {
          historical: 'historical',
          seasonal: 'seasonal',
          promotional: 'promotional',
          weather: 'weather',
          economic: 'economic',
          social: 'social',
          location: 'location',
          competitor: 'competitor'
        };

        const factor = factorMap[adj.factor];
        if (factor) {
          forecast.factors[factor] = adj.adjusted;
        }

        // Apply proportional adjustment
        const proportion = adj.adjusted / adj.original;
        adjustedDemand *= proportion;
        adjustedPeak *= proportion;
      }

      // Update forecast
      forecast.predicted.totalDemand = Math.round(adjustedDemand);
      forecast.predicted.peakDemand = Math.round(adjustedPeak);
      forecast.status = 'calibrated';
      forecast.metadata.lastUpdated = new Date();

      // Update confidence based on calibration
      forecast.confidence.score = Math.min(0.95, forecast.confidence.score + 0.05);
      forecast.confidence.factors.push('calibrated');

      await forecast.save();

      // Store after state
      const afterState = {
        totalDemand: forecast.predicted.totalDemand,
        peakDemand: forecast.predicted.peakDemand,
        confidence: forecast.confidence.score
      };

      // Create calibration record
      const calibration = new Calibration({
        eventId: request.eventId,
        eventName: forecast.eventName,
        category: forecast.category,
        location: forecast.location,
        timestamp: new Date(),
        adjustments: processedAdjustments,
        totalImpact,
        method: request.method || 'manual',
        source: request.source || { type: 'manual', details: 'User calibration' },
        beforeState,
        afterState,
        notes: request.notes || '',
        validated: false
      });

      await calibration.save();

      calibrationCounter.inc({ event_id: request.eventId, status: 'success' });

      logger.info('Forecast calibrated', {
        eventId: request.eventId,
        totalImpact,
        method: request.method,
        beforeDemand: beforeState.totalDemand,
        afterDemand: afterState.totalDemand
      });

      return {
        success: true,
        data: calibration
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to calibrate forecast', { error: errorMessage, request });
      calibrationCounter.inc({ event_id: request.eventId, status: 'error' });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get calibration history for an event
   */
  async getEventCalibrations(eventId: string, limit: number = 10): Promise<{
    success: boolean;
    data?: ICalibration[];
    error?: string;
  }> {
    try {
      const calibrations = await Calibration.find({ eventId })
        .sort({ timestamp: -1 })
        .limit(limit);

      return {
        success: true,
        data: calibrations
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get calibrations', { error: errorMessage, eventId });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get recent calibrations
   */
  async getRecentCalibrations(days: number = 7): Promise<{
    success: boolean;
    data?: ICalibration[];
    error?: string;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const calibrations = await Calibration.find({
        timestamp: { $gte: startDate }
      })
        .sort({ timestamp: -1 })
        .limit(100);

      return {
        success: true,
        data: calibrations
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get recent calibrations', { error: errorMessage });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get pending validations
   */
  async getPendingValidations(): Promise<{
    success: boolean;
    data?: ICalibration[];
    error?: string;
  }> {
    try {
      const calibrations = await Calibration.getPendingValidations();

      return {
        success: true,
        data: calibrations
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get pending validations', { error: errorMessage });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Validate a calibration
   */
  async validateCalibration(calibrationId: string, validatedBy: string): Promise<CalibrationResponse> {
    try {
      const calibration = await Calibration.findById(calibrationId);
      if (!calibration) {
        return {
          success: false,
          error: 'Calibration not found'
        };
      }

      calibration.validate(validatedBy);
      await calibration.save();

      logger.info('Calibration validated', {
        calibrationId,
        validatedBy
      });

      return {
        success: true,
        data: calibration
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to validate calibration', { error: errorMessage, calibrationId });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get calibration statistics
   */
  async getCalibrationStats(category?: string): Promise<{
    success: boolean;
    data?: {
      total: number;
      byMethod: { _id: string; count: number; avgImpact: number }[];
      avgImpact: number;
      pendingValidations: number;
    };
    error?: string;
  }> {
    try {
      const matchStage: Record<string, unknown> = {};
      if (category) {
        matchStage.category = category;
      }

      const stats = await Calibration.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            avgImpact: { $avg: '$totalImpact' },
            totalImpact: { $sum: '$totalImpact' }
          }
        }
      ]);

      const methodBreakdown = await Calibration.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$method',
            count: { $sum: 1 },
            avgImpact: { $avg: '$totalImpact' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const pendingCount = await Calibration.countDocuments({
        validated: false,
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      return {
        success: true,
        data: {
          total: stats[0]?.total || 0,
          byMethod: methodBreakdown,
          avgImpact: stats[0]?.avgImpact || 0,
          pendingValidations: pendingCount
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get calibration stats', { error: errorMessage });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Auto-calibrate based on actual demand vs predicted
   */
  async autoCalibrate(eventId: string, actualDemand: number): Promise<CalibrationResponse> {
    try {
      const forecast = await Forecast.findOne({ eventId });
      if (!forecast) {
        return {
          success: false,
          error: `Forecast for event ${eventId} not found`
        };
      }

      const predictedDemand = forecast.predicted.totalDemand;
      const variance = actualDemand - predictedDemand;
      const variancePercent = predictedDemand > 0 ? (variance / predictedDemand) * 100 : 0;

      // Only calibrate if variance is significant (>10%)
      if (Math.abs(variancePercent) < 10) {
        return {
          success: false,
          error: 'Variance not significant enough for auto-calibration'
        };
      }

      // Create adjustment
      const adjustment = {
        factor: 'demand',
        original: predictedDemand,
        adjusted: actualDemand,
        reason: `Auto-calibration: Actual demand (${actualDemand}) vs predicted (${predictedDemand}), variance ${variancePercent.toFixed(2)}%`
      };

      return this.calibrateForecast({
        eventId,
        adjustments: [adjustment],
        method: 'automatic',
        source: {
          type: 'real_time',
          details: `Actual demand reported: ${actualDemand}`
        },
        notes: `Automatic calibration based on real-time demand data`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to auto-calibrate', { error: errorMessage, eventId });

      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

export const calibrationService = new CalibrationService();
export default calibrationService;