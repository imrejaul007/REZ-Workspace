import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RestaurantWhatsAppService } from './restaurant-whatsapp.service';
import {
  OrderWhatsAppDto,
  StatusUpdateDto,
  ReservationWhatsAppDto,
  WaitTimeNotificationDto,
  ReviewRequestDto,
  CampaignDto,
} from './dto/restaurant-whatsapp.dto';

/**
 * Restaurant WhatsApp Controller
 *
 * Handles REST endpoints for WhatsApp messaging:
 * - Send order notifications
 * - Send reservation updates
 * - Execute campaigns
 * - View queue status
 */
@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class RestaurantWhatsAppController {
  constructor(private readonly whatsappService: RestaurantWhatsAppService) {}

  // ==========================================
  // ORDER NOTIFICATIONS
  // ==========================================

  /**
   * Send order confirmation to customer
   */
  @Post('order/confirmation')
  @HttpCode(HttpStatus.OK)
  async sendOrderConfirmation(@Body() order: OrderWhatsAppDto) {
    const result = await this.whatsappService.sendOrderConfirmation(order);
    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
    };
  }

  /**
   * Send order status update
   */
  @Post('order/status')
  @HttpCode(HttpStatus.OK)
  async sendStatusUpdate(@Body() update: StatusUpdateDto) {
    const result = await this.whatsappService.sendStatusUpdate(update);
    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
    };
  }

  // ==========================================
  // RESERVATION NOTIFICATIONS
  // ==========================================

  /**
   * Send reservation confirmation
   */
  @Post('reservation/confirmation')
  @HttpCode(HttpStatus.OK)
  async sendReservationConfirmation(@Body() reservation: ReservationWhatsAppDto) {
    const result = await this.whatsappService.sendReservationConfirmation(reservation);
    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
    };
  }

  /**
   * Send reservation reminder
   */
  @Post('reservation/:reservationId/reminder')
  @HttpCode(HttpStatus.OK)
  async sendReservationReminder(@Param('reservationId') reservationId: string) {
    const result = await this.whatsappService.sendReservationReminder(reservationId);
    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
    };
  }

  // ==========================================
  // WAIT TIME NOTIFICATIONS
  // ==========================================

  /**
   * Send wait time notification to multiple customers
   */
  @Post('wait-time/notify')
  @HttpCode(HttpStatus.OK)
  async sendWaitTimeNotification(@Body() notification: WaitTimeNotificationDto) {
    const result = await this.whatsappService.sendWaitTimeNotification(notification);
    return {
      success: true,
      total: result.total,
      sent: result.successful,
      failed: result.failed,
      queued: result.queued,
    };
  }

  // ==========================================
  // REVIEW REQUESTS
  // ==========================================

  /**
   * Send review request after order
   */
  @Post('review/request')
  @HttpCode(HttpStatus.OK)
  async sendReviewRequest(@Body() review: ReviewRequestDto) {
    const result = await this.whatsappService.sendReviewRequest(review);
    return {
      success: result.success,
      messageId: result.messageId,
      status: result.status,
    };
  }

  // ==========================================
  // CAMPAIGNS
  // ==========================================

  /**
   * Execute marketing campaign
   */
  @Post('campaigns/send')
  @HttpCode(HttpStatus.OK)
  async sendCampaign(@Body() campaign: CampaignDto) {
    const result = await this.whatsappService.sendCampaign(campaign);
    return result;
  }

  // ==========================================
  // QUEUE MANAGEMENT
  // ==========================================

  /**
   * Get WhatsApp queue status
   */
  @Get('queue/status')
  async getQueueStatus() {
    const status = this.whatsappService.getQueueStatus();
    return {
      success: true,
      ...status,
    };
  }

  /**
   * Retry failed messages
   */
  @Post('queue/retry')
  @HttpCode(HttpStatus.OK)
  async retryFailedMessages() {
    const count = await this.whatsappService.retryFailedMessages();
    return {
      success: true,
      retried: count,
    };
  }
}
