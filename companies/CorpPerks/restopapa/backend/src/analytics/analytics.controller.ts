import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { AnalyticsService, TrackEventDto, NotificationDeliveryLogDto } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Track a custom analytics event
   */
  @Post('events')
  async trackEvent(@Body() dto: TrackEventDto): Promise<{ success: boolean }> {
    await this.analyticsService.trackEvent(dto.eventName, dto.properties);
    return { success: true };
  }

  /**
   * Get analytics events with pagination
   */
  @Get('events')
  async getEvents(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('eventName') eventName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ events: any[]; total: number }> {
    return this.analyticsService.getEvents({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      eventName,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  /**
   * Log notification delivery
   */
  @Post('notifications/delivery')
  async logNotificationDelivery(
    @Body() dto: NotificationDeliveryLogDto,
  ): Promise<{ success: boolean }> {
    await this.analyticsService.logNotificationDelivery(dto);
    return { success: true };
  }

  /**
   * Update notification delivery status
   */
  @Post('notifications/delivery/:notificationId')
  async updateDeliveryStatus(
    @Param('notificationId') notificationId: string,
    @Body() body: { status: 'delivered' | 'read' | 'failed'; error?: string },
  ): Promise<{ success: boolean }> {
    await this.analyticsService.updateDeliveryStatus(
      notificationId,
      body.status,
      body.error,
    );
    return { success: true };
  }

  /**
   * Get notification delivery logs
   */
  @Get('notifications/delivery')
  async getDeliveryLogs(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('eventType') eventType?: string,
  ): Promise<{ logs: any[]; total: number }> {
    return this.analyticsService.getDeliveryLogs({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      userId,
      status,
      eventType,
    });
  }

  /**
   * Get notification analytics summary
   */
  @Get('notifications/summary')
  async getNotificationAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
    @Query('eventType') eventType?: string,
  ): Promise<any> {
    return this.analyticsService.getNotificationAnalytics({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      userId,
      eventType,
    });
  }
}
