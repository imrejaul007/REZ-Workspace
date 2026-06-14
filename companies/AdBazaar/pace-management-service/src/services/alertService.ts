import { PacingAlert, CampaignPacing, PacingStatus } from '../models';
import { AlertThreshold, AlertSeverity, IPacingAlertDocument } from '../types';
import { alertLogger } from '../utils/logger';
import { pacingAlertsTotal, pacingAlertsActive } from '../utils/metrics';
import axios from 'axios';

export interface CreateAlertInput {
  campaignId: string;
  alertType: AlertThreshold;
  threshold: number;
  severity?: AlertSeverity;
  message?: string;
  notificationChannels?: string[];
}

export interface AlertResult {
  alerts: IPacingAlertDocument[];
  triggered: number;
  notifications: number;
}

export class AlertService {
  /**
   * Create a new pacing alert
   */
  async createAlert(input: CreateAlertInput): Promise<IPacingAlertDocument> {
    alertLogger.info('Creating pacing alert', { campaignId: input.campaignId, alertType: input.alertType });

    // Check if alert already exists
    const existing = await PacingAlert.findOne({
      campaignId: input.campaignId,
      alertType: input.alertType
    });

    if (existing) {
      alertLogger.warn('Alert already exists', { campaignId: input.campaignId, alertType: input.alertType });
      throw new Error(`Alert already exists for campaign ${input.campaignId} with type ${input.alertType}`);
    }

    const alert = new PacingAlert({
      campaignId: input.campaignId,
      alertType: input.alertType,
      threshold: input.threshold,
      severity: input.severity || AlertSeverity.WARNING,
      message: input.message || this.generateDefaultMessage(input.alertType, input.threshold),
      notificationChannels: input.notificationChannels || ['email'],
      isEnabled: true,
      isTriggered: false
    });

    await alert.save();

    alertLogger.info('Alert created successfully', { alertId: alert._id, campaignId: input.campaignId });

    return alert;
  }

  /**
   * Get all alerts for a campaign
   */
  async getAlerts(campaignId: string): Promise<IPacingAlertDocument[]> {
    alertLogger.debug('Getting alerts for campaign', { campaignId });
    return PacingAlert.getCampaignAlerts(campaignId);
  }

  /**
   * Get active (triggered) alerts
   */
  async getActiveAlerts(): Promise<IPacingAlertDocument[]> {
    alertLogger.debug('Getting active alerts');
    return PacingAlert.find({
      isTriggered: true,
      isEnabled: true
    }).sort({ lastTriggered: -1 });
  }

  /**
   * Get alerts by severity
   */
  async getAlertsBySeverity(severity: AlertSeverity): Promise<IPacingAlertDocument[]> {
    return PacingAlert.find({ severity, isEnabled: true });
  }

  /**
   * Update alert configuration
   */
  async updateAlert(alertId: string, updates: Partial<CreateAlertInput>): Promise<IPacingAlertDocument | null> {
    alertLogger.info('Updating alert', { alertId });

    const alert = await PacingAlert.findById(alertId);
    if (!alert) {
      return null;
    }

    if (updates.threshold !== undefined) alert.threshold = updates.threshold;
    if (updates.severity !== undefined) alert.severity = updates.severity;
    if (updates.message !== undefined) alert.message = updates.message;
    if (updates.notificationChannels !== undefined) {
      alert.notificationChannels = updates.notificationChannels;
    }

    await alert.save();

    alertLogger.info('Alert updated successfully', { alertId });

    return alert;
  }

  /**
   * Delete alert
   */
  async deleteAlert(alertId: string): Promise<boolean> {
    alertLogger.info('Deleting alert', { alertId });

    const result = await PacingAlert.deleteOne({ _id: alertId });

    if (result.deletedCount > 0) {
      pacingAlertsActive.dec();
      alertLogger.info('Alert deleted successfully', { alertId });
      return true;
    }

    return false;
  }

  /**
   * Enable/disable alert
   */
  async setAlertEnabled(alertId: string, enabled: boolean): Promise<IPacingAlertDocument | null> {
    const alert = await PacingAlert.findByIdAndUpdate(
      alertId,
      { isEnabled: enabled, isTriggered: false },
      { new: true }
    );

    if (alert && enabled) {
      pacingAlertsActive.inc();
    } else if (alert) {
      pacingAlertsActive.dec();
    }

    return alert;
  }

  /**
   * Check and trigger alerts for a campaign
   */
  async checkAlerts(campaignId: string): Promise<AlertResult> {
    alertLogger.debug('Checking alerts for campaign', { campaignId });

    const pacing = await CampaignPacing.findOne({ campaignId });
    if (!pacing) {
      throw new Error(`Campaign pacing not found for ${campaignId}`);
    }

    const latestStatus = await PacingStatus.getLatestStatus(campaignId);
    const alerts = await PacingAlert.find({ campaignId, isEnabled: true });

    let triggered = 0;
    let notifications = 0;

    for (const alert of alerts) {
      const shouldTrigger = await this.evaluateAlert(alert, pacing, latestStatus);

      if (shouldTrigger && !alert.isTriggered) {
        alert.trigger();
        await alert.save();

        triggered++;
        pacingAlertsTotal.inc({
          alert_type: alert.alertType,
          severity: alert.severity
        });

        // Send notification
        const sent = await this.sendNotification(alert);
        if (sent) notifications++;

        alertLogger.warn('Alert triggered', {
          campaignId,
          alertType: alert.alertType,
          severity: alert.severity
        });
      } else if (!shouldTrigger && alert.isTriggered) {
        alert.reset();
        await alert.save();
      }
    }

    return {
      alerts,
      triggered,
      notifications
    };
  }

