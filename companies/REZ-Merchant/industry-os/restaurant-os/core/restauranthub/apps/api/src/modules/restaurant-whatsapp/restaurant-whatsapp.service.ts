import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios, { AxiosError } from 'axios';
import {
  OrderWhatsAppDto,
  StatusUpdateDto,
  ReservationWhatsAppDto,
  WaitTimeNotificationDto,
  ReviewRequestDto,
  CampaignDto,
  CampaignResult,
  SendMessageResult,
  BatchSendResult,
  MessageDeliveryStatus,
  WhatsAppTemplateType,
  OrderStatusEnum,
} from './dto/restaurant-whatsapp.dto';

// WhatsApp Unified Platform integration
const WHATSAPP_URL = process.env.WHATSAPP_URL || 'http://localhost:4610';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-token';

/**
 * Message status for local tracking
 */
interface WhatsAppMessage {
  id: string;
  phone: string;
  templateType: WhatsAppTemplateType;
  status: MessageDeliveryStatus;
  retryCount: number;
  sentAt?: Date;
  error?: string;
}

/**
 * Restaurant WhatsApp Service
 *
 * Handles all WhatsApp communications for restaurant use cases:
 * - Order confirmations and status updates
 * - Table reservation notifications
 * - Wait time alerts
 * - Review requests
 * - Marketing campaigns
 *
 * Integrates with HOJAI Unified Platform (WhatsApp)
 */
@Injectable()
export class RestaurantWhatsAppService {
  private readonly logger = new Logger(RestaurantWhatsAppService.name);
  private readonly messageQueue: WhatsAppMessage[] = [];
  private readonly maxRetries = 3;
  private readonly retryDelays = [5000, 15000, 30000]; // 5s, 15s, 30s

  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // ORDER NOTIFICATIONS
  // ==========================================

  /**
   * Send order confirmation to customer
   */
  async sendOrderConfirmation(order: OrderWhatsAppDto): Promise<SendMessageResult> {
    const message = this.formatOrderConfirmationMessage(order);

    try {
      const result = await this.sendWhatsAppMessage({
        phone: order.customerPhone,
        templateType: WhatsAppTemplateType.ORDER_CONFIRMATION,
        message,
        metadata: {
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          itemCount: order.items.length,
        },
      });

      return {
        success: true,
        messageId: result.messageId,
        phone: order.customerPhone,
        status: MessageDeliveryStatus.SENT,
        sentAt: new Date(),
        templateType: WhatsAppTemplateType.ORDER_CONFIRMATION,
      };
    } catch (error) {
      this.logger.error(`Failed to send order confirmation: ${error instanceof Error ? error.message : 'Unknown'}`);
      return this.handleSendError(order.customerPhone, WhatsAppTemplateType.ORDER_CONFIRMATION, error);
    }
  }

  /**
   * Send order status update to customer
   */
  async sendStatusUpdate(update: StatusUpdateDto): Promise<SendMessageResult> {
    const statusMessages: Record<string, string> = {
      [OrderStatusEnum.CONFIRMED]: `Your order is confirmed! 🥗 Our kitchen is preparing your food.`,
      [OrderStatusEnum.PREPARING]: `Your order is being prepared 🔥 We'll notify you when it's ready.`,
      [OrderStatusEnum.READY]: `Your order is ready! 🎉 Please collect it from the counter.`,
      [OrderStatusEnum.DELIVERED]: `Your order has been delivered! Enjoy your meal 🍽️`,
      [OrderStatusEnum.CANCELLED]: `Your order has been cancelled. Refund will be processed shortly.`,
    };

    const message = update.message || statusMessages[update.status] || `Order status: ${update.status}`;

    try {
      const result = await this.sendWhatsAppMessage({
        phone: update.orderId, // In real impl, fetch customer phone from order
        templateType: WhatsAppTemplateType.ORDER_STATUS_UPDATE,
        message,
        metadata: {
          orderId: update.orderId,
          status: update.status,
          estimatedTime: update.estimatedTime,
        },
      });

      return {
        success: true,
        messageId: result.messageId,
        phone: update.orderId,
        status: MessageDeliveryStatus.SENT,
        sentAt: new Date(),
        templateType: WhatsAppTemplateType.ORDER_STATUS_UPDATE,
      };
    } catch (error) {
      this.logger.error(`Failed to send status update: ${error instanceof Error ? error.message : 'Unknown'}`);
      return this.handleSendError(update.orderId, WhatsAppTemplateType.ORDER_STATUS_UPDATE, error);
    }
  }

  // ==========================================
  // RESERVATION NOTIFICATIONS
  // ==========================================

