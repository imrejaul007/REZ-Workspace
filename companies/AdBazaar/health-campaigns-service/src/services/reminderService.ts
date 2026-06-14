import { HealthReminder, IHealthReminder, ReminderType } from '../models/HealthReminder';
import { EngagementRecord } from '../models/Engagement';
import { logger } from 'utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors';

const WHATSAPP_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:4011';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';

export interface ScheduleReminderInput {
  reminderType: ReminderType;
  patientId: string;
  patientName?: string;
  familyIds?: string[];
  familyNotify?: boolean;
  channels: string[];
  eventDetails: {
    title: string;
    description?: string;
    scheduledTime: Date;
    location?: string;
    medicationName?: string;
    dosage?: string;
  };
  timing?: {
    advanceMinutes?: number;
    repeatCount?: number;
    repeatInterval?: number;
  };
}

export interface ReminderResponse {
  success: boolean;
  reminderId: string;
  nextSendAt: Date;
  sentToFamily?: boolean;
}

// Mock patient data (fallback)
const mockPatients = new Map<string, { id: string; name: string; phone?: string; email?: string }>([
  ['P001', { id: 'P001', name: 'John Doe', phone: '+919876543210', email: 'john@example.com' }],
  ['P002', { id: 'P002', name: 'Jane Smith', phone: '+919876543211', email: 'jane@example.com' }],
  ['P003', { id: 'P003', name: 'Raj Kumar', phone: '+919876543212', email: 'raj@example.com' }],
]);

class ReminderService {
  /**
   * Schedule a health reminder
   */
  async scheduleReminder(input: ScheduleReminderInput): Promise<IReminder> {
    logger.info('Scheduling health reminder', {
      type: input.reminderType,
      patientId: input.patientId,
      title: input.eventDetails.title,
    });

    // Calculate next send time based on timing
    const scheduledTime = new Date(input.eventDetails.scheduledTime);
    const advanceMinutes = input.timing?.advanceMinutes || 30;
    const nextSendAt = new Date(scheduledTime.getTime() - advanceMinutes * 60 * 1000);

    // Don't schedule if the time has passed
    if (nextSendAt <= new Date()) {
      throw new ValidationError('Reminder time has already passed');
    }

    const reminder = new HealthReminder({
      reminderType: input.reminderType,
      patientId: input.patientId,
      patientName: input.patientName,
      familyIds: input.familyIds || [],
      familyNotify: input.familyNotify || false,
      channels: input.channels,
      eventDetails: input.eventDetails,
      timing: {
        advanceMinutes: input.timing?.advanceMinutes || 30,
        repeatCount: input.timing?.repeatCount || 1,
        repeatInterval: input.timing?.repeatInterval || 60,
      },
      status: 'pending',
      sentCount: 0,
      nextSendAt,
      engagementScore: 0,
    });

    await reminder.save();
    logger.info('Reminder scheduled', { reminderId: reminder.id, nextSendAt });

    return reminder;
  }

  /**
   * Get reminder by ID
   */
  async getReminder(reminderId: string): Promise<IHealthReminder> {
    const reminder = await HealthReminder.findOne({ id: reminderId });
    if (!reminder) {
      throw new NotFoundError('Reminder', reminderId);
    }
    return reminder;
  }

  /**
   * Get all reminders for a profile/patient
   */
  async getRemindersByProfile(profileId: string): Promise<IHealthReminder[]> {
    return HealthReminder.find({ patientId: profileId })
      .sort({ nextSendAt: 1 });
  }

  /**
   * Get pending reminders that need to be sent
   */
  async getPendingReminders(): Promise<IHealthReminder[]> {
    const now = new Date();
    return HealthReminder.find({
      status: 'pending',
      nextSendAt: { $lte: now },
    }).sort({ nextSendAt: 1 });
  }

  /**
   * Cancel a reminder
   */
  async cancelReminder(reminderId: string): Promise<void> {
    const reminder = await this.getReminder(reminderId);

    if (reminder.status === 'acknowledged') {
      throw new ValidationError('Cannot cancel an acknowledged reminder');
    }

    await HealthReminder.deleteOne({ id: reminderId });
    logger.info('Reminder cancelled', { reminderId });
  }

