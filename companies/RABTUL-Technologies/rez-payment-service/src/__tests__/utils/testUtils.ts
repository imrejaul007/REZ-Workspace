/**
 * Test Utilities and Mocks for Payment Service
 */

import { Request, Response, NextFunction } from 'express';

// Mock Redis helper
export function createMockRedis(overrides: unknown = {}) {
  return {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    exists: jest.fn().mockResolvedValue(0),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    del: jest.fn().mockResolvedValue(1),
    ...overrides,
  };
}

// Mock Express Request
export function createMockRequest(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    ip: '127.0.0.1',
    body: {},
    params: {},
    query: {},
    headers: {
      'x-internal-token': 'test-internal-token',
    },
    method: 'POST',
    path: '/test',
    ...overrides,
  };
}

// Mock Express Response
export function createMockResponse() {
  const res: unknown = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.locals = {};
  return res;
}

// Mock NextFunction
export function createMockNext() {
  return jest.fn();
}

// Test payment factory
export function createTestPayment(overrides: unknown = {}) {
  return {
    paymentId: `pay_${Date.now()}`,
    orderId: 'order_test_123',
    user: '507f1f77bcf86cd799439011',
    amount: 100.00,
    currency: 'INR',
    paymentMethod: 'card',
    purpose: 'order_payment',
    status: 'pending',
    metadata: {},
    gatewayResponse: null,
    walletCredited: false,
    refundedAmount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Test refund factory
export function createTestRefund(overrides: unknown = {}) {
  return {
    refundId: `ref_${Date.now()}`,
    paymentId: 'pay_test_123',
    amount: 50.00,
    currency: 'INR',
    status: 'pending',
    reason: 'Customer request',
    processedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

// Test audit log entry factory
export function createTestAuditEntry(overrides: unknown = {}) {
  return {
    action: 'initiate',
    paymentId: 'pay_test_123',
    userId: 'user_123',
    amount: 100,
    newStatus: 'pending',
    previousStatus: null,
    gatewayResponse: null,
    createdAt: new Date(),
    ...overrides,
  };
}

// Generate Razorpay-style webhook payload
export function generateWebhookPayload(event: string, entity) {
  return {
    event,
    payload: {
      [entity.type]: {
        entity,
      },
    },
    created_at: Math.floor(Date.now() / 1000),
  };
}

// Generate Razorpay signature
export function generateRazorpaySignature(payload: string, secret: string): string {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// Validate webhook signature
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Mock BullMQ Queue
export function createMockQueue() {
  return {
    add: jest.fn().mockResolvedValue({ id: `job_${Date.now()}` }),
    getJob: jest.fn().mockResolvedValue(null),
    on: jest.fn(),
    pause: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    getJobCounts: jest.fn().mockResolvedValue({
      wait: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    }),
  };
}

// Mock mongoose connection
export function createMockMongooseConnection(models: unknown = {}) {
  return {
    collection: jest.fn().mockImplementation((name: string) => {
      return models[name] || {
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
        create: jest.fn().mockResolvedValue({}),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      };
    }),
    ...models,
  };
}

// Amount formatting utilities
export function toPaise(amount: number): number {
  return Math.round(amount * 100);
}

export function fromPaise(paise: number): number {
  return paise / 100;
}

// Currency validation
export const VALID_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

export function isValidCurrency(currency: string): boolean {
  return VALID_CURRENCIES.includes(currency);
}

// Payment method validation
export const VALID_PAYMENT_METHODS = ['card', 'upi', 'netbanking', 'wallet', 'bnpl', 'emi'];

export function isValidPaymentMethod(method: string): boolean {
  return VALID_PAYMENT_METHODS.includes(method);
}

// Amount limits
export const AMOUNT_LIMITS = {
  MIN_AMOUNT: 1,
  MAX_WALLET_TOPUP: 100000,
  MAX_GENERAL: 1000000,
  MAX_BNPL: 50000,
};

export function isValidAmount(amount: number, type: 'general' | 'wallet_topup' | 'bnpl' = 'general'): boolean {
  const max = type === 'wallet_topup' ? AMOUNT_LIMITS.MAX_WALLET_TOPUP :
              type === 'bnpl' ? AMOUNT_LIMITS.MAX_BNPL : AMOUNT_LIMITS.MAX_GENERAL;
  return amount >= AMOUNT_LIMITS.MIN_AMOUNT && amount <= max;
}

// Wait for a specified time
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Async handler wrapper
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
