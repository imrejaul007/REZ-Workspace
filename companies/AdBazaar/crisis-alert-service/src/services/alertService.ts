/**
 * Alert Service - Business logic for crisis alerts
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CrisisAlert,
  ICrisisAlert,
  AlertSeverity,
  AlertType,
  AlertStatus,
  IMonitoringKeyword,
  CrisisPlaybook,
  ICrisisPlaybook,
  PostMortem,
  IPostMortem,
} from '../models';
import { crisisMetrics } from '../utils/metrics';
import logger from '../utils/logger';
import { NotificationService } from './notificationService';
import { io } from '../index';

export interface CreateAlertInput {
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  description: string;
  source: {
    platform: string;
    postId?: string;
    postUrl?: string;
    authorUsername?: string;
  };
  metrics: {
    mentions: number;
    sentiment: number;
    reach?: number;
    velocity?: number;
  };
  affectedBrand?: string;
}

export interface AlertFilter {
  status?: AlertStatus;
  severity?: AlertSeverity;
  type?: AlertType;
  affectedBrand?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class AlertService {
  private static notificationService = new NotificationService();

  /**
   * Create a new crisis alert
   */
  static async createAlert(input: CreateAlertInput, userId?: string): Promise<ICrisisAlert> {
    const alert = new CrisisAlert({
      alertId: `ALERT-${uuidv4().slice(0, 8).toUpperCase()}`,
      ...input,
      status: AlertStatus.ACTIVE,
    });

    await alert.save();

    // Update metrics
    crisisMetrics.incrementAlertsCreated(input.severity, input.type);
    await this.updateActiveAlertsMetric();

    // Emit socket event
    io.emit('alert:created', {
      alertId: alert.alertId,
      severity: alert.severity,
      type: alert.type,
      title: alert.title,
    });

    // Check and execute playbooks
    await this.checkPlaybooks(alert);

    // Send notifications
    await this.notificationService.sendAlertNotification(alert);

    logger.info('Alert created', {
      alertId: alert.alertId,
      severity: alert.severity,
      type: alert.type,
    });

    return alert;
  }

  /**
   * Get alert by ID
   */
  static async getAlertById(alertId: string): Promise<ICrisisAlert | null> {
    return CrisisAlert.findOne({ alertId });
  }

  /**
   * List alerts with filters and pagination
   */
  static async listAlerts(
    filters: AlertFilter = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<ICrisisAlert>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;

    const query: Record<string, unknown> = {};

    if (filters.status) query.status = filters.status;
    if (filters.severity) query.severity = filters.severity;
    if (filters.type) query.type = filters.type;
    if (filters.affectedBrand) query.affectedBrand = filters.affectedBrand;

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) (query.createdAt as Record<string, Date>).$gte = filters.startDate;
      if (filters.endDate) (query.createdAt as Record<string, Date>).$lte = filters.endDate;
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
      CrisisAlert.find(query).sort(sort).skip(skip).limit(limit),
      CrisisAlert.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Acknowledge an alert
   */
  static async acknowledgeAlert(alertId: string, userId: string): Promise<ICrisisAlert | null> {
    const alert = await CrisisAlert.findOneAndUpdate(
      { alertId, status: { $ne: AlertStatus.RESOLVED } },
      {
        status: AlertStatus.ACKNOWLEDGED,
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      },
      { new: true }
    );

    if (alert) {
      crisisMetrics.incrementAlertsAcknowledged();
      await this.updateActiveAlertsMetric();

      io.emit('alert:updated', {
        alertId: alert.alertId,
        status: alert.status,
        acknowledgedBy: userId,
      });

      logger.info('Alert acknowledged', { alertId, userId });
    }

    return alert;
  }

  /**
   * Escalate an alert
   */
  static async escalateAlert(
    alertId: string,
    escalateTo: string[],
    userId: string
  ): Promise<ICrisisAlert | null> {
    const alert = await CrisisAlert.findOneAndUpdate(
      { alertId },
      {
        status: AlertStatus.ESCALATED,
        escalatedTo,
      },
      { new: true }
    );

    if (alert) {
      crisisMetrics.incrementAlertsEscalated();
      await this.updateActiveAlertsMetric();

      io.emit('alert:escalated', {
        alertId: alert.alertId,
        escalatedTo,
      });

      // Send escalation notifications
      await this.notificationService.sendEscalationNotification(alert, escalateTo);

      logger.info('Alert escalated', { alertId, escalateTo, userId });
    }

    return alert;
  }

  /**
   * Resolve an alert
   */
  static async resolveAlert(
    alertId: string,
    resolution: string,
    userId: string
  ): Promise<ICrisisAlert | null> {
    const alert = await CrisisAlert.findOneAndUpdate(
      { alertId },
      {
        status: AlertStatus.RESOLVED,
        resolution,
        resolvedAt: new Date(),
      },
      { new: true }
    );

    if (alert) {
      crisisMetrics.incrementAlertsResolved();
      await this.updateActiveAlertsMetric();

      io.emit('alert:resolved', {
        alertId: alert.alertId,
        resolution,
      });

      logger.info('Alert resolved', { alertId, resolution, userId });
    }

    return alert;
  }

  /**
   * Get alert history with filters
   */
  static async getAlertHistory(
    filters: AlertFilter = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<ICrisisAlert>> {
    // Always include resolved alerts in history
    return this.listAlerts({ ...filters }, pagination);
  }

  /**
   * Get daily digest
   */
  static async getDailyDigest(): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    topAlerts: ICrisisAlert[];
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const alerts = await CrisisAlert.find({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    alerts.forEach((alert) => {
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
      byType[alert.type] = (byType[alert.type] || 0) + 1;
      byStatus[alert.status] = (byStatus[alert.status] || 0) + 1;
    });

    // Sort by severity for top alerts (critical first)
    const severityOrder = ['critical', 'high', 'medium', 'low'];
    const topAlerts = alerts
      .sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity))
      .slice(0, 10);

    return {
      total: alerts.length,
      bySeverity,
      byType,
      byStatus,
      topAlerts,
    };
  }

  /**
   * Check and execute relevant playbooks
   */
  private static async checkPlaybooks(alert: ICrisisAlert): Promise<void> {
    const playbooks = await CrisisPlaybook.find({});

    for (const playbook of playbooks) {
      const conditions = playbook.triggerConditions;

      let matches = true;

      if (conditions.sentimentThreshold !== undefined) {
        matches = matches && alert.metrics.sentiment <= conditions.sentimentThreshold;
      }

      if (conditions.mentionThreshold !== undefined) {
        matches = matches && alert.metrics.mentions >= conditions.mentionThreshold;
      }

      if (conditions.velocityThreshold !== undefined) {
        matches = matches && (alert.metrics.velocity || 0) >= conditions.velocityThreshold;
      }

      if (conditions.keywords && conditions.keywords.length > 0) {
        matches =
          matches &&
          conditions.keywords.some((kw) =>
            alert.title.toLowerCase().includes(kw.toLowerCase()) ||
            alert.description.toLowerCase().includes(kw.toLowerCase())
          );
      }

      if (matches) {
        crisisMetrics.incrementPlaybooksExecuted(playbook.playbookId);

        // Execute playbook steps (in real implementation, this would be async)
        logger.info('Playbook triggered', {
          playbookId: playbook.playbookId,
          alertId: alert.alertId,
        });

        // Send playbook notifications
        for (const notification of playbook.notifications) {
          await this.notificationService.sendPlaybookNotification(
            alert,
            playbook,
            notification
          );
        }
      }
    }
  }

  /**
   * Update active alerts metrics
   */
  private static async updateActiveAlertsMetric(): Promise<void> {
    const activeAlerts = await CrisisAlert.aggregate([
      { $match: { status: { $in: [AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED, AlertStatus.ESCALATED] } } },
      { $group: { _id: { severity: '$severity', type: '$type' }, count: { $sum: 1 } } },
    ]);

    // Reset all metrics
    crisisMetrics.setActiveAlerts('critical', 'all', 0);
    crisisMetrics.setActiveAlerts('high', 'all', 0);
    crisisMetrics.setActiveAlerts('medium', 'all', 0);
    crisisMetrics.setActiveAlerts('low', 'all', 0);

    // Set actual counts
    activeAlerts.forEach((group) => {
      crisisMetrics.setActiveAlerts(group._id.severity, group._id.type, group.count);
    });
  }

  /**
   * Delete an alert
   */
  static async deleteAlert(alertId: string): Promise<boolean> {
    const result = await CrisisAlert.deleteOne({ alertId });
    if (result.deletedCount > 0) {
      await this.updateActiveAlertsMetric();
      logger.info('Alert deleted', { alertId });
      return true;
    }
    return false;
  }

  /**
   * Get alert statistics
   */
  static async getAlertStats(days: number = 30): Promise<{
    total: number;
    active: number;
    resolved: number;
    avgResolutionTime: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const alerts = await CrisisAlert.find({ createdAt: { $gte: startDate } });

    const resolvedAlerts = alerts.filter((a) => a.status === AlertStatus.RESOLVED && a.resolvedAt);

    let avgResolutionTime = 0;
    if (resolvedAlerts.length > 0) {
      const totalTime = resolvedAlerts.reduce((sum, alert) => {
        const resolutionTime = alert.resolvedAt!.getTime() - alert.createdAt.getTime();
        return sum + resolutionTime;
      }, 0);
      avgResolutionTime = totalTime / resolvedAlerts.length / (1000 * 60); // in minutes
    }

    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};

    alerts.forEach((alert) => {
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
      byType[alert.type] = (byType[alert.type] || 0) + 1;
    });

    return {
      total: alerts.length,
      active: alerts.filter((a) => a.status !== AlertStatus.RESOLVED).length,
      resolved: resolvedAlerts.length,
      avgResolutionTime: Math.round(avgResolutionTime),
      bySeverity,
      byType,
    };
  }
}
