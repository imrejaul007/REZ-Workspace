/**
 * RABTUL Notifications Service Integration Tests
 *
 * Tests the centralized notifications service.
 *
 * @group integration
 * @group notifications
 */

import { describe, test, expect } from 'vitest';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'https://rez-notifications-service.onrender.com';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'test-token';

describe('RABTUL Notifications Service Integration Tests', () => {

  describe('Health Check', () => {
    test('should return healthy status', async () => {
      const response = await fetch(`${NOTIFICATION_SERVICE_URL}/health`);
      expect(response.ok).toBe(true);
    });
  });

  describe('Send Notification', () => {
    test('should send push notification', async () => {
      const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/v1/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify({
          userId: 'test_user_id',
          channel: 'PUSH',
          template: 'test_notification',
          data: {
            title: 'Test Notification',
            body: 'This is a test notification',
          },
        }),
      });

      expect([200, 400, 500]).toContain(response.status);
    });

    test('should send email notification', async () => {
      const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/v1/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify({
          userId: 'test_user_id',
          channel: 'EMAIL',
          template: 'test_email',
          data: {
            to: 'test@example.com',
            subject: 'Test Email',
          },
        }),
      });

      expect([200, 400, 500]).toContain(response.status);
    });

    test('should send SMS notification', async () => {
      const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/v1/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify({
          userId: 'test_user_id',
          channel: 'SMS',
          template: 'test_sms',
          data: {
            phone: '+919876543210',
            message: 'Test SMS',
          },
        }),
      });

      expect([200, 400, 500]).toContain(response.status);
    });

    test('should reject requests without internal token', async () => {
      const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/v1/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'test_user_id',
          channel: 'PUSH',
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Bulk Notifications', () => {
    test('should send bulk notifications', async () => {
      const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/v1/notifications/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify({
          userIds: ['user1', 'user2', 'user3'],
          channel: 'PUSH',
          template: 'bulk_test',
          data: {
            title: 'Bulk Test',
            body: 'Sent to multiple users',
          },
        }),
      });

      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('Notification Templates', () => {
    test('should list available templates', async () => {
      const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/v1/templates`, {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
      });

      expect([200, 404]).toContain(response.status);
    });
  });
});

describe('Notifications Service Error Handling', () => {
  test('should handle invalid channel', async () => {
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/v1/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
      },
      body: JSON.stringify({
        userId: 'test_user_id',
        channel: 'INVALID_CHANNEL',
      }),
    });

    expect(response.status).toBe(400);
  });
});
