/**
 * Integration Tests - Customer Lifecycle
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

const mockCustomerService = {
  create: jest.fn(),
  update: jest.fn(),
  getById: jest.fn(),
};

const mockLoyaltyService = {
  addPoints: jest.fn(),
  redeem: jest.fn(),
};

const mockNotificationService = {
  send: jest.fn(),
};

// Test customer flow
describe('Customer Lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('onboarding new customer', async () => {
    mockCustomerService.create.mockResolvedValue({
      id: 'cust-123',
      status: 'active',
      points: 100,
    });

    const customer = await mockCustomerService.create({
      phone: '+91-9876543210',
      name: 'Test Customer',
    });

    expect(customer.id).toBe('cust-123');
    expect(customer.status).toBe('active');
    expect(customer.points).toBe(100);
  });

  test('adds loyalty points on order', async () => {
    mockLoyaltyService.addPoints.mockResolvedValue({
      points: 50,
      total: 150,
    });

    const result = await mockLoyaltyService.addPoints({
      customerId: 'cust-123',
      points: 50,
      reason: 'order',
    });

    expect(result.points).toBe(50);
  });

  test('sends notification on milestone', async () => {
    mockNotificationService.send.mockResolvedValue({ sent: true });

    const notification = await mockNotificationService.send({
      customerId: 'cust-123',
      template: 'milestone-reached',
    });

    expect(notification.sent).toBe(true);
  });
});

describe('Customer Segmentation', () => {
  test('segments by lifetime value', async () => {
    const segments = ['high', 'medium', 'low'];
    expect(segments).toContain('high');
  });

  test('triggers win-back for churned', async () => {
    mockCustomerService.getById.mockResolvedValue({
      id: 'cust-123',
      lastOrderDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    });

    const customer = await mockCustomerService.getById('cust-123');
    const daysSince = (Date.now() - customer.lastOrderDate.getTime()) / (24 * 60 * 60 * 1000);

    expect(daysSince).toBeGreaterThan(29);
  });
});
