import { TrustAlert, TrustScore } from '../types';
import { TrustAlertModel, ITrustAlertDocument } from '../models';
import { config } from '../config';
import { alertLogger as logger } from '../utils/logger';

export type AlertType =
  | 'TRUST_DROP'
  | 'RISK_INCREASE'
  | 'LIMIT_THRESHOLD'
  | 'BLOCK_TRIGGERED'
  | 'COMPLIANCE_ISSUE';

export interface CreateAlertInput {
  merchantId: string;
  alertType: AlertType;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  previousScore?: number;
  currentScore?: number;
  metadata?: Record<string, unknown>;
}

export interface AlertFilter {
  merchantId?: string;
  alertType?: AlertType;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  acknowledged?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export class AlertService {
  private alertCallbacks: Array<(alert: TrustAlert) => void> = [];

  /**
   * Register a callback for new alerts
   */
  onAlert(callback: (alert: TrustAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Create a new alert
   */
  async createAlert(input: CreateAlertInput): Promise<TrustAlert> {
    const alert = new TrustAlertModel({
      merchantId: input.merchantId,
      alertType: input.alertType,
      severity: input.severity,
      message: input.message,
      previousScore: input.previousScore,
      currentScore: input.currentScore,
      metadata: input.metadata,
      createdAt: new Date(),
      acknowledged: false,
    });

    await alert.save();

    const alertData: TrustAlert = {
      merchantId: alert.merchantId,
      alertType: alert.alertType as AlertType,
      severity: alert.severity as 'INFO' | 'WARNING' | 'CRITICAL',
      message: alert.message,
      previousScore: alert.previousScore,
      currentScore: alert.currentScore,
      createdAt: alert.createdAt.toISOString(),
      acknowledged: alert.acknowledged,
      metadata: alert.metadata as Record<string, unknown> | undefined,
    };

    logger.info(`Created alert for ${input.merchantId}`, {
      type: input.alertType,
      severity: input.severity,
      message: input.message,
    });

    // Notify callbacks
    this.notifyCallbacks(alertData);

    // Send notifications based on severity
    if (input.severity === 'CRITICAL' || input.severity === 'WARNING') {
      await this.sendNotifications(alertData);
    }

    return alertData;
  }

  /**
   * Notify registered callbacks
   */
  private notifyCallbacks(alert: TrustAlert): void {
    for (const callback of this.alertCallbacks) {
      try {
        callback(alert);
      } catch (err) {
        logger.error('Alert callback error', {
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Send notifications for alerts
   */
  private async sendNotifications(alert: TrustAlert): Promise<void> {
    // Log notification (in production, this would send emails, SMS, push notifications, etc.)
    logger.info(`Sending alert notification`, {
      merchantId: alert.merchantId,
      type: alert.alertType,
      severity: alert.severity,
    });

    // In production, implement actual notification sending:
    // - Email to merchant
    // - SMS to merchant
    // - Push notification
    // - Webhook to merchant system
    // - Dashboard notification
  }

  /**
   * Get alerts with filtering
   */
  async getAlerts(
    filter: AlertFilter,
    page = 1,
    limit = 50
  ): Promise<{
    alerts: TrustAlert[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: Record<string, unknown> = {};

    if (filter.merchantId) {
      query.merchantId = filter.merchantId;
    }

    if (filter.alertType) {
      query.alertType = filter.alertType;
    }

    if (filter.severity) {
      query.severity = filter.severity;
    }

    if (filter.acknowledged !== undefined) {
      query.acknowledged = filter.acknowledged;
    }

    if (filter.startDate || filter.endDate) {
      query.createdAt = {};
      if (filter.startDate) {
        (query.createdAt as Record<string, Date>).$gte = filter.startDate;
      }
      if (filter.endDate) {
        (query.createdAt as Record<string, Date>).$lte = filter.endDate;
      }
    }

    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      TrustAlertModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TrustAlertModel.countDocuments(query),
    ]);

    return {
      alerts: alerts.map((a) => ({
        merchantId: a.merchantId,
        alertType: a.alertType as AlertType,
        severity: a.severity as 'INFO' | 'WARNING' | 'CRITICAL',
        message: a.message,
        previousScore: a.previousScore,
        currentScore: a.currentScore,
        createdAt: a.createdAt.toISOString(),
        acknowledged: a.acknowledged,
        metadata: a.metadata as Record<string, unknown> | undefined,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get unacknowledged alerts
   */
  async getUnacknowledgedAlerts(
    merchantId?: string,
    severity?: 'CRITICAL' | 'WARNING' | 'INFO'
  ): Promise<TrustAlert[]> {
    const query: Record<string, unknown> = { acknowledged: false };

    if (merchantId) {
      query.merchantId = merchantId;
    }

    if (severity) {
      query.severity = severity;
    }

    const alerts = await TrustAlertModel.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return alerts.map((a) => ({
      merchantId: a.merchantId,
      alertType: a.alertType as AlertType,
      severity: a.severity as 'INFO' | 'WARNING' | 'CRITICAL',
      message: a.message,
      previousScore: a.previousScore,
      currentScore: a.currentScore,
      createdAt: a.createdAt.toISOString(),
      acknowledged: a.acknowledged,
      metadata: a.metadata as Record<string, unknown> | undefined,
    }));
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string
  ): Promise<TrustAlert | null> {
    const alert = await TrustAlertModel.findById(alertId);

    if (!alert) {
      logger.warn(`Alert not found: ${alertId}`);
      return null;
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    await alert.save();

    logger.info(`Acknowledged alert ${alertId}`, { acknowledgedBy });

    return {
      merchantId: alert.merchantId,
      alertType: alert.alertType as AlertType,
      severity: alert.severity as 'INFO' | 'WARNING' | 'CRITICAL',
      message: alert.message,
      previousScore: alert.previousScore,
      currentScore: alert.currentScore,
      createdAt: alert.createdAt.toISOString(),
      acknowledged: alert.acknowledged,
      metadata: alert.metadata as Record<string, unknown> | undefined,
    };
  }

  /**
   * Acknowledge multiple alerts
   */
  async acknowledgeAlerts(
    alertIds: string[],
    acknowledgedBy: string
  ): Promise<number> {
    const result = await TrustAlertModel.updateMany(
      { _id: { $in: alertIds } },
      {
        $set: {
          acknowledged: true,
          acknowledgedBy,
          acknowledgedAt: new Date(),
        },
      }
    );

    logger.info(`Acknowledged ${result.modifiedCount} alerts`, { acknowledgedBy });

    return result.modifiedCount;
  }

  /**
   * Acknowledge all alerts for a merchant
   */
  async acknowledgeMerchantAlerts(
    merchantId: string,
    acknowledgedBy: string
  ): Promise<number> {
    const result = await TrustAlertModel.updateMany(
      { merchantId, acknowledged: false },
      {
        $set: {
          acknowledged: true,
          acknowledgedBy,
          acknowledgedAt: new Date(),
        },
      }
    );

    logger.info(`Acknowledged ${result.modifiedCount} alerts for ${merchantId}`, {
      acknowledgedBy,
    });

    return result.modifiedCount;
  }

  /**
   * Detect and create trust degradation alerts
   */
  async checkTrustDegradation(
    merchantId: string,
    currentScore: number,
    previousScore: number
  ): Promise<TrustAlert | null> {
    if (previousScore <= currentScore) {
      return null; // No degradation
    }

    const dropPercent = ((previousScore - currentScore) / previousScore) * 100;

    if (dropPercent >= config.alertThresholds.trustDropPercent) {
      return this.createAlert({
        merchantId,
        alertType: 'TRUST_DROP',
        severity: dropPercent >= 30 ? 'CRITICAL' : 'WARNING',
        message: `Trust score dropped by ${dropPercent.toFixed(1)}% (${previousScore} -> ${currentScore})`,
        previousScore,
        currentScore,
      });
    }

    return null;
  }

  /**
   * Detect and create risk increase alerts
   */
  async checkRiskIncrease(
    merchantId: string,
    currentRiskLevel: TrustScore['riskLevel'],
    previousRiskLevel: TrustScore['riskLevel']
  ): Promise<TrustAlert | null> {
    const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const currentIndex = riskLevels.indexOf(currentRiskLevel);
    const previousIndex = riskLevels.indexOf(previousRiskLevel);

    if (currentIndex <= previousIndex) {
      return null; // No risk increase
    }

    const severity =
      currentRiskLevel === 'CRITICAL' || currentRiskLevel === 'HIGH'
        ? 'CRITICAL'
        : 'WARNING';

    return this.createAlert({
      merchantId,
      alertType: 'RISK_INCREASE',
      severity,
      message: `Risk level increased from ${previousRiskLevel} to ${currentRiskLevel}`,
      previousScore: previousIndex,
      currentScore: currentIndex,
    });
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    unacknowledged: number;
    acknowledged: number;
  }> {
    const match: Record<string, unknown> = {};

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) {
        (match.createdAt as Record<string, Date>).$gte = startDate;
      }
      if (endDate) {
        (match.createdAt as Record<string, Date>).$lte = endDate;
      }
    }

    const [alerts, unacknowledgedCount, acknowledgedCount] = await Promise.all([
      TrustAlertModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            bySeverity: { $push: '$severity' },
            byType: { $push: '$alertType' },
          },
        },
      ]),
      TrustAlertModel.countDocuments({ ...match, acknowledged: false }),
      TrustAlertModel.countDocuments({ ...match, acknowledged: true }),
    ]);

    const result = alerts[0] || { bySeverity: [], byType: [] };

    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const severity of result.bySeverity as string[]) {
      bySeverity[severity] = (bySeverity[severity] || 0) + 1;
    }

    for (const type of result.byType as string[]) {
      byType[type] = (byType[type] || 0) + 1;
    }

    return {
      total: unacknowledgedCount + acknowledgedCount,
      bySeverity,
      byType,
      unacknowledged: unacknowledgedCount,
      acknowledged: acknowledgedCount,
    };
  }

  /**
   * Clean up old alerts
   */
  async cleanupOldAlerts(daysToKeep = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await TrustAlertModel.deleteMany({
      createdAt: { $lt: cutoffDate },
      acknowledged: true,
    });

    logger.info(`Cleaned up ${result.deletedCount} old alerts older than ${daysToKeep} days`);

    return result.deletedCount;
  }
}

// Export singleton instance
export const alertService = new AlertService();
export default alertService;
