import { ChronicCondition, ConditionReading, Alert } from '../models/chronicCare';
import { ControlScore, TrendData, ConditionSummary, ReadingType, TARGET_RANGES, ConditionType } from '../types';
import chronicCareService from './chronicCareService';
import alertService from './alertService';
import { startOfDay, endOfDay, daysBetween, determineTrend } from '../utils/helpers';
import logger from '../utils/logger';

interface MonthlyReport {
  patientId: string;
  conditionId: string;
  conditionType: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalReadings: number;
    readingsByType: Record<string, number>;
    averageValues: Record<string, { average: number; min: number; max: number; unit: string }>;
    inRangePercentage: Record<string, number>;
    outOfRangeCount: number;
  };
  alerts: {
    total: number;
    unacknowledged: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  };
  controlScore: number;
  trend: 'improving' | 'stable' | 'declining';
  medicationAdherence: number;
  recommendations: string[];
}

interface ControlScoreResponse {
  patientId: string;
  overallScore: number;
  conditions: Array<{
    conditionId: string;
    conditionType: string;
    score: number;
    trend: 'improving' | 'stable' | 'declining';
  }>;
  overallTrend: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
}

class ReportingService {
  /**
   * Generate a comprehensive condition summary
   */
  async getConditionSummary(
    patientId: string,
    conditionId: string
  ): Promise<ConditionSummary | null> {
    try {
      return await chronicCareService.getConditionSummary(conditionId);
    } catch (error) {
      logger.error('Error generating condition summary:', error);
      throw error;
    }
  }

