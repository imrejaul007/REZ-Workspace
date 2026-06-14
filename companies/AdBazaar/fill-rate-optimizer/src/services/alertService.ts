import { FillAlert, IFillAlert } from '../models/FillAlert';
import { FillRate } from '../models/FillRate';
import { logger } from 'utils/logger.js';
import { alertCounter } from '../utils/metrics';
import axios from 'axios';

export interface CreateAlertParams {
  inventoryId?: string;
  inventoryName?: string;
  threshold: number;
  condition: 'above' | 'below' | 'equals';
  notification: {
    email?: string;
    webhook?: string;
    slack?: string;
    sms?: string;
  };
  createdBy: string;
}

export class AlertService {
  // Create a new fill rate alert
  async createAlert(params: CreateAlertParams): Promise<IFillAlert> {
    try {
      logger.info('Creating fill rate alert', params);

      const alert = new FillAlert({
        inventoryId: params.inventoryId,
        inventoryName: params.inventoryName,
        threshold: params.threshold,
        condition: params.condition,
        notification: params.notification,
        status: 'active',
        createdBy: params.createdBy,
        triggeredCount: 0
      });

      await alert.save();

      logger.info('Fill rate alert created', { alertId: alert._id });
      return alert;
    } catch (error) {
      logger.error('Error creating alert', { error, params });
      throw error;
    }
  }

  // Get all alerts
  async getAlerts(filters?: {
    status?: 'active' | 'paused' | 'triggered' | 'disabled';
    inventoryId?: string;
  }): Promise<IFillAlert[]> {
    try {
      const query: any = {};
      if (filters?.status) query.status = filters.status;
      if (filters?.inventoryId) query.inventoryId = filters.inventoryId;

      return await FillAlert.find(query)
        .sort({ createdAt: -1 })
        .lean();
    } catch (error) {
      logger.error('Error getting alerts', { error, filters });
      throw error;
    }
  }

  // Get single alert
  async getAlert(alertId: string): Promise<IFillAlert | null> {
    try {
      return await FillAlert.findById(alertId);
    } catch (error) {
      logger.error('Error getting alert', { error, alertId });
      throw error;
    }
  }

  // Update alert
  async updateAlert(alertId: string, updates: Partial<CreateAlertParams>): Promise<IFillAlert | null> {
    try {
      logger.info('Updating fill rate alert', { alertId, updates });

      const alert = await FillAlert.findByIdAndUpdate(
        alertId,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!alert) {
        logger.warn('Alert not found', { alertId });
      }

      return alert;
    } catch (error) {
      logger.error('Error updating alert', { error, alertId });
      throw error;
    }
  }

  // Delete alert
  async deleteAlert(alertId: string): Promise<boolean> {
    try {
      const result = await FillAlert.findByIdAndDelete(alertId);
      return !!result;
    } catch (error) {
      logger.error('Error deleting alert', { error, alertId });
      throw error;
    }
  }

  // Pause alert
  async pauseAlert(alertId: string): Promise<IFillAlert | null> {
    try {
      return await FillAlert.findByIdAndUpdate(
        alertId,
        { $set: { status: 'paused' } },
        { new: true }
      );
    } catch (error) {
      logger.error('Error pausing alert', { error, alertId });
      throw error;
    }
  }

  // Resume alert
  async resumeAlert(alertId: string): Promise<IFillAlert | null> {
    try {
      return await FillAlert.findByIdAndUpdate(
        alertId,
        { $set: { status: 'active' } },
        { new: true }
      );
    } catch (error) {
      logger.error('Error resuming alert', { error, alertId });
      throw error;
    }
  }

  // Check and trigger alerts
  async checkAlerts(): Promise<{ triggered: number; failed: number }> {
    try {
      const activeAlerts = await FillAlert.find({ status: 'active' });
      let triggered = 0;
      let failed = 0;

      for (const alert of activeAlerts) {
        try {
          // Get current fill rate
          const currentRate = await this.getCurrentFillRate(alert.inventoryId);

          // Check if should trigger
          if (alert.shouldTrigger(currentRate)) {
            await this.triggerAlert(alert, currentRate);
            triggered++;
          }
        } catch (error) {
          logger.error('Error checking alert', { error, alertId: alert._id });
          failed++;
        }
      }

      logger.info('Alert check completed', { triggered, failed, totalAlerts: activeAlerts.length });
      return { triggered, failed };
    } catch (error) {
      logger.error('Error checking alerts', { error });
      throw error;
    }
  }

