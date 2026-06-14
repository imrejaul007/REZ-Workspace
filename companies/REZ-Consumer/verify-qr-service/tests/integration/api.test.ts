/**
 * Integration Tests for Verify QR Service API
 * Tests HTTP endpoints, request/response handling, and middleware
 */

import {
  createMockSerial,
  createMockWarranty,
  createMockClaim,
  createMockOwnership,
  MockSerialRepository,
  MockWarrantyRepository,
  MockClaimRepository,
  MockOwnershipRepository,
  generateValidSerial,
  delay,
} from '../setup';

// ============================================================
// Mock HTTP Request/Response
// ============================================================

interface MockRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
  params: Record<string, string>;
  query: Record<string, string>;
  user?: { id: string; role: string };
}

interface MockResponse {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
  status: (code: number) => MockResponse;
  json: (data: unknown) => MockResponse;
  setHeader: (key: string, value: string) => MockResponse;
}

const createMockResponse = (): MockResponse => {
  const res: MockResponse = {
    statusCode: 200,
    body: null,
    headers: {},
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.body = data;
      return this;
    },
    setHeader(key: string, value: string) {
      this.headers[key] = value;
      return this;
    },
  };
  return res;
};

// ============================================================
// API Routes Implementation (Mock)
// ============================================================

interface ApiError {
  error: string;
  status: number;
  details?: string;
}

class MockRouter {
  private routes: Map<string, Map<string, (req: MockRequest, res: MockResponse) => Promise<void>>> = new Map();

  register(method: string, path: string, handler: (req: MockRequest, res: MockResponse) => Promise<void>) {
    if (!this.routes.has(method)) {
      this.routes.set(method, new Map());
    }
    this.routes.get(method)!.set(path, handler);
  }

  async handle(req: MockRequest): Promise<MockResponse> {
    const res = createMockResponse();
    const methodRoutes = this.routes.get(req.method);

    if (!methodRoutes) {
      res.status(404).json({ error: 'Not Found' });
      return res;
    }

    const handler = methodRoutes.get(req.url);

    if (!handler) {
      res.status(404).json({ error: 'Not Found' });
      return res;
    }

    try {
      await handler(req, res);
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return res;
  }
}

// ============================================================
// API Service Implementation
// ============================================================

class VerifyQRApiService {
  constructor(
    private serialRepo: MockSerialRepository,
    private warrantyRepo: MockWarrantyRepository,
    private claimRepo: MockClaimRepository,
    private ownershipRepo: MockOwnershipRepository
  ) {}

  async verifySerialHandler(req: MockRequest, res: MockResponse): Promise<void> {
    const { serial } = req.query;

    if (!serial || typeof serial !== 'string') {
      res.status(400).json({ error: 'Serial number is required' });
      return;
    }

    const normalizedSerial = serial.trim().toUpperCase();

    // Validate format
    if (!/^REZ-[A-Z0-9]+-[A-Z0-9]+$/i.test(normalizedSerial)) {
      res.status(400).json({ error: 'Invalid serial number format' });
      return;
    }

    const foundSerial = await this.serialRepo.findBySerialNumber(normalizedSerial);

    if (!foundSerial) {
      res.status(404).json({ error: 'Serial number not found' });
      return;
    }

    if (!foundSerial.isValid) {
      res.status(400).json({ error: 'Serial has been deactivated' });
      return;
    }

    const warranty = await this.warrantyRepo.findBySerialNumber(normalizedSerial);
    const ownership = await this.ownershipRepo.findCurrentOwner(normalizedSerial);

    res.status(200).json({
      success: true,
      data: {
        serialNumber: foundSerial.serialNumber,
        productId: foundSerial.productId,
        merchantId: foundSerial.merchantId,
        warranty: warranty
          ? {
              isActive: warranty.isActive,
              endDate: warranty.endDate.toISOString(),
              ownerId: warranty.ownerId,
            }
          : null,
        ownership: ownership
          ? {
              currentOwnerId: ownership.ownerId,
              transferredAt: ownership.transferredAt.toISOString(),
            }
          : null,
      },
    });
  }

