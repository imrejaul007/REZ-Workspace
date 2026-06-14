import logger from './utils/logger';

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

interface AuthSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
@Injectable()
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthSocket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.userRole = payload.role;

      // Store connection
      this.connectedUsers.set(client.userId, client.id);
      
      // Join user to their notification room
      client.join(`notifications_${client.userId}`);

      // Send unread notification count
      const unreadCount = await this.getUnreadNotificationCount(client.userId);
      client.emit('notification_count', { count: unreadCount });

      logger.info(`User ${client.userId} connected to notifications`);
    } catch (error) {
      logger.error('WebSocket authentication error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      logger.info(`User ${client.userId} disconnected from notifications`);
    }
  }

  @SubscribeMessage('mark_notification_read')
  async handleMarkNotificationRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: AuthSocket,
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      await this.prisma.notification.update({
        where: {
          id: data.notificationId,
          userId: client.userId, // Ensure user can only mark their own notifications as read
        },
        data: {
          isRead: true,
        }
      });

      // Send updated count
      const unreadCount = await this.getUnreadNotificationCount(client.userId);
      client.emit('notification_count', { count: unreadCount });

      return { success: true };
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      return { error: 'Failed to mark notification as read' };
    }
  }

  @SubscribeMessage('mark_all_notifications_read')
  async handleMarkAllNotificationsRead(@ConnectedSocket() client: AuthSocket) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      await this.prisma.notification.updateMany({
        where: {
          userId: client.userId,
          isRead: false,
        },
        data: {
          isRead: true,
        }
      });

      client.emit('notification_count', { count: 0 });

      return { success: true };
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      return { error: 'Failed to mark notifications as read' };
    }
  }

  @SubscribeMessage('get_notifications')
  async handleGetNotifications(
    @MessageBody() data: { page?: number; limit?: number },
    @ConnectedSocket() client: AuthSocket,
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      const page = data.page || 1;
      const limit = data.limit || 20;
      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where: { userId: client.userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.notification.count({
          where: { userId: client.userId }
        })
      ]);

      return {
        notifications,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: total
        }
      };
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      return { error: 'Failed to fetch notifications' };
    }
  }

  // Method to send notifications from other services
  async sendNotification(userId: string, notification: {
    title: string;
    message: string;
    type: string;
    actionUrl?: string;
  }) {
    try {
      // Save to database
      const savedNotification = await this.prisma.notification.create({
        data: {
          userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          actionUrl: notification.actionUrl,
        }
      });

      // Send real-time notification if user is connected
      const socketId = this.connectedUsers.get(userId);
      if (socketId) {
        this.server.to(socketId).emit('new_notification', {
          id: savedNotification.id,
          title: savedNotification.title,
          message: savedNotification.message,
          type: savedNotification.type,
          actionUrl: savedNotification.actionUrl,
          createdAt: savedNotification.createdAt,
          isRead: false,
        });

        // Send updated count
        const unreadCount = await this.getUnreadNotificationCount(userId);
        this.server.to(socketId).emit('notification_count', { count: unreadCount });
      }

      return savedNotification;
    } catch (error) {
      logger.error('Error sending notification:', error);
      throw error;
    }
  }

  // Bulk notification method for system-wide announcements
  async sendBulkNotification(userIds: string[], notification: {
    title: string;
    message: string;
    type: string;
    actionUrl?: string;
  }) {
    try {
      // Create notifications for all users
      const notifications = await this.prisma.notification.createMany({
        data: userIds.map(userId => ({
          userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          actionUrl: notification.actionUrl,
        }))
      });

      // Send real-time notifications to connected users
      for (const userId of userIds) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
          this.server.to(socketId).emit('new_notification', {
            title: notification.title,
            message: notification.message,
            type: notification.type,
            actionUrl: notification.actionUrl,
            createdAt: new Date(),
            isRead: false,
          });

          // Send updated count
          const unreadCount = await this.getUnreadNotificationCount(userId);
          this.server.to(socketId).emit('notification_count', { count: unreadCount });
        }
      }

      return notifications;
    } catch (error) {
      logger.error('Error sending bulk notification:', error);
      throw error;
    }
  }

  private async getUnreadNotificationCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      }
    });
  }
}