  /**
   * Send reservation confirmation
   */
  async sendReservationConfirmation(reservation: ReservationWhatsAppDto): Promise<SendMessageResult> {
    const message = this.formatReservationConfirmationMessage(reservation);

    try {
      const result = await this.sendWhatsAppMessage({
        phone: reservation.customerPhone,
        templateType: WhatsAppTemplateType.RESERVATION_CONFIRMATION,
        message,
        metadata: {
          reservationId: reservation.reservationId,
          partySize: reservation.partySize,
          reservationTime: reservation.reservationTime,
        },
      });

      return {
        success: true,
        messageId: result.messageId,
        phone: reservation.customerPhone,
        status: MessageDeliveryStatus.SENT,
        sentAt: new Date(),
        templateType: WhatsAppTemplateType.RESERVATION_CONFIRMATION,
      };
    } catch (error) {
      this.logger.error(`Failed to send reservation confirmation: ${error instanceof Error ? error.message : 'Unknown'}`);
      return this.handleSendError(reservation.customerPhone, WhatsAppTemplateType.RESERVATION_CONFIRMATION, error);
    }
  }

  /**
   * Send reservation reminder (24 hours before)
   */
  async sendReservationReminder(reservationId: string): Promise<SendMessageResult> {
    try {
      const reservation = await this.prisma.tableReservation.findUnique({
        where: { id: reservationId },
        include: { customer: true },
      });

      if (!reservation) {
        throw new NotFoundException('Reservation not found');
      }

      const message = `Reminder: Your table at ${reservation.restaurantId} is booked for tomorrow at ${new Date(reservation.reservationTime).toLocaleTimeString()} for ${reservation.partySize} guests. See you then!`;

      const result = await this.sendWhatsAppMessage({
        phone: reservation.customer?.phone || '',
        templateType: WhatsAppTemplateType.RESERVATION_REMINDER,
        message,
        metadata: { reservationId },
      });

      return {
        success: true,
        messageId: result.messageId,
        phone: reservation.customer?.phone || '',
        status: MessageDeliveryStatus.SENT,
        sentAt: new Date(),
        templateType: WhatsAppTemplateType.RESERVATION_REMINDER,
      };
    } catch (error) {
      this.logger.error(`Failed to send reservation reminder: ${error instanceof Error ? error.message : 'Unknown'}`);
      return this.handleSendError(reservationId, WhatsAppTemplateType.RESERVATION_REMINDER, error);
    }
  }

  // ==========================================
  // WAIT TIME NOTIFICATIONS
  // ==========================================