  /**
   * Send a reminder
   */
  async sendReminder(reminderId: string): Promise<ReminderResponse> {
    const reminder = await this.getReminder(reminderId);

    if (reminder.status === 'acknowledged') {
      return {
        success: false,
        reminderId,
        nextSendAt: reminder.nextSendAt,
      };
    }

    logger.info('Sending reminder', { reminderId, channels: reminder.channels });

    // Get patient info
    const patient = this.getMockPatient(reminder.patientId);

    // Send to each channel
    for (const channel of reminder.channels) {
      await this.sendReminderViaChannel(reminder, patient, channel);
    }

    // Send to family if enabled
    let sentToFamily = false;
    if (reminder.familyNotify && reminder.familyIds.length > 0) {
      await this.notifyFamily(reminder);
      sentToFamily = true;
    }

    // Update reminder status
    reminder.sentCount += 1;
    reminder.lastSentAt = new Date();
    reminder.status = 'sent';

    // Calculate next send time if repeat is needed
    const repeatCount = reminder.timing.repeatCount;
    if (reminder.sentCount < repeatCount) {
      const nextSendAt = new Date(
        reminder.lastSentAt.getTime() + reminder.timing.repeatInterval * 60 * 1000
      );
      reminder.nextSendAt = nextSendAt;
      reminder.status = 'pending';
    } else {
      // No more repeats, mark as sent
      reminder.nextSendAt = new Date(reminder.eventDetails.scheduledTime);
    }

    await reminder.save();

    // Track engagement
    await this.trackReminderResponse(reminder.patientId, reminder.id, 'sent');

    logger.info('Reminder sent', { reminderId, sentToFamily });

    return {
      success: true,
      reminderId,
      nextSendAt: reminder.nextSendAt,
      sentToFamily,
    };
  }

  /**
   * Acknowledge a reminder (patient responded)
   */
  async acknowledgeReminder(reminderId: string, profileId: string): Promise<IHealthReminder> {
    const reminder = await this.getReminder(reminderId);

    if (reminder.patientId !== profileId) {
      throw new ValidationError('Profile does not own this reminder');
    }

    reminder.status = 'acknowledged';
    reminder.acknowledgedAt = new Date();
    reminder.engagementScore = Math.min(100, reminder.engagementScore + 20);
    await reminder.save();

    await this.trackReminderResponse(profileId, reminderId, 'converted');

    logger.info('Reminder acknowledged', { reminderId, profileId });
    return reminder;
  }

  /**
   * Snooze a reminder
   */
  async snoozeReminder(reminderId: string, snoozeMinutes: number = 15): Promise<IHealthReminder> {
    const reminder = await this.getReminder(reminderId);

    if (reminder.status === 'acknowledged') {
      throw new ValidationError('Cannot snooze an acknowledged reminder');
    }

    const snoozedUntil = new Date(Date.now() + snoozeMinutes * 60 * 1000);
    reminder.status = 'snoozed';
    reminder.snoozedUntil = snoozedUntil;
    reminder.nextSendAt = snoozedUntil;
    await reminder.save();

    logger.info('Reminder snoozed', { reminderId, snoozedUntil });
    return reminder;
  }

  /**
   * Track reminder response/engagement
   */
  async trackReminderResponse(
    profileId: string,
    reminderId: string,
    action: 'sent' | 'converted' | 'ignored'
  ): Promise<void> {
    const record = new EngagementRecord({
      profileId,
      reminderId,
      channel: 'auto', // System-generated reminder
      action,
      timestamp: new Date(),
    });
    await record.save();
  }

  /**
   * Get reminders by type for a profile
   */
  async getRemindersByType(profileId: string, type: ReminderType): Promise<IHealthReminder[]> {
    return HealthReminder.find({
      patientId: profileId,
      reminderType: type,
    }).sort({ nextSendAt: 1 });
  }

  /**
   * Get reminder statistics
   */
  async getReminderStats(profileId?: string): Promise<{
    total: number;
    pending: number;
    sent: number;
    acknowledged: number;
    snoozed: number;
    failed: number;
    avgEngagementScore: number;
  }> {
    const query = profileId ? { patientId: profileId } : {};
    const reminders = await HealthReminder.find(query);

    const stats = {
      total: reminders.length,
      pending: reminders.filter(r => r.status === 'pending').length,
      sent: reminders.filter(r => r.status === 'sent').length,
      acknowledged: reminders.filter(r => r.status === 'acknowledged').length,
      snoozed: reminders.filter(r => r.status === 'snoozed').length,
      failed: reminders.filter(r => r.status === 'failed').length,
      avgEngagementScore: reminders.length > 0
        ? reminders.reduce((sum, r) => sum + r.engagementScore, 0) / reminders.length
        : 0,
    };

    return stats;
  }