  /**
   * Generate a monthly report for a condition
   */
  async getMonthlyReport(
    patientId: string,
    conditionId: string,
    year: number,
    month: number
  ): Promise<MonthlyReport> {
    try {
      const condition = await ChronicCondition.findById(conditionId);
      if (!condition) {
        throw new Error('Condition not found');
      }

      // Calculate date range for the month
      const startDate = startOfDay(new Date(year, month - 1, 1));
      const endDate = endOfDay(new Date(year, month, 0));

      // Get all readings for the period
      const readings = await ConditionReading.find({
        conditionId,
        recordedAt: { $gte: startDate, $lte: endDate }
      }).lean();

      // Get alerts for the period
      const alerts = await Alert.find({
        patientId,
        conditionId,
        createdAt: { $gte: startDate, $lte: endDate }
      });

      // Calculate summary statistics
      const readingsByType: Record<string, number> = {};
      const valuesByType: Record<string, number[]> = {};
      const inRangeByType: Record<string, { inRange: number; total: number }> = {};

      const targetRanges = TARGET_RANGES[condition.conditionType as ConditionType];

      for (const reading of readings) {
        const type = reading.readingType;
        readingsByType[type] = (readingsByType[type] || 0) + 1;

        if (!valuesByType[type]) {
          valuesByType[type] = [];
          inRangeByType[type] = { inRange: 0, total: 0 };
        }
        valuesByType[type].push(reading.value);
        inRangeByType[type].total++;

        const range = targetRanges[type as ReadingType];
        if (range && reading.value >= range.min && reading.value <= range.max) {
          inRangeByType[type].inRange++;
        }
      }

      // Calculate averages and ranges
      const averageValues: Record<string, { average: number; min: number; max: number; unit: string }> = {};
      let totalOutOfRange = 0;

      for (const [type, values] of Object.entries(valuesByType)) {
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const range = targetRanges[type as ReadingType];
        averageValues[type] = {
          average: Math.round(avg * 100) / 100,
          min: Math.min(...values),
          max: Math.max(...values),
          unit: range?.unit || ''
        };

        if (range) {
          const outOfRange = values.filter(
            (v) => v < range.min || v > range.max
          ).length;
          totalOutOfRange += outOfRange;
        }
      }

      // Calculate in-range percentages
      const inRangePercentage: Record<string, number> = {};
      for (const [type, data] of Object.entries(inRangeByType)) {
        inRangePercentage[type] = data.total > 0
          ? Math.round((data.inRange / data.total) * 100)
          : 0;
      }

      // Calculate control score
      const controlScore = await chronicCareService.calculateControl(conditionId);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        condition.conditionType as ConditionType,
        averageValues,
        inRangePercentage,
        controlScore.overall
      );

      // Alert statistics
      const alertStats = alertService.getAlertStats(patientId);

      return {
        patientId,
        conditionId: conditionId,
        conditionType: condition.conditionType,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        summary: {
          totalReadings: readings.length,
          readingsByType,
          averageValues,
          inRangePercentage,
          outOfRangeCount: totalOutOfRange
        },
        alerts: {
          total: alerts.length,
          unacknowledged: alerts.filter((a) => !a.acknowledged).length,
          bySeverity: {
            low: alerts.filter((a) => a.severity === 'low').length,
            medium: alerts.filter((a) => a.severity === 'medium').length,
            high: alerts.filter((a) => a.severity === 'high').length,
            critical: alerts.filter((a) => a.severity === 'critical').length
          },
          byType: {
            out_of_range: alerts.filter((a) => a.type === 'out_of_range').length,
            medication_due: alerts.filter((a) => a.type === 'medication_due').length,
            appointment_due: alerts.filter((a) => a.type === 'appointment_due').length,
            trend_concern: alerts.filter((a) => a.type === 'trend_concern').length
          }
        },
        controlScore: controlScore.overall,
        trend: controlScore.trend,
        medicationAdherence: await this.calculateMedicationAdherence(conditionId, startDate, endDate),
        recommendations
      };
    } catch (error) {
      logger.error('Error generating monthly report:', error);
      throw error;
    }
  }

  /**
   * Get control score for a patient across all conditions
   */
  async getControlScore(patientId: string): Promise<ControlScoreResponse> {
    try {
      const conditions = await ChronicCondition.find({
        patientId,
        status: { $in: ['active', 'managed'] }
      });

      const conditionScores: Array<{
        conditionId: string;
        conditionType: string;
        score: number;
        trend: 'improving' | 'stable' | 'declining';
      }> = [];

      let totalScore = 0;
      const trends: ('improving' | 'stable' | 'declining')[] = [];

      for (const condition of conditions) {
        const controlScore = await chronicCareService.calculateControl(
          condition._id.toString()
        );
        conditionScores.push({
          conditionId: condition._id.toString(),
          conditionType: condition.conditionType,
          score: controlScore.overall,
          trend: controlScore.trend
        });
        totalScore += controlScore.overall;
        trends.push(controlScore.trend);
      }

      const overallScore = conditions.length > 0
        ? Math.round(totalScore / conditions.length)
        : 0;

      // Determine overall trend
      const improvingCount = trends.filter((t) => t === 'improving').length;
      const decliningCount = trends.filter((t) => t === 'declining').length;

      let overallTrend: 'improving' | 'stable' | 'declining' = 'stable';
      if (improvingCount > decliningCount && improvingCount > conditions.length / 2) {
        overallTrend = 'improving';
      } else if (decliningCount > improvingCount && decliningCount > conditions.length / 2) {
        overallTrend = 'declining';
      }

      return {
        patientId,
        overallScore,
        conditions: conditionScores,
        overallTrend,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting control score:', error);
      throw error;
    }
  }

  /**
   * Calculate medication adherence for a period
   */
  private async calculateMedicationAdherence(
    conditionId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      // This would typically integrate with a medication tracking system
      // For now, return a placeholder based on reading frequency
      const condition = await ChronicCondition.findById(conditionId);
      if (!condition || condition.medications.length === 0) {
        return 100;
      }

      const readings = await ConditionReading.countDocuments({
        conditionId,
        recordedAt: { $gte: startDate, $lte: endDate }
      });

      // Estimate expected readings based on medication frequency
      const days = daysBetween(startDate, endDate);
      const expectedReadings = days; // At least one reading per day is expected

      const adherence = Math.min(100, Math.round((readings / expectedReadings) * 100));
      return adherence;
    } catch (error) {
      logger.error('Error calculating medication adherence:', error);
      return 0;
    }
  }

  /**
   * Generate recommendations based on condition data
   */
  private generateRecommendations(
    conditionType: ConditionType,
    averageValues: Record<string, { average: number; min: number; max: number; unit: string }>,
    inRangePercentage: Record<string, number>,
    controlScore: number
  ): string[] {
    const recommendations: string[] = [];

    // General recommendations based on control score
    if (controlScore >= 80) {
      recommendations.push('Excellent control! Continue current management plan.');
    } else if (controlScore >= 60) {
      recommendations.push('Good progress. Consider more frequent monitoring.');
    } else if (controlScore >= 40) {
      recommendations.push('Control needs improvement. Review medications with your doctor.');
    } else {
      recommendations.push('Urgent review needed with healthcare provider.');
    }

    // Specific recommendations based on reading types
    for (const [type, percentage] of Object.entries(inRangePercentage)) {
      if (percentage < 50) {
        const typeName = this.formatReadingType(type as ReadingType);
        switch (type) {
          case 'blood_sugar':
            recommendations.push(`Blood sugar frequently out of range (${percentage}%). Review diet and medication timing.`);
            break;
          case 'blood_pressure':
            recommendations.push(`Blood pressure out of range often (${percentage}%). Consider lifestyle modifications.`);
            break;
          case 'heart_rate':
            recommendations.push(`Heart rate irregularity detected (${percentage}% in range). Consult cardiologist.`);
            break;
          case 'weight':
            recommendations.push(`Weight outside target range (${percentage}% adherence). Review diet and exercise.`);
            break;
          default:
            recommendations.push(`${typeName} monitoring needs attention (${percentage}% in range).`);
        }
      }
    }

    // Condition-specific recommendations
    switch (conditionType) {
      case 'diabetes':
        if (averageValues['blood_sugar']) {
          const avg = averageValues['blood_sugar'].average;
          if (avg > 200) {
            recommendations.push('Average blood sugar is high. Consider adjusting insulin or diet.');
          } else if (avg < 80) {
            recommendations.push('Average blood sugar is low. Review hypoglycemia risk with doctor.');
          }
        }
        break;
      case 'hypertension':
        if (averageValues['blood_pressure']) {
          const avg = averageValues['blood_pressure'].average;
          if (avg > 130) {
            recommendations.push('Blood pressure averaging above target. Reduce sodium intake and stress.');
          }
        }
        break;
      case 'thyroid':
        recommendations.push('Ensure thyroid medication is taken on empty stomach, 30-60 minutes before breakfast.');
        break;
      case 'asthma':
      case 'copd':
        recommendations.push('Continue using controller inhaler as prescribed. Monitor peak flow readings.');
        break;
      case 'heart_disease':
        recommendations.push('Maintain heart-healthy diet and regular moderate exercise.');
        break;
    }

    return recommendations;
  }

  /**
   * Format reading type for display
   */
  private formatReadingType(type: ReadingType): string {
    const names: Record<ReadingType, string> = {
      blood_sugar: 'Blood Sugar',
      blood_pressure: 'Blood Pressure',
      heart_rate: 'Heart Rate',
      weight: 'Weight',
      thyroid: 'Thyroid (TSH)',
      lung_function: 'Lung Function',
      pain_level: 'Pain Level',
      mood: 'Mood Score'
    };
    return names[type] || type;
  }

  /**
   * Get patient overview report
   */
  async getPatientOverview(patientId: string): Promise<{
    patientId: string;
    totalConditions: number;
    activeConditions: Array<{
      conditionId: string;
      conditionType: string;
      severity: string;
      controlScore: number;
      lastReading: string;
    }>;
    overallControlScore: number;
    totalAlerts: number;
    unacknowledgedAlerts: number;
    recentTrend: 'improving' | 'stable' | 'declining';
  }> {
    try {
      const conditions = await ChronicCondition.find({
        patientId,
        status: { $in: ['active', 'managed'] }
      });

      const controlScore = await this.getControlScore(patientId);
      const alertStats = await alertService.getAlertStats(patientId);

      const activeConditions: Array<{
        conditionId: string;
        conditionType: string;
        severity: string;
        controlScore: number;
        lastReading: string;
      }> = [];

      for (const condition of conditions) {
        const lastReading = await ConditionReading.findOne({ conditionId: condition._id })
          .sort({ recordedAt: -1 })
          .lean();

        const conditionScore = controlScore.conditions.find(
          (c) => c.conditionId === condition._id.toString()
        );

        activeConditions.push({
          conditionId: condition._id.toString(),
          conditionType: condition.conditionType,
          severity: condition.severity,
          controlScore: conditionScore?.score || 0,
          lastReading: lastReading?.recordedAt.toISOString() || 'No readings'
        });
      }

      return {
        patientId,
        totalConditions: conditions.length,
        activeConditions,
        overallControlScore: controlScore.overallScore,
        totalAlerts: alertStats.total,
        unacknowledgedAlerts: alertStats.unacknowledged,
        recentTrend: controlScore.overallTrend
      };
    } catch (error) {
      logger.error('Error generating patient overview:', error);
      throw error;
    }
  }
}

export default new ReportingService();
