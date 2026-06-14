/**
 * REZ Inbox - Messages Service
 * In-memory message store
 */

import { v4 as uuidv4 } from 'uuid';
import { EmailMessage, PaginatedResponse } from '../types/index';

// In-memory store (use Redis/DB in production)
const messages = new Map<string, EmailMessage>();

interface ListOptions {
  page: number;
  limit: number;
  category?: string;
  status?: string;
  starred?: boolean;
}

class MessagesService {
  async addMessage(message: EmailMessage): Promise<EmailMessage> {
    messages.set(message.id, message);
    return message;
  }

  async getMessage(id: string): Promise<EmailMessage | null> {
    return messages.get(id) || null;
  }

  async listMessages(options: ListOptions): Promise<PaginatedResponse<EmailMessage>> {
    let filtered = Array.from(messages.values());

    // Filter by category
    if (options.category) {
      filtered = filtered.filter(m => m.category === options.category);
    }

    // Filter by status
    if (options.status) {
      filtered = filtered.filter(m => m.status === options.status);
    }

    // Filter by starred
    if (options.starred) {
      filtered = filtered.filter(m => m.isStarred);
    }

    // Sort by date
    filtered.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Paginate
    const start = (options.page - 1) * options.limit;
    const items = filtered.slice(start, start + options.limit);

    return {
      items,
      total: filtered.length,
      page: options.page,
      limit: options.limit,
      hasMore: start + options.limit < filtered.length,
    };
  }

  async markAsRead(id: string): Promise<void> {
    const message = messages.get(id);
    if (message) {
      message.status = 'read';
      message.updatedAt = new Date().toISOString();
    }
  }

  async markAsUnread(id: string): Promise<void> {
    const message = messages.get(id);
    if (message) {
      message.status = 'unread';
      message.updatedAt = new Date().toISOString();
    }
  }

  async archive(id: string): Promise<void> {
    const message = messages.get(id);
    if (message) {
      message.status = 'archived';
      message.updatedAt = new Date().toISOString();
    }
  }

  async toggleStar(id: string): Promise<EmailMessage | null> {
    const message = messages.get(id);
    if (message) {
      message.isStarred = !message.isStarred;
      message.updatedAt = new Date().toISOString();
    }
    return message || null;
  }

  async delete(id: string): Promise<void> {
    const message = messages.get(id);
    if (message) {
      message.status = 'deleted';
      message.updatedAt = new Date().toISOString();
    }
  }

  async bulkAction(ids: string[], action: string): Promise<void> {
    for (const id of ids) {
      switch (action) {
        case 'read':
          await this.markAsRead(id);
          break;
        case 'unread':
          await this.markAsUnread(id);
          break;
        case 'archive':
          await this.archive(id);
          break;
        case 'delete':
          await this.delete(id);
          break;
      }
    }
  }
}

export const messagesService = new MessagesService();
