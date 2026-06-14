import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async listNotifications(@Request() req) {
    return this.notificationsService.listForUser(req.user.id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllRead(@Request() req) {
    const userId = req.user.sub || req.user.id;
    this.logger.log(`Marking all notifications as read for user ${userId}`);
    return this.notificationsService.markAllRead(userId);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markRead(@Param('id') id: string, @Request() req) {
    this.logger.log(`Marking notification ${id} as read for user ${req.user.id}`);
    return this.notificationsService.markRead(id, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(@Param('id') id: string, @Request() req) {
    this.logger.log(`Deleting notification ${id} for user ${req.user.id}`);
    await this.notificationsService.deleteNotification(id, req.user.id);
  }
}