  private getMockPatient(patientId: string): { id: string; name: string; phone?: string; email?: string } {
    return mockPatients.get(patientId) || { id: patientId, name: 'Unknown Patient' };
  }

  private async sendReminderViaChannel(
    reminder: IHealthReminder,
    patient: { id: string; name: string; phone?: string; email?: string },
    channel: string
  ): Promise<void> {
    const reminderMessages = this.getReminderMessage(reminder);

    const payload = {
      to: channel === 'whatsapp' || channel === 'sms' ? patient.phone : patient.email,
      channel,
      title: reminder.eventDetails.title,
      message: reminderMessages[channel] || reminderMessages.default,
      reminderId: reminder.id,
      scheduledTime: reminder.eventDetails.scheduledTime,
    };

    try {
      if (channel === 'whatsapp') {
        await this.sendViaWhatsApp(payload);
      } else {
        await this.sendViaNotification(payload);
      }
    } catch (error) {
      logger.warn(`Failed to send via ${channel}, simulating send`, { error });
    }
  }

  private getReminderMessage(reminder: IHealthReminder): Record<string, string> {
    const title = reminder.eventDetails.title;
    const time = new Date(reminder.eventDetails.scheduledTime).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    switch (reminder.reminderType) {
      case 'medication':
        return {
          whatsapp: `💊 *Medication Reminder*\n\n${title}\nTime: ${time}\n\nTap to confirm you've taken your medication.`,
          sms: `Medication Reminder: ${title} at ${time}. Reply CONFIRM to acknowledge.`,
          push: `Time to take ${title}`,
          email: `Medication Reminder: ${title} scheduled for ${time}`,
          default: `Reminder: ${title} at ${time}`,
        };
      case 'appointment':
        return {
          whatsapp: `📅 *Appointment Reminder*\n\n${title}\nTime: ${time}\n${reminder.eventDetails.location ? `Location: ${reminder.eventDetails.location}` : ''}\n\nTap to confirm or reschedule.`,
          sms: `Appointment Reminder: ${title} at ${time}. ${reminder.eventDetails.location || ''}`,
          push: `Upcoming appointment: ${title} at ${time}`,
          email: `Appointment Reminder: ${title} scheduled for ${time}`,
          default: `Reminder: ${title} at ${time}`,
        };
      case 'vaccination':
        return {
          whatsapp: `💉 *Vaccination Reminder*\n\n${title}\nTime: ${time}\n\nPlease arrive 15 minutes early.`,
          sms: `Vaccination Reminder: ${title} at ${time}`,
          push: `Vaccination scheduled: ${title}`,
          email: `Vaccination Reminder: ${title} for ${time}`,
          default: `Reminder: ${title} at ${time}`,
        };
      case 'checkup':
        return {
          whatsapp: `🏥 *Health Checkup Reminder*\n\n${title}\nTime: ${time}\n\nStay healthy! Get your regular checkup done.`,
          sms: `Health Checkup: ${title} at ${time}`,
          push: `Checkup reminder: ${title}`,
          email: `Health Checkup Reminder: ${title} on ${time}`,
          default: `Reminder: ${title} at ${time}`,
        };
      default:
        return {
          default: `Reminder: ${title} at ${time}`,
        };
    }
  }

  private async sendViaWhatsApp(message: Record<string, unknown>): Promise<void> {
    const axios = (await import('axios')).default;
    await axios.post(`${WHATSAPP_SERVICE_URL}/api/send`, message, { timeout: 10000 });
  }

  private async sendViaNotification(message: Record<string, unknown>): Promise<void> {
    const axios = (await import('axios')).default;
    await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notify`, message, { timeout: 10000 });
  }

  private async notifyFamily(reminder: IHealthReminder): Promise<void> {
    logger.info('Notifying family members', {
      reminderId: reminder.id,
      familyIds: reminder.familyIds,
    });
    // Send notification to each family member
    for (const familyId of reminder.familyIds) {
      await this.trackReminderResponse(familyId, reminder.id, 'sent');
    }
  }
}

interface IReminder extends IHealthReminder {}

export const reminderService = new ReminderService();