  // Get alert history
  async getAlertHistory(alertId: string, limit: number = 50): Promise<{
    alertId: string;
    triggeredAt: Date;
    rate: number;
    threshold: number;
  }[]> {
    try {
      // This would typically come from a separate alert_events collection
      // For now, we'll return recent triggered status
      const alert = await FillAlert.findById(alertId);
      if (!alert) return [];

      const history: any[] = [];
      if (alert.lastTriggeredAt) {
        history.push({
          alertId,
          triggeredAt: alert.lastTriggeredAt,
          rate: 0, // Would need to query historical data
          threshold: alert.threshold
        });
      }

      return history;
    } catch (error) {
      logger.error('Error getting alert history', { error, alertId });
      throw error;
    }
  }

  // Get alert statistics
  async getAlertStats(inventoryId?: string): Promise<{
    total: number;
    active: number;
    triggered: number;
    triggeredToday: number;
    avgTriggerCount: number;
  }> {
    try {
      const query = inventoryId ? { inventoryId } : {};

      const [alerts, today] = await Promise.all([
        FillAlert.find(query),
        FillAlert.find({
          ...query,
          lastTriggeredAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        })
      ]);

      const active = alerts.filter(a => a.status === 'active').length;
      const triggered = alerts.filter(a => a.status === 'triggered').length;
      const triggeredToday = today.length;
      const totalTriggerCount = alerts.reduce((sum, a) => sum + a.triggeredCount, 0);

      return {
        total: alerts.length,
        active,
        triggered,
        triggeredToday,
        avgTriggerCount: alerts.length > 0 ? totalTriggerCount / alerts.length : 0
      };
    } catch (error) {
      logger.error('Error getting alert stats', { error, inventoryId });
      throw error;
    }
  }

  private async getCurrentFillRate(inventoryId?: string): Promise<number> {
    try {
      const query = inventoryId ? { inventoryId } : {};
      const latest = await FillRate.findOne(query)
        .sort({ date: -1 })
        .lean();
      return latest?.rate || 0;
    } catch (error) {
      logger.error('Error getting current fill rate for alert', { error, inventoryId });
      return 0;
    }
  }

  private async triggerAlert(alert: IFillAlert, currentRate: number): Promise<void> {
    try {
      // Update alert status
      await alert.trigger();

      // Record metric
      alertCounter.labels(alert.inventoryId || 'all', alert.condition).inc();

      // Send notifications
      await this.sendNotifications(alert, currentRate);

      logger.info('Alert triggered', {
        alertId: alert._id,
        inventoryId: alert.inventoryId,
        currentRate,
        threshold: alert.threshold
      });
    } catch (error) {
      logger.error('Error triggering alert', { error, alertId: alert._id });
      throw error;
    }
  }

  private async sendNotifications(alert: IFillAlert, currentRate: number): Promise<void> {
    const notificationPayload = {
      alertId: alert._id,
      inventoryId: alert.inventoryId,
      inventoryName: alert.inventoryName,
      threshold: alert.threshold,
      condition: alert.condition,
      currentRate,
      triggeredAt: new Date().toISOString()
    };

    // Send email notification
    if (alert.notification.email) {
      try {
        // In production, integrate with email service
        logger.info('Would send email notification', {
          to: alert.notification.email,
          ...notificationPayload
        });
      } catch (error) {
        logger.error('Error sending email notification', { error });
      }
    }

    // Send webhook notification
    if (alert.notification.webhook) {
      try {
        await axios.post(alert.notification.webhook, notificationPayload, {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        logger.error('Error sending webhook notification', { error, webhook: alert.notification.webhook });
      }
    }

    // Send Slack notification
    if (alert.notification.slack) {
      try {
        await axios.post(alert.notification.slack, {
          text: `Fill Rate Alert: ${alert.inventoryId || 'All'} - Rate: ${currentRate.toFixed(2)}% (Threshold: ${alert.threshold}%)`,
          attachments: [{
            color: currentRate < alert.threshold ? 'danger' : 'warning',
            fields: [
              { title: 'Inventory', value: alert.inventoryId || 'All', short: true },
              { title: 'Current Rate', value: `${currentRate.toFixed(2)}%`, short: true },
              { title: 'Threshold', value: `${alert.threshold}%`, short: true }
            ]
          }]
        }, {
          timeout: 5000
        });
      } catch (error) {
        logger.error('Error sending Slack notification', { error });
      }
    }
  }
}