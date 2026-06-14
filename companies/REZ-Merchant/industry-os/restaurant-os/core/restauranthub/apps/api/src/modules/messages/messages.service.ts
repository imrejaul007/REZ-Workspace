import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { has: userId },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    return conversations.map((conv) => {
      const unreadCount = 0; // would require a DB count per conv; returning 0 until full messaging system
      return {
        id: conv.id,
        participants: conv.participants,
        lastMessage: conv.messages[0] ?? null,
        unreadCount,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt,
      };
    });
  }

  async getConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }
    if (!conversation.participants.includes(userId)) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }

    return conversation;
  }

  async createConversation(
    userId: string,
    recipientId: string,
    subject?: string,
  ) {
    // Prevent self-conversation
    if (userId === recipientId) {
      throw new ForbiddenException('Cannot create a conversation with yourself');
    }

    // Check if conversation between these two already exists
    const existing = await this.prisma.conversation.findFirst({
      where: {
        participants: { hasEvery: [userId, recipientId] },
      },
    });

    if (existing) {
      return existing;
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        participants: [userId, recipientId],
      },
    });

    this.logger.log(
      `Conversation created: ${conversation.id} between ${userId} and ${recipientId}`,
    );
    return conversation;
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    content: string,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }
    if (!conversation.participants.includes(userId)) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }

    const [message] = await Promise.all([
      this.prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content,
          attachments: [],
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    this.logger.log(`Message sent: ${message.id} in conversation ${conversationId}`);
    return message;
  }

  async markConversationRead(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }
    if (!conversation.participants.includes(userId)) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }

    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { success: true, message: 'Messages marked as read' };
  }
}
