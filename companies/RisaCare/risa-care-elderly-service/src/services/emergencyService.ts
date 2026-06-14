import { v4 as uuidv4 } from 'uuid';
import {
  EmergencyAlert,
  TriggerEmergencyDTO,
  EmergencyType,
  EmergencySeverity,
  EmergencyContact,
} from '../models/elderlyCare';
import { elderlyProfileService } from './elderlyProfileService';
import { dailyCheckInService } from './dailyCheckInService';
import {
  EmergencyAlertModel,
  IEmergencyAlert,
} from '../models/mongodb';
import logger from '../utils/logger';

// Notification queue (would integrate with notification service in production)
const notificationQueue: Array<{
  alertId: string;
  contactId: string;
  contact: EmergencyContact;
  patientId: string;
  type: EmergencyType;
  message: string;
  sentAt: Date;
}> = [];

export class EmergencyService {
  /**
   * Trigger an emergency alert
   */
  async triggerEmergency(patientId: string, dto: TriggerEmergencyDTO): Promise<EmergencyAlert> {
    logger.warn('EMERGENCY TRIGGERED', { patientId, type: dto.type, severity: dto.severity });

    const alert = new EmergencyAlertModel({
      patientId,
      type: dto.type,
      severity: dto.severity,
      location: dto.location,
      description: dto.description,
      triggeredAt: new Date(),
      responded: false,
      resolved: false,
    });

    await alert.save();

    // Notify emergency contacts
    await this.notifyContacts(alert.toObject() as unknown as EmergencyAlert);

    // Check if automated response needed based on severity
    if (alert.severity === 'critical') {
      logger.error('CRITICAL EMERGENCY - Immediate response required', { patientId, alertId: alert._id });
    }

    logger.info('Emergency alert created', { patientId, alertId: alert._id });

    return alert.toObject() as unknown as EmergencyAlert;
  }

