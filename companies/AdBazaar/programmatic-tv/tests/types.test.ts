import {
  CTVBidRequest,
  PrivateDeal,
  BidderSeat,
  FloorPriceRule,
  DealType,
  DealStatus,
  CTVDeviceCategory,
  AuctionType,
} from '../src/types/index';

describe('OpenRTB Types', () => {
  describe('CTVBidRequest', () => {
    it('should create a valid CTV bid request', () => {
      const request: CTVBidRequest = {
        id: 'test-request-123',
        at: AuctionType.SECOND_PRICE,
        tmax: 2000,
        imp: [
          {
            id: 'imp-1',
            bidfloor: 1.5,
            bidfloorcur: 'USD',
            video: {
              mimes: ['video/mp4', 'video/webm'],
              minduration: 5,
              maxduration: 60,
              linearity: 1,
              skip: 1,
              skipmin: 5,
              ctv: {
                deviceCategory: CTVDeviceCategory.SMART_TV,
                appBundle: 'com.example.app',
                isLivingRoom: true,
              },
            },
          },
        ],
        device: {
          devicetype: 3,
          make: 'Samsung',
          model: 'Smart TV',
          os: 'Tizen',
          connectiontype: 1,
          geo: {
            country: 'US',
            region: 'CA',
            city: 'Los Angeles',
          },
        },
        app: {
          id: 'app-123',
          name: 'Test App',
          bundle: 'com.example.app',
        },
        user: {
          id: 'user-123',
          yob: 1990,
          gender: 'M',
        },
      };

      expect(request.id).toBe('test-request-123');
      expect(request.at).toBe(AuctionType.SECOND_PRICE);
      expect(request.imp).toHaveLength(1);
      expect(request.imp[0].video?.ctv?.deviceCategory).toBe(CTVDeviceCategory.SMART_TV);
    });

    it('should support PMP deals', () => {
      const request: CTVBidRequest = {
        id: 'pmp-request',
        at: AuctionType.SECOND_PRICE,
        imp: [
          {
            id: 'imp-1',
            pmp: {
              private_auction: 1,
              deals: [
                {
                  id: 'deal-123',
                  bidfloor: 2.0,
                  bidfloorcur: 'USD',
                },
              ],
            },
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

      expect(request.imp[0].pmp?.deals).toHaveLength(1);
      expect(request.imp[0].pmp?.deals[0].id).toBe('deal-123');
    });
  });

  describe('PrivateDeal', () => {
    it('should create a valid private deal', () => {
      const deal: Omit<PrivateDeal, 'dealId' | 'createdAt' | 'updatedAt'> = {
        name: 'Premium CTV Deal',
        advertiserId: 'adv-123',
        publisherId: 'pub-456',
        type: DealType.PROGRAMMATIC_GUARANTEED,
        floorPrice: 5.0,
        priceCurrency: 'USD',
        targeting: {
          geo: ['US', 'CA'],
          deviceTypes: [CTVDeviceCategory.SMART_TV],
          contentCategories: ['IAB1'],
        },
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: DealStatus.ACTIVE,
        createdBy: 'admin',
      };

      expect(deal.name).toBe('Premium CTV Deal');
      expect(deal.type).toBe(DealType.PROGRAMMATIC_GUARANTEED);
      expect(deal.targeting.geo).toContain('US');
    });

    it('should support all deal types', () => {
      const types = [
        DealType.PROGRAMMATIC_GUARANTEED,
        DealType.PREFERRED_DEAL,
        DealType.PRIVATE_MARKETPLACE,
      ];

      types.forEach((type) => {
        const deal: Partial<PrivateDeal> = {
          type,
        };
        expect(deal.type).toBeDefined();
      });
    });
  });

  describe('BidderSeat', () => {
    it('should create a valid bidder seat', () => {
      const seat: Omit<BidderSeat, 'seatId' | 'createdAt' | 'updatedAt'> = {
        name: 'Test Seat',
        advertiserId: 'adv-123',
        contactEmail: 'test@example.com',
        status: 'active',
        allowedFormats: ['video', 'display'],
        allowedCategories: ['IAB1', 'IAB2'],
        sspConnections: ['ssp-1', 'ssp-2'],
      };

      expect(seat.name).toBe('Test Seat');
      expect(seat.status).toBe('active');
      expect(seat.allowedFormats).toContain('video');
    });
  });

  describe('FloorPriceRule', () => {
    it('should create a valid floor price rule', () => {
      const rule: Omit<FloorPriceRule, 'ruleId' | 'createdAt' | 'updatedAt'> = {
        name: 'US Smart TV Floor',
        priority: 10,
        conditions: {
          geo: ['US'],
          deviceTypes: [CTVDeviceCategory.SMART_TV],
          contentCategories: ['IAB1'],
        },
        floorPrice: 3.0,
        currency: 'USD',
        status: 'active',
        createdBy: 'admin',
      };

      expect(rule.name).toBe('US Smart TV Floor');
      expect(rule.priority).toBe(10);
      expect(rule.conditions.geo).toContain('US');
    });
  });
});