  /**
   * Evaluate if alert should trigger
   */
  private async evaluateAlert(
    alert: IPacingAlertDocument,
    pacing: any,
    status: any
  ): Promise<boolean> {
    const currentSpent = status?.spent || 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (alert.alertType) {
      case AlertThreshold.DAILY_BUDGET:
        const dailySpent = currentSpent; // Simplified - would need daily aggregation
        return dailySpent >= alert.threshold;

      case AlertThreshold.TOTAL_BUDGET:
        return currentSpent >= alert.threshold;

      case AlertThreshold.PACE_DEVIATION:
        const pacePercentage = status?.pacePercentage || 0;
        return Math.abs(pacePercentage - 100) >= alert.threshold;

      case AlertThreshold.SPEND_RATE:
        // Calculate spend rate (spend per hour)
        const currentHour = new Date().getHours();
        const hourlyRate = currentSpent / (currentHour + 1);
        return hourlyRate > alert.threshold * (pacing.dailyBudget / 24);

      default:
        return false;
    }
  }

  /**
   * Send notification for alert
   */
  private async sendNotification(alert: IPacingAlertDocument): Promise<boolean> {
    alertLogger.info('Sending alert notification', {
      alertId: alert._id,
      channels: alert.notificationChannels
    });

    const notificationPayload = {
      type: 'pacing_alert',
      campaignId: alert.campaignId,
      alertType: alert.alertType,
      severity: alert.severity,
      message: alert.message,
      threshold: alert.threshold,
      currentValue: alert.currentValue,
      timestamp: new Date().toISOString()
    };

    // Send to each notification channel
    for (const channel of alert.notificationChannels) {
      try {
        await this.sendToChannel(channel, notificationPayload);
      } catch (error: any) {
        alertLogger.error('Failed to send notification', { channel, error: error.message });
      }
    }

    return true;
  }

  /**
   * Send notification to specific channel
   */
  private async sendToChannel(channel: string, payload: any): Promise<void> {
    const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';

    switch (channel) {
      case 'email':
        await this.sendEmailNotification(payload);
        break;
      case 'push':
        await this.sendPushNotification(payload);
        break;
      case 'webhook':
        await this.sendWebhookNotification(payload);
        break;
      case 'sms':
        await this.sendSmsNotification(payload);
        break;
      case 'slack':
        await this.sendSlackNotification(payload);
        break;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(payload: any): Promise<void> {
    const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';

    await axios.post(`${notificationServiceUrl}/api/notifications/email`, {
      to: 'campaign-manager@adbazaar.com',
      subject: `[${payload.severity.toUpperCase()}] Pacing Alert - Campaign ${payload.campaignId}`,
      body: payload.message
    }, {
      headers: {
        'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
      },
      timeout: 5000
    });
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(payload: any): Promise<void> {
    const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';

    await axios.post(`${notificationServiceUrl}/api/notifications/push`, {
      title: 'Pacing Alert',
      body: payload.message,
      data: payload
    }, {
      headers: {
        'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
      },
      timeout: 5000
    });
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(payload: any): Promise<void> {
    // Send to configured webhook URLs
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;

    if (webhookUrl) {
      await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSmsNotification(payload: any): Promise<void> {
    const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';

    await axios.post(`${notificationServiceUrl}/api/notifications/sms`, {
      to: process.env.ALERT_SMS_RECIPIENT,
      message: payload.message
    }, {
      headers: {
        'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
      },
      timeout: 5000
    });
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(payload: any): Promise<void> {
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (slackWebhookUrl) {
      const severityEmoji = payload.severity === 'critical' ? ':rotating_light:' :
        payload.severity === 'warning' ? ':warning:' : ':information_source:';

      await axios.post(slackWebhookUrl, {
        text: `${severityEmoji} Pacing Alert`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Campaign:* ${payload.campaignId}\n*Severity:* ${payload.severity}\n*Message:* ${payload.message}`
            }
          }
        ]
      }, {
        timeout: 5000
      });
    }
  }

  /**
   * Create default alerts for a campaign
   */
  async createDefaultAlerts(campaignId: string, dailyBudget: number, totalBudget: number): Promise<IPacingAlertDocument[]> {
    alertLogger.info('Creating default alerts', { campaignId });

    const alerts = await PacingAlert.createDefaultAlerts(campaignId, dailyBudget, totalBudget);

    pacingAlertsActive.inc(alerts.length);

    alertLogger.info('Default alerts created', { count: alerts.length, campaignId });

    return alerts;
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(): Promise<{
    totalAlerts: number;
    activeAlerts: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const [counts, severityCounts, typeCounts] = await Promise.all([
      PacingAlert.countDocuments(),
      PacingAlert.getTriggeredAlertsBySeverity(),
      PacingAlert.aggregate([
        {
          $group: {
            _id: '$alertType',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const byType: Record<string, number> = {};
    typeCounts.forEach((t) => {
      byType[t._id] = t.count;
    });

    return {
      totalAlerts: counts,
      activeAlerts: Object.values(severityCounts).reduce((a, b) => a + b, 0),
      bySeverity: severityCounts,
      byType: byType
    };
  }

  /**
   * Generate default message for alert type
   */
  private generateDefaultMessage(alertType: AlertThreshold, threshold: number): string {
    switch (alertType) {
      case AlertThreshold.DAILY_BUDGET:
        return `Daily budget threshold reached: ${threshold}`;
      case AlertThreshold.TOTAL_BUDGET:
        return `Total budget threshold reached: ${threshold}`;
      case AlertThreshold.PACE_DEVIATION:
        return `Pace deviation exceeds ${threshold}%`;
      case AlertThreshold.SPEND_RATE:
        return `Spend rate exceeds threshold: ${threshold}`;
      default:
        return `Alert threshold reached: ${threshold}`;
    }
  }
}

export const alertService = new AlertService();