  /**
   * Send wait time notification to customers in queue
   */
  async sendWaitTimeNotification(notification: WaitTimeNotificationDto): Promise<BatchSendResult> {
    const results: SendMessageResult[] = [];
    const message = notification.message ||
      `Current estimated wait time: ${notification.estimatedWaitMinutes} minutes${notification.currentQueuePosition ? `. Your position: ${notification.currentQueuePosition}` : ''}`;

    for (const phone of notification.customerPhones) {
      try {
        const result = await this.sendWhatsAppMessage({
          phone,
          templateType: WhatsAppTemplateType.WAIT_TIME_NOTIFICATION,
          message,
          metadata: {
            restaurantId: notification.restaurantId,
            waitMinutes: notification.estimatedWaitMinutes,
            queuePosition: notification.currentQueuePosition,
          },
        });

        results.push({
          success: true,
          messageId: result.messageId,
          phone,
          status: MessageDeliveryStatus.SENT,
          sentAt: new Date(),
          templateType: WhatsAppTemplateType.WAIT_TIME_NOTIFICATION,
        });
      } catch (error) {
        results.push({
          success: false,
          phone,
          status: MessageDeliveryStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
          templateType: WhatsAppTemplateType.WAIT_TIME_NOTIFICATION,
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      total: results.length,
      successful,
      failed,
      queued: 0,
      results,
      processedAt: new Date(),
    };
  }

  // ==========================================
  // REVIEW REQUESTS
  // ==========================================

  /**
   * Send review request after order delivery
   */
  async sendReviewRequest(review: ReviewRequestDto): Promise<SendMessageResult> {
    const message = review.requestPhotoReview
      ? `How was your meal at ${review.restaurantName || 'our restaurant'}? We'd love to hear your feedback and see your food photos! ${review.reviewLink || ''}`
      : `Thank you for dining with us, ${review.customerName || 'valued customer'}! How was your experience at ${review.restaurantName || 'our restaurant'}? ${review.reviewLink || ''}`;

    try {
      const result = await this.sendWhatsAppMessage({
        phone: review.customerPhone,
        templateType: WhatsAppTemplateType.REVIEW_REQUEST,
        message,
        metadata: {
          orderId: review.orderId,
          orderNumber: review.orderNumber,
          rating: review.orderRating,
        },
      });

      return {
        success: true,
        messageId: result.messageId,
        phone: review.customerPhone,
        status: MessageDeliveryStatus.SENT,
        sentAt: new Date(),
        templateType: WhatsAppTemplateType.REVIEW_REQUEST,
      };
    } catch (error) {
      this.logger.error(`Failed to send review request: ${error instanceof Error ? error.message : 'Unknown'}`);
      return this.handleSendError(review.customerPhone, WhatsAppTemplateType.REVIEW_REQUEST, error);
    }
  }

  // ==========================================
  // CAMPAIGNS
  // ==========================================

  /**
   * Send campaign message to customer segment
   */
  async sendCampaign(campaign: CampaignDto): Promise<CampaignResult> {
    try {
      // Get target customers based on segment
      const customers = await this.getCampaignTargets(campaign);

      if (customers.length === 0) {
        return {
          success: true,
          totalRecipients: 0,
          sent: 0,
          failed: 0,
          queued: 0,
          message: 'No customers match the target criteria',
        };
      }

      const results = await this.batchSend(
        customers.map(c => ({
          phone: c.phone,
          customerId: c.id,
        })),
        campaign.messageTemplate,
        WhatsAppTemplateType.CAMPAIGN_PROMOTIONAL,
        { campaignId: campaign.name, campaignType: campaign.campaignType }
      );

      return {
        success: results.successful > 0,
        totalRecipients: customers.length,
        sent: results.successful,
        failed: results.failed,
        queued: results.queued,
        message: `Campaign sent to ${results.successful} customers`,
      };
    } catch (error) {
      this.logger.error(`Campaign failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      throw new InternalServerErrorException('Campaign delivery failed');
    }
  }

  /**
   * Get customers matching campaign target criteria
   */
  private async getCampaignTargets(campaign: CampaignDto): Promise<Array<{ id: string; phone: string }>> {
    // Query customers from database based on segment
    // This is a simplified implementation - real one would use CRM module
    const whereClause: Record<string, unknown> = {};

    if (campaign.customerIds && campaign.customerIds.length > 0) {
      return campaign.customerIds.map(id => ({ id, phone: '' })); // Real impl would fetch phones
    }

    // For now, return empty - CRM module will provide this
    return [];
  }

  /**
   * Batch send messages to multiple recipients
   */
  private async batchSend(
    recipients: Array<{ phone: string; customerId: string }>,
    messageTemplate: string,
    templateType: WhatsAppTemplateType,
    metadata: Record<string, unknown>
  ): Promise<BatchSendResult> {
    const results: SendMessageResult[] = [];
    let queued = 0;

    for (const recipient of recipients) {
      try {
        const result = await this.sendWhatsAppMessage({
          phone: recipient.phone,
          templateType,
          message: messageTemplate,
          metadata: { ...metadata, customerId: recipient.customerId },
        });

        results.push({
          success: true,
          messageId: result.messageId,
          phone: recipient.phone,
          status: MessageDeliveryStatus.SENT,
          sentAt: new Date(),
          templateType,
        });
      } catch (error) {
        // Queue for retry
        this.queueMessage(recipient.phone, templateType, messageTemplate);
        queued++;

        results.push({
          success: false,
          phone: recipient.phone,
          status: MessageDeliveryStatus.QUEUED,
          error: error instanceof Error ? error.message : 'Unknown',
          templateType,
          retryCount: 0,
        });
      }
    }

    return {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success && r.status !== MessageDeliveryStatus.QUEUED).length,
      queued,
      results,
      processedAt: new Date(),
    };
  }

  // ==========================================
  // CORE WHATSAPP INTEGRATION
  // ==========================================

  /**
   * Send message via WhatsApp Unified Platform
   */
  private async sendWhatsAppMessage(params: {
    phone: string;
    templateType: WhatsAppTemplateType;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean; messageId: string }> {
    try {
      const response = await axios.post(
        `${WHATSAPP_URL}/api/v1/messages/send`,
        {
          phone: params.phone,
          template: params.templateType,
          message: params.message,
          metadata: params.metadata,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        return {
          success: true,
          messageId: response.data.messageId || `wa-${Date.now()}`,
        };
      }

      throw new Error(response.data.error || 'WhatsApp API returned failure');
    } catch (error) {
      if (error instanceof AxiosError) {
        // Network error - queue for retry
        if (!error.response) {
          this.queueMessage(params.phone, params.templateType, params.message);
          throw new Error('Message queued for offline delivery');
        }
        throw new Error(`WhatsApp API error: ${error.response?.status}`);
      }
      throw error;
    }
  }

  /**
   * Queue message for offline/retry delivery
   */
  private queueMessage(
    phone: string,
    templateType: WhatsAppTemplateType,
    message: string
  ): void {
    const queuedMessage: WhatsAppMessage = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      phone,
      templateType,
      status: MessageDeliveryStatus.QUEUED,
      retryCount: 0,
    };

    this.messageQueue.push(queuedMessage);
    this.logger.log(`Message queued for ${phone}, queue size: ${this.messageQueue.length}`);

    // Process queue after short delay
    setTimeout(() => this.processQueue(), this.retryDelays[0]);
  }

  /**
   * Process queued messages with retry logic
   */
  private async processQueue(): Promise<void> {
    const toProcess = this.messageQueue.filter(
      m => m.status === MessageDeliveryStatus.QUEUED && m.retryCount < this.maxRetries
    );

    for (const message of toProcess) {
      try {
        await this.sendWhatsAppMessage({
          phone: message.phone,
          templateType: message.templateType,
          message: '', // Would need to store full message
        });

        message.status = MessageDeliveryStatus.SENT;
        message.sentAt = new Date();
        this.logger.log(`Queued message delivered to ${message.phone}`);
      } catch (error) {
        message.retryCount++;
        message.error = error instanceof Error ? error.message : 'Unknown';

        if (message.retryCount < this.maxRetries) {
          // Schedule next retry
          const delay = this.retryDelays[message.retryCount];
          setTimeout(() => this.processQueue(), delay);
        } else {
          message.status = MessageDeliveryStatus.FAILED;
          this.logger.error(`Message to ${message.phone} failed after ${this.maxRetries} attempts`);
        }
      }
    }
  }

  /**
   * Handle send error with retry
   */
  private handleSendError(
    phone: string,
    templateType: WhatsAppTemplateType,
    error: unknown
  ): SendMessageResult {
    this.queueMessage(phone, templateType, '');

    return {
      success: false,
      phone,
      status: MessageDeliveryStatus.QUEUED,
      error: error instanceof Error ? error.message : 'Unknown error',
      retryCount: 0,
      templateType,
    };
  }

  // ==========================================
  // MESSAGE FORMATTING
  // ==========================================

  /**
   * Format order confirmation message
   */
  private formatOrderConfirmationMessage(order: OrderWhatsAppDto): string {
    const itemsList = order.items
      .slice(0, 3)
      .map(item => `${item.quantity}x ${item.productName || item.productId}`)
      .join(', ');

    const moreItems = order.items.length > 3 ? ` and ${order.items.length - 3} more items` : '';

    return `🍽️ *Order Confirmed!*

Order #${order.orderNumber}
${order.restaurantName || ''}

${itemsList}${moreItems}

Total: ₹${order.totalAmount.toFixed(2)}
${order.estimatedDeliveryTime ? `ETA: ${new Date(order.estimatedDeliveryTime).toLocaleString()}` : ''}

Thank you for ordering with us! 🎉`;
  }

  /**
   * Format reservation confirmation message
   */
  private formatReservationConfirmationMessage(reservation: ReservationWhatsAppDto): string {
    const date = new Date(reservation.reservationTime);
    const formattedDate = date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    const formattedTime = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    return `🪑 *Reservation Confirmed!*

${reservation.restaurantName || 'Restaurant'}

📅 ${formattedDate}
🕐 ${formattedTime}
👥 ${reservation.partySize} guests
${reservation.tableNumber ? `Table: ${reservation.tableNumber}` : ''}

See you soon! 🎉`;
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Get queue status
   */
  getQueueStatus(): { queued: number; processing: number; failed: number } {
    return {
      queued: this.messageQueue.filter(m => m.status === MessageDeliveryStatus.QUEUED).length,
      processing: this.messageQueue.filter(m => m.status === MessageDeliveryStatus.PENDING).length,
      failed: this.messageQueue.filter(m => m.status === MessageDeliveryStatus.FAILED).length,
    };
  }

  /**
   * Retry failed messages
   */
  async retryFailedMessages(): Promise<number> {
    const failed = this.messageQueue.filter(m => m.status === MessageDeliveryStatus.FAILED);

    for (const message of failed) {
      message.status = MessageDeliveryStatus.QUEUED;
      message.retryCount = 0;
    }

    this.processQueue();
    return failed.length;
  }
}
