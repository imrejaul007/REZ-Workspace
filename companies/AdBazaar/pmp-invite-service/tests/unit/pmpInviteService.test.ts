import { z } from 'zod';

// Mock the PMPInvite model
jest.mock('../../src/models/PMPInvite', () => {
  const mockSave = jest.fn().mockResolvedValue(undefined);
  const mockFindOne = jest.fn();
  const mockFind = jest.fn();
  const mockCountDocuments = jest.fn();
  const mockUpdateMany = jest.fn();

  const MockPMPInvite = jest.fn().mockImplementation((data) => ({
    ...data,
    inviteId: `PMP-TEST123-${Date.now()}`,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: mockSave.mockResolvedValue({
      ...data,
      inviteId: `PMP-TEST123-${Date.now()}`,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  }));

  MockPMPInvite.findOne = mockFindOne;
  MockPMPInvite.find = mockFind;
  MockPMPInvite.countDocuments = mockCountDocuments;
  MockPMPInvite.updateMany = mockUpdateMany;
  MockPMPInvite.aggregate = jest.fn();
  MockPMPInvite.getMetrics = jest.fn().mockResolvedValue({
    totalInvites: 100,
    pendingInvites: 20,
    acceptedInvites: 60,
    declinedInvites: 15,
    expiredInvites: 5,
    conversionRate: 60,
  });

  return { PMPInvite: MockPMPInvite, IPMPInvite: {} };
});

// Import after mocking
import { PMPInvite } from '../../src/models/PMPInvite';
import { config } from '../../src/config/index';

describe('PMP Invite Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Config', () => {
    it('should have correct default values', () => {
      expect(config.port).toBe(4601);
      expect(config.nodeEnv).toBe('test');
      expect(config.mongodb.uri).toContain('test_adbazzaar_pmp');
      expect(config.invite.defaultExpiryDays).toBe(7);
      expect(config.invite.maxExpiryDays).toBe(30);
    });

    it('should have JWT configuration', () => {
      expect(config.jwt.secret).toBeDefined();
      expect(config.jwt.expiresIn).toBeDefined();
      expect(config.jwt.issuer).toBe('adbazzaar');
      expect(config.jwt.audience).toBe('pmp-service');
    });
  });

  describe('Create Invite Schema Validation', () => {
    const createInviteSchema = z.object({
      publisherId: z.string().min(1),
      advertiserId: z.string().optional(),
      dealType: z.enum(['preferred_deal', 'private_marketplace', 'programmatic_guaranteed']),
      dealDetails: z.object({
        name: z.string().min(1).max(255),
        floorPrice: z.number().positive(),
        currency: z.string().length(3).default('USD'),
        targeting: z.object({
          geo: z.array(z.string()).optional(),
          deviceTypes: z.array(z.string()).optional(),
          contentCategories: z.array(z.string()).optional(),
        }).optional(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      }),
      expiresInDays: z.number().int().min(1).max(30).optional(),
    });

    it('should validate valid invite data', () => {
      const validData = {
        publisherId: 'pub_123',
        advertiserId: 'adv_456',
        dealType: 'private_marketplace',
        dealDetails: {
          name: 'Test Deal',
          floorPrice: 5.50,
          currency: 'USD',
          targeting: {
            geo: ['IN', 'US'],
            deviceTypes: ['mobile', 'desktop'],
          },
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      };

      const result = createInviteSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid deal type', () => {
      const invalidData = {
        publisherId: 'pub_123',
        dealType: 'invalid_type',
        dealDetails: {
          name: 'Test Deal',
          floorPrice: 5.50,
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      };

      const result = createInviteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative floor price', () => {
      const invalidData = {
        publisherId: 'pub_123',
        dealType: 'preferred_deal',
        dealDetails: {
          name: 'Test Deal',
          floorPrice: -5.50,
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      };

      const result = createInviteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty publisher ID', () => {
      const invalidData = {
        publisherId: '',
        dealType: 'preferred_deal',
        dealDetails: {
          name: 'Test Deal',
          floorPrice: 5.50,
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      };

      const result = createInviteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('List Invites Query Schema', () => {
    const listInvitesQuerySchema = z.object({
      status: z.enum(['pending', 'accepted', 'declined', 'expired']).optional(),
      publisherId: z.string().optional(),
      advertiserId: z.string().optional(),
      dealType: z.enum(['preferred_deal', 'private_marketplace', 'programmatic_guaranteed']).optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    });

    it('should validate empty query with defaults', () => {
      const result = listInvitesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should validate query with all filters', () => {
      const query = {
        status: 'pending',
        publisherId: 'pub_123',
        advertiserId: 'adv_456',
        dealType: 'private_marketplace',
        page: 2,
        limit: 50,
      };

      const result = listInvitesQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it('should reject page less than 1', () => {
      const result = listInvitesQuerySchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject limit greater than 100', () => {
      const result = listInvitesQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });
  });

  describe('Update Invite Status Schema', () => {
    const updateInviteStatusSchema = z.object({
      status: z.enum(['accepted', 'declined']),
      message: z.string().max(1000).optional(),
    });

    it('should validate accept status', () => {
      const result = updateInviteStatusSchema.safeParse({ status: 'accepted' });
      expect(result.success).toBe(true);
    });

    it('should validate decline with message', () => {
      const result = updateInviteStatusSchema.safeParse({
        status: 'declined',
        message: 'Not interested in this deal',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = updateInviteStatusSchema.safeParse({ status: 'pending' });
      expect(result.success).toBe(false);
    });

    it('should reject message exceeding 1000 characters', () => {
      const result = updateInviteStatusSchema.safeParse({
        status: 'declined',
        message: 'a'.repeat(1001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('JWT Payload Schema', () => {
    const jwtPayloadSchema = z.object({
      userId: z.string(),
      role: z.enum(['publisher', 'advertiser', 'admin']),
      companyId: z.string(),
      companyType: z.enum(['publisher', 'advertiser']),
    });

    it('should validate valid JWT payload', () => {
      const payload = {
        userId: 'user_123',
        role: 'publisher',
        companyId: 'comp_456',
        companyType: 'publisher',
      };

      const result = jwtPayloadSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
      const payload = {
        userId: 'user_123',
        role: 'invalid_role',
        companyId: 'comp_456',
        companyType: 'publisher',
      };

      const result = jwtPayloadSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('Invite ID Generation', () => {
    it('should generate unique invite IDs', () => {
      const generateInviteId = (): string => {
        return `PMP-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      };

      const id1 = generateInviteId();
      const id2 = generateInviteId();

      expect(id1).toMatch(/^PMP-[A-Z0-9]{8}-[A-Z0-9]+$/);
      expect(id2).toMatch(/^PMP-[A-Z0-9]{8}-[A-Z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Pagination Calculation', () => {
    it('should calculate correct pagination values', () => {
      const calculatePagination = (total: number, page: number, limit: number) => {
        const totalPages = Math.ceil(total / limit);
        return {
          skip: (page - 1) * limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        };
      };

      const result = calculatePagination(100, 2, 20);
      expect(result.skip).toBe(20);
      expect(result.totalPages).toBe(5);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
    });

    it('should handle last page correctly', () => {
      const calculatePagination = (total: number, page: number, limit: number) => {
        const totalPages = Math.ceil(total / limit);
        return {
          skip: (page - 1) * limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        };
      };

      const result = calculatePagination(100, 5, 20);
      expect(result.skip).toBe(80);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);
    });

    it('should handle single page correctly', () => {
      const calculatePagination = (total: number, page: number, limit: number) => {
        const totalPages = Math.ceil(total / limit);
        return {
          skip: (page - 1) * limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        };
      };

      const result = calculatePagination(15, 1, 20);
      expect(result.skip).toBe(0);
      expect(result.totalPages).toBe(1);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(false);
    });
  });

  describe('Conversion Rate Calculation', () => {
    it('should calculate correct conversion rate', () => {
      const calculateConversionRate = (accepted: number, total: number): number => {
        if (total === 0) return 0;
        return Math.round((accepted / total) * 10000) / 100;
      };

      expect(calculateConversionRate(60, 100)).toBe(60);
      expect(calculateConversionRate(1, 3)).toBe(33.33);
      expect(calculateConversionRate(0, 0)).toBe(0);
      expect(calculateConversionRate(10, 10)).toBe(100);
    });
  });
});