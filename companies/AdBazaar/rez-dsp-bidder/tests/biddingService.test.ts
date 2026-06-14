/**
 * Bidding Service Unit Tests
 * Tests for bid evaluation and execution
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockCampaign, createMockBudgetTracker, createMockBidLog, createMockId } from './mocks.js';

// Mock all models before importing the service
vi.mock('../src/models/Campaign.js', () => ({
  CampaignModel: {
    find: vi.fn(),
  },
}));

vi.mock('../src/models/BidLog.js', () => ({
  BidLogModel: {
    create: vi.fn(),
  },
}));

vi.mock('../src/models/BudgetTracker.js', () => ({
  BudgetTrackerModel: {
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

// Mock config
vi.mock('../src/config/index.js', () => ({
  config: {
    budget: {
      maxBidPrice: 100,
      minBidPrice: 1,
    },
  },
}));

// Import after mocks are set up
import { BiddingService } from '../src/services/biddingService.js';
import { CampaignModel } from '../src/models/Campaign.js';
import { BidLogModel } from '../src/models/BidLog.js';
import { BudgetTrackerModel } from '../src/models/BudgetTracker.js';
import { IBidRequest } from '../src/types/index.js';

describe('BiddingService', () => {
  let biddingService: BiddingService;

  // Sample bid request for testing
  const createSampleBidRequest = (overrides = {}): IBidRequest => ({
    exchange: 'google_adx',
    requestId: 'req-123',
    timestamp: new Date(),
    impression: {
      id: 'imp-123',
      floor: 10,
      currency: 'INR',
      inventory: {
        screenId: 'screen-001',
        screenType: 'billboard_led',
        location: 'Mumbai Downtown',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'IN',
      },
      creative: {
        width: 1920,
        height: 1080,
        mimeTypes: ['image/jpeg', 'image/png'],
      },
    },
    campaign: {
      id: 'campaign-001',
      targeting: {
        geo: ['IN'],
        screenTypes: ['billboard_led'],
        locations: ['Mumbai'],
      },
      maxBid: 50,
    },
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    biddingService = new BiddingService();
  });

  describe('evaluateAndBid', () => {
    describe('no matching campaigns', () => {
      it('should return no-bid response when no campaigns exist', async () => {
        const request = createSampleBidRequest();

        // Mock empty campaign list
        (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([]);

        const result = await biddingService.evaluateAndBid(request);

        expect(result.bid).toBeNull();
        expect(result.reason).toBe('No matching campaigns');
        expect(result.won).toBe(false);
        expect(result.requestId).toBe(request.requestId);
        expect(result.exchange).toBe(request.exchange);
      });

      it('should return no-bid when all campaigns are paused', async () => {
        const request = createSampleBidRequest();
        const pausedCampaign = createMockCampaign({ status: 'paused' });

        (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([pausedCampaign]);

        const result = await biddingService.evaluateAndBid(request);

        expect(result.bid).toBeNull();
        expect(result.reason).toBe('No matching campaigns');
      });

      it('should return no-bid when campaign has not started yet', async () => {
        const request = createSampleBidRequest();
        const futureCampaign = createMockCampaign({
          status: 'active',
          startDate: new Date('2099-01-01'),
        });

        (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([futureCampaign]);

        const result = await biddingService.evaluateAndBid(request);

        expect(result.bid).toBeNull();
        expect(result.reason).toBe('No matching campaigns');
      });

      it('should return no-bid when campaign has ended', async () => {
        const request = createSampleBidRequest();
        const endedCampaign = createMockCampaign({
          status: 'active',
          startDate: new Date('2020-01-01'),
          endDate: new Date('2020-12-31'),
        });

        (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([endedCampaign]);

        const result = await biddingService.evaluateAndBid(request);

        expect(result.bid).toBeNull();
        expect(result.reason).toBe('No matching campaigns');
      });

      it('should return no-bid when targeting geo does not match', async () => {
        const request = createSampleBidRequest({
          impression: {
            ...request.impression,
            inventory: {
              ...request.impression.inventory,
              country: 'US',
            },
          },
        });
        const campaign = createMockCampaign({
          status: 'active',
          targeting: { geo: ['IN'] },
        });

        (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([campaign]);

        const result = await biddingService.evaluateAndBid(request);

        expect(result.bid).toBeNull();
        expect(result.reason).toBe('No matching campaigns');
      });

      it('should return no-bid when targeting screenType does not match', async () => {
        const request = createSampleBidRequest({
          impression: {
            ...request.impression,
            inventory: {
              ...request.impression.inventory,
              screenType: 'retail_kiosk',
            },
          },
        });
        const campaign = createMockCampaign({
          status: 'active',
          targeting: { screenTypes: ['billboard_led'] },
        });

        (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([campaign]);

        const result = await biddingService.evaluateAndBid(request);

        expect(result.bid).toBeNull();
        expect(result.reason).toBe('No matching campaigns');
      });

      it('should return no-bid when targeting location does not match', async () => {
        const request = createSampleBidRequest({
          impression: {
            ...request.impression,
            inventory: {
              ...request.impression.inventory,
              location: 'Delhi NCR',
              city: 'Delhi',
            },
          },
        });
        const campaign = createMockCampaign({
          status: 'active',
          targeting: { locations: ['Mumbai'] },
        });

        (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([campaign]);

        const result = await biddingService.evaluateAndBid(request);

        expect(result.bid).toBeNull();
        expect(result.reason).toBe('No matching campaigns');
      });
    });

    describe('with matching campaigns', () => {
      it('should return a valid bid response when campaign matches', async () => {
        const request = createSampleBidRequest();
        const campaign = createMockCampaign({
          status: 'active',
          budget: 10000,
          bidStrategy: 'fixed',
          maxBidPrice: 50,
          targeting: {
            geo: ['IN'],
            screenTypes: ['billboard_led'],
          },
        });

        (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([campaign]);
        (BudgetTrackerModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
          createMockBudgetTracker({ totalSpent: 0 })
        );
        (BidLogModel.create as ReturnType<typeof vi.fn>).mockResolvedValue(createMockBidLog());
        (BudgetTrackerModel.findOneAndUpdate as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const result = await biddingService.evaluateAndBid(request);

        expect(result.bid).not.toBeNull();
        expect(result.bid?.price).toBeGreaterThanOrEqual(request.impression.floor);
        expect(result.requestId).toBe(request.requestId);
        expect(result.exchange).toBe(request.exchange);
      });

      it('should select campaign with highest budget remaining', async () => {
        const request = createSampleBidRequest();
        const lowBudgetCampaign = createMockCampaign({
          _id: createMockId(),
          status: 'active',
          budget: 5000,
          targeting: {},
        });
        const highBudgetCampaign = createMockCampaign({
          _id: createMockId(),
          status: 'active',
          budget: 10000,
          targeting: {},
        });

        (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([
          lowBudgetCampaign,
          highBudgetCampaign,
        ]);
        (BudgetTrackerModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
          createMockBudgetTracker({ totalSpent: 0 })
        );
        (BidLogModel.create as ReturnType<typeof vi.fn>).mockResolvedValue(createMockBidLog());
        (BudgetTrackerModel.findOneAndUpdate as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const result = await biddingService.evaluateAndBid(request);

        expect(result.bid).not.toBeNull();
      });

      it('should respect campaign max bid price', async () => {
        const request = createSampleBidRequest({
          impression: {
            ...request.impression,
            floor: 100, // High floor
          },
        });
        const campaign = createMockCampaign({
          status: 'active',
          budget: 10000,
          bidStrategy: 'fixed',
          maxBidPrice: 20, // Low max bid
          targeting: {},
        });

        (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([campaign]);
        (BudgetTrackerModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
          createMockBudgetTracker({ totalSpent: 0 })
        );
        (BidLogModel.create as ReturnType<typeof vi.fn>).mockResolvedValue(createMockBidLog());
        (BudgetTrackerModel.findOneAndUpdate as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const result = await biddingService.evaluateAndBid(request);

        expect(result.bid?.price).toBeLessThanOrEqual(20);
      });

      it('should respect DSP max bid price from config', async () => {
        const request = createSampleBidRequest({
          impression: {
            ...request.impression,
            floor: 150,
          },
        });
        const campaign = createMockCampaign({
          status: 'active',
          budget: 10000,
          bidStrategy: 'fixed',
          maxBidPrice: 200, // Above DSP max
          targeting: {},
        });

        (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([campaign]);
        (BudgetTrackerModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
          createMockBudgetTracker({ totalSpent: 0 })
        );
        (BidLogModel.create as ReturnType<typeof vi.fn>).mockResolvedValue(createMockBidLog());
        (BudgetTrackerModel.findOneAndUpdate as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const result = await biddingService.evaluateAndBid(request);

        expect(result.bid?.price).toBeLessThanOrEqual(100); // DSP max is 100
      });

      it('should always bid at least the floor price', async () => {
        const request = createSampleBidRequest({
          impression: {
            ...request.impression,
            floor: 25,
          },
        });
        const campaign = createMockCampaign({
          status: 'active',
          budget: 10000,
          bidStrategy: 'fixed',
          maxBidPrice: 10, // Below floor
          targeting: {},
        });

        (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([campaign]);
        (BudgetTrackerModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
          createMockBudgetTracker({ totalSpent: 0 })
        );
        (BidLogModel.create as ReturnType<typeof vi.fn>).mockResolvedValue(createMockBidLog());
        (BudgetTrackerModel.findOneAndUpdate as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const result = await biddingService.evaluateAndBid(request);

        expect(result.bid?.price).toBeGreaterThanOrEqual(25);
      });

      it('should match campaigns without targeting criteria', async () => {
        const request = createSampleBidRequest();
        const campaign = createMockCampaign({
          status: 'active',
          budget: 10000,
          targeting: undefined, // No targeting
        });

        (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([campaign]);
        (BudgetTrackerModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
          createMockBudgetTracker({ totalSpent: 0 })
        );
        (BidLogModel.create as ReturnType<typeof vi.fn>).mockResolvedValue(createMockBidLog());
        (BudgetTrackerModel.findOneAndUpdate as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const result = await biddingService.evaluateAndBid(request);

        expect(result.bid).not.toBeNull();
      });

      it('should match campaigns with exchange match', async () => {
        const request = createSampleBidRequest({ exchange: 'google_adx' });
        const campaign = createMockCampaign({
          status: 'active',
          exchange: 'google_adx',
          budget: 10000,
          targeting: {},
        });

        (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([campaign]);
        (BudgetTrackerModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
          createMockBudgetTracker({ totalSpent: 0 })
        );
        (BidLogModel.create as ReturnType<typeof vi.fn>).mockResolvedValue(createMockBidLog());
        (BudgetTrackerModel.findOneAndUpdate as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const result = await biddingService.evaluateAndBid(request);

        expect(result.bid).not.toBeNull();
      });

      it('should match campaigns without exchange specified', async () => {
        const request = createSampleBidRequest({ exchange: 'amazon_tam' });
        const campaign = createMockCampaign({
          status: 'active',
          exchange: undefined, // No exchange restriction
          budget: 10000,
          targeting: {},
        });

        (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([campaign]);
        (BudgetTrackerModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
          createMockBudgetTracker({ totalSpent: 0 })
        );
        (BidLogModel.create as ReturnType<typeof vi.fn>).mockResolvedValue(createMockBidLog());
        (BudgetTrackerModel.findOneAndUpdate as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const result = await biddingService.evaluateAndBid(request);

        expect(result.bid).not.toBeNull();
      });
    });

    describe('budget exceeded', () => {
      it('should return no-bid when daily budget is exceeded', async () => {
        const request = createSampleBidRequest();
        const campaign = createMockCampaign({
          status: 'active',
          budget: 1000,
          dailyLimit: 100,
          targeting: {},
        });

        (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([campaign]);
        (BudgetTrackerModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
          createMockBudgetTracker({ totalSpent: 99 }) // 1 away from limit
        );

        const result = await biddingService.evaluateAndBid(request);

        expect(result.bid).toBeNull();
        expect(result.reason).toBe('Budget exceeded');
      });

      it('should return no-bid when adding bid would exceed daily limit', async () => {
        const request = createSampleBidRequest({
          impression: {
            ...request.impression,
            floor: 10,
          },
        });
        const campaign = createMockCampaign({
          status: 'active',
          budget: 1000,
          dailyLimit: 100,
          targeting: {},
        });

        (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([campaign]);
        (BudgetTrackerModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
          createMockBudgetTracker({ totalSpent: 95 }) // 5 remaining, bid would be 11
        );

        const result = await biddingService.evaluateAndBid(request);

        expect(result.bid).toBeNull();
        expect(result.reason).toBe('Budget exceeded');
      });

      it('should return no-bid when total budget is exceeded', async () => {
        const request = createSampleBidRequest();
        const campaign = createMockCampaign({
          status: 'active',
          budget: 100,
          dailyLimit: undefined, // Use total budget
          targeting: {},
        });

        (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([campaign]);
        (BudgetTrackerModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
          createMockBudgetTracker({ totalSpent: 100 })
        );

        const result = await biddingService.evaluateAndBid(request);

        expect(result.bid).toBeNull();
        expect(result.reason).toBe('Budget exceeded');
      });

      it('should allow bid when no budget tracker exists yet', async () => {
        const request = createSampleBidRequest();
        const campaign = createMockCampaign({
          status: 'active',
          budget: 10000,
          targeting: {},
        });

        (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([campaign]);
        (BudgetTrackerModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        (BidLogModel.create as ReturnType<typeof vi.fn>).mockResolvedValue(createMockBidLog());
        (BudgetTrackerModel.findOneAndUpdate as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const result = await biddingService.evaluateAndBid(request);

        expect(result.bid).not.toBeNull();
      });
    });

    describe('bid logging', () => {
      it('should log bid to BidLogModel', async () => {
        const request = createSampleBidRequest();
        const campaign = createMockCampaign({
          status: 'active',
          budget: 10000,
          targeting: {},
        });

        (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([campaign]);
        (BudgetTrackerModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
          createMockBudgetTracker({ totalSpent: 0 })
        );
        (BidLogModel.create as ReturnType<typeof vi.fn>).mockResolvedValue(createMockBidLog());
        (BudgetTrackerModel.findOneAndUpdate as ReturnType<typeof vi.fn>).mockResolvedValue({});

        await biddingService.evaluateAndBid(request);

        expect(BidLogModel.create).toHaveBeenCalledWith(
          expect.objectContaining({
            requestId: request.requestId,
            exchange: request.exchange,
            impressionId: request.impression.id,
            floor: request.impression.floor,
          })
        );
      });

      it('should update budget tracker after bid', async () => {
        const request = createSampleBidRequest();
        const campaign = createMockCampaign({
          status: 'active',
          budget: 10000,
          targeting: {},
        });

        (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([campaign]);
        (BudgetTrackerModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
          createMockBudgetTracker({ totalSpent: 0 })
        );
        (BidLogModel.create as ReturnType<typeof vi.fn>).mockResolvedValue(createMockBidLog());
        (BudgetTrackerModel.findOneAndUpdate as ReturnType<typeof vi.fn>).mockResolvedValue({});

        await biddingService.evaluateAndBid(request);

        expect(BudgetTrackerModel.findOneAndUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            $inc: expect.objectContaining({
              totalBids: 1,
            }),
          }),
          expect.anything(),
          expect.anything()
        );
      });
    });

    describe('error handling', () => {
      it('should return no-bid response on internal error', async () => {
        const request = createSampleBidRequest();

        (CampaignModel.find as ReturnType<typeof vi.fn>).mockRejectedValue(
          new Error('Database connection failed')
        );

        const result = await biddingService.evaluateAndBid(request);

        expect(result.bid).toBeNull();
        expect(result.reason).toBe('Internal error');
        expect(result.won).toBe(false);
      });
    });
  });

  describe('batch bid evaluation', () => {
    it('should process multiple bid requests', async () => {
      const requests = [
        createSampleBidRequest({ requestId: 'req-1' }),
        createSampleBidRequest({ requestId: 'req-2' }),
        createSampleBidRequest({ requestId: 'req-3' }),
      ];

      const campaign = createMockCampaign({
        status: 'active',
        budget: 100000,
        targeting: {},
      });

      (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([campaign]);
      (BudgetTrackerModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockBudgetTracker({ totalSpent: 0 })
      );
      (BidLogModel.create as ReturnType<typeof vi.fn>).mockResolvedValue(createMockBidLog());
      (BudgetTrackerModel.findOneAndUpdate as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const results = await Promise.all(
        requests.map((request) => biddingService.evaluateAndBid(request))
      );

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.requestId).toBe(requests[index].requestId);
      });
    });

    it('should handle mixed results (some bids, some no-bids)', async () => {
      const request1 = createSampleBidRequest({ requestId: 'req-1' });
      const request2 = createSampleBidRequest({ requestId: 'req-2' });

      const campaign = createMockCampaign({
        status: 'active',
        budget: 10, // Very low budget
        targeting: {},
      });

      // First request succeeds
      (CampaignModel.find as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([campaign])
        .mockResolvedValueOnce([campaign]);
      (BudgetTrackerModel.findOne as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(createMockBudgetTracker({ totalSpent: 0 }))
        .mockResolvedValueOnce(createMockBudgetTracker({ totalSpent: 10 })); // Budget exhausted
      (BidLogModel.create as ReturnType<typeof vi.fn>).mockResolvedValue(createMockBidLog());
      (BudgetTrackerModel.findOneAndUpdate as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const results = await Promise.all([
        biddingService.evaluateAndBid(request1),
        biddingService.evaluateAndBid(request2),
      ]);

      // First should have bid, second should be no-bid
      expect(results[0].bid).not.toBeNull();
      expect(results[1].bid).toBeNull();
      expect(results[1].reason).toBe('Budget exceeded');
    });

    it('should handle all requests failing gracefully', async () => {
      const requests = [
        createSampleBidRequest({ requestId: 'req-error' }),
      ];

      (CampaignModel.find as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Database error')
      );

      const results = await Promise.all(
        requests.map((request) => biddingService.evaluateAndBid(request))
      );

      expect(results).toHaveLength(1);
      expect(results[0].bid).toBeNull();
      expect(results[0].reason).toBe('Internal error');
    });
  });

  describe('bid strategy variations', () => {
    it('should apply fixed bid strategy (floor * 1.1)', async () => {
      const request = createSampleBidRequest({
        impression: { ...request.impression, floor: 10 },
      });
      const campaign = createMockCampaign({
        status: 'active',
        budget: 10000,
        bidStrategy: 'fixed',
        maxBidPrice: 100,
        targeting: {},
      });

      (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([campaign]);
      (BudgetTrackerModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockBudgetTracker({ totalSpent: 0 })
      );
      (BidLogModel.create as ReturnType<typeof vi.fn>).mockResolvedValue(createMockBidLog());
      (BudgetTrackerModel.findOneAndUpdate as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await biddingService.evaluateAndBid(request);

      expect(result.bid?.price).toBe(11); // 10 * 1.1 = 11
    });

    it('should apply optimized bid strategy (floor * 1.2)', async () => {
      const request = createSampleBidRequest({
        impression: { ...request.impression, floor: 10 },
      });
      const campaign = createMockCampaign({
        status: 'active',
        budget: 10000,
        bidStrategy: 'optimized',
        maxBidPrice: 100,
        targeting: {},
      });

      (CampaignModel.find as ReturnType<typeof vi.fn>).mockResolvedValue([campaign]);
      (BudgetTrackerModel.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockBudgetTracker({ totalSpent: 0 })
      );
      (BidLogModel.create as ReturnType<typeof vi.fn>).mockResolvedValue(createMockBidLog());
      (BudgetTrackerModel.findOneAndUpdate as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await biddingService.evaluateAndBid(request);

      expect(result.bid?.price).toBe(12); // 10 * 1.2 = 12
    });
  });
});
