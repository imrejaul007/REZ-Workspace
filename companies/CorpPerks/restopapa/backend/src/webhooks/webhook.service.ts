import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AnalyticsService } from '../analytics/analytics.service';

export interface WebhookEvent {
  type: string;
  payload: Record<string, any>;
  timestamp: Date;
  source: string;
}

export interface OrderWebhookPayload {
  orderId: string;
  orderNumber: string;
  status: string;
  customerId: string;
  merchantId: string;
  totalAmount?: number;
}

export interface PaymentWebhookPayload {
  paymentId: string;
  orderId: string;
  status: string;
  amount: number;
  userId: string;
}

export interface UserWebhookPayload {
  userId: string;
  event: 'registered' | 'verified' | 'deactivated';
}

/**
 * Webhook Handler Service
 * Processes incoming webhook events and triggers appropriate actions
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private analyticsService: AnalyticsService,
  ) {}

  /**
   * Process a webhook event
   */
  async processEvent(event: WebhookEvent): Promise<void> {
    this.logger.log(`Processing webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case 'order.created':
          await this.handleOrderCreated(event.payload as OrderWebhookPayload);
          break;
        case 'order.status_updated':
          await this.handleOrderStatusUpdated(event.payload as OrderWebhookPayload);
          break;
        case 'order.cancelled':
          await this.handleOrderCancelled(event.payload as OrderWebhookPayload);
          break;
        case 'payment.success':
          await this.handlePaymentSuccess(event.payload as PaymentWebhookPayload);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(event.payload as PaymentWebhookPayload);
          break;
        case 'user.registered':
          await this.handleUserRegistered(event.payload as UserWebhookPayload);
          break;
        case 'user.verified':
          await this.handleUserVerified(event.payload as UserWebhookPayload);
          break;
        default:
          this.logger.warn(`Unknown webhook event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error processing webhook event: ${event.type}`, error);
      throw error;
    }
  }

  /**
   * Handle order created webhook
   */
  private async handleOrderCreated(payload: OrderWebhookPayload): Promise<void> {
    this.logger.log(`Processing order created: ${payload.orderId}`);

    // Create notification for merchant
    await this.notificationsService.createNotification({
      userId: payload.merchantId,
      title: 'New Order Received',
      message: `Order #${payload.orderNumber} has been placed${payload.totalAmount ? ` for $${payload.totalAmount.toFixed(2)}` : ''}`,
      type: 'order_new',
      data: {
        orderId: payload.orderId,
        orderNumber: payload.orderNumber,
      },
    });

    // Track analytics
    await this.analyticsService.trackEvent('order_created', {
      orderId: payload.orderId,
      orderNumber: payload.orderNumber,
      merchantId: payload.merchantId,
      totalAmount: payload.totalAmount,
    });

    // Log for notification delivery tracking
    await this.analyticsService.logNotificationDelivery({
      eventType: 'order_created',
      userId: payload.merchantId,
      orderId: payload.orderId,
    });
  }

  /**
   * Handle order status update webhook
   */
  private async handleOrderStatusUpdated(payload: OrderWebhookPayload): Promise<void> {
    this.logger.log(`Processing order status update: ${payload.orderId} -> ${payload.status}`);

    const statusMessages: Record<string, string> = {
      confirmed: 'has been confirmed',
      preparing: 'is being prepared',
      ready: 'is ready for pickup',
      dispatched: 'has been dispatched',
      out_for_delivery: 'is out for delivery',
      delivered: 'has been delivered',
    };

    const message = statusMessages[payload.status] || `status changed to ${payload.status}`;

    // Notify customer
    await this.notificationsService.createNotification({
      userId: payload.customerId,
      title: 'Order Update',
      message: `Order #${payload.orderNumber} ${message}`,
      type: 'order_update',
      data: {
        orderId: payload.orderId,
        orderNumber: payload.orderNumber,
        status: payload.status,
      },
    });

    // Track analytics
    await this.analyticsService.trackEvent('order_status_updated', {
      orderId: payload.orderId,
      orderNumber: payload.orderNumber,
      status: payload.status,
    });
  }

  /**
   * Handle order cancelled webhook
   */
  private async handleOrderCancelled(payload: OrderWebhookPayload): Promise<void> {
    this.logger.log(`Processing order cancelled: ${payload.orderId}`);

    // Notify merchant
    await this.notificationsService.createNotification({
      userId: payload.merchantId,
      title: 'Order Cancelled',
      message: `Order #${payload.orderNumber} has been cancelled by the customer`,
      type: 'order_cancelled',
      data: {
        orderId: payload.orderId,
        orderNumber: payload.orderNumber,
      },
    });

    // Notify customer
    await this.notificationsService.createNotification({
      userId: payload.customerId,
      title: 'Order Cancelled',
      message: `Your order #${payload.orderNumber} has been cancelled`,
      type: 'order_cancelled',
      data: {
        orderId: payload.orderId,
        orderNumber: payload.orderNumber,
      },
    });

    // Track analytics
    await this.analyticsService.trackEvent('order_cancelled', {
      orderId: payload.orderId,
      orderNumber: payload.orderNumber,
      cancelledBy: 'customer',
    });
  }

  /**
   * Handle payment success webhook
   */
  private async handlePaymentSuccess(payload: PaymentWebhookPayload): Promise<void> {
    this.logger.log(`Processing payment success: ${payload.paymentId}`);

    // Notify user
    await this.notificationsService.createNotification({
      userId: payload.userId,
      title: 'Payment Successful',
      message: `Your payment of $${payload.amount.toFixed(2)} has been processed successfully`,
      type: 'payment_success',
      data: {
        paymentId: payload.paymentId,
        orderId: payload.orderId,
        amount: payload.amount,
      },
    });

    // Track analytics
    await this.analyticsService.trackEvent('payment_success', {
      paymentId: payload.paymentId,
      orderId: payload.orderId,
      amount: payload.amount,
    });
  }

  /**
   * Handle payment failed webhook
   */
  private async handlePaymentFailed(payload: PaymentWebhookPayload): Promise<void> {
    this.logger.log(`Processing payment failed: ${payload.paymentId}`);

    // Notify user
    await this.notificationsService.createNotification({
      userId: payload.userId,
      title: 'Payment Failed',
      message: `Your payment of $${payload.amount.toFixed(2)} could not be processed. Please try again.`,
      type: 'payment_failed',
      data: {
        paymentId: payload.paymentId,
        orderId: payload.orderId,
        amount: payload.amount,
      },
    });

    // Track analytics
    await this.analyticsService.trackEvent('payment_failed', {
      paymentId: payload.paymentId,
      orderId: payload.orderId,
      amount: payload.amount,
    });
  }

  /**
   * Handle user registered webhook
   */
  private async handleUserRegistered(payload: UserWebhookPayload): Promise<void> {
    this.logger.log(`Processing user registered: ${payload.userId}`);

    // Send welcome notification
    await this.notificationsService.createNotification({
      userId: payload.userId,
      title: 'Welcome to ReZ!',
      message: 'Thank you for registering. Start exploring our services!',
      type: 'welcome',
      data: {
        userId: payload.userId,
      },
    });

    // Track analytics
    await this.analyticsService.trackEvent('user_registered', {
      userId: payload.userId,
    });
  }

  /**
   * Handle user verified webhook
   */
  private async handleUserVerified(payload: UserWebhookPayload): Promise<void> {
    this.logger.log(`Processing user verified: ${payload.userId}`);

    // Send verification notification
    await this.notificationsService.createNotification({
      userId: payload.userId,
      title: 'Account Verified',
      message: 'Your account has been verified successfully. You now have full access!',
      type: 'account_verified',
      data: {
        userId: payload.userId,
      },
    });

    // Track analytics
    await this.analyticsService.trackEvent('user_verified', {
      userId: payload.userId,
    });
  }

  /**
   * Register a webhook endpoint
   */
  async registerWebhook(endpoint: string, events: string[], secret: string): Promise<string> {
    const webhook = await this.prisma.webhook.create({
      data: {
        endpoint,
        events: JSON.stringify(events),
        secret,
        isActive: true,
      },
    });

    return webhook.id;
  }

  /**
   * Unregister a webhook endpoint
   */
  async unregisterWebhook(webhookId: string): Promise<void> {
    await this.prisma.webhook.update({
      where: { id: webhookId },
      data: { isActive: false },
    });
  }

  /**
   * Get all registered webhooks
   */
  async getWebhooks(): Promise<any[]> {
    return this.prisma.webhook.findMany({
      where: { isActive: true },
    });
  }
}
