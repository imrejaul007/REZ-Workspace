import { CheckHistory, IAlert } from '../models/CheckHistory';
import { logger } from 'utils/logger.js';
import { activeAlertsGauge } from '../config/metrics';

export interface AlertSummary {
  alertId: string;
  influencerId: string;
  platform: string;
  username: string;
  type: string;
  severity: string;
  message: string;
  createdAt: Date;
}

export class AlertService {
  /**
   * Get all active (unacknowledged) alerts
   */
  async getActiveAlerts(options?: {
    severity?: 'info' | 'warning' | 'critical';
    platform?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ alerts: AlertSummary[]; total: number }> {
    const { severity, platform, limit = 50, offset = 0 } = options || {};

    const query: Record<string, unknown> = { 'alerts.acknowledged': false };

    if (severity) {
      query['alerts.severity'] = severity;
    }

    const histories = await CheckHistory.find(query)
      .select('influencerId platform username alerts')
      .limit(limit)
      .skip(offset)
      .lean();

    const alerts: AlertSummary[] = [];
    let total = 0;

    for (const history of histories) {
      if (platform && history.platform !== platform) continue;

      const unacknowledgedAlerts = history.alerts.filter((a) => !a.acknowledged);

      for (const alert of unacknowledgedAlerts) {
        if (severity && alert.severity !== severity) continue;

        alerts.push({
          alertId: alert.alertId,
          influencerId: history.influencerId,
          platform: history.platform,
          username: history.username,
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          createdAt: alert.createdAt,
        });
        total++;
      }
    }

    // Sort by severity and date
    alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      const severityDiff = severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return { alerts: alerts.slice(offset, offset + limit), total };
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    alertId: string,
    influencerId: string,
    acknowledgedBy?: string,
    notes?: string
  ): Promise<boolean> {
    const history = await CheckHistory.findOne({ influencerId });

    if (!history) {
      logger.warn('Alert acknowledgement failed: history not found', { alertId, influencerId });
      return false;
    }

    const alert = history.alerts.find((a) => a.alertId === alertId);
    if (!alert) {
      logger.warn('Alert acknowledgement failed: alert not found', { alertId });
      return false;
    }

    if (alert.acknowledged) {
      logger.info('Alert already acknowledged', { alertId });
      return true;
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();
    if (notes) {
      alert.notes = notes;
    }

    await history.save();

    // Update metrics
    await this.updateAlertMetrics();

    logger.info('Alert acknowledged', { alertId, influencerId, acknowledgedBy });

    return true;
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    recentCount: number; // Last 24 hours
  }> {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const histories = await CheckHistory.find({
      'alerts.acknowledged': false,
    }).select('alerts');

    const stats = {
      total: 0,
      bySeverity: { critical: 0, warning: 0, info: 0 },
      byType: {} as Record<string, number>,
      recentCount: 0,
    };

    for (const history of histories) {
      for (const alert of history.alerts) {
        if (alert.acknowledged) continue;

        stats.total++;
        stats.bySeverity[alert.severity]++;
        stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;

        if (alert.createdAt >= twentyFourHoursAgo) {
          stats.recentCount++;
        }
      }
    }

    return stats;
  }

  /**
   * Update alert metrics for Prometheus
   */
  private async updateAlertMetrics(): Promise<void> {
    const { total } = await this.getActiveAlerts();
    activeAlertsGauge.set(total);
  }

  /**
   * Get alerts for a specific influencer
   */
  async getAlertsForInfluencer(influencerId: string): Promise<IAlert[]> {
    const history = await CheckHistory.findOne({ influencerId });

    if (!history) {
      return [];
    }

    return history.alerts;
  }

  /**
   * Acknowledge all alerts for an influencer
   */
  async acknowledgeAllAlerts(
    influencerId: string,
    acknowledgedBy?: string,
    notes?: string
  ): Promise<number> {
    const history = await CheckHistory.findOne({ influencerId });

    if (!history) {
      return 0;
    }

    let count = 0;
    const now = new Date();

    for (const alert of history.alerts) {
      if (!alert.acknowledged) {
        alert.acknowledged = true;
        alert.acknowledgedBy = acknowledgedBy;
        alert.acknowledgedAt = now;
        if (notes) {
          alert.notes = notes;
        }
        count++;
      }
    }

    if (count > 0) {
      await history.save();
      await this.updateAlertMetrics();
    }

    logger.info('All alerts acknowledged', { influencerId, count, acknowledgedBy });

    return count;
  }
}

export const alertService = new AlertService();