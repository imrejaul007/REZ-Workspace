import { z } from 'zod';

// Test validation schemas
describe('Validation Schemas', () => {
  describe('Create Invite Schema', () => {
    const createInviteSchema = z.object({
      publisherId: z.string().min(1, 'Publisher ID is required'),
      advertiserId: z.string().optional(),
      dealType: z.enum(['preferred_deal', 'private_marketplace', 'programmatic_guaranteed']),
      dealDetails: z.object({
        name: z.string().min(1, 'Deal name is required').max(255),
        floorPrice: z.number().positive('Floor price must be positive'),
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

    it('should validate a complete valid invite', () => {
      const validInvite = {
        publisherId: 'pub_abc123',
        advertiserId: 'adv_xyz789',
        dealType: 'private_marketplace',
        dealDetails: {
          name: 'Premium Display Inventory',
          floorPrice: 2.50,
          currency: 'USD',
          targeting: {
            geo: ['US', 'CA'],
            deviceTypes: ['mobile'],
            contentCategories: ['news', 'sports'],
          },
          startDate: '2026-07-01',
          endDate: '2026-12-31',
        },
        expiresInDays: 14,
      };

      const result = createInviteSchema.safeParse(validInvite);
      expect(result.success).toBe(true);
    });

    it('should apply default currency', () => {
      const inviteWithoutCurrency = {
        publisherId: 'pub_abc123',
        dealType: 'preferred_deal',
        dealDetails: {
          name: 'Basic Deal',
          floorPrice: 1.00,
          startDate: '2026-07-01',
          endDate: '2026-12-31',
        },
      };

      const result = createInviteSchema.safeParse(inviteWithoutCurrency);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dealDetails.currency).toBe('USD');
      }
    });

    it('should reject missing publisherId', () => {
      const invalidInvite = {
        dealType: 'preferred_deal',
        dealDetails: {
          name: 'Test',
          floorPrice: 1.00,
          startDate: '2026-07-01',
          endDate: '2026-12-31',
        },
      };

      const result = createInviteSchema.safeParse(invalidInvite);
      expect(result.success).toBe(false);
    });

    it('should reject invalid deal type', () => {
      const invalidInvite = {
        publisherId: 'pub_123',
        dealType: 'invalid_type',
        dealDetails: {
          name: 'Test',
          floorPrice: 1.00,
          startDate: '2026-07-01',
          endDate: '2026-12-31',
        },
      };

      const result = createInviteSchema.safeParse(invalidInvite);
      expect(result.success).toBe(false);
    });

    it('should reject zero floor price', () => {
      const invalidInvite = {
        publisherId: 'pub_123',
        dealType: 'preferred_deal',
        dealDetails: {
          name: 'Test',
          floorPrice: 0,
          startDate: '2026-07-01',
          endDate: '2026-12-31',
        },
      };

      const result = createInviteSchema.safeParse(invalidInvite);
      expect(result.success).toBe(false);
    });

    it('should reject negative floor price', () => {
      const invalidInvite = {
        publisherId: 'pub_123',
        dealType: 'preferred_deal',
        dealDetails: {
          name: 'Test',
          floorPrice: -1.00,
          startDate: '2026-07-01',
          endDate: '2026-12-31',
        },
      };

      const result = createInviteSchema.safeParse(invalidInvite);
      expect(result.success).toBe(false);
    });

    it('should reject empty deal name', () => {
      const invalidInvite = {
        publisherId: 'pub_123',
        dealType: 'preferred_deal',
        dealDetails: {
          name: '',
          floorPrice: 1.00,
          startDate: '2026-07-01',
          endDate: '2026-12-31',
        },
      };

      const result = createInviteSchema.safeParse(invalidInvite);
      expect(result.success).toBe(false);
    });

    it('should reject expiresInDays greater than 30', () => {
      const invalidInvite = {
        publisherId: 'pub_123',
        dealType: 'preferred_deal',
        dealDetails: {
          name: 'Test',
          floorPrice: 1.00,
          startDate: '2026-07-01',
          endDate: '2026-12-31',
        },
        expiresInDays: 31,
      };

      const result = createInviteSchema.safeParse(invalidInvite);
      expect(result.success).toBe(false);
    });

    it('should reject expiresInDays less than 1', () => {
      const invalidInvite = {
        publisherId: 'pub_123',
        dealType: 'preferred_deal',
        dealDetails: {
          name: 'Test',
          floorPrice: 1.00,
          startDate: '2026-07-01',
          endDate: '2026-12-31',
        },
        expiresInDays: 0,
      };

      const result = createInviteSchema.safeParse(invalidInvite);
      expect(result.success).toBe(false);
    });

    it('should accept programmatic_guaranteed deal type', () => {
      const validInvite = {
        publisherId: 'pub_123',
        dealType: 'programmatic_guaranteed',
        dealDetails: {
          name: 'Guaranteed Deal',
          floorPrice: 10.00,
          startDate: '2026-07-01',
          endDate: '2026-12-31',
        },
      };

      const result = createInviteSchema.safeParse(validInvite);
      expect(result.success).toBe(true);
    });
  });

  describe('Update Invite Status Schema', () => {
    const updateInviteStatusSchema = z.object({
      status: z.enum(['accepted', 'declined']),
      message: z.string().max(1000).optional(),
    });

    it('should validate accepted status', () => {
      const result = updateInviteStatusSchema.safeParse({ status: 'accepted' });
      expect(result.success).toBe(true);
    });

    it('should validate declined status with message', () => {
      const result = updateInviteStatusSchema.safeParse({
        status: 'declined',
        message: 'Budget constraints prevent us from accepting this deal',
      });
      expect(result.success).toBe(true);
    });

    it('should reject pending status', () => {
      const result = updateInviteStatusSchema.safeParse({ status: 'pending' });
      expect(result.success).toBe(false);
    });

    it('should reject expired status', () => {
      const result = updateInviteStatusSchema.safeParse({ status: 'expired' });
      expect(result.success).toBe(false);
    });

    it('should reject message longer than 1000 characters', () => {
      const result = updateInviteStatusSchema.safeParse({
        status: 'declined',
        message: 'a'.repeat(1001),
      });
      expect(result.success).toBe(false);
    });

    it('should accept message of exactly 1000 characters', () => {
      const result = updateInviteStatusSchema.safeParse({
        status: 'declined',
        message: 'a'.repeat(1000),
      });
      expect(result.success).toBe(true);
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

    it('should coerce string page to number', () => {
      const result = listInvitesQuerySchema.safeParse({ page: '5' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
      }
    });

    it('should validate all deal types', () => {
      const types = ['preferred_deal', 'private_marketplace', 'programmatic_guaranteed'];
      for (const dealType of types) {
        const result = listInvitesQuerySchema.safeParse({ dealType });
        expect(result.success).toBe(true);
      }
    });

    it('should validate all statuses', () => {
      const statuses = ['pending', 'accepted', 'declined', 'expired'];
      for (const status of statuses) {
        const result = listInvitesQuerySchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it('should reject page less than 1', () => {
      const result = listInvitesQuerySchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject negative page', () => {
      const result = listInvitesQuerySchema.safeParse({ page: -1 });
      expect(result.success).toBe(false);
    });

    it('should reject limit less than 1', () => {
      const result = listInvitesQuerySchema.safeParse({ limit: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject limit greater than 100', () => {
      const result = listInvitesQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it('should accept limit of 100', () => {
      const result = listInvitesQuerySchema.safeParse({ limit: 100 });
      expect(result.success).toBe(true);
    });
  });

  describe('Invite ID Parameter Schema', () => {
    const inviteIdParamSchema = z.object({
      id: z.string().min(1, 'Invite ID is required'),
    });

    it('should validate valid invite ID', () => {
      const result = inviteIdParamSchema.safeParse({ id: 'PMP-ABC12345-XYZ789' });
      expect(result.success).toBe(true);
    });

    it('should reject empty ID', () => {
      const result = inviteIdParamSchema.safeParse({ id: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing ID', () => {
      const result = inviteIdParamSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});