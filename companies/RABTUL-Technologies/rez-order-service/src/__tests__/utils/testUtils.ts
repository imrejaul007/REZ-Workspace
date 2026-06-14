/**
 * Test Utilities and Mocks for Order Service
 */

import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';

// Mock Redis helper
export function createMockRedis(overrides: unknown = {}) {
  return {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    exists: jest.fn().mockResolvedValue(0),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    del: jest.fn().mockResolvedValue(1),
    sadd: jest.fn().mockResolvedValue(1),
    scard: jest.fn().mockResolvedValue(1),
    on: jest.fn(),
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
    headers: {},
    method: 'POST',
    path: '/test',
    user: { userId: 'user_123' },
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

// Order item factory
export function createTestOrderItem(overrides: unknown = {}) {
  const quantity = overrides.quantity || 1;
  const unitPrice = overrides.unitPrice || 10.00;

  return {
    productId: `prod_${Date.now()}`,
    name: 'Test Product',
    quantity,
    unitPrice,
    totalPrice: quantity * unitPrice,
    ...overrides,
  };
}

// Test order factory
export function createTestOrder(overrides: unknown = {}) {
  const items = overrides.items || [createTestOrderItem()];
  const subtotal = items.reduce((sum: number, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.0875;
  const deliveryFee = overrides.delivery?.type === 'delivery' ? 4.99 : 0;

  return {
    _id: new Types.ObjectId(),
    orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    user: new Types.ObjectId(),
    store: new Types.ObjectId(),
    items,
    totals: {
      subtotal,
      tax,
      deliveryFee,
      total: subtotal + tax + deliveryFee,
    },
    payment: {
      method: 'card',
      status: 'pending',
      transactionId: null,
    },
    delivery: null,
    status: 'placed',
    currency: 'USD',
    clientIdempotencyKey: null,
    correlationId: `corr_${Date.now()}`,
    notes: null,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Delivery address factory
export function createTestDeliveryAddress(overrides: unknown = {}) {
  return {
    street: '123 Main Street',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    coordinates: {
      latitude: 40.7128,
      longitude: -74.0060,
    },
    ...overrides,
  };
}

// Order status constants
export const ORDER_STATUSES = {
  PLACED: 'placed',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const;

// Valid status transitions
export const VALID_TRANSITIONS: Record<string, string[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
  failed: ['placed'],
};

// Cancellable statuses
export const CANCELLABLE_STATUSES = ['placed', 'confirmed', 'preparing', 'ready'];

// Check if transition is valid
export function isValidTransition(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

// Check if order can be cancelled
export function canCancelOrder(status: string): boolean {
  return CANCELLABLE_STATUSES.includes(status);
}

// Mock BullMQ Queue
export function createMockQueue() {
  return {
    add: jest.fn().mockResolvedValue({ id: `job_${Date.now()}` }),
    addWithIdempotency: jest.fn().mockResolvedValue({
      success: true,
      jobId: `job_${Date.now()}`,
      orderId: 'order_123',
      status: 'processed',
    }),
    isProcessed: jest.fn().mockResolvedValue(false),
    getResult: jest.fn().mockResolvedValue(null),
    clearIdempotency: jest.fn().mockResolvedValue(undefined),
    getJob: jest.fn().mockResolvedValue(null),
    getJobCounts: jest.fn().mockResolvedValue({
      wait: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    }),
    pause: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

// Idempotency result enum
export const IdempotencyResult = {
  NEW: 'new',
  DUPLICATE: 'duplicate',
  PROCESSING: 'processing',
};

// Calculate order totals
export function calculateOrderTotals(
  items: Array<{ quantity: number; unitPrice: number }>,
  deliveryType?: 'pickup' | 'delivery'
): { subtotal: number; tax: number; deliveryFee: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = subtotal * 0.0875;
  const deliveryFee = deliveryType === 'delivery' ? 4.99 : 0;
  const total = subtotal + tax + deliveryFee;

  return { subtotal, tax, deliveryFee, total };
}

// Generate unique order number
export function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${dateStr}-${random}`;
}

// Mock mongoose model
export function createMockMongooseModel(data: unknown[] = []) {
  return {
    findOne: jest.fn().mockImplementation((query) => {
      const found = data.find(item => {
        for (const key in query) {
          if (key === '_id' && item._id) {
            if (item._id.toString() !== query[key].toString()) return false;
          } else if (item[key] !== query[key]) {
            return false;
          }
        }
        return true;
      });
      return {
        lean: jest.fn().mockResolvedValue(found || null),
        exec: jest.fn().mockResolvedValue(found || null),
      };
    }),
    findById: jest.fn().mockImplementation((id) => {
      const found = data.find(item => item._id?.toString() === id?.toString());
      return {
        exec: jest.fn().mockResolvedValue(found || null),
      };
    }),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(data),
            exec: jest.fn().mockResolvedValue(data),
          }),
        }),
      }),
    }),
    findByIdAndUpdate: jest.fn().mockImplementation((id, update) => {
      const index = data.findIndex(item => item._id?.toString() === id?.toString());
      if (index >= 0) {
        Object.assign(data[index], update);
        return { exec: jest.fn().mockResolvedValue(data[index]) };
      }
      return { exec: jest.fn().mockResolvedValue(null) };
    }),
    create: jest.fn().mockImplementation((doc) => {
      const newDoc = { ...doc, _id: new Types.ObjectId() };
      data.push(newDoc);
      return Promise.resolve(newDoc);
    }),
  };
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

// Validate order input
export function validateOrderInput(input): string[] {
  const errors: string[] = [];

  if (!input.userId) errors.push('userId is required');
  if (!input.merchantId) errors.push('merchantId is required');
  if (!input.storeId) errors.push('storeId is required');
  if (!input.items || input.items.length === 0) {
    errors.push('At least one item is required');
  }

  if (input.items) {
    input.items.forEach((item, index: number) => {
      if (!item.productId) errors.push(`Item ${index}: productId is required`);
      if (!item.name) errors.push(`Item ${index}: name is required`);
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index}: quantity must be positive`);
      }
      if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
        errors.push(`Item ${index}: unitPrice must be a non-negative number`);
      }
    });
  }

  return errors;
}
