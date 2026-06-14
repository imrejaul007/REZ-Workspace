import axios from 'axios';
import { Notification, NotificationType, NotificationStatus } from '../models/Notification';
import { logger } from '../config/logger';

export class NotificationService {
  private notifyUrl = process.env.REZ_NOTIFY_URL || 'http://localhost:4011';

  async send(userId: string, type: NotificationType, title: string, message: string, data?: any): Promise<void> {
    // Save to DB
    const notification = new Notification({ userId, type, title, message, data, status: NotificationStatus.PENDING });
    await notification.save();

    try {
      // Send via RABTUL Notifications
      const payload: any = {
        userId,
        type: type === NotificationType.PUSH ? 'push' : type === NotificationType.WHATSAPP ? 'whatsapp' : 'sms',
        title,
        message,
        data
      };

      await axios.post(`${this.notifyUrl}/api/notifications/send`, payload, {
        headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN }
      });

      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      await notification.save();
      logger.info('Notification sent', { userId, type });
    } catch (err: any) {
      notification.status = NotificationStatus.FAILED;
      notification.error = err.message;
      await notification.save();
      logger.error('Notification failed', { userId, type, error: err.message });
    }
  }

  async getUserNotifications(userId: string, page = 1, limit = 20): Promise<any[]> {
    const skip = (page - 1) * limit;
    return Notification.find({ userId, deletedAt: null })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async markAsRead(id: string): Promise<void> {
    await Notification.findByIdAndUpdate(id, { read: true, readAt: new Date() });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany({ userId, read: false }, { read: true, readAt: new Date() });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ userId, read: false, deletedAt: null });
  }

  // Convenience methods
  async notifyLeadAssigned(userId: string, leadName: string, brokerName: string): Promise<void> {
    await this.send(userId, NotificationType.PUSH,
      'New Lead Assigned',
      `${brokerName} has assigned you a new lead: ${leadName}`,
      { type: 'lead_assigned' }
    );
  }

  async notifySiteVisitReminder(userId: string, propertyName: string, time: string): Promise<void> {
    await this.send(userId, NotificationType.PUSH,
      'Site Visit Reminder',
      `Reminder: Site visit for ${propertyName} at ${time}`,
      { type: 'site_visit_reminder' }
    );
  }

  async notifyPaymentDue(userId: string, amount: number, dueDate: string): Promise<void> {
    await this.send(userId, NotificationType.PUSH,
      'Payment Due',
      `Payment of ${amount} is due on ${dueDate}`,
      { type: 'payment_due' }
    );
  }

  async notifyReferralReward(userId: string, referralName: string, reward: number): Promise<void> {
    await this.send(userId, NotificationType.PUSH,
      'Referral Reward!',
      `You earned AED ${reward} for referring ${referralName}`,
      { type: 'referral_reward' }
    );
  }
}

export const notificationService = new NotificationService();
