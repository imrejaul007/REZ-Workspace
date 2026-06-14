/**
 * Test Setup and Utilities
 * Global mocks, helpers, and test configuration for Verify QR Service
 */

// ============================================================
// Type Definitions
// ============================================================

export interface MockSerial {
  serialNumber: string;
  isValid: boolean;
  createdAt: Date;
  productId: string;
  merchantId: string;
}

export interface MockWarranty {
  id: string;
  serialNumber: string;
  ownerId: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  claimCount: number;
}

export interface MockClaim {
  id: string;
  serialNumber: string;
  ownerId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  filedAt: Date;
  resolvedAt?: Date;
}

export interface MockOwnership {
  id: string;
  serialNumber: string;
  ownerId: string;
  previousOwnerId?: string;
  transferredAt: Date;
  transferReason: string;
}

export interface MockFraudAlert {
  id: string;
  serialNumber: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  details: string;
  createdAt: Date;
}

// ============================================================
// Mock Data Generators
// ============================================================

export const generateValidSerial = (): string => {
  const prefix = 'REZ';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const generateInvalidSerial = (): string => {
  return `INVALID-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
};

export const createMockSerial = (overrides: Partial<MockSerial> = {}): MockSerial => ({
  serialNumber: generateValidSerial(),
  isValid: true,
  createdAt: new Date(),
  productId: 'PROD-001',
  merchantId: 'MERCH-001',
  ...overrides,
});

export const createMockWarranty = (overrides: Partial<MockWarranty> = {}): MockWarranty => ({
  id: `WARR-${Math.random().toString(36).substring(2, 10)}`,
  serialNumber: generateValidSerial(),
  ownerId: 'USER-001',
  startDate: new Date(),
  endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  isActive: true,
  claimCount: 0,
  ...overrides,
});

export const createMockClaim = (overrides: Partial<MockClaim> = {}): MockClaim => ({
  id: `CLM-${Math.random().toString(36).substring(2, 10)}`,
  serialNumber: generateValidSerial(),
  ownerId: 'USER-001',
  reason: 'Product defect',
  status: 'pending',
  filedAt: new Date(),
  ...overrides,
});

export const createMockOwnership = (overrides: Partial<MockOwnership> = {}): MockOwnership => ({
  id: `OWN-${Math.random().toString(36).substring(2, 10)}`,
  serialNumber: generateValidSerial(),
  ownerId: 'USER-002',
  previousOwnerId: 'USER-001',
  transferredAt: new Date(),
  transferReason: 'Sale',
  ...overrides,
});

export const createMockFraudAlert = (overrides: Partial<MockFraudAlert> = {}): MockFraudAlert => ({
  id: `FRAUD-${Math.random().toString(36).substring(2, 10)}`,
  serialNumber: generateValidSerial(),
  type: 'duplicate_verification',
  severity: 'medium',
  details: 'Serial verified from multiple locations',
  createdAt: new Date(),
  ...overrides,
});

// ============================================================
// Mock Repositories
// ============================================================

export class MockSerialRepository {
  private serials: Map<string, MockSerial> = new Map();

  async findBySerialNumber(serialNumber: string): Promise<MockSerial | null> {
    return this.serials.get(serialNumber) || null;
  }

  async findByProductId(productId: string): Promise<MockSerial[]> {
    return Array.from(this.serials.values()).filter(s => s.productId === productId);
  }

  async findByMerchantId(merchantId: string): Promise<MockSerial[]> {
    return Array.from(this.serials.values()).filter(s => s.merchantId === merchantId);
  }

  async create(serial: MockSerial): Promise<MockSerial> {
    this.serials.set(serial.serialNumber, serial);
    return serial;
  }

  async update(serialNumber: string, updates: Partial<MockSerial>): Promise<MockSerial | null> {
    const existing = this.serials.get(serialNumber);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.serials.set(serialNumber, updated);
    return updated;
  }

  async delete(serialNumber: string): Promise<boolean> {
    return this.serials.delete(serialNumber);
  }

  async findAll(): Promise<MockSerial[]> {
    return Array.from(this.serials.values());
  }

  clear(): void {
    this.serials.clear();
  }
}

export class MockWarrantyRepository {
  private warranties: Map<string, MockWarranty> = new Map();

  async findBySerialNumber(serialNumber: string): Promise<MockWarranty | null> {
    return Array.from(this.warranties.values()).find(w => w.serialNumber === serialNumber) || null;
  }

  async findByOwnerId(ownerId: string): Promise<MockWarranty[]> {
    return Array.from(this.warranties.values()).filter(w => w.ownerId === ownerId);
  }

  async findActive(): Promise<MockWarranty[]> {
    return Array.from(this.warranties.values()).filter(w => w.isActive);
  }

  async create(warranty: MockWarranty): Promise<MockWarranty> {
    this.warranties.set(warranty.id, warranty);
    return warranty;
  }

  async update(id: string, updates: Partial<MockWarranty>): Promise<MockWarranty | null> {
    const existing = this.warranties.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.warranties.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.warranties.delete(id);
  }

  clear(): void {
    this.warranties.clear();
  }
}

export class MockClaimRepository {
  private claims: Map<string, MockClaim> = new Map();

  async findById(id: string): Promise<MockClaim | null> {
    return this.claims.get(id) || null;
  }

  async findBySerialNumber(serialNumber: string): Promise<MockClaim[]> {
    return Array.from(this.claims.values()).filter(c => c.serialNumber === serialNumber);
  }

  async findByOwnerId(ownerId: string): Promise<MockClaim[]> {
    return Array.from(this.claims.values()).filter(c => c.ownerId === ownerId);
  }

  async findByStatus(status: MockClaim['status']): Promise<MockClaim[]> {
    return Array.from(this.claims.values()).filter(c => c.status === status);
  }

  async create(claim: MockClaim): Promise<MockClaim> {
    this.claims.set(claim.id, claim);
    return claim;
  }

  async update(id: string, updates: Partial<MockClaim>): Promise<MockClaim | null> {
    const existing = this.claims.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.claims.set(id, updated);
    return updated;
  }

  clear(): void {
    this.claims.clear();
  }
}

export class MockOwnershipRepository {
  private ownerships: Map<string, MockOwnership> = new Map();

  async findBySerialNumber(serialNumber: string): Promise<MockOwnership[]> {
    return Array.from(this.ownerships.values())
      .filter(o => o.serialNumber === serialNumber)
      .sort((a, b) => b.transferredAt.getTime() - a.transferredAt.getTime());
  }

  async findCurrentOwner(serialNumber: string): Promise<MockOwnership | null> {
    const histories = await this.findBySerialNumber(serialNumber);
    return histories[0] || null;
  }

  async findByOwnerId(ownerId: string): Promise<MockOwnership[]> {
    return Array.from(this.ownerships.values()).filter(o => o.ownerId === ownerId);
  }

  async create(ownership: MockOwnership): Promise<MockOwnership> {
    this.ownerships.set(ownership.id, ownership);
    return ownership;
  }

  clear(): void {
    this.ownerships.clear();
  }
}

export class MockFraudAlertRepository {
  private alerts: Map<string, MockFraudAlert> = new Map();

  async findBySerialNumber(serialNumber: string): Promise<MockFraudAlert[]> {
    return Array.from(this.alerts.values()).filter(a => a.serialNumber === serialNumber);
  }

  async findBySeverity(severity: MockFraudAlert['severity']): Promise<MockFraudAlert[]> {
    return Array.from(this.alerts.values()).filter(a => a.severity === severity);
  }

  async findUnresolved(): Promise<MockFraudAlert[]> {
    return Array.from(this.alerts.values()).filter(a => !a.resolvedAt);
  }

  async create(alert: MockFraudAlert): Promise<MockFraudAlert> {
    this.alerts.set(alert.id, alert);
    return alert;
  }

  async resolve(id: string, resolvedAt: Date = new Date()): Promise<MockFraudAlert | null> {
    const existing = this.alerts.get(id);
    if (!existing) return null;
    const updated = { ...existing, resolvedAt };
    this.alerts.set(id, updated);
    return updated;
  }

  clear(): void {
    this.alerts.clear();
  }
}

// ============================================================
// Mock External Services
// ============================================================

export class MockExternalAPIService {
  private shouldFail = false;
  private failureMessage = 'External API error';

  setFailure(shouldFail: boolean, message?: string): void {
    this.shouldFail = shouldFail;
    if (message) this.failureMessage = message;
  }

  async validateSerialWithManufacturer(serialNumber: string): Promise<{ valid: boolean }> {
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }
    return { valid: serialNumber.startsWith('REZ-') };
  }

  async notifyManufacturer(serialNumber: string, event: string): Promise<{ success: boolean }> {
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }
    return { success: true };
  }
}

// ============================================================
// Jest Global Setup
// ============================================================

beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-testing';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.REDIS_URL = 'redis://localhost:6379';
});

afterEach(() => {
  // Clear all mocks after each test
  jest.clearAllMocks();
});

afterAll(() => {
  // Cleanup
  jest.restoreAllMocks();
});

// ============================================================
// Custom Jest Matchers
// ============================================================

expect.extend({
  toBeValidSerialFormat(received: string) {
    const isValid = /^REZ-[A-Z0-9]+-[A-Z0-9]+$/i.test(received);
    return {
      pass: isValid,
      message: () =>
        `Expected ${received} ${isValid ? 'not ' : ''}to be a valid serial format`,
    };
  },
  toBeWithinDateRange(received: Date, start: Date, end: Date) {
    const time = received.getTime();
    const isWithin = time >= start.getTime() && time <= end.getTime();
    return {
      pass: isWithin,
      message: () =>
        `Expected ${received.toISOString()} ${isWithin ? 'not ' : ''}to be within range`,
    };
  },
  toHaveUniqueElements<T>(received: T[]) {
    const unique = new Set(received);
    const isUnique = unique.size === received.length;
    return {
      pass: isUnique,
      message: () =>
        `Expected array ${isUnique ? 'not ' : ''}to have unique elements`,
    };
  },
});

// Type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidSerialFormat(): R;
      toBeWithinDateRange(start: Date, end: Date): R;
      toHaveUniqueElements(): R;
    }
  }
}

// ============================================================
// Test Helper Functions
// ============================================================

export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<T> => {
  let lastError: Error | undefined;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await delay(delayMs * (i + 1));
      }
    }
  }
  throw lastError;
};

export const createMockRequest = (overrides: Record<string, unknown> = {}) => ({
  headers: { 'content-type': 'application/json' },
  body: {},
  params: {},
  query: {},
  user: { id: 'USER-001', role: 'user' },
  ...overrides,
});

export const createMockResponse = () => {
  const res: Record<string, unknown> = {
    statusCode: 200,
    body: null,
    headers: {},
  };

  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);

  return res as {
    statusCode: number;
    status: jest.Mock;
    json: jest.Mock;
    setHeader: jest.Mock;
    body: unknown;
    headers: Record<string, string>;
  };
};

// Export all test utilities
export default {
  generateValidSerial,
  generateInvalidSerial,
  createMockSerial,
  createMockWarranty,
  createMockClaim,
  createMockOwnership,
  createMockFraudAlert,
  MockSerialRepository,
  MockWarrantyRepository,
  MockClaimRepository,
  MockOwnershipRepository,
  MockFraudAlertRepository,
  MockExternalAPIService,
  delay,
  retry,
  createMockRequest,
  createMockResponse,
};
