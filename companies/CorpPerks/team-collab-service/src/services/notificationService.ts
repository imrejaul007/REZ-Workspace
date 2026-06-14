import axios from 'axios';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channel?: string;
  tags?: string[];
}

export class NotificationService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = NOTIFICATION_SERVICE_URL;
  }

  /**
   * Send notification for new message in channel
   */
  async notifyNewMessage(
    channelId: string,
    channelName: string,
    senderName: string,
    content: string,
    recipientIds: string[],
    excludeUserId?: string
  ): Promise<void> {
    const recipients = excludeUserId
      ? recipientIds.filter((id) => id !== excludeUserId)
      : recipientIds;

    if (recipients.length === 0) return;

    await this.sendBatch({
      recipients,
      notification: {
        title: `New message in ${channelName}`,
        body: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        channel: 'team-collab',
        tags: ['message', channelId],
      },
    });
  }

  /**
   * Send notification for new announcement
   */
  async notifyNewAnnouncement(
    title: string,
    summary: string,
    authorName: string,
    priority: 'low' | 'normal' | 'high' | 'urgent',
    recipientIds: string[]
  ): Promise<void> {
    const priorityEmoji = {
      low: '',
      normal: '',
      high: '🔥',
      urgent: '🚨',
    };

    await this.sendBatch({
      recipients: recipientIds,
      notification: {
        title: `${priorityEmoji[priority]} ${title}`,
        body: `${authorName}: ${summary}`,
        channel: 'team-collab',
        tags: ['announcement'],
        data: { priority },
      },
    });
  }

  /**
   * Send notification for upcoming meeting
   */
  async notifyUpcomingMeeting(
    meetingId: string,
    title: string,
    startTime: Date,
    attendeeIds: string[]
  ): Promise<void> {
    const timeUntil = this.getTimeUntil(startTime);

    await this.sendBatch({
      recipients: attendeeIds,
      notification: {
        title: `Upcoming: ${title}`,
        body: `Starting ${timeUntil}`,
        channel: 'team-collab',
        tags: ['meeting', meetingId],
        data: { meetingId, startTime: startTime.toISOString() },
      },
    });
  }

  /**
   * Send notification for action item assignment
   */
  async notifyActionItem(
    assigneeId: string,
    assigneeName: string,
    meetingTitle: string,
    task: string,
    dueDate?: Date
  ): Promise<void> {
    let body = `You have a new action item from ${meetingTitle}: ${task}`;
    if (dueDate) {
      body += `\nDue: ${this.formatDate(dueDate)}`;
    }

    await this.send({
      userId: assigneeId,
      notification: {
        title: 'New Action Item Assigned',
        body,
        channel: 'team-collab',
        tags: ['action-item', meetingTitle],
      },
    });
  }

  /**
   * Send notification for thread reply
   */
  async notifyThreadReply(
    parentMessageSenderId: string,
    parentMessageSenderName: string,
    channelName: string,
    replyContent: string,
    threadId: string
  ): Promise<void> {
    await this.send({
      userId: parentMessageSenderId,
      notification: {
        title: `${parentMessageSenderName} replied to your thread`,
        body: `${channelName}: ${replyContent.substring(0, 100)}...`,
        channel: 'team-collab',
        tags: ['thread', threadId],
        data: { threadId },
      },
    });
  }

  /**
   * Send notification for channel invite
   */
  async notifyChannelInvite(
    inviteeId: string,
    channelName: string,
    inviterName: string
  ): Promise<void> {
    await this.send({
      userId: inviteeId,
      notification: {
        title: `Added to ${channelName}`,
        body: `You were added to ${channelName} by ${inviterName}`,
        channel: 'team-collab',
        tags: ['channel-invite'],
      },
    });
  }

  /**
   * Send notification for meeting reminder
   */
  async notifyMeetingReminder(
    attendeeIds: string[],
    meetingId: string,
    title: string,
    startTime: Date,
    minutesUntil: number
  ): Promise<void> {
    await this.sendBatch({
      recipients: attendeeIds,
      notification: {
        title: `Meeting starting in ${minutesUntil} minutes`,
        body: title,
        channel: 'team-collab',
        tags: ['meeting-reminder', meetingId],
        data: { meetingId, startTime: startTime.toISOString() },
      },
    });
  }

  /**
   * Send push notification to single user
   */
  async send(data: {
    userId: string;
    notification: {
      title: string;
      body: string;
      channel?: string;
      tags?: string[];
      data?: Record<string, unknown>;
    };
  }): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/notifications/send`,
        {
          userId: data.userId,
          title: data.notification.title,
          body: data.notification.body,
          data: {
            ...data.notification.data,
            source: 'team-collab-service',
          },
          channel: data.notification.channel || 'team-collab',
          tags: data.notification.tags || [],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN,
          },
          timeout: 5000,
        }
      );

      return response.status === 200;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Failed to send notification:', error.message);
      }
      return false;
    }
  }

  /**
   * Send batch notifications
   */
  async sendBatch(data: {
    recipients: string[];
    notification: {
      title: string;
      body: string;
      channel?: string;
      tags?: string[];
      data?: Record<string, unknown>;
    };
  }): Promise<void> {
    // Send to each recipient (in production, use a queue/batch API)
    await Promise.all(
      data.recipients.map((userId) =>
        this.send({ userId, notification: data.notification })
      )
    );
  }

  /**
   * Get human-readable time until date
   */
  private getTimeUntil(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 0) return 'started';
    if (diffMins < 60) return `in ${diffMins} minutes`;
    if (diffMins < 120) return 'in 1 hour';
    if (diffMins < 1440) return `in ${Math.floor(diffMins / 60)} hours`;
    return `in ${Math.floor(diffMins / 1440)} days`;
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

export const notificationService = new NotificationService();
