import { INotificationAdapter, SendResult, Notification } from '../types';

export abstract class BaseAdapter implements INotificationAdapter {
  abstract readonly channel: string;

  abstract send(notification: Notification): Promise<SendResult>;

  async sendBatch(notifications: Notification[]): Promise<SendResult[]> {
    const results: SendResult[] = [];

    for (const notification of notifications) {
      try {
        const result = await this.send(notification);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });
      }
    }

    return results;
  }

  async getStatus(notificationId: string): Promise<string> {
    // Default implementation - subclasses can override
    return 'unknown';
  }

  protected createSuccessResult(messageId: string): SendResult {
    return {
      success: true,
      messageId,
      timestamp: new Date(),
    };
  }

  protected createFailureResult(error: string): SendResult {
    return {
      success: false,
      error,
      timestamp: new Date(),
    };
  }
}
