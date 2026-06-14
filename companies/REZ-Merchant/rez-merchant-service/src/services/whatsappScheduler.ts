/**
 * WhatsApp Scheduler Service
 *
 * Manages scheduled WhatsApp notifications for payment reminders and overdue alerts.
 *
 * Reminder Schedule Logic:
 * - 7 days before due: Gentle reminder
 * - 3 days before due: Strong reminder
 * - 1 day before due: Urgent reminder
 * - Due date: Payment due today
 * - 1 day overdue: First overdue alert
 * - 7 days overdue: Escalation alert
 * - 14 days overdue: Final notice
 * - 30 days overdue: Legal notice warning
 *
 * Business hours: Only send 9 AM - 8 PM IST, skip Sundays
 *
 * Features:
 * - Cron-based periodic scanning for due reminders
 * - Automatic cancellation when payment received
 * - Idempotent scheduling (prevents duplicate reminders)
 * - Graceful degradation when WhatsApp service unavailable
 */

import { logger } from '../config/logger';
import { redis } from '../config/redis';
import {
  scheduleReminder,
  scheduleOverdueAlert,
  cancelScheduledMessages,
  SendReminderJobData,
  SendOverdueAlertJobData,
} from '../jobs/whatsappJobs';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { Supplier } from '../models/Supplier';
import { POPaymentStatus } from '../config/purchaseOrderTransitions';

/**
 * Reminder type enum
 */
export enum ReminderType {
  GENTLE = 'gentle',      // 7 days before
  STRONG = 'strong',      // 3 days before
  URGENT = 'urgent',      // 1 day before
  TODAY = 'today',        // Due date
}

/**
 * Overdue alert type enum
 */
export enum AlertType {
  FIRST = 'first',        // 1 day overdue
  ESCALATION = 'escalation', // 7 days overdue
  FINAL = 'final',        // 14 days overdue
  LEGAL = 'legal',       // 30 days overdue
}

/**
 * Scheduled notification tracking
 */
export interface ScheduledNotification {
  id: string;
  poId: string;
  supplierId: string;
  type: 'reminder' | 'overdue_alert';
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
}

/**
 * Reminder schedule configuration
 */
const REMINDER_SCHEDULE = {
  [ReminderType.GENTLE]: { daysBefore: 7, priority: 1 },
  [ReminderType.STRONG]: { daysBefore: 3, priority: 2 },
  [ReminderType.URGENT]: { daysBefore: 1, priority: 3 },
  [ReminderType.TODAY]: { daysBefore: 0, priority: 4 },
};

/**
 * Overdue alert schedule configuration
 */
const OVERDUE_SCHEDULE = {
  [AlertType.FIRST]: { daysOverdue: 1, priority: 5 },
  [AlertType.ESCALATION]: { daysOverdue: 7, priority: 6 },
  [AlertType.FINAL]: { daysOverdue: 14, priority: 7 },
  [AlertType.LEGAL]: { daysOverdue: 30, priority: 8 },
};

// Business hours configuration (IST)
const BUSINESS_HOUR_START = 9;  // 9 AM IST
const BUSINESS_HOUR_END = 20;   // 8 PM IST
const IST_OFFSET_HOURS = 5.5;

/**
 * Scheduler service for WhatsApp notifications
 */
export class WhatsAppScheduler {
  private merchantName: string = 'ReZ Merchant';

  constructor(merchantName?: string) {
    if (merchantName) {
      this.merchantName = merchantName;
    }
  }

  /**
   * Check if current time is within business hours (9 AM - 8 PM IST)
   */
  public isWithinBusinessHours(): boolean {
    const now = new Date();
    const istTime = this.getISTTime(now);
    const hour = istTime.getHours();

    return hour >= BUSINESS_HOUR_START && hour < BUSINESS_HOUR_END;
  }

  /**
   * Get IST time from UTC
   */
  private getISTTime(utcDate: Date = new Date()): Date {
    const istOffset = IST_OFFSET_HOURS * 60 * 60 * 1000;
    return new Date(utcDate.getTime() + istOffset);
  }

  /**
   * Check if today is Sunday
   */
  public isSunday(): boolean {
    const istTime = this.getISTTime();
    return istTime.getDay() === 0;
  }

