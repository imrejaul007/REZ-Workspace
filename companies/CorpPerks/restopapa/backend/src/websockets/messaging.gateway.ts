import logger from './utils/logger';

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
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
  namespace: '/messaging',
})
@Injectable()
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
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
      
      // Join user to their personal room
      client.join(`user_${client.userId}`);

      logger.info(`User ${client.userId} connected to messaging`);
    } catch (error) {
      logger.error('WebSocket authentication error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      logger.info(`User ${client.userId} disconnected from messaging`);
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: {
      receiverId: string;
      content: string;
      type?: 'text' | 'image' | 'file';
    },
    @ConnectedSocket() client: AuthSocket,
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      // Save message to database
      const message = await this.prisma.directMessage.create({
        data: {
          senderId: client.userId,
          receiverId: data.receiverId,
          content: data.content,
          isPaid: false, // Implement paid messaging logic here
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              restaurant: { select: { businessName: true } },
              employee: { select: { fullName: true } },
              vendor: { select: { businessName: true } },
            }
          }
        }
      });

      // Send to receiver if they're online
      const receiverSocketId = this.connectedUsers.get(data.receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('new_message', {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          senderName: this.getSenderName(message.sender),
          timestamp: message.createdAt,
          isRead: false,
        });
      }

      // Create notification for receiver
      await this.prisma.notification.create({
        data: {
          userId: data.receiverId,
          title: 'New Message',
          message: `You have a new message from ${this.getSenderName(message.sender)}`,
          type: 'message',
          actionUrl: `/messages?chat=${client.userId}`,
        }
      });

      return { success: true, messageId: message.id };
    } catch (error) {
      logger.error('Error sending message:', error);
      return { error: 'Failed to send message' };
    }
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() data: { senderId: string },
    @ConnectedSocket() client: AuthSocket,
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      await this.prisma.directMessage.updateMany({
        where: {
          senderId: data.senderId,
          receiverId: client.userId,
          isRead: false,
        },
        data: {
          isRead: true,
        }
      });

      return { success: true };
    } catch (error) {
      logger.error('Error marking messages as read:', error);
      return { error: 'Failed to mark messages as read' };
    }
  }

  @SubscribeMessage('typing_start')
  async handleTypingStart(
    @MessageBody() data: { receiverId: string },
    @ConnectedSocket() client: AuthSocket,
  ) {
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('user_typing', {
        userId: client.userId,
        typing: true,
      });
    }
  }

  @SubscribeMessage('typing_stop')
  async handleTypingStop(
    @MessageBody() data: { receiverId: string },
    @ConnectedSocket() client: AuthSocket,
  ) {
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('user_typing', {
        userId: client.userId,
        typing: false,
      });
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() data: { otherUserId: string },
    @ConnectedSocket() client: AuthSocket,
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    // Create a room for this conversation
    const conversationId = [client.userId, data.otherUserId].sort().join('_');
    client.join(conversationId);

    return { success: true, conversationId };
  }

  // Helper method to get sender name based on role
  private getSenderName(sender: any): string {
    if (sender.restaurant?.businessName) {
      return sender.restaurant.businessName;
    }
    if (sender.employee?.fullName) {
      return sender.employee.fullName;
    }
    if (sender.vendor?.businessName) {
      return sender.vendor.businessName;
    }
    return sender.email;
  }

  // Method to send system messages (called from other services)
  async sendSystemMessage(userId: string, message: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('system_message', message);
    }
  }
}