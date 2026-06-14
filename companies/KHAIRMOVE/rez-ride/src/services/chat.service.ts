import { Injectable, Logger } from '@nestjs/common';

/**
 * Chat Service - Real-time messaging
 */
@Injectable()
export class ChatService {
  private logger = new Logger('ChatService');
  private conversations = new Map();
  private typing = new Map();

  async sendMessage(conversationId: string, message: ChatMessage): Promise<ChatMessage> {
    const chat = {
      ...message,
      id: `MSG_${Date.now()}`,
      timestamp: new Date(),
      read: false,
    };
    const conv = this.conversations.get(conversationId) || { messages: [] };
    conv.messages.push(chat);
    this.conversations.set(conversationId, conv);
    this.logger.log(`Message sent: ${chat.id}`);
    return chat;
  }

  async getConversation(conversationId: string): Promise<Chat> {
    return this.conversations.get(conversationId) || { id: conversationId, messages: [] };
  }

  async markRead(conversationId: string, userId: string): Promise<void> {
    const conv = this.conversations.get(conversationId);
    if (conv) {
      conv.messages.forEach((m: ChatMessage) => { if (m.senderId !== userId) m.read = true; });
    }
  }
}

export interface ChatMessage {
  id?: string;
  senderId: string;
  text: string;
  type: 'text' | 'location' | 'image';
  timestamp?: Date;
  read?: boolean;
}

export interface Chat {
  id: string;
  messages: ChatMessage[];
}
