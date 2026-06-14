import crypto from 'crypto';
import { logger } from '../utils/logger';

export class WebhookHandler {
  private processedEvents = new Map<string, number>();

  async handleWebhook(payload, signature: string): Promise<void> {
    // 1. Verify signature
    this.verifySignature(payload, signature);

    // 2. Check idempotency
    const eventId = payload.payload?.payment?.entity?.id || payload.id;
    if (this.isProcessed(eventId)) {
      logger.debug(`Webhook already processed: ${eventId}`);
      return;
    }

    // 3. Process event
    const event = payload.event;
    switch (event) {
      case 'payment.captured':
        await this.handlePaymentCaptured(payload);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(payload);
        break;
      case 'refund.created':
        await this.handleRefundCreated(payload);
        break;
      case 'refund.processed':
        await this.handleRefundProcessed(payload);
        break;
    }

    // 4. Mark as processed
    this.markProcessed(eventId);
  }

  private verifySignature(payload, signature: string): void {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new Error('Invalid webhook signature');
    }
  }

  private isProcessed(eventId: string): boolean {
    const timestamp = this.processedEvents.get(eventId);
    if (!timestamp) return false;

    // Events expire after 24 hours
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      this.processedEvents.delete(eventId);
      return false;
    }
    return true;
  }

  private markProcessed(eventId: string): void {
    this.processedEvents.set(eventId, Date.now());
  }

  private async handlePaymentCaptured(payload): Promise<void> {
    // Credit wallet
    // Award coins
    // Send notification
  }

  private async handlePaymentFailed(payload): Promise<void> {
    // Update order status
  }

  private async handleRefundCreated(payload): Promise<void> {
    // Debit wallet
  }

  private async handleRefundProcessed(payload): Promise<void> {
    // Confirm refund
  }
}
