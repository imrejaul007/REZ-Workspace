// @ts-nocheck
/**
 * Testing Utilities
 * Mock data and test helpers for development and testing
 */

import { logger } from './logger';

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

export function generateMockProduct(id?: string) {
  return {
    _id: id || `prod_${Date.now()}`,
    name: 'Test Product',
    description: 'A test product description',
    price: 999,
    originalPrice: 1499,
    images: ['https://example.com/image.jpg'],
    category: 'test',
    store: {
      _id: 'store_123',
      name: 'Test Store',
      slug: 'test-store',
    },
    rating: 4.5,
    reviewCount: 100,
    inStock: true,
  };
}

export function generateMockStore(id?: string) {
  return {
    _id: id || `store_${Date.now()}`,
    name: 'Test Store',
    slug: 'test-store',
    description: 'A test store',
    logo: 'https://example.com/logo.jpg',
    coverImage: 'https://example.com/cover.jpg',
    address: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      zip: '12345',
      coordinates: { lat: 28.6139, lng: 77.2090 },
    },
    rating: 4.2,
    reviewCount: 50,
    isOpen: true,
    deliveryTime: '30-40 min',
    minimumOrder: 100,
    deliveryFee: 20,
  };
}

export function generateMockOrder(id?: string) {
  return {
    _id: id || `order_${Date.now()}`,
    status: 'confirmed',
    items: [
      {
        product: generateMockProduct(),
        quantity: 2,
        price: 999,
      },
    ],
    total: 1998,
    deliveryFee: 20,
    grandTotal: 2018,
    store: generateMockStore(),
    deliveryAddress: {
      street: '123 Delivery Street',
      city: 'Test City',
    },
    paymentMethod: 'UPI',
    createdAt: new Date().toISOString(),
    estimatedDelivery: new Date(Date.now() + 40 * 60 * 1000).toISOString(),
  };
}

export function generateMockUser(id?: string) {
  return {
    _id: id || `user_${Date.now()}`,
    name: 'Test User',
    email: 'test@example.com',
    phone: '+919876543210',
    avatar: 'https://example.com/avatar.jpg',
    walletBalance: 500,
    karmaPoints: 1000,
    tier: 'gold',
    addresses: [
      {
        _id: 'addr_1',
        label: 'Home',
        street: '123 Home Street',
        city: 'Test City',
        isDefault: true,
      },
    ],
  };
}

export function generateMockCampaign(id?: string) {
  return {
    _id: id || `campaign_${Date.now()}`,
    title: 'Test Campaign',
    description: 'A test campaign description',
    merchantId: 'merchant_123',
    merchantName: 'Test Merchant',
    category: 'food',
    status: 'active',
    rewardType: 'coins',
    rewardValue: '100',
    targetCount: 100,
    currentCount: 50,
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://example.com/campaign.jpg',
    terms: ['Term 1', 'Term 2'],
    minSpend: 200,
    isParticipating: false,
  };
}

export function generateMockVoucher(id?: string) {
  return {
    _id: id || `voucher_${Date.now()}`,
    title: 'Test Voucher',
    description: 'A test voucher description',
    merchantId: 'merchant_123',
    merchantName: 'Test Merchant',
    type: 'discount',
    value: '20% off',
    code: 'TEST20',
    status: 'active',
    minSpend: 200,
    maxDiscount: 100,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    claimedAt: new Date().toISOString(),
  };
}

// ============================================================================
// API MOCKS
// ============================================================================

export interface MockApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function createMockSuccessResponse<T>(data: T): MockApiResponse<T> {
  return { success: true, data };
}

export function createMockErrorResponse(error: string): MockApiResponse<never> {
  return { success: false, error };
}

// ============================================================================
// TEST HELPERS
// ============================================================================

export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockNetworkError(): Error {
  return new Error('Network request failed');
}

export function createMockTimeoutError(): Error {
  return new Error('Request timed out');
}

export function createMockAuthError(): Error {
  return new Error('Unauthorized - 401');
}

export function createMockServerError(message = 'Internal server error'): Error {
  const error = new Error(message);
  (error as unknown).response = { status: 500 };
  return error;
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

export function assertIsDefined<T>(value: T | null | undefined, message = 'Value is null or undefined'): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

export function assertEquals<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected} but got ${actual}`);
  }
}

export function assertContains(actual: string, expected: string, message?: string): void {
  if (!actual.includes(expected)) {
    throw new Error(message || `Expected "${actual}" to contain "${expected}"`);
  }
}

// ============================================================================
// PERFORMANCE TESTING
// ============================================================================

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

export class PerformanceTracker {
  private metrics: PerformanceMetric[] = [];

  startTimer(name: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.metrics.push({
        name,
        duration,
        timestamp: Date.now(),
      });
      logger.debug(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    };
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clear(): void {
    this.metrics = [];
  }

  getAverageDuration(name: string): number {
    const relevantMetrics = this.metrics.filter((m) => m.name === name);
    if (relevantMetrics.length === 0) return 0;
    const sum = relevantMetrics.reduce((acc, m) => acc + m.duration, 0);
    return sum / relevantMetrics.length;
  }
}

// ============================================================================
// MEMORY TESTING
// ============================================================================

export function getMemoryUsage(): { heapUsed: number; heapTotal: number } | null {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const { heapUsed, heapTotal } = process.memoryUsage();
    return { heapUsed, heapTotal };
  }
  return null;
}

export function logMemoryUsage(label: string): void {
  const usage = getMemoryUsage();
  if (usage) {
    logger.debug(
      `[Memory] ${label}: ${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB / ${(usage.heapTotal / 1024 / 1024).toFixed(2)}MB`
    );
  }
}

// ============================================================================
// CONSOLE MOCKING
// ============================================================================

const originalConsole = { ...console };

export function mockConsole(): void {
  console.log = jest.fn();
  console.debug = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
}

export function restoreConsole(): void {
  Object.assign(console, originalConsole);
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export const testUtils = {
  generateMockProduct,
  generateMockStore,
  generateMockOrder,
  generateMockUser,
  generateMockCampaign,
  generateMockVoucher,
  createMockSuccessResponse,
  createMockErrorResponse,
  delay,
  createMockNetworkError,
  createMockTimeoutError,
  createMockAuthError,
  createMockServerError,
  assertIsDefined,
  assertEquals,
  assertContains,
  PerformanceTracker,
  getMemoryUsage,
  logMemoryUsage,
  mockConsole,
  restoreConsole,
};
