/**
 * Alert Service - Alert management and notifications
 */

import { AlertModel, IAlert } from '../models/alert';
import { logger } from '../utils/logger';

export class AlertService {
  /**
   * Get alerts for a customer
   */
  async getAlerts(customerId?: string, acknowledged?: boolean): Promise<IAlert[]> {
    const query: Record<string, unknown> = {};
    if (customerId) query.customerId = customerId;
    if (acknowledged !== undefined) query.acknowledged = acknowledged;

    return AlertModel.find(query).sort({ createdAt: -1 }).lean();
  }

  /**
   * Get active (unacknowledged) alerts
   */
  async getActiveAlerts(severity?: string): Promise<IAlert[]> {
    const query: Record<string, unknown> = { acknowledged: false };
    if (severity) query.severity = severity;

    return AlertModel.find(query).sort({ severity: -1, createdAt: -1 }).lean();
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<IAlert | null> {
    const alert = await AlertModel.findByIdAndUpdate(
      alertId,
      {
        acknowledged: true,
        acknowledgedBy,
        acknowledgedAt: new Date(),
      },
      { new: true }
    );

    if (alert) {
      logger.info(`Alert ${alertId} acknowledged by ${acknowledgedBy}`);
    }

    return alert;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(
    alertId: string,
    resolvedBy: string,
    actionTaken: string
  ): Promise<IAlert | null> {
    const alert = await AlertModel.findByIdAndUpdate(
      alertId,
      {
        resolved: true,
        resolvedBy,
        resolvedAt: new Date(),
        actionTaken,
      },
      { new: true }
    );

    if (alert) {
      logger.info(`Alert ${alertId} resolved by ${resolvedBy}`);
    }

    return alert;
  }

  /**
   * Get alert analytics
   */
  async getAlertAnalytics(days: number = 30): Promise<{
    totalAlerts: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    avgResolutionTime: number;
    acknowledgedRate: number;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const alerts = await AlertModel.find({
      createdAt: { $gte: startDate },
    }).lean();

    const bySeverity: Record<string, number> = { info: 0, warning: 0, critical: 0 };
    const byType: Record<string, number> = {};

    let resolvedCount = 0;
    let totalResolutionTime = 0;
    let acknowledgedCount = 0;

    alerts.forEach(alert => {
      bySeverity[alert.severity]++;
      byType[alert.type] = (byType[alert.type] || 0) + 1;

      if (alert.resolved && alert.resolvedAt && alert.createdAt) {
        resolvedCount++;
        totalResolutionTime += alert.resolvedAt.getTime() - alert.createdAt.getTime();
      }

      if (alert.acknowledged) {
        acknowledgedCount++;
      }
    });

    return {
      totalAlerts: alerts.length,
      bySeverity,
      byType,
      avgResolutionTime: resolvedCount > 0 ? Math.round(totalResolutionTime / resolvedCount / 60000) : 0,
      acknowledgedRate: alerts.length > 0 ? Math.round((acknowledgedCount / alerts.length) * 100) : 0,
    };
  }

  /**
   * Create a new alert
   */
  async createAlert(data: Partial<IAlert>): Promise<IAlert> {
    const alert = await AlertModel.create({
      ...data,
      acknowledged: false,
      resolved: false,
    });

    logger.info(`Alert created: ${alert._id} for customer ${alert.customerId}`);
    return alert;
  }

  /**
   * Bulk acknowledge alerts
   */
  async bulkAcknowledge(alertIds: string[], acknowledgedBy: string): Promise<number> {
    const result = await AlertModel.updateMany(
      { _id: { $in: alertIds } },
      {
        acknowledged: true,
        acknowledgedBy,
        acknowledgedAt: new Date(),
      }
    );

    logger.info(`Bulk acknowledged ${result.modifiedCount} alerts by ${acknowledgedBy}`);
    return result.modifiedCount;
  }

  /**
   * Get alert by ID
   */
  async getAlertById(alertId: string): Promise<IAlert | null> {
    return AlertModel.findById(alertId).lean();
  }
}

export const alertService = new AlertService();