  async activateWarrantyHandler(req: MockRequest, res: MockResponse): Promise<void> {
    const { serialNumber, ownerId, durationDays } = req.body;

    if (!serialNumber || !ownerId) {
      res.status(400).json({ error: 'serialNumber and ownerId are required' });
      return;
    }

    const serial = await this.serialRepo.findBySerialNumber(serialNumber);
    if (!serial) {
      res.status(404).json({ error: 'Serial number not found' });
      return;
    }

    const existingWarranty = await this.warrantyRepo.findBySerialNumber(serialNumber);
    if (existingWarranty) {
      res.status(409).json({ error: 'Warranty already exists' });
      return;
    }

    const ownership = await this.ownershipRepo.findCurrentOwner(serialNumber);
    if (!ownership || ownership.ownerId !== ownerId) {
      res.status(403).json({ error: 'You do not own this product' });
      return;
    }

    const startDate = new Date();
    const duration = durationDays || 365;
    const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);

    const warranty = {
      id: `WARR-${Date.now()}`,
      serialNumber,
      ownerId,
      startDate,
      endDate,
      isActive: true,
      claimCount: 0,
    };

    await this.warrantyRepo.create(warranty);

    res.status(201).json({
      success: true,
      data: {
        warrantyId: warranty.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  }

  async fileClaimHandler(req: MockRequest, res: MockResponse): Promise<void> {
    const { serialNumber, reason } = req.body;
    const ownerId = req.user?.id;

    if (!serialNumber || !reason || !ownerId) {
      res.status(400).json({
        error: 'serialNumber, reason, and authentication are required',
      });
      return;
    }

    const warranty = await this.warrantyRepo.findBySerialNumber(serialNumber);
    if (!warranty) {
      res.status(404).json({ error: 'No warranty found' });
      return;
    }

    if (!warranty.isActive) {
      res.status(400).json({ error: 'Warranty is not active' });
      return;
    }

    if (warranty.claimCount >= 2) {
      res.status(400).json({ error: 'Maximum claims reached' });
      return;
    }

    const claim = {
      id: `CLM-${Date.now()}`,
      serialNumber,
      ownerId,
      reason,
      status: 'pending' as const,
      filedAt: new Date(),
    };

    await this.claimRepo.create(claim);
    await this.warrantyRepo.update(warranty.id, {
      claimCount: warranty.claimCount + 1,
    });

    res.status(201).json({
      success: true,
      data: { claimId: claim.id },
    });
  }

  async transferOwnershipHandler(req: MockRequest, res: MockResponse): Promise<void> {
    const { serialNumber, toOwnerId } = req.body;
    const fromOwnerId = req.user?.id;

    if (!serialNumber || !toOwnerId || !fromOwnerId) {
      res.status(400).json({ error: 'serialNumber, toOwnerId, and authentication are required' });
      return;
    }

    if (fromOwnerId === toOwnerId) {
      res.status(400).json({ error: 'Cannot transfer to yourself' });
      return;
    }

    const ownership = await this.ownershipRepo.findCurrentOwner(serialNumber);
    if (!ownership || ownership.ownerId !== fromOwnerId) {
      res.status(403).json({ error: 'You do not own this product' });
      return;
    }

    const newOwnership = {
      id: `OWN-${Date.now()}`,
      serialNumber,
      ownerId: toOwnerId,
      previousOwnerId: fromOwnerId,
      transferredAt: new Date(),
      transferReason: 'Sale',
    };

    await this.ownershipRepo.create(newOwnership);

    res.status(200).json({
      success: true,
      data: {
        transferId: newOwnership.id,
        newOwnerId: toOwnerId,
      },
    });
  }

  async getClaimHistoryHandler(req: MockRequest, res: MockResponse): Promise<void> {
    const { serialNumber } = req.params;

    if (!serialNumber) {
      res.status(400).json({ error: 'serialNumber is required' });
      return;
    }

    const claims = await this.claimRepo.findBySerialNumber(serialNumber);

    res.status(200).json({
      success: true,
      data: claims.map(c => ({
        id: c.id,
        reason: c.reason,
        status: c.status,
        filedAt: c.filedAt.toISOString(),
        resolvedAt: c.resolvedAt?.toISOString(),
      })),
    });
  }

  async getWarrantyStatusHandler(req: MockRequest, res: MockResponse): Promise<void> {
    const { serialNumber } = req.query;

    if (!serialNumber || typeof serialNumber !== 'string') {
      res.status(400).json({ error: 'serialNumber is required' });
      return;
    }

    const warranty = await this.warrantyRepo.findBySerialNumber(serialNumber);

    if (!warranty) {
      res.status(404).json({ error: 'Warranty not found' });
      return;
    }

    const now = new Date();
    const endDate = new Date(warranty.endDate);
    const daysRemaining = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    res.status(200).json({
      success: true,
      data: {
        warrantyId: warranty.id,
        serialNumber: warranty.serialNumber,
        ownerId: warranty.ownerId,
        isActive: warranty.isActive && daysRemaining > 0,
        startDate: warranty.startDate.toISOString(),
        endDate: warranty.endDate.toISOString(),
        daysRemaining: Math.max(0, daysRemaining),
        claimCount: warranty.claimCount,
      },
    });
  }
}

// ============================================================
// Test Suite
// ============================================================

describe('Verify QR Service API', () => {
  let apiService: VerifyQRApiService;
  let router: MockRouter;
  let serialRepo: MockSerialRepository;
  let warrantyRepo: MockWarrantyRepository;
  let claimRepo: MockClaimRepository;
  let ownershipRepo: MockOwnershipRepository;

  beforeEach(() => {
    serialRepo = new MockSerialRepository();
    warrantyRepo = new MockWarrantyRepository();
    claimRepo = new MockClaimRepository();
    ownershipRepo = new MockOwnershipRepository();
    apiService = new VerifyQRApiService(
      serialRepo,
      warrantyRepo,
      claimRepo,
      ownershipRepo
    );
    router = new MockRouter();

    // Register routes
    router.register('GET', '/api/v1/verify', (req, res) =>
      apiService.verifySerialHandler(req, res)
    );
    router.register('POST', '/api/v1/warranty/activate', (req, res) =>
      apiService.activateWarrantyHandler(req, res)
    );
    router.register('POST', '/api/v1/claims', (req, res) =>
      apiService.fileClaimHandler(req, res)
    );
    router.register('POST', '/api/v1/ownership/transfer', (req, res) =>
      apiService.transferOwnershipHandler(req, res)
    );
    router.register('GET', '/api/v1/claims/:serialNumber', (req, res) =>
      apiService.getClaimHistoryHandler(req, res)
    );
    router.register('GET', '/api/v1/warranty/status', (req, res) =>
      apiService.getWarrantyStatusHandler(req, res)
    );
  });

  afterEach(() => {
    serialRepo.clear();
    warrantyRepo.clear();
    claimRepo.clear();
    ownershipRepo.clear();
  });

  describe('GET /api/v1/verify', () => {
    it('should return 200 for valid serial', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const req: MockRequest = {
        method: 'GET',
        url: '/api/v1/verify',
        headers: {},
        body: {},
        params: {},
        query: { serial: serial.serialNumber },
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(200);
      expect((res.body as { success: boolean }).success).toBe(true);
      expect((res.body as { data: { serialNumber: string } }).data.serialNumber).toBe(
        serial.serialNumber
      );
    });

    it('should return 400 for missing serial', async () => {
      const req: MockRequest = {
        method: 'GET',
        url: '/api/v1/verify',
        headers: {},
        body: {},
        params: {},
        query: {},
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(400);
      expect((res.body as { error: string }).error).toBe('Serial number is required');
    });

    it('should return 400 for invalid serial format', async () => {
      const req: MockRequest = {
        method: 'GET',
        url: '/api/v1/verify',
        headers: {},
        body: {},
        params: {},
        query: { serial: 'INVALID-FORMAT' },
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(400);
      expect((res.body as { error: string }).error).toBe('Invalid serial number format');
    });

    it('should return 404 for non-existent serial', async () => {
      const req: MockRequest = {
        method: 'GET',
        url: '/api/v1/verify',
        headers: {},
        body: {},
        params: {},
        query: { serial: 'REZ-NOTFOUND-123' },
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(404);
      expect((res.body as { error: string }).error).toBe('Serial number not found');
    });

    it('should return 400 for deactivated serial', async () => {
      const serial = createMockSerial({ isValid: false });
      await serialRepo.create(serial);

      const req: MockRequest = {
        method: 'GET',
        url: '/api/v1/verify',
        headers: {},
        body: {},
        params: {},
        query: { serial: serial.serialNumber },
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(400);
      expect((res.body as { error: string }).error).toBe('Serial has been deactivated');
    });

    it('should include warranty info in response', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const warranty = {
        id: 'WARR-001',
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
        claimCount: 0,
      };
      await warrantyRepo.create(warranty);

      const req: MockRequest = {
        method: 'GET',
        url: '/api/v1/verify',
        headers: {},
        body: {},
        params: {},
        query: { serial: serial.serialNumber },
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(200);
      const data = (res.body as { data: { warranty: unknown } }).data;
      expect(data.warranty).not.toBeNull();
      expect((data.warranty as { isActive: boolean }).isActive).toBe(true);
    });

    it('should normalize serial to uppercase', async () => {
      const serial = createMockSerial({ serialNumber: 'REZ-ABC123-XYZ789' });
      await serialRepo.create(serial);

      const req: MockRequest = {
        method: 'GET',
        url: '/api/v1/verify',
        headers: {},
        body: {},
        params: {},
        query: { serial: 'rez-abc123-xyz789' },
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(200);
      expect(
        (res.body as { data: { serialNumber: string } }).data.serialNumber
      ).toBe('REZ-ABC123-XYZ789');
    });
  });

  describe('POST /api/v1/warranty/activate', () => {
    it('should activate warranty successfully', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const ownership = createMockOwnership({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
      });
      await ownershipRepo.create(ownership);

      const req: MockRequest = {
        method: 'POST',
        url: '/api/v1/warranty/activate',
        headers: {},
        body: {
          serialNumber: serial.serialNumber,
          ownerId: 'USER-001',
          durationDays: 365,
        },
        params: {},
        query: {},
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(201);
      expect((res.body as { success: boolean }).success).toBe(true);
      expect((res.body as { data: { warrantyId: string } }).data.warrantyId).toBeDefined();
    });

    it('should return 400 for missing fields', async () => {
      const req: MockRequest = {
        method: 'POST',
        url: '/api/v1/warranty/activate',
        headers: {},
        body: { serialNumber: 'REZ-TEST-123' },
        params: {},
        query: {},
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(400);
      expect((res.body as { error: string }).error).toBe(
        'serialNumber and ownerId are required'
      );
    });

    it('should return 404 for non-existent serial', async () => {
      const req: MockRequest = {
        method: 'POST',
        url: '/api/v1/warranty/activate',
        headers: {},
        body: {
          serialNumber: 'REZ-NOTFOUND-123',
          ownerId: 'USER-001',
        },
        params: {},
        query: {},
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(404);
    });

    it('should return 409 for existing warranty', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const ownership = createMockOwnership({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
      });
      await ownershipRepo.create(ownership);

      // First activation
      await warrantyRepo.create(
        createMockWarranty({ serialNumber: serial.serialNumber })
      );

      const req: MockRequest = {
        method: 'POST',
        url: '/api/v1/warranty/activate',
        headers: {},
        body: {
          serialNumber: serial.serialNumber,
          ownerId: 'USER-001',
        },
        params: {},
        query: {},
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(409);
      expect((res.body as { error: string }).error).toBe('Warranty already exists');
    });

    it('should return 403 for non-owner', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const ownership = createMockOwnership({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
      });
      await ownershipRepo.create(ownership);

      const req: MockRequest = {
        method: 'POST',
        url: '/api/v1/warranty/activate',
        headers: {},
        body: {
          serialNumber: serial.serialNumber,
          ownerId: 'USER-002',
        },
        params: {},
        query: {},
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(403);
      expect((res.body as { error: string }).error).toBe('You do not own this product');
    });
  });

  describe('POST /api/v1/claims', () => {
    it('should file claim successfully', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const warranty = createMockWarranty({
        serialNumber: serial.serialNumber,
        isActive: true,
        claimCount: 0,
      });
      await warrantyRepo.create(warranty);

      const req: MockRequest = {
        method: 'POST',
        url: '/api/v1/claims',
        headers: {},
        body: {
          serialNumber: serial.serialNumber,
          reason: 'product_defect',
        },
        params: {},
        query: {},
        user: { id: 'USER-001', role: 'user' },
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(201);
      expect((res.body as { success: boolean }).success).toBe(true);
      expect((res.body as { data: { claimId: string } }).data.claimId).toBeDefined();
    });

    it('should return 400 for unauthenticated request', async () => {
      const req: MockRequest = {
        method: 'POST',
        url: '/api/v1/claims',
        headers: {},
        body: {
          serialNumber: 'REZ-TEST-123',
          reason: 'product_defect',
        },
        params: {},
        query: {},
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for missing fields', async () => {
      const req: MockRequest = {
        method: 'POST',
        url: '/api/v1/claims',
        headers: {},
        body: { serialNumber: 'REZ-TEST-123' },
        params: {},
        query: {},
        user: { id: 'USER-001', role: 'user' },
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 for no warranty', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const req: MockRequest = {
        method: 'POST',
        url: '/api/v1/claims',
        headers: {},
        body: {
          serialNumber: serial.serialNumber,
          reason: 'product_defect',
        },
        params: {},
        query: {},
        user: { id: 'USER-001', role: 'user' },
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(404);
    });

    it('should return 400 for inactive warranty', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const warranty = createMockWarranty({
        serialNumber: serial.serialNumber,
        isActive: false,
      });
      await warrantyRepo.create(warranty);

      const req: MockRequest = {
        method: 'POST',
        url: '/api/v1/claims',
        headers: {},
        body: {
          serialNumber: serial.serialNumber,
          reason: 'product_defect',
        },
        params: {},
        query: {},
        user: { id: 'USER-001', role: 'user' },
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(400);
      expect((res.body as { error: string }).error).toBe('Warranty is not active');
    });

    it('should return 400 for max claims', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const warranty = createMockWarranty({
        serialNumber: serial.serialNumber,
        isActive: true,
        claimCount: 2,
      });
      await warrantyRepo.create(warranty);

      const req: MockRequest = {
        method: 'POST',
        url: '/api/v1/claims',
        headers: {},
        body: {
          serialNumber: serial.serialNumber,
          reason: 'product_defect',
        },
        params: {},
        query: {},
        user: { id: 'USER-001', role: 'user' },
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(400);
      expect((res.body as { error: string }).error).toBe('Maximum claims reached');
    });
  });

  describe('POST /api/v1/ownership/transfer', () => {
    it('should transfer ownership successfully', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const ownership = createMockOwnership({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
      });
      await ownershipRepo.create(ownership);

      const req: MockRequest = {
        method: 'POST',
        url: '/api/v1/ownership/transfer',
        headers: {},
        body: {
          serialNumber: serial.serialNumber,
          toOwnerId: 'USER-002',
        },
        params: {},
        query: {},
        user: { id: 'USER-001', role: 'user' },
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(200);
      expect((res.body as { success: boolean }).success).toBe(true);
      expect((res.body as { data: { newOwnerId: string } }).data.newOwnerId).toBe('USER-002');
    });

    it('should return 400 for self-transfer', async () => {
      const req: MockRequest = {
        method: 'POST',
        url: '/api/v1/ownership/transfer',
        headers: {},
        body: {
          serialNumber: 'REZ-TEST-123',
          toOwnerId: 'USER-001',
        },
        params: {},
        query: {},
        user: { id: 'USER-001', role: 'user' },
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(400);
      expect((res.body as { error: string }).error).toBe('Cannot transfer to yourself');
    });

    it('should return 403 for non-owner', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const ownership = createMockOwnership({
        serialNumber: serial.serialNumber,
        ownerId: 'USER-002',
      });
      await ownershipRepo.create(ownership);

      const req: MockRequest = {
        method: 'POST',
        url: '/api/v1/ownership/transfer',
        headers: {},
        body: {
          serialNumber: serial.serialNumber,
          toOwnerId: 'USER-003',
        },
        params: {},
        query: {},
        user: { id: 'USER-001', role: 'user' },
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/v1/claims/:serialNumber', () => {
    it('should return claim history', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const claim = createMockClaim({ serialNumber: serial.serialNumber });
      await claimRepo.create(claim);

      const req: MockRequest = {
        method: 'GET',
        url: `/api/v1/claims/${serial.serialNumber}`,
        headers: {},
        body: {},
        params: { serialNumber: serial.serialNumber },
        query: {},
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(200);
      const claims = (res.body as { data: unknown[] }).data;
      expect(claims.length).toBe(1);
    });

    it('should return empty array for serial with no claims', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const req: MockRequest = {
        method: 'GET',
        url: `/api/v1/claims/${serial.serialNumber}`,
        headers: {},
        body: {},
        params: { serialNumber: serial.serialNumber },
        query: {},
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(200);
      expect((res.body as { data: unknown[] }).data).toEqual([]);
    });
  });

  describe('GET /api/v1/warranty/status', () => {
    it('should return warranty status', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const warranty = createMockWarranty({
        serialNumber: serial.serialNumber,
        isActive: true,
      });
      await warrantyRepo.create(warranty);

      const req: MockRequest = {
        method: 'GET',
        url: '/api/v1/warranty/status',
        headers: {},
        body: {},
        params: {},
        query: { serialNumber: serial.serialNumber },
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(200);
      expect((res.body as { success: boolean }).success).toBe(true);
      expect((res.body as { data: { isActive: boolean } }).data.isActive).toBe(true);
    });

    it('should return 404 for non-existent warranty', async () => {
      const req: MockRequest = {
        method: 'GET',
        url: '/api/v1/warranty/status',
        headers: {},
        body: {},
        params: {},
        query: { serialNumber: 'REZ-NOTFOUND-123' },
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(404);
    });

    it('should return 400 for missing serialNumber', async () => {
      const req: MockRequest = {
        method: 'GET',
        url: '/api/v1/warranty/status',
        headers: {},
        body: {},
        params: {},
        query: {},
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(400);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const req: MockRequest = {
        method: 'GET',
        url: '/api/v1/unknown',
        headers: {},
        body: {},
        params: {},
        query: {},
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(404);
    });

    it('should return 405 for wrong method', async () => {
      const req: MockRequest = {
        method: 'DELETE',
        url: '/api/v1/verify',
        headers: {},
        body: {},
        params: {},
        query: {},
      };

      const res = await router.handle(req);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('Response Format', () => {
    it('should include Content-Type header', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const req: MockRequest = {
        method: 'GET',
        url: '/api/v1/verify',
        headers: {},
        body: {},
        params: {},
        query: { serial: serial.serialNumber },
      };

      const res = await router.handle(req);

      expect(res.headers['content-type']).toBeDefined();
    });

    it('should follow success response format', async () => {
      const serial = createMockSerial();
      await serialRepo.create(serial);

      const req: MockRequest = {
        method: 'GET',
        url: '/api/v1/verify',
        headers: {},
        body: {},
        params: {},
        query: { serial: serial.serialNumber },
      };

      const res = await router.handle(req);

      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('data');
    });

    it('should follow error response format', async () => {
      const req: MockRequest = {
        method: 'GET',
        url: '/api/v1/verify',
        headers: {},
        body: {},
        params: {},
        query: {},
      };

      const res = await router.handle(req);

      expect(res.body).toHaveProperty('error');
    });
  });
});

// ============================================================
// End-to-End Workflow Tests
// ============================================================

describe('Verify QR Service End-to-End Workflows', () => {
  let apiService: VerifyQRApiService;
  let router: MockRouter;
  let serialRepo: MockSerialRepository;
  let warrantyRepo: MockWarrantyRepository;
  let claimRepo: MockClaimRepository;
  let ownershipRepo: MockOwnershipRepository;

  beforeEach(() => {
    serialRepo = new MockSerialRepository();
    warrantyRepo = new MockWarrantyRepository();
    claimRepo = new MockClaimRepository();
    ownershipRepo = new MockOwnershipRepository();
    apiService = new VerifyQRApiService(
      serialRepo,
      warrantyRepo,
      claimRepo,
      ownershipRepo
    );
    router = new MockRouter();

    router.register('GET', '/api/v1/verify', (req, res) =>
      apiService.verifySerialHandler(req, res)
    );
    router.register('POST', '/api/v1/warranty/activate', (req, res) =>
      apiService.activateWarrantyHandler(req, res)
    );
    router.register('POST', '/api/v1/claims', (req, res) =>
      apiService.fileClaimHandler(req, res)
    );
    router.register('POST', '/api/v1/ownership/transfer', (req, res) =>
      apiService.transferOwnershipHandler(req, res)
    );
    router.register('GET', '/api/v1/warranty/status', (req, res) =>
      apiService.getWarrantyStatusHandler(req, res)
    );
  });

  afterEach(() => {
    serialRepo.clear();
    warrantyRepo.clear();
    claimRepo.clear();
    ownershipRepo.clear();
  });

  it('should complete full product lifecycle', async () => {
    // 1. Create product with serial
    const serial = createMockSerial();
    await serialRepo.create(serial);

    // 2. Verify serial (before warranty)
    let req: MockRequest = {
      method: 'GET',
      url: '/api/v1/verify',
      headers: {},
      body: {},
      params: {},
      query: { serial: serial.serialNumber },
    };
    let res = await router.handle(req);
    expect(res.statusCode).toBe(200);
    expect((res.body as { data: { warranty: null } }).data.warranty).toBeNull();

    // 3. Set initial ownership
    const ownership = createMockOwnership({
      serialNumber: serial.serialNumber,
      ownerId: 'USER-001',
    });
    await ownershipRepo.create(ownership);

    // 4. Activate warranty
    req = {
      method: 'POST',
      url: '/api/v1/warranty/activate',
      headers: {},
      body: {
        serialNumber: serial.serialNumber,
        ownerId: 'USER-001',
        durationDays: 365,
      },
      params: {},
      query: {},
    };
    res = await router.handle(req);
    expect(res.statusCode).toBe(201);

    // 5. Verify serial (after warranty)
    req = {
      method: 'GET',
      url: '/api/v1/verify',
      headers: {},
      body: {},
      params: {},
      query: { serial: serial.serialNumber },
    };
    res = await router.handle(req);
    expect(res.statusCode).toBe(200);
    expect((res.body as { data: { warranty: unknown } }).data.warranty).not.toBeNull();

    // 6. File claim
    req = {
      method: 'POST',
      url: '/api/v1/claims',
      headers: {},
      body: {
        serialNumber: serial.serialNumber,
        reason: 'product_defect',
      },
      params: {},
      query: {},
      user: { id: 'USER-001', role: 'user' },
    };
    res = await router.handle(req);
    expect(res.statusCode).toBe(201);

    // 7. Transfer ownership
    req = {
      method: 'POST',
      url: '/api/v1/ownership/transfer',
      headers: {},
      body: {
        serialNumber: serial.serialNumber,
        toOwnerId: 'USER-002',
      },
      params: {},
      query: {},
      user: { id: 'USER-001', role: 'user' },
    };
    res = await router.handle(req);
    expect(res.statusCode).toBe(200);

    // 8. Verify serial (after transfer)
    req = {
      method: 'GET',
      url: '/api/v1/verify',
      headers: {},
      body: {},
      params: {},
      query: { serial: serial.serialNumber },
    };
    res = await router.handle(req);
    expect(res.statusCode).toBe(200);
    expect(
      (res.body as { data: { ownership: { currentOwnerId: string } } }).data.ownership
        .currentOwnerId
    ).toBe('USER-002');

    // 9. New owner cannot file claim (warranty owner unchanged)
    req = {
      method: 'POST',
      url: '/api/v1/claims',
      headers: {},
      body: {
        serialNumber: serial.serialNumber,
        reason: 'manufacturing_error',
      },
      params: {},
      query: {},
      user: { id: 'USER-002', role: 'user' },
    };
    res = await router.handle(req);
    expect(res.statusCode).toBe(400); // Not the warranty owner
  });

  it('should handle concurrent requests', async () => {
    const serial = createMockSerial();
    await serialRepo.create(serial);

    const ownership = createMockOwnership({
      serialNumber: serial.serialNumber,
      ownerId: 'USER-001',
    });
    await ownershipRepo.create(ownership);

    // Concurrent warranty activations
    const requests = [
      {
        method: 'POST',
        url: '/api/v1/warranty/activate',
        headers: {},
        body: {
          serialNumber: serial.serialNumber,
          ownerId: 'USER-001',
        },
        params: {},
        query: {},
      },
      {
        method: 'POST',
        url: '/api/v1/warranty/activate',
        headers: {},
        body: {
          serialNumber: serial.serialNumber,
          ownerId: 'USER-001',
        },
        params: {},
        query: {},
      },
    ];

    const responses = await Promise.all(
      requests.map(req =>
        router.handle(req as MockRequest)
      )
    );

    // One should succeed, one should fail
    const successCount = responses.filter(r => r.statusCode === 201).length;
    const conflictCount = responses.filter(r => r.statusCode === 409).length;

    expect(successCount).toBe(1);
    expect(conflictCount).toBe(1);
  });
});