  /**
   * Get next business hour timestamp
   */
  public getNextBusinessHour(): Date {
    const now = new Date();
    const istTime = this.getISTTime(now);
    const utcTime = now;

    // If Sunday, move to Monday 9 AM IST
    if (istTime.getDay() === 0) {
      const nextMonday = new Date(utcTime);
      nextMonday.setDate(nextMonday.getDate() + 1);
      nextMonday.setUTCHours(3, 30, 0, 0); // 9 AM IST = 3:30 AM UTC
      return nextMonday;
    }

    const currentHourIST = istTime.getHours();
    const currentMinuteIST = istTime.getMinutes();
    const currentTimeISTMinutes = currentHourIST * 60 + currentMinuteIST;
    const startMinutesIST = BUSINESS_HOUR_START * 60;
    const endMinutesIST = BUSINESS_HOUR_END * 60;

    // If before 9 AM IST
    if (currentTimeISTMinutes < startMinutesIST) {
      const next = new Date(utcTime);
      next.setUTCHours(3, 30, 0, 0); // 9 AM IST
      return next;
    }

    // If after 8 PM IST
    if (currentTimeISTMinutes >= endMinutesIST) {
      const next = new Date(utcTime);
      next.setUTCDate(next.getUTCDate() + 1);
      next.setUTCHours(3, 30, 0, 0); // 9 AM IST next day
      return next;
    }

    // Already in business hours - return current time
    return utcTime;
  }

  /**
   * Calculate reminder dates based on due date
   */
  public calculateReminderDates(dueDate: Date): Map<ReminderType, Date> {
    const reminders = new Map<ReminderType, Date>();
    const dueDateTime = new Date(dueDate).getTime();

    for (const [type, config] of Object.entries(REMINDER_SCHEDULE)) {
      const reminderDate = new Date(dueDateTime - config.daysBefore * 24 * 60 * 60 * 1000);
      // Set reminder time to 10 AM IST (4:30 AM UTC) for optimal open rate
      reminderDate.setUTCHours(4, 30, 0, 0);

      // Only schedule if in the future
      if (reminderDate.getTime() > Date.now()) {
        reminders.set(type as ReminderType, reminderDate);
      }
    }

    return reminders;
  }

  /**
   * Calculate overdue alert dates based on due date
   */
  public calculateOverdueDates(dueDate: Date): Map<AlertType, Date> {
    const alerts = new Map<AlertType, Date>();
    const dueDateTime = new Date(dueDate).getTime();

    for (const [type, config] of Object.entries(OVERDUE_SCHEDULE)) {
      const alertDate = new Date(dueDateTime + config.daysOverdue * 24 * 60 * 60 * 1000);
      // Set alert time to 10 AM IST for overdue messages
      alertDate.setUTCHours(4, 30, 0, 0);

      // Only schedule if in the future
      if (alertDate.getTime() > Date.now()) {
        alerts.set(type as AlertType, alertDate);
      }
    }

    return alerts;
  }

  /**
   * Schedule reminders for a purchase order
   */
  public async scheduleReminder(poId: string, dueDate: Date): Promise<ScheduledNotification[]> {
    const po = await PurchaseOrder.findById(poId).lean();
    if (!po) {
      logger.warn('[WhatsAppScheduler] PO not found for scheduling', { poId });
      return [];
    }

    const supplier = await Supplier.findById(po.supplierId).lean();
    if (!supplier || !supplier.phone) {
      logger.warn('[WhatsAppScheduler] Supplier not found or no phone', { poId, supplierId: po.supplierId });
      return [];
    }

    // Check if already paid
    if (po.paymentStatus === POPaymentStatus.PAID) {
      logger.info('[WhatsAppScheduler] PO already paid, skipping reminders', { poId });
      return [];
    }

    const scheduledNotifications: ScheduledNotification[] = [];
    const reminderDates = this.calculateReminderDates(dueDate);

    for (const [type, scheduledDate] of reminderDates) {
      // Check if already scheduled (idempotent)
      const existingKey = `whatsapp:scheduled:${poId}:reminder:${type}`;
      const existing = await redis.get(existingKey);

      if (existing) {
        logger.debug('[WhatsAppScheduler] Reminder already scheduled', { poId, type });
        continue;
      }

      const jobData: SendReminderJobData = {
        poId: po._id.toString(),
        supplierId: supplier._id.toString(),
        supplierPhone: supplier.phone,
        supplierName: supplier.name,
        poNumber: po.poNumber,
        amount: po.totalAmount - (po.paidAmount || 0),
        dueDate,
        reminderType: type,
        merchantName: this.merchantName,
      };

      try {
        const job = await scheduleReminder(jobData, scheduledDate);

        // Track scheduled notification
        await redis.hset(existingKey, {
          jobId: job.id!,
          type,
          scheduledFor: scheduledDate.toISOString(),
          status: 'pending',
        });
        await redis.expire(existingKey, 86400 * 30); // 30 days TTL

        scheduledNotifications.push({
          id: job.id!,
          poId,
          supplierId: supplier._id.toString(),
          type: 'reminder',
          scheduledFor: scheduledDate,
          status: 'pending',
        });

        logger.info('[WhatsAppScheduler] Reminder scheduled', {
          poId,
          type,
          scheduledFor: scheduledDate.toISOString(),
        });
      } catch (error) {
        logger.error('[WhatsAppScheduler] Failed to schedule reminder', {
          poId,
          type,
          error,
        });
      }
    }

    return scheduledNotifications;
  }

