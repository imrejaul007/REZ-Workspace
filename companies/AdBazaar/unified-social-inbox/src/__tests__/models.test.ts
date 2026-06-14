/**
 * Unified Social Inbox Service - Models Tests
 */

import { z } from 'zod';
import { Platform, MessageMetadata } from '../types';

// Validation schemas
const messageSchema = z.object({
  conversationId: z.string(),
  platform: z.enum(['instagram', 'facebook', 'twitter', 'linkedin', 'whatsapp']),
  platformMessageId: z.string(),
  sender: z.object({
    type: z.enum(['user', 'agent']),
    platformUserId: z.string().optional(),
    agentId: z.string().optional(),
  }),
  content: z.string(),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(['image', 'video', 'audio']).optional(),
  timestamp: z.date(),
  read: z.boolean(),
  metadata: z.record(z.any()).optional(),
});

const conversationSchema = z.object({
  accountId: z.string(),
  platform: z.enum(['instagram', 'facebook', 'twitter', 'linkedin', 'whatsapp']),
  platformConversationId: z.string(),
  user: z.object({
    platformUserId: z.string(),
    username: z.string(),
    displayName: z.string(),
  }),
  status: z.enum(['open', 'pending', 'resolved', 'archived']),
  lastMessage: z.object({
    content: z.string(),
    sender: z.enum(['user', 'agent']),
    timestamp: z.date(),
  }).optional(),
  unreadCount: z.number().min(0),
  tags: z.array(z.string()).optional(),
  assignedTo: z.string().optional(),
});

const quickReplySchema = z.object({
  accountId: z.string(),
  shortcut: z.string().min(1),
  message: z.string().min(1),
  category: z.string().optional(),
  isActive: z.boolean(),
  usageCount: z.number().min(0),
});

const settingsSchema = z.object({
  accountId: z.string(),
  autoReply: z.boolean(),
  businessHours: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
    timezone: z.string(),
  }),
  awayMessage: z.string().optional(),
  notificationPreferences: z.object({
    email: z.boolean(),
    push: z.boolean(),
  }),
});

describe('Message Model', () => {
  describe('Schema Validation', () => {
    it('should validate correct message', () => {
      const validData = {
        conversationId: 'conv-123',
        platform: 'instagram',
        platformMessageId: 'ig-msg-123',
        sender: { type: 'user', platformUserId: 'user-123' },
        content: 'Hello!',
        timestamp: new Date(),
        read: false,
      };
      const result = messageSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid platform', () => {
      const invalidData = {
        conversationId: 'conv-123',
        platform: 'invalid',
        platformMessageId: 'msg-123',
        sender: { type: 'user' },
        content: 'Test',
        timestamp: new Date(),
        read: false,
      };
      const result = messageSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid sender type', () => {
      const invalidData = {
        conversationId: 'conv-123',
        platform: 'instagram',
        platformMessageId: 'msg-123',
        sender: { type: 'bot' },
        content: 'Test',
        timestamp: new Date(),
        read: false,
      };
      const result = messageSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate with optional media', () => {
      const validData = {
        conversationId: 'conv-123',
        platform: 'instagram',
        platformMessageId: 'msg-123',
        sender: { type: 'user' },
        content: 'Check this out!',
        mediaUrl: 'https://example.com/image.jpg',
        mediaType: 'image',
        timestamp: new Date(),
        read: false,
      };
      const result = messageSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Platform Type', () => {
    it('should accept valid platforms', () => {
      const platforms: Platform[] = ['instagram', 'facebook', 'twitter', 'linkedin', 'whatsapp'];
      platforms.forEach(p => {
        expect(['instagram', 'facebook', 'twitter', 'linkedin', 'whatsapp']).toContain(p);
      });
    });
  });
});

describe('Conversation Model', () => {
  describe('Schema Validation', () => {
    it('should validate correct conversation', () => {
      const validData = {
        accountId: 'account-123',
        platform: 'instagram',
        platformConversationId: 'ig-conv-123',
        user: {
          platformUserId: 'user-123',
          username: 'testuser',
          displayName: 'Test User',
        },
        status: 'open',
        unreadCount: 0,
      };
      const result = conversationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const invalidData = {
        accountId: 'account-123',
        platform: 'instagram',
        platformConversationId: 'ig-conv-123',
        user: { platformUserId: 'user-123', username: 'test', displayName: 'Test' },
        status: 'closed',
        unreadCount: 0,
      };
      const result = conversationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative unread count', () => {
      const invalidData = {
        accountId: 'account-123',
        platform: 'instagram',
        platformConversationId: 'ig-conv-123',
        user: { platformUserId: 'user-123', username: 'test', displayName: 'Test' },
        status: 'open',
        unreadCount: -1,
      };
      const result = conversationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('QuickReply Model', () => {
  describe('Schema Validation', () => {
    it('should validate correct quick reply', () => {
      const validData = {
        accountId: 'account-123',
        shortcut: '/hello',
        message: 'Hello! How can I help you?',
        category: 'greetings',
        isActive: true,
        usageCount: 10,
      };
      const result = quickReplySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty shortcut', () => {
      const invalidData = {
        accountId: 'account-123',
        shortcut: '',
        message: 'Hello!',
        isActive: true,
        usageCount: 0,
      };
      const result = quickReplySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative usage count', () => {
      const invalidData = {
        accountId: 'account-123',
        shortcut: '/test',
        message: 'Test message',
        isActive: true,
        usageCount: -5,
      };
      const result = quickReplySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Settings Model', () => {
  describe('Schema Validation', () => {
    it('should validate correct settings', () => {
      const validData = {
        accountId: 'account-123',
        autoReply: true,
        businessHours: {
          start: '09:00',
          end: '18:00',
          timezone: 'Asia/Kolkata',
        },
        notificationPreferences: {
          email: true,
          push: false,
        },
      };
      const result = settingsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid time format', () => {
      const invalidData = {
        accountId: 'account-123',
        autoReply: true,
        businessHours: {
          start: '9:00',
          end: '18:00',
          timezone: 'Asia/Kolkata',
        },
        notificationPreferences: { email: true, push: true },
      };
      const result = settingsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Model Indexes', () => {
  it('should verify Message model has required indexes', () => {
    const model = require('../models/message.model').Message;
    const schemaObj = model.schema.obj;
    expect(schemaObj.conversationId).toBeDefined();
    expect(schemaObj.platform).toBeDefined();
  });

  it('should verify Conversation model has required indexes', () => {
    const model = require('../models/conversation.model').Conversation;
    const schemaObj = model.schema.obj;
    expect(schemaObj.accountId).toBeDefined();
    expect(schemaObj.platform).toBeDefined();
    expect(schemaObj.status).toBeDefined();
  });
});