  /**
   * Notify emergency contacts
   */
  async notifyContacts(alert: EmergencyAlert): Promise<void> {
    logger.info('Notifying emergency contacts', { patientId: alert.patientId, alertId: alert._id });

    const profile = await elderlyProfileService.getProfile(alert.patientId);
    if (!profile) {
      logger.warn('Profile not found for notification', { patientId: alert.patientId });
      return;
    }

    // Get primary contact first, then others
    const contacts = [...profile.emergencyContacts].sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return 0;
    });

    const emergencyMessage = this.generateEmergencyMessage(alert);

    for (const contact of contacts) {
      const notification = {
        alertId: alert._id?.toString() || '',
        contactId: contact.id,
        contact,
        patientId: alert.patientId,
        type: alert.type,
        message: emergencyMessage,
        sentAt: new Date(),
      };

      notificationQueue.push(notification);
      logger.info('Notification queued', {
        patientId: alert.patientId,
        contactId: contact.id,
        contactName: contact.name,
      });
    }

    logger.info('All emergency contacts notified', { patientId: alert.patientId, count: contacts.length });
  }

  /**
   * Generate emergency message based on alert type
   */
  private generateEmergencyMessage(alert: EmergencyAlert): string {
    const messages: Record<EmergencyType, string> = {
      fall: 'FALL DETECTED - Patient may have fallen and needs assistance',
      sos: 'SOS ALERT - Patient has triggered emergency button',
      no_activity: 'NO ACTIVITY ALERT - No activity detected for extended period',
      vital_concern: 'VITAL SIGNS CONCERN - Abnormal vital signs detected',
    };

    let message = messages[alert.type] || 'EMERGENCY ALERT';

    if (alert.location) {
      message += ` | Location: ${alert.location}`;
    }

    message += ` | Time: ${new Date(alert.triggeredAt).toLocaleString()}`;

    if (alert.description) {
      message += ` | Details: ${alert.description}`;
    }

    return message;
  }

  /**
   * Get active (unresolved) alerts for a patient
   */
  async getActiveAlerts(patientId: string): Promise<EmergencyAlert[]> {
    logger.info('Fetching active alerts', { patientId });

    const alerts = await EmergencyAlertModel.find({ patientId, resolved: false })
      .sort({ triggeredAt: -1 })
      .lean();

    return alerts as unknown as EmergencyAlert[];
  }

  /**
   * Get all alerts for a patient
   */
  async getAllAlerts(
    patientId: string,
    options?: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      type?: EmergencyType;
      severity?: EmergencySeverity;
    }
  ): Promise<EmergencyAlert[]> {
    logger.info('Fetching alert history', { patientId, options });

    const query: any = { patientId };

    if (options?.startDate) {
      query.triggeredAt = { ...query.triggeredAt, $gte: options.startDate };
    }
    if (options?.endDate) {
      query.triggeredAt = { ...query.triggeredAt, $lte: options.endDate };
    }
    if (options?.type) {
      query.type = options.type;
    }
    if (options?.severity) {
      query.severity = options.severity;
    }

    let queryBuilder = EmergencyAlertModel.find(query).sort({ triggeredAt: -1 });

    if (options?.limit && options.limit > 0) {
      queryBuilder = queryBuilder.limit(options.limit);
    }

    const alerts = await queryBuilder.lean();
    return alerts as unknown as EmergencyAlert[];
  }

  /**
   * Mark alert as responded
   */
  async markResponded(alertId: string, patientId: string, responderId: string): Promise<EmergencyAlert> {
    logger.info('Marking alert as responded', { patientId, alertId, responderId });

    const alert = await EmergencyAlertModel.findOne({ _id: alertId, patientId });

    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    alert.responded = true;
    alert.respondedBy = responderId;
    alert.respondedAt = new Date();

    await alert.save();

    logger.info('Alert marked as responded', { patientId, alertId });

    return alert.toObject() as unknown as EmergencyAlert;
  }

  /**
   * Resolve an emergency alert
   */
  async resolveAlert(alertId: string, patientId: string, notes?: string): Promise<EmergencyAlert> {
    logger.info('Resolving emergency alert', { patientId, alertId });

    const alert = await EmergencyAlertModel.findOne({ _id: alertId, patientId });

    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    if (notes) {
      alert.notes = notes;
    }

    await alert.save();

    logger.info('Emergency alert resolved', { patientId, alertId });

    return alert.toObject() as unknown as EmergencyAlert;
  }

  /**
   * Check for no-activity emergencies (automation)
   */
  async checkNoActivityEmergencies(): Promise<string[]> {
    logger.info('Checking for no-activity emergencies');

    const missingPatients = await dailyCheckInService.getPatientsMissingToday();
    const triggeredEmergencies: string[] = [];

    for (const patientId of missingPatients) {
      // Check if already has an active no_activity alert
      const hasActiveNoActivity = await EmergencyAlertModel.findOne({
        patientId,
        type: 'no_activity',
        resolved: false,
      });

      if (!hasActiveNoActivity) {
        // Trigger no-activity alert
        await this.triggerEmergency(patientId, {
          type: 'no_activity',
          severity: 'medium',
          description: 'No daily check-in received. Patient may need assistance.',
        });
        triggeredEmergencies.push(patientId);
        logger.warn('No-activity emergency triggered', { patientId });
      }
    }

    return triggeredEmergencies;
  }

  /**
   * Get alert statistics
   */
  async getAlertStatistics(patientId: string, days: number = 30): Promise<{
    totalAlerts: number;
    byType: Record<EmergencyType, number>;
    bySeverity: Record<EmergencySeverity, number>;
    avgResponseTime: number | null;
    resolutionRate: number;
  }> {
    logger.info('Calculating alert statistics', { patientId, days });

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const alerts = await EmergencyAlertModel.find({
      patientId,
      triggeredAt: { $gte: startDate },
    }).lean();

    const byType: Record<EmergencyType, number> = {
      fall: 0,
      sos: 0,
      no_activity: 0,
      vital_concern: 0,
    };

    const bySeverity: Record<EmergencySeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    let responseTimeSum = 0;
    let respondedCount = 0;

    for (const alert of alerts) {
      byType[alert.type as EmergencyType]++;
      bySeverity[alert.severity as EmergencySeverity]++;

      if (alert.responded && alert.respondedAt) {
        const responseTime = new Date(alert.respondedAt).getTime() - new Date(alert.triggeredAt).getTime();
        responseTimeSum += responseTime;
        respondedCount++;
      }
    }

    const resolvedCount = alerts.filter(a => a.resolved).length;

    return {
      totalAlerts: alerts.length,
      byType,
      bySeverity,
      avgResponseTime: respondedCount > 0 ? Math.round(responseTimeSum / respondedCount / 1000) : null,
      resolutionRate: alerts.length > 0 ? Math.round((resolvedCount / alerts.length) * 100) : 0,
    };
  }

  /**
   * Get all pending notifications
   */
  getPendingNotifications(): typeof notificationQueue {
    return [...notificationQueue];
  }

  /**
   * Clear notification from queue (after sending)
   */
  clearNotification(index: number): void {
    if (index >= 0 && index < notificationQueue.length) {
      notificationQueue.splice(index, 1);
    }
  }

  /**
   * Get critical alerts across all patients (for monitoring dashboard)
   */
  async getAllCriticalAlerts(): Promise<EmergencyAlert[]> {
    logger.info('Fetching all critical alerts');

    const alerts = await EmergencyAlertModel.find({
      severity: 'critical',
      resolved: false,
    }).sort({ triggeredAt: -1 }).lean();

    return alerts as unknown as EmergencyAlert[];
  }
}

export const emergencyService = new EmergencyService();
export default emergencyService;