import {
  CTVBidRequestSchema,
  CreateDealSchema,
  CreateSeatSchema,
  CreateFloorRuleSchema,
  PaginationSchema,
} from '../src/middleware/validation';
import { AuctionType, DealType, CTVDeviceCategory } from '../src/types/index';

describe('Validation Schemas', () => {
  describe('CTVBidRequestSchema', () => {
    it('should validate a valid bid request', () => {
      const validRequest = {
        id: 'req-123',
        at: AuctionType.SECOND_PRICE,
        imp: [
          {
            id: 'imp-1',
            video: {
              mimes: ['video/mp4'],
              minduration: 5,
              maxduration: 30,
              linearity: 1,
            },
          },
        ],
        app: {
          id: 'app-123',
        },
      };

      const result = CTVBidRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject request without id', () => {
      const invalidRequest = {
        at: AuctionType.SECOND_PRICE,
        imp: [
          {
            id: 'imp-1',
            video: {
              mimes: ['video/mp4'],
              minduration: 5,
              maxduration: 30,
              linearity: 1,
            },
          },
        ],
        app: {
          id: 'app-123',
        },
      };

      const result = CTVBidRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject request without app or site', () => {
      const invalidRequest = {
        id: 'req-123',
        at: AuctionType.SECOND_PRICE,
        imp: [
          {
            id: 'imp-1',
            video: {
              mimes: ['video/mp4'],
              minduration: 5,
              maxduration: 30,
              linearity: 1,
            },
          },
        ],
      };

      const result = CTVBidRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should validate CTV extensions', () => {
      const requestWithCTV = {
        id: 'req-123',
        at: AuctionType.SECOND_PRICE,
        imp: [
          {
            id: 'imp-1',
            video: {
              mimes: ['video/mp4'],
              minduration: 5,
              maxduration: 30,
              linearity: 1,
              ctv: {
                deviceCategory: CTVDeviceCategory.SMART_TV,
                appBundle: 'com.example',
                isLivingRoom: true,
              },
            },
          },
        ],
        app: {
          id: 'app-123',
        },
      };

      const result = CTVBidRequestSchema.safeParse(requestWithCTV);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.imp[0].video?.ctv?.deviceCategory).toBe(CTVDeviceCategory.SMART_TV);
      }
    });
  });

  describe('CreateDealSchema', () => {
    it('should validate a valid deal', () => {
      const validDeal = {
        name: 'Test Deal',
        advertiserId: 'adv-123',
        publisherId: 'pub-456',
        type: DealType.PROGRAMMATIC_GUARANTEED,
        floorPrice: 5.0,
        priceCurrency: 'USD',
        startDate: new Date('2024-01-01').toISOString(),
        endDate: new Date('2024-12-31').toISOString(),
      };

      const result = CreateDealSchema.safeParse(validDeal);
      expect(result.success).toBe(true);
    });

    it('should reject endDate before startDate', () => {
      const invalidDeal = {
        name: 'Test Deal',
        advertiserId: 'adv-123',
        publisherId: 'pub-456',
        type: DealType.PROGRAMMATIC_GUARANTEED,
        floorPrice: 5.0,
        startDate: new Date('2024-12-31').toISOString(),
        endDate: new Date('2024-01-01').toISOString(),
      };

      const result = CreateDealSchema.safeParse(invalidDeal);
      expect(result.success).toBe(false);
    });

    it('should reject negative floor price', () => {
      const invalidDeal = {
        name: 'Test Deal',
        advertiserId: 'adv-123',
        publisherId: 'pub-456',
        type: DealType.PROGRAMMATIC_GUARANTEED,
        floorPrice: -1.0,
        startDate: new Date('2024-01-01').toISOString(),
        endDate: new Date('2024-12-31').toISOString(),
      };

      const result = CreateDealSchema.safeParse(invalidDeal);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateSeatSchema', () => {
    it('should validate a valid seat', () => {
      const validSeat = {
        name: 'Test Seat',
        advertiserId: 'adv-123',
        contactEmail: 'test@example.com',
      };

      const result = CreateSeatSchema.safeParse(validSeat);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidSeat = {
        name: 'Test Seat',
        advertiserId: 'adv-123',
        contactEmail: 'not-an-email',
      };

      const result = CreateSeatSchema.safeParse(invalidSeat);
      expect(result.success).toBe(false);
    });
  });

  describe('PaginationSchema', () => {
    it('should apply default values', () => {
      const result = PaginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sortOrder).toBe('desc');
    });

    it('should parse string values to numbers', () => {
      const result = PaginationSchema.parse({
        page: '2',
        limit: '50',
      });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it('should reject invalid page number', () => {
      const result = PaginationSchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('should cap limit at 100', () => {
      const result = PaginationSchema.safeParse({ limit: 200 });
      expect(result.success).toBe(false);
    });
  });
});