import {
  ChronicCondition,
  ConditionReading,
  IChronicCondition,
  IConditionReading
} from '../models/chronicCare';
import {
  CreateConditionInput,
  UpdateConditionInput,
  CreateReadingInput,
  ConditionSummary,
  TrendData,
  ControlScore,
  TARGET_RANGES,
  ConditionType,
  ReadingType
} from '../types';
import { daysBetween, determineTrend } from '../utils/helpers';
import logger from '../utils/logger';
import alertService from './alertService';

class ChronicCareService {
  /**
   * Create a new chronic condition for a patient
   */
  async createCondition(input: CreateConditionInput): Promise<IChronicCondition> {
    try {
      const condition = new ChronicCondition({
        ...input,
        diagnosedDate: input.diagnosedDate ? new Date(input.diagnosedDate) : new Date()
      });

      await condition.save();

      logger.info('Chronic condition created', {
        conditionId: condition._id,
        patientId: input.patientId,
        conditionType: input.conditionType
      });

      return condition;
    } catch (error) {
      logger.error('Error creating chronic condition:', error);
      throw error;
    }
  }

  /**
   * Get all conditions for a patient
   */
  async getConditions(patientId: string): Promise<IChronicCondition[]> {
    try {
      const conditions = await ChronicCondition.find({
        patientId,
        status: { $in: ['active', 'managed'] }
      })
        .sort({ createdAt: -1 })
        .lean();

      return conditions as IChronicCondition[];
    } catch (error) {
      logger.error('Error getting conditions:', error);
      throw error;
    }
  }

  /**
   * Get condition details by ID
   */
  async getConditionDetails(conditionId: string): Promise<IChronicCondition | null> {
    try {
      const condition = await ChronicCondition.findById(conditionId).lean();
      return condition as IChronicCondition | null;
    } catch (error) {
      logger.error('Error getting condition details:', error);
      throw error;
    }
  }

  /**
   * Update a chronic condition
   */
  async updateCondition(
    conditionId: string,
    input: UpdateConditionInput
  ): Promise<IChronicCondition | null> {
    try {
      const condition = await ChronicCondition.findByIdAndUpdate(
        conditionId,
        { $set: input },
        { new: true, runValidators: true }
      ).lean();

      if (condition) {
        logger.info('Chronic condition updated', {
          conditionId,
          updates: Object.keys(input)
        });
      }

      return condition as IChronicCondition | null;
    } catch (error) {
      logger.error('Error updating condition:', error);
      throw error;
    }
  }

  /**
   * Add a reading for a condition
   */
  async addReading(
    conditionId: string,
    input: CreateReadingInput
  ): Promise<IConditionReading> {
    try {
      // Get the condition to get patientId
      const condition = await ChronicCondition.findById(conditionId);
      if (!condition) {
        throw new Error('Condition not found');
      }

      const reading = new ConditionReading({
        conditionId,
        patientId: condition.patientId,
        readingType: input.readingType,
        value: input.value,
        unit: input.unit,
        recordedAt: input.recordedAt ? new Date(input.recordedAt) : new Date(),
        notes: input.notes,
        recordedBy: input.recordedBy
      });

      await reading.save();

      logger.info('Reading added', {
        readingId: reading._id,
        conditionId,
        readingType: input.readingType,
        value: input.value
      });

      // Check thresholds and create alerts if needed
      await alertService.checkThresholds(
        condition.patientId,
        conditionId,
        input.readingType,
        input.value,
        input.unit
      );

      return reading;
    } catch (error) {
      logger.error('Error adding reading:', error);
      throw error;
    }
  }