  /**
   * Schedule overdue alerts for a purchase order
   */
  public async scheduleOverdueAlerts(poId: string): Promise<ScheduledNotification[]> {
    const po = await PurchaseOrder.findById(poId).lean();
    if (!po) {
      logger.warn('[WhatsAppScheduler] PO not found for overdue alerts', { poId });
      return [];
    }

    const supplier = await Supplier.findById(po.supplierId).lean();
    if (!supplier || !supplier.phone) {
      logger.warn('[WhatsAppScheduler] Supplier not found or no phone', { poId });
      return [];
    }

    // Check if already paid
    if (po.paymentStatus === POPaymentStatus.PAID) {
      logger.info('[WhatsAppScheduler] PO paid, cancelling overdue alerts', { poId });
      await this.cancelScheduledMessages(poId);
      return [];
    }

    if (!po.dueDate) {
      logger.warn('[WhatsAppScheduler] PO has no due date', { poId });
      return [];
    }

    const scheduledNotifications: ScheduledNotification[] = [];
    const overdueDates = this.calculateOverdueDates(po.dueDate);

    for (const [type, scheduledDate] of overdueDates) {
      // Check if already scheduled
      const existingKey = `whatsapp:scheduled:${poId}:overdue:${type}`;
      const existing = await redis.get(existingKey);

      if (existing) {
        logger.debug('[WhatsAppScheduler] Overdue alert already scheduled', { poId, type });
        continue;
      }

      const daysOverdue = OVERDUE_SCHEDULE[type].daysOverdue;

      const jobData: SendOverdueAlertJobData = {
        poId: po._id.toString(),
        supplierId: supplier._id.toString(),
        supplierPhone: supplier.phone,
        supplierName: supplier.name,
        poNumber: po.poNumber,
        amount: po.totalAmount - (po.paidAmount || 0),
        daysOverdue,
        alertType: type,
        merchantName: this.merchantName,
      };

      try {
        const job = await scheduleOverdueAlert(jobData, scheduledDate);

        // Track scheduled notification
        await redis.hset(existingKey, {
          jobId: job.id!,
          type,
          scheduledFor: scheduledDate.toISOString(),
          status: 'pending',
        });
        await redis.expire(existingKey, 86400 * 30);

        scheduledNotifications.push({
          id: job.id!,
          poId,
          supplierId: supplier._id.toString(),
          type: 'overdue_alert',
          scheduledFor: scheduledDate,
          status: 'pending',
        });

        logger.info('[WhatsAppScheduler] Overdue alert scheduled', {
          poId,
          type,
          daysOverdue,
          scheduledFor: scheduledDate.toISOString(),
        });
      } catch (error) {
        logger.error('[WhatsAppScheduler] Failed to schedule overdue alert', {
          poId,
          type,
          error,
        });
      }
    }

    return scheduledNotifications;
  }

  /**
   * Cancel all scheduled messages for a PO
   */
  public async cancelScheduledMessages(poId: string): Promise<number> {
    try {
      const cancelledCount = await cancelScheduledMessages(poId);

      // Clean up Redis tracking keys
      const reminderKeys = await redis.keys(`whatsapp:scheduled:${poId}:*`);
      for (const key of reminderKeys) {
        await redis.hset(key, 'status', 'cancelled');
      }

      logger.info('[WhatsAppScheduler] Cancelled scheduled messages', { poId, count: cancelledCount });

      return cancelledCount;
    } catch (error) {
      logger.error('[WhatsAppScheduler] Failed to cancel scheduled messages', { poId, error });
      return 0;
    }
  }

  /**
   * Get reminder schedule template (for display purposes)
   */
  public getReminderSchedule(): Array<{
    type: string;
    description: string;
    timing: string;
  }> {
    return [
      {
        type: ReminderType.GENTLE,
        description: 'Gentle reminder about upcoming payment',
        timing: '7 days before due date',
      },
      {
        type: ReminderType.STRONG,
        description: 'Strong reminder with urgency',
        timing: '3 days before due date',
      },
      {
        type: ReminderType.URGENT,
        description: 'Urgent reminder one day before',
        timing: '1 day before due date',
      },
      {
        type: ReminderType.TODAY,
        description: 'Payment due today notification',
        timing: 'On due date',
      },
      {
        type: AlertType.FIRST,
        description: 'First overdue alert',
        timing: '1 day after due date',
      },
      {
        type: AlertType.ESCALATION,
        description: 'Escalation notice for prolonged non-payment',
        timing: '7 days overdue',
      },
      {
        type: AlertType.FINAL,
        description: 'Final notice before legal action',
        timing: '14 days overdue',
      },
      {
        type: AlertType.LEGAL,
        description: 'Legal notice warning',
        timing: '30 days overdue',
      },
    ];
  }

