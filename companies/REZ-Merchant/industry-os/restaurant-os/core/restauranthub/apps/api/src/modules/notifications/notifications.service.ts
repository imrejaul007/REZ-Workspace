import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    this.logger.log(`Marked ${result.count} notifications as read for user ${userId}`);
    return { count: result.count };
  }

  async markRead(id: string, userId: string) {
    await this.assertOwnership(id, userId);
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async deleteNotification(id: string, userId: string) {
    await this.assertOwnership(id, userId);
    await this.prisma.notification.delete({ where: { id } });
    this.logger.log(`Notification ${id} deleted by user ${userId}`);
  }

  private async assertOwnership(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException(`Notification ${id} not found`);
    if (notification.userId !== userId) throw new ForbiddenException('Access denied');
    return notification;
  }
}
