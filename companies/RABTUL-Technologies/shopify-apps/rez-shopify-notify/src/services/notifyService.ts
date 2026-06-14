/**
 * ReZ Notify - Notification Service
 */

import { Notification, INotification, NotificationTemplate, INotificationTemplate } from '../models/Notification';
import axios from 'axios';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';

export class NotifyService {
  /**
   * Send notification
   */
  static async send(data: {
    shop: string;
    tenantId: string;
    brandId: string;
    type: 'push' | 'email' | 'sms' | 'whatsapp';
    customerId?: string;
    customerEmail?: string;
    customerPhone?: string;
    title: string;
    message: string;
    data?: Record<string, any>;
  }): Promise<INotification> {
    // Create notification record
    const notification = await Notification.create({
      ...data,
      shop: data.shop.toLowerCase(),
      status: 'pending',
    });

    try {
      // Send via notification service
      await this.sendViaChannel(notification);

      notification.status = 'sent';
      notification.sentAt = new Date();
      await notification.save();

      return notification;
    } catch (error) {
      notification.status = 'failed';
      notification.error = (error as Error).message;
      await notification.save();
      throw error;
    }
  }

  /**
   * Send notification via channel
   */
  private static async sendViaChannel(notification: INotification): Promise<void> {
    const payload = {
      type: notification.type,
      to: notification.type === 'email' ? notification.customerEmail : notification.customerPhone,
      title: notification.title,
      message: notification.message,
      data: notification.data,
    };

    await axios.post(`${NOTIFICATION_SERVICE_URL}/api/send`, payload, {
      headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN },
    });
  }

  /**
   * Send template-based notification
   */
  static async sendTemplate(data: {
    shop: string;
    tenantId: string;
    brandId: string;
    templateId: string;
    customerId?: string;
    customerEmail?: string;
    customerPhone?: string;
    variables: Record<string, string>;
  }): Promise<INotification> {
    const template = await NotificationTemplate.findById(data.templateId);
    if (!template) throw new Error('Template not found');

    // Replace variables
    let title = template.title;
    let body = template.body;
    for (const [key, value] of Object.entries(data.variables)) {
      title = title.replace(new RegExp(`{{${key}}}`, 'g'), value);
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return this.send({
      ...data,
      type: template.type,
      title,
      message: body,
    });
  }

  /**
   * Broadcast to segment
   */
  static async broadcast(data: {
    shop: string;
    tenantId: string;
    brandId: string;
    templateId: string;
    customerIds: string[];
    variables: Record<string, string>;
  }): Promise<number> {
    const template = await NotificationTemplate.findById(data.templateId);
    if (!template) throw new Error('Template not found');

    let sent = 0;
    for (const customerId of data.customerIds) {
      try {
        await this.sendTemplate({
          ...data,
          customerId,
        });
        sent++;
      } catch (error) {
        console.error(`Failed to send to ${customerId}:`, error);
      }
    }

    return sent;
  }

  /**
   * Track notification interaction
   */
  static async trackInteraction(
    notificationId: string,
    action: 'delivered' | 'read' | 'clicked'
  ): Promise<void> {
    const update: any = {};
    update[`${action}At`] = new Date();
    if (action === 'delivered') update.status = 'delivered';

    await Notification.findByIdAndUpdate(notificationId, update);
  }

  /**
   * Get notification stats
   */
  static async getStats(shop: string): Promise<{
    total: number;
    sent: number;
    delivered: number;
    read: number;
    clicked: number;
  }> {
    const stats = await Notification.aggregate([
      { $match: { shop: shop.toLowerCase() } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = { total: 0, sent: 0, delivered: 0, read: 0, clicked: 0 };
    for (const stat of stats) {
      result.total += stat.count;
      if (stat._id === 'sent') result.sent = stat.count;
      if (stat._id === 'delivered') result.delivered = stat.count;
    }

    const reads = await Notification.countDocuments({ shop: shop.toLowerCase(), readAt: { $exists: true } });
    const clicks = await Notification.countDocuments({ shop: shop.toLowerCase(), clickedAt: { $exists: true } });
    result.read = reads;
    result.clicked = clicks;

    return result;
  }

  /**
   * Create template
   */
  static async createTemplate(data: {
    shop: string;
    tenantId: string;
    name: string;
    type: 'push' | 'email' | 'sms' | 'whatsapp';
    subject?: string;
    title: string;
    body: string;
    ctaText?: string;
    ctaUrl?: string;
    imageUrl?: string;
  }): Promise<INotificationTemplate> {
    // Extract variables from template
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    while ((match = variableRegex.exec(data.body)) !== null) {
      variables.push(match[1]);
    }

    return NotificationTemplate.create({
      ...data,
      shop: data.shop.toLowerCase(),
      variables,
    });
  }
}
