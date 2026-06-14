/**
 * Churn Alert Service - Alert management
 */

import { AlertModel, IAlert } from '../models/alert';
import { logger } from '../utils/logger';

export class AlertService {
  /**
   * Get alerts
   */
  async getAlerts(filters?: {
    customerId?: string;
    severity?: string;
    acknowledged?: boolean;
    resolved?: boolean;
  }): Promise<IAlert[]> {
    const query: Record<string, unknown> = {};
    if (filters?.customerId) query.customerId = filters.customerId;
    if (filters?.severity) query.severity = filters.severity;
    if (filters?.acknowledged !== undefined) query.acknowledged = filters.acknowledged;
    if (filters?.resolved !== undefined) query.resolved = filters.resolved;

    return AlertModel.find(query).sort({ createdAt: -1 }).lean();
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
    interventionTaken: string
  ): Promise<IAlert | null> {
    const alert = await AlertModel.findByIdAndUpdate(
      alertId,
      {
        resolved: true,
        resolvedBy,
        resolvedAt: new Date(),
        interventionTaken,
      },
      { new: true }
    );

    if (alert) {
      logger.info(`Alert ${alertId} resolved by ${resolvedBy}`);
    }

    return alert;
  }

  /**
   * Get analytics on alerts
   */
  async getAnalytics(days: number = 30): Promise<{
    totalAlerts: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    avgResolutionTime: number;
    acknowledgedRate: number;
    resolvedRate: number;
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
      resolvedRate: alerts.length > 0 ? Math.round((resolvedCount / alerts.length) * 100) : 0,
    };
  }
}

export const alertService = new AlertService();