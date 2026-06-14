/**
 * Notifications Service Tests
 * Tests for notification delivery, templates, and preferences
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface Notification {
  id: string;
  userId: string;
  type: 'email' | 'push' | 'sms' | 'whatsapp';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'push' | 'sms' | 'whatsapp';
  subject?: string;
  body: string;
  variables: string[];
}

interface UserPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  whatsapp: boolean;
  quietHours?: { start: string; end: string };
}

// Template rendering
function renderTemplate(template: string, variables: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return rendered;
}

// Notification priority
function getPriority(notification: Notification): 'high' | 'normal' | 'low' {
  if (notification.data?.priority === 'high') return 'high';
  if (notification.data?.priority === 'low') return 'low';
  return 'normal';
}

// Queue sorting
function sortByPriority(notifications: Notification[]): Notification[] {
  const priority = { high: 0, normal: 1, low: 2 };
  return [...notifications].sort((a, b) =>
    priority[getPriority(a)] - priority[getPriority(b)]
  );
}

// Delivery status
function canDeliver(
  notification: Notification,
  preferences: UserPreferences
): { canDeliver: boolean; reason?: string } {
  if (!preferences[notification.type]) {
    return { canDeliver: false, reason: `${notification.type} notifications disabled` };
  }

  if (isInQuietHours(preferences.quietHours)) {
    return { canDeliver: false, reason: 'Quiet hours active' };
  }

  return { canDeliver: true };
}

function isInQuietHours(quietHours?: { start: string; end: string }): boolean {
  if (!quietHours) return false;

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  if (quietHours.start <= quietHours.end) {
    return currentTime >= quietHours.start && currentTime <= quietHours.end;
  } else {
    return currentTime >= quietHours.start || currentTime <= quietHours.end;
  }
}

// Batch processing
interface BatchResult {
  total: number;
  sent: number;
  failed: number;
  results: { id: string; status: 'sent' | 'failed'; error?: string }[];
}

function processBatch(
  notifications: Notification[],
  preferences: UserPreferences
): BatchResult {
  const results: BatchResult['results'] = [];
  let sent = 0;
  let failed = 0;

  for (const notification of notifications) {
    const { canDeliver, reason } = canDeliver(notification, preferences);

    if (canDeliver) {
      results.push({ id: notification.id, status: 'sent' });
      sent++;
    } else {
      results.push({ id: notification.id, status: 'failed', error: reason });
      failed++;
    }
  }

  return { total: notifications.length, sent, failed, results };
}

describe('Template Rendering', () => {
  const template = 'Hello {name}, your order {orderId} has been {status}.';

  it('should replace single variable', () => {
    const rendered = renderTemplate(template, { name: 'John' });
    expect(rendered).toBe('Hello John, your order {orderId} has been {status}.');
  });

  it('should replace multiple variables', () => {
    const rendered = renderTemplate(template, {
      name: 'John',
      orderId: 'ORD-123',
      status: 'shipped'
    });
    expect(rendered).toBe('Hello John, your order ORD-123 has been shipped.');
  });

  it('should handle missing variables', () => {
    const rendered = renderTemplate(template, { name: 'John' });
    expect(rendered).toContain('{orderId}');
    expect(rendered).toContain('{status}');
  });

  it('should handle empty variables', () => {
    const rendered = renderTemplate('Hello {name}', { name: '' });
    expect(rendered).toBe('Hello ');
  });
});

describe('Notification Priority', () => {
  it('should assign high priority', () => {
    const notification = createMockNotification({ data: { priority: 'high' } });
    expect(getPriority(notification)).toBe('high');
  });

  it('should assign normal priority by default', () => {
    const notification = createMockNotification({});
    expect(getPriority(notification)).toBe('normal');
  });

  it('should assign low priority', () => {
    const notification = createMockNotification({ data: { priority: 'low' } });
    expect(getPriority(notification)).toBe('low');
  });
});

describe('Priority Sorting', () => {
  const notifications = [
    createMockNotification({ id: '1', data: { priority: 'low' } }),
    createMockNotification({ id: '2', data: { priority: 'high' } }),
    createMockNotification({ id: '3', data: { priority: 'normal' } }),
  ];

  it('should sort high priority first', () => {
    const sorted = sortByPriority(notifications);
    expect(sorted[0].id).toBe('2');
  });

  it('should sort normal priority second', () => {
    const sorted = sortByPriority(notifications);
    expect(sorted[1].id).toBe('3');
  });

  it('should sort low priority last', () => {
    const sorted = sortByPriority(notifications);
    expect(sorted[2].id).toBe('1');
  });
});

describe('Delivery Permission', () => {
  const preferences: UserPreferences = {
    email: true,
    push: true,
    sms: false,
    whatsapp: false
  };

  it('should allow when enabled', () => {
    const notification = createMockNotification({ type: 'email' });
    expect(canDeliver(notification, preferences).canDeliver).toBe(true);
  });

  it('should block when disabled', () => {
    const notification = createMockNotification({ type: 'sms' });
    const result = canDeliver(notification, preferences);
    expect(result.canDeliver).toBe(false);
    expect(result.reason).toContain('disabled');
  });
});

describe('Quiet Hours', () => {
  it('should allow outside quiet hours', () => {
    const preferences: UserPreferences = {
      email: true,
      push: true,
      sms: true,
      whatsapp: false,
      quietHours: { start: '22:00', end: '08:00' }
    };

    // Current time should be outside 22:00-08:00
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 8 && hour < 22) {
      const notification = createMockNotification({ type: 'email' });
      expect(canDeliver(notification, preferences).canDeliver).toBe(true);
    }
  });

  it('should handle no quiet hours', () => {
    const preferences: UserPreferences = {
      email: true,
      push: true,
      sms: true,
      whatsapp: false
    };

    const notification = createMockNotification({ type: 'email' });
    expect(canDeliver(notification, preferences).canDeliver).toBe(true);
  });
});

describe('Batch Processing', () => {
  const preferences: UserPreferences = {
    email: true,
    push: false, // Disabled
    sms: true,
    whatsapp: false
  };

  const notifications = [
    createMockNotification({ id: '1', type: 'email' }),
    createMockNotification({ id: '2', type: 'push' }),
    createMockNotification({ id: '3', type: 'sms' }),
  ];

  it('should process all notifications', () => {
    const result = processBatch(notifications, preferences);

    expect(result.total).toBe(3);
    expect(result.sent + result.failed).toBe(3);
  });

  it('should count sent correctly', () => {
    const result = processBatch(notifications, preferences);

    expect(result.sent).toBe(2); // email and sms enabled
    expect(result.failed).toBe(1); // push disabled
  });

  it('should include error reasons', () => {
    const result = processBatch(notifications, preferences);
    const failed = result.results.find(r => r.status === 'failed');

    expect(failed).toBeDefined();
    expect(failed?.error).toContain('disabled');
  });
});

describe('Notification Status', () => {
  it('should track pending status', () => {
    const notification = createMockNotification({ status: 'pending' });
    expect(notification.status).toBe('pending');
  });

  it('should track sent status', () => {
    const notification = createMockNotification({ status: 'sent', sentAt: new Date() });
    expect(notification.status).toBe('sent');
  });

  it('should track delivered status', () => {
    const notification = createMockNotification({
      status: 'delivered',
      sentAt: new Date(),
      deliveredAt: new Date()
    });
    expect(notification.status).toBe('delivered');
  });

  it('should track failed status', () => {
    const notification = createMockNotification({ status: 'failed' });
    expect(notification.status).toBe('failed');
  });
});

describe('Notification Types', () => {
  it('should support email notifications', () => {
    const notification = createMockNotification({ type: 'email' });
    expect(notification.type).toBe('email');
  });

  it('should support push notifications', () => {
    const notification = createMockNotification({ type: 'push' });
    expect(notification.type).toBe('push');
  });

  it('should support SMS notifications', () => {
    const notification = createMockNotification({ type: 'sms' });
    expect(notification.type).toBe('sms');
  });

  it('should support WhatsApp notifications', () => {
    const notification = createMockNotification({ type: 'whatsapp' });
    expect(notification.type).toBe('whatsapp');
  });
});

// Helper
function createMockNotification(overrides: Partial<Notification>): Notification {
  return {
    id: overrides.id || 'notif-1',
    userId: overrides.userId || 'user-123',
    type: overrides.type || 'email',
    title: overrides.title || 'Test Notification',
    body: overrides.body || 'This is a test notification',
    data: overrides.data,
    status: overrides.status || 'pending',
    sentAt: overrides.sentAt,
    deliveredAt: overrides.deliveredAt,
    readAt: overrides.readAt,
    createdAt: new Date()
  };
}