  /**
   * Get readings for a condition
   */
  async getReadings(
    conditionId: string,
    options: {
      readingType?: ReadingType;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<IConditionReading[]> {
    try {
      const query: Record<string, unknown> = { conditionId };

      if (options.readingType) {
        query.readingType = options.readingType;
      }

      if (options.startDate || options.endDate) {
        query.recordedAt = {};
        if (options.startDate) {
          (query.recordedAt as Record<string, Date>).$gte = options.startDate;
        }
        if (options.endDate) {
          (query.recordedAt as Record<string, Date>).$lte = options.endDate;
        }
      }

      const readings = await ConditionReading.find(query)
        .sort({ recordedAt: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 100)
        .lean();

      return readings as IConditionReading[];
    } catch (error) {
      logger.error('Error getting readings:', error);
      throw error;
    }
  }

  /**
   * Get trends for a condition
   */
  async getTrends(
    conditionId: string,
    readingType: ReadingType,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<TrendData[]> {
    try {
      const condition = await ChronicCondition.findById(conditionId);
      if (!condition) {
        throw new Error('Condition not found');
      }

      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      const readings = await ConditionReading.find({
        conditionId,
        readingType,
        recordedAt: { $gte: startDate, $lte: now }
      })
        .sort({ recordedAt: 1 })
        .lean();

      // Group readings by day
      const groupedByDay = new Map<string, number[]>();

      for (const reading of readings) {
        const dateKey = reading.recordedAt.toISOString().split('T')[0];
        if (!groupedByDay.has(dateKey)) {
          groupedByDay.set(dateKey, []);
        }
        groupedByDay.get(dateKey)!.push(reading.value);
      }

      // Calculate trend data
      const trends: TrendData[] = [];
      for (const [date, values] of groupedByDay) {
        const sum = values.reduce((a, b) => a + b, 0);
        trends.push({
          date,
          average: sum / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length
        });
      }

      return trends.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      logger.error('Error getting trends:', error);
      throw error;
    }
  }

  /**
   * Calculate control score for a condition
   */
  async calculateControl(
    conditionId: string
  ): Promise<ControlScore> {
    try {
      const condition = await ChronicCondition.findById(conditionId);
      if (!condition) {
        throw new Error('Condition not found');
      }

      const readings = await ConditionReading.find({
        conditionId,
        recordedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
        .sort({ recordedAt: -1 })
        .lean();

      const targetRanges = TARGET_RANGES[condition.conditionType as ConditionType];
      const readingTypeScores: Record<string, number> = {};
      let totalScore = 0;
      let scoreCount = 0;

      // Group readings by type
      const readingsByType = new Map<ReadingType, number[]>();
      for (const reading of readings) {
        const type = reading.readingType as ReadingType;
        if (!readingsByType.has(type)) {
          readingsByType.set(type, []);
        }
        readingsByType.get(type)!.push(reading.value);
      }

      // Calculate score for each reading type
      for (const [type, values] of readingsByType) {
        const range = targetRanges[type];
        if (!range) continue;

        // Use most recent reading
        const recentValue = values[0];
        const { min, max } = range;

        // Calculate how close to target range
        if (recentValue >= min && recentValue <= max) {
          readingTypeScores[type] = 100;
        } else if (recentValue < min) {
          const deviation = ((min - recentValue) / min) * 100;
          readingTypeScores[type] = Math.max(0, 100 - deviation);
        } else {
          const deviation = ((recentValue - max) / max) * 100;
          readingTypeScores[type] = Math.max(0, 100 - deviation);
        }

        totalScore += readingTypeScores[type];
        scoreCount++;
      }

      // Calculate trend
      const allValues = readings.map((r) => r.value);
      const trend = determineTrend(allValues);

      return {
        overall: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
        readingTypeScores,
        trend,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error calculating control score:', error);
      throw error;
    }
  }

  /**
   * Get condition summary for a patient
   */
  async getConditionSummary(conditionId: string): Promise<ConditionSummary | null> {
    try {
      const condition = await ChronicCondition.findById(conditionId);
      if (!condition) {
        return null;
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [allReadings, monthReadings, lastReading, controlScore, activeAlerts] = await Promise.all([
        ConditionReading.countDocuments({ conditionId }),
        ConditionReading.countDocuments({
          conditionId,
          recordedAt: { $gte: startOfMonth }
        }),
        ConditionReading.findOne({ conditionId })
          .sort({ recordedAt: -1 })
          .lean(),
        this.calculateControl(conditionId),
        alertService.getActiveAlertCount(conditionId)
      ]);

      return {
        conditionId: condition._id.toString(),
        conditionType: condition.conditionType as ConditionType,
        patientId: condition.patientId,
        severity: condition.severity as 'mild' | 'moderate' | 'severe',
        daysSinceDiagnosis: daysBetween(condition.diagnosedDate, now),
        totalReadings: allReadings,
        readingsThisMonth: monthReadings,
        controlScore: controlScore.overall,
        activeAlerts,
        lastReading: lastReading
          ? {
              type: lastReading.readingType as ReadingType,
              value: lastReading.value,
              unit: lastReading.unit,
              date: lastReading.recordedAt.toISOString()
            }
          : null
      };
    } catch (error) {
      logger.error('Error getting condition summary:', error);
      throw error;
    }
  }

  /**
   * Delete a condition and all related data
   */
  async deleteCondition(conditionId: string): Promise<boolean> {
    try {
      const result = await ChronicCondition.findByIdAndDelete(conditionId);
      if (result) {
        // Delete related readings and alerts
        await Promise.all([
          ConditionReading.deleteMany({ conditionId }),
          alertService.deleteAlertsForCondition(conditionId)
        ]);

        logger.info('Condition deleted', { conditionId });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error deleting condition:', error);
      throw error;
    }
  }
}

export default new ChronicCareService();