  /**
   * Process PO for payment received - cancel reminders, schedule thank you
   */
  public async onPaymentReceived(poId: string): Promise<void> {
    // Cancel all scheduled reminders and alerts
    const cancelledCount = await this.cancelScheduledMessages(poId);

    // Mark as paid in tracking
    await redis.hset(`whatsapp:paid:${poId}`, {
      paidAt: new Date().toISOString(),
      remindersCancelled: String(cancelledCount),
    });

    logger.info('[WhatsAppScheduler] Payment received - reminders cancelled', {
      poId,
      cancelledCount,
    });
  }

  /**
   * Get scheduled notifications for a PO
   */
  public async getScheduledNotifications(poId: string): Promise<ScheduledNotification[]> {
    const notifications: ScheduledNotification[] = [];

    const reminderKeys = await redis.keys(`whatsapp:scheduled:${poId}:reminder:*`);
    const overdueKeys = await redis.keys(`whatsapp:scheduled:${poId}:overdue:*`);

    for (const key of [...reminderKeys, ...overdueKeys]) {
      const data = await redis.hgetall(key);
      if (data) {
        notifications.push({
          id: data.jobId,
          poId,
          supplierId: data.supplierId || '',
          type: data.type.includes('overdue') ? 'overdue_alert' : 'reminder',
          scheduledFor: new Date(data.scheduledFor),
          status: data.status as 'pending' | 'sent' | 'failed' | 'cancelled',
        });
      }
    }

    return notifications.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
  }

  /**
   * Scan for POs needing reminders (for cron job)
   */
  public async scanForDueReminders(): Promise<number> {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Find POs with due dates in the next 7 days that are unpaid
    const duePOs = await PurchaseOrder.find({
      dueDate: {
        $gte: now,
        $lte: sevenDaysFromNow,
      },
      paymentStatus: { $ne: POPaymentStatus.PAID },
      isDeleted: false,
    }).lean();

    let scheduledCount = 0;

    for (const po of duePOs) {
      const notifications = await this.scheduleReminder(po._id.toString(), po.dueDate!);
      scheduledCount += notifications.length;
    }

    logger.info('[WhatsAppScheduler] Scanned for due reminders', {
      found: duePOs.length,
      scheduled: scheduledCount,
    });

    return scheduledCount;
  }

  /**
   * Scan for overdue POs needing alerts (for cron job)
   */
  public async scanForOverduePOs(): Promise<number> {
    const now = new Date();

    // Find POs that are overdue by at least 1 day
    const overduePOs = await PurchaseOrder.find({
      dueDate: {
        $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // At least 1 day ago
      },
      paymentStatus: { $ne: POPaymentStatus.PAID },
      isDeleted: false,
    }).lean();

    let scheduledCount = 0;

    for (const po of overduePOs) {
      const notifications = await this.scheduleOverdueAlerts(po._id.toString());
      scheduledCount += notifications.length;
    }

    logger.info('[WhatsAppScheduler] Scanned for overdue POs', {
      found: overduePOs.length,
      scheduled: scheduledCount,
    });

    return scheduledCount;
  }

  /**
   * Check if a reminder should be sent now
   */
  public shouldSendNow(scheduledFor: Date): boolean {
    const now = new Date();

    // Don't send before scheduled time
    if (scheduledFor.getTime() > now.getTime()) {
      return false;
    }

    // Don't send outside business hours (unless urgent/overdue)
    if (!this.isWithinBusinessHours()) {
      return false;
    }

    // Don't send on Sunday
    if (this.isSunday()) {
      return false;
    }

    // Only send within 24 hours of scheduled time
    const hoursSinceScheduled = (now.getTime() - scheduledFor.getTime()) / (1000 * 60 * 60);
    if (hoursSinceScheduled > 24) {
      return false;
    }

    return true;
  }
}

// Singleton instance
let schedulerInstance: WhatsAppScheduler | null = null;

export function getWhatsAppScheduler(merchantName?: string): WhatsAppScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new WhatsAppScheduler(merchantName);
  }
  return schedulerInstance;
}

export default WhatsAppScheduler;
