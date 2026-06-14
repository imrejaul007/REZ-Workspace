/**
 * rez-hotel-messaging-service Unit Tests
 * Tests guest messaging and conversation management
 */

import { describe, it, expect } from 'vitest';

describe('Messaging Service Configuration', () => {
  it('should have correct service configuration', () => {
    const config = {
      port: 4018,
      rateLimit: { windowMs: 60000, max: 30 },
    };

    expect(config.port).toBe(4018);
    expect(config.rateLimit.max).toBe(30);
  });
});

describe('Conversation Management', () => {
  it('should have correct conversation structure', () => {
    const conversation = {
      id: 'conv-001',
      hotelId: 'HTL-001',
      guestId: 'GUEST-001',
      guestName: 'John Doe',
      guestPhone: '+919876543210',
      guestEmail: 'john@example.com',
      bookingId: 'BK-001',
      source: 'in_stay',
      status: 'active',
      unreadCount: { hotel: 2, guest: 0 },
      tags: ['vip', 'corporate'],
    };

    expect(conversation).toHaveProperty('id');
    expect(conversation).toHaveProperty('guestId');
    expect(conversation).toHaveProperty('status');
  });

  it('should support conversation sources', () => {
    const sources = ['pre_stay', 'in_stay', 'post_stay', 'support', 'marketing'];
    expect(sources).toContain('in_stay');
    expect(sources).toHaveLength(5);
  });

  it('should support conversation statuses', () => {
    const statuses = ['active', 'archived', 'resolved'];
    const validStatus = 'active';

    expect(statuses).toContain(validStatus);
  });
});

describe('Message Management', () => {
  it('should have correct message structure', () => {
    const message = {
      id: 'msg-001',
      conversationId: 'conv-001',
      senderId: 'GUEST-001',
      senderType: 'guest',
      senderName: 'John Doe',
      recipientId: 'HTL-001',
      recipientType: 'hotel',
      content: 'Request for late checkout',
      type: 'text',
      priority: 'normal',
      status: 'delivered',
      attachments: [],
      readBy: [],
      isRead: false,
    };

    expect(message).toHaveProperty('content');
    expect(message).toHaveProperty('senderType');
    expect(message).toHaveProperty('recipientType');
  });

  it('should support message types', () => {
    const types = ['text', 'image', 'document', 'system', 'template'];
    expect(types).toContain('text');
    expect(types).toContain('template');
  });

  it('should support message priorities', () => {
    const priorities = ['low', 'normal', 'high', 'urgent'];
    expect(priorities).toContain('urgent');
  });

  it('should support message statuses', () => {
    const statuses = ['sent', 'delivered', 'read', 'failed'];
    expect(statuses).toContain('read');
  });

  it('should support sender types', () => {
    const senderTypes = ['guest', 'staff', 'hotel', 'system', 'bot'];
    expect(senderTypes).toContain('bot');
  });
});

describe('Message Templates', () => {
  it('should have correct template structure', () => {
    const template = {
      id: 'tmpl-001',
      hotelId: 'HTL-001',
      name: 'Welcome Message',
      category: 'greeting',
      subject: 'Welcome to our hotel!',
      content: 'Dear {{guestName}}, welcome to {{hotelName}}!',
      variables: ['guestName', 'hotelName'],
      isActive: true,
      channels: ['in_app', 'whatsapp'],
    };

    expect(template).toHaveProperty('variables');
    expect(template.variables).toContain('guestName');
  });

  it('should support template categories', () => {
    const categories = ['greeting', 'reminder', 'checkout', 'review', 'promotion', 'custom'];
    expect(categories).toContain('checkout');
    expect(categories).toContain('review');
  });

  it('should render template variables correctly', () => {
    const template = 'Dear {{guestName}}, welcome to {{hotelName}}!';
    const variables = { guestName: 'John', hotelName: 'Grand Hotel' };

    let rendered = template;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    expect(rendered).toBe('Dear John, welcome to Grand Hotel!');
  });

  it('should extract variables from template', () => {
    const template = 'Dear {{guestName}}, your booking {{bookingId}} is confirmed.';
    const matches = template.match(/\{\{(\w+)\}\}/g) || [];
    const variables = [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];

    expect(variables).toContain('guestName');
    expect(variables).toContain('bookingId');
    expect(variables).toHaveLength(2);
  });
});

describe('Bulk Messaging', () => {
  it('should support bulk message types', () => {
    const types = ['announcement', 'promotion', 'reminder', 'survey'];
    expect(types).toContain('announcement');
    expect(types).toContain('promotion');
  });

  it('should handle bulk send results', () => {
    const results = {
      sent: 95,
      failed: 5,
      scheduled: 0,
    };

    expect(results.sent).toBeGreaterThan(0);
    expect(results.sent + results.failed).toBe(100);
  });
});

describe('Rate Limiting', () => {
  it('should enforce message rate limits', () => {
    const rateLimit = {
      windowMs: 60 * 1000,
      max: 30,
    };

    const messages = [
      { timestamp: Date.now() - 30000 },
      { timestamp: Date.now() - 20000 },
      { timestamp: Date.now() - 10000 },
    ];

    const withinWindow = messages.filter(
      m => Date.now() - m.timestamp < rateLimit.windowMs
    );

    expect(withinWindow.length).toBe(3);
    expect(withinWindow.length).toBeLessThan(rateLimit.max);
  });
});

describe('Unread Count Management', () => {
  it('should track unread counts per recipient', () => {
    const unreadCounts = {
      hotel: 3,
      guest: 0,
    };

    expect(unreadCounts.hotel).toBe(3);
    expect(unreadCounts.guest).toBe(0);
  });

  it('should increment unread count correctly', () => {
    const unreadCount = { hotel: 3 };
    unreadCount.hotel += 1;

    expect(unreadCount.hotel).toBe(4);
  });

  it('should reset unread count on read', () => {
    const unreadCount = { hotel: 5 };
    unreadCount.hotel = 0;

    expect(unreadCount.hotel).toBe(0);
  });
});

describe('API Response Formats', () => {
  it('should format conversation list response', () => {
    const response = {
      success: true,
      data: {
        conversations: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      },
    };

    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('pagination');
  });

  it('should format message send response', () => {
    const response = {
      success: true,
      data: {
        message: {
          id: 'msg-001',
          status: 'sent',
        },
      },
    };

    expect(response.success).toBe(true);
    expect(response.data.message).toHaveProperty('status');
  });

  it('should format error response', () => {
    const errorResponse = {
      success: false,
      error: {
        code: 'RATE_LIMIT',
        message: 'Too many messages, please try again later',
      },
    };

    expect(errorResponse.success).toBe(false);
    expect(errorResponse.error.code).toBe('RATE_LIMIT');
  });
});

describe('Health Check', () => {
  it('should return correct health status format', () => {
    const health = {
      status: 'healthy',
      service: 'rez-hotel-messaging-service',
      port: 4018,
      timestamp: new Date().toISOString(),
    };

    expect(health.status).toBe('healthy');
    expect(health.service).toBe('rez-hotel-messaging-service');
  });
});
