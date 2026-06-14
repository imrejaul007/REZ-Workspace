import { Alert, IAlert } from '../models/chronicCare';
import { AlertType, AlertSeverity, ReadingType, AcknowledgeAlertInput, TARGET_RANGES, ConditionType } from '../types';
import logger from '../utils/logger';

class AlertService {
  /**
   * Check if a reading is out of range and create alert if needed
   */
  async checkThresholds(
    patientId: string,
    conditionId: string,
    readingType: ReadingType,
    value: number,
    unit: string
  ): Promise<IAlert | null> {
    try {
      // Get condition to determine target ranges
      const { ChronicCondition } = await import('../models/chronicCare');
      const condition = await ChronicCondition.findById(conditionId);

      if (!condition) {
        logger.warn('Condition not found for threshold check', { conditionId });
        return null;
      }

      const targetRanges = TARGET_RANGES[condition.conditionType as ConditionType];
      const range = targetRanges[readingType];

      if (!range) {
        return null;
      }

      let severity: AlertSeverity = 'low';
      let message = '';

      // Check if value is out of range
      if (value < range.min) {
        const deviation = ((range.min - value) / range.min) * 100;
        severity = this.calculateSeverity(deviation);
        message = `${this.formatReadingType(readingType)} is LOW: ${value}${unit} (target: ${range.min}-${range.max}${unit}). Patient is ${deviation.toFixed(1)}% below minimum.`;
      } else if (value > range.max) {
        const deviation = ((value - range.max) / range.max) * 100;
        severity = this.calculateSeverity(deviation);
        message = `${this.formatReadingType(readingType)} is HIGH: ${value}${unit} (target: ${range.min}-${range.max}${unit}). Patient is ${deviation.toFixed(1)}% above maximum.`;
      }

      // Create alert if out of range
      if (message) {
        const alert = await this.createAlert({
          patientId,
          conditionId,
          type: 'out_of_range',
          severity,
          message,
          details: {
            readingType,
            value,
            unit,
            targetMin: range.min,
            targetMax: range.max,
            deviation: value < range.min
              ? ((range.min - value) / range.min) * 100
              : ((value - range.max) / range.max) * 100
          }
        });

        logger.info('Out of range alert created', {
          alertId: alert._id,
          patientId,
          readingType,
          value,
          severity
        });

        return alert;
      }

      return null;
    } catch (error) {
      logger.error('Error checking thresholds:', error);
      throw error;
    }
  }

  /**
   * Calculate severity based on deviation percentage
   */
  private calculateSeverity(deviation: number): AlertSeverity {
    if (deviation >= 50) return 'critical';
    if (deviation >= 25) return 'high';
    if (deviation >= 10) return 'medium';
    return 'low';
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
   * Create a new alert
   */
  async createAlert(params: {
    patientId: string;
    conditionId: string;
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    details?: Record<string, unknown>;
  }): Promise<IAlert> {
    try {
      const alert = new Alert({
        patientId: params.patientId,
        conditionId: params.conditionId,
        type: params.type,
        severity: params.severity,
        message: params.message,
        details: params.details
      });

      await alert.save();

      return alert;
    } catch (error) {
      logger.error('Error creating alert:', error);
      throw error;
    }
  }

  /**
   * Get alerts for a patient
   */
  async getAlerts(
    patientId: string,
    options: {
      acknowledged?: boolean;
      severity?: AlertSeverity;
      type?: AlertType;
      conditionId?: string;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<IAlert[]> {
    try {
      const query: Record<string, unknown> = { patientId };

      if (options.acknowledged !== undefined) {
        query.acknowledged = options.acknowledged;
      }
      if (options.severity) {
        query.severity = options.severity;
      }
      if (options.type) {
        query.type = options.type;
      }
      if (options.conditionId) {
        query.conditionId = options.conditionId;
      }

      const alerts = await Alert.find(query)
        .sort({ createdAt: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 50)
        .lean();

      return alerts as IAlert[];
    } catch (error) {
      logger.error('Error getting alerts:', error);
      throw error;
    }
  }

  /**
   * Get unacknowledged alerts count for a condition
   */
  async getActiveAlertCount(conditionId: string): Promise<number> {
    try {
      const count = await Alert.countDocuments({
        conditionId,
        acknowledged: false
      });
      return count;
    } catch (error) {
      logger.error('Error getting active alert count:', error);
      throw error;
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    alertId: string,
    input: AcknowledgeAlertInput
  ): Promise<IAlert | null> {
    try {
      const alert = await Alert.findByIdAndUpdate(
        alertId,
        {
          $set: {
            acknowledged: true,
            acknowledgedBy: input.acknowledgedBy,
            acknowledgedAt: new Date(),
            acknowledgeNotes: input.notes
          }
        },
        { new: true }
      ).lean();

      if (alert) {
        logger.info('Alert acknowledged', {
          alertId,
          acknowledgedBy: input.acknowledgedBy
        });
      }

      return alert as IAlert | null;
    } catch (error) {
      logger.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  /**
   * Create a medication reminder alert
   */
  async createMedicationReminder(
    patientId: string,
    conditionId: string,
    medicationName: string,
    scheduledTime: Date
  ): Promise<IAlert> {
    try {
      const alert = await this.createAlert({
        patientId,
        conditionId,
        type: 'medication_due',
        severity: 'medium',
        message: `Time to take ${medicationName}`,
        details: {
          medicationName,
          scheduledTime: scheduledTime.toISOString()
        }
      });

      logger.info('Medication reminder created', {
        alertId: alert._id,
        patientId,
        medicationName
      });

      return alert;
    } catch (error) {
      logger.error('Error creating medication reminder:', error);
      throw error;
    }
  }

  /**
   * Create an appointment reminder alert
   */
  async createAppointmentReminder(
    patientId: string,
    conditionId: string,
    appointmentDate: Date,
    appointmentType: string
  ): Promise<IAlert> {
    try {
      const alert = await this.createAlert({
        patientId,
        conditionId,
        type: 'appointment_due',
        severity: 'high',
        message: `Upcoming ${appointmentType} appointment on ${appointmentDate.toLocaleDateString()}`,
        details: {
          appointmentDate: appointmentDate.toISOString(),
          appointmentType
        }
      });

      logger.info('Appointment reminder created', {
        alertId: alert._id,
        patientId,
        appointmentDate
      });

      return alert;
    } catch (error) {
      logger.error('Error creating appointment reminder:', error);
      throw error;
    }
  }

  /**
   * Create a trend concern alert
   */
  async createTrendAlert(
    patientId: string,
    conditionId: string,
    readingType: ReadingType,
    trend: 'improving' | 'stable' | 'declining',
    details: Record<string, unknown>
  ): Promise<IAlert> {
    try {
      if (trend !== 'declining') {
        return null as unknown as IAlert;
      }

      const severity: AlertSeverity = 'high';
      const message = `Concerning trend detected for ${this.formatReadingType(readingType)}. Values have been declining over the past period.`;

      const alert = await this.createAlert({
        patientId,
        conditionId,
        type: 'trend_concern',
        severity,
        message,
        details: {
          readingType,
          trend,
          ...details
        }
      });

      logger.info('Trend alert created', {
        alertId: alert._id,
        patientId,
        readingType,
        trend
      });

      return alert;
    } catch (error) {
      logger.error('Error creating trend alert:', error);
      throw error;
    }
  }

  /**
   * Delete all alerts for a condition
   */
  async deleteAlertsForCondition(conditionId: string): Promise<number> {
    try {
      const result = await Alert.deleteMany({ conditionId });
      logger.info('Alerts deleted for condition', {
        conditionId,
        count: result.deletedCount
      });
      return result.deletedCount;
    } catch (error) {
      logger.error('Error deleting alerts:', error);
      throw error;
    }
  }

  /**
   * Get alert statistics for a patient
   */
  async getAlertStats(patientId: string): Promise<{
    total: number;
    unacknowledged: number;
    bySeverity: Record<AlertSeverity, number>;
    byType: Record<AlertType, number>;
  }> {
    try {
      const alerts = await Alert.find({ patientId });

      const stats = {
        total: alerts.length,
        unacknowledged: alerts.filter((a) => !a.acknowledged).length,
        bySeverity: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        } as Record<AlertSeverity, number>,
        byType: {
          out_of_range: 0,
          medication_due: 0,
          appointment_due: 0,
          trend_concern: 0
        } as Record<AlertType, number>
      };

      for (const alert of alerts) {
        if (!alert.acknowledged) {
          stats.bySeverity[alert.severity as AlertSeverity]++;
        }
        stats.byType[alert.type as AlertType]++;
      }

      return stats;
    } catch (error) {
      logger.error('Error getting alert stats:', error);
      throw error;
    }
  }
}

export default new AlertService();
