/** Social Competitor Tracker - Service Tests */
import { CompetitorService } from '../services/competitor.service';
import { InsightService } from '../services/insight.service';

jest.mock('../models', () => ({
  Competitor: { find: jest.fn(), findById: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn(), findOneAndUpdate: jest.fn() },
  CompetitorPost: { find: jest.fn(), create: jest.fn(), countDocuments: jest.fn(), aggregate: jest.fn() },
  Benchmark: { find: jest.fn(), create: jest.fn() },
  CompetitorSnapshot: { create: jest.fn() },
}));

describe('CompetitorService', () => {
  let service: CompetitorService;
  beforeEach(() => { jest.clearAllMocks(); service = new CompetitorService(); });

  describe('addCompetitor', () => {
    it('should add new competitor', async () => {
      const Competitor = require('../models').Competitor;
      Competitor.create.mockResolvedValue(createMockCompetitor());
      const result = await service.addCompetitor({ name: 'Competitor A', platforms: ['instagram', 'twitter'], handle: '@competitor' });
      expect(result.name).toBe('Competitor A');
    });
  });

  describe('getCompetitors', () => {
    it('should return all competitors', async () => {
      const Competitor = require('../models').Competitor;
      Competitor.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([createMockCompetitor(), createMockCompetitor({ name: 'Competitor B' })]) });
      const result = await service.getCompetitors();
      expect(result).toHaveLength(2);
    });
  });

  describe('trackCompetitor', () => {
    it('should track competitor data', async () => {
      const Competitor = require('../models').Competitor;
      Competitor.findById.mockResolvedValue(createMockCompetitor());
      const CompetitorSnapshot = require('../models').CompetitorSnapshot;
      CompetitorSnapshot.create.mockResolvedValue({});
      const result = await service.trackCompetitor('comp-123');
      expect(result).toBeDefined();
    });
  });

  describe('getCompetitorPosts', () => {
    it('should return competitor posts', async () => {
      const CompetitorPost = require('../models').CompetitorPost;
      CompetitorPost.find.mockReturnValue({ sort: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue([createMockCompetitorPost()]) });
      const result = await service.getCompetitorPosts('comp-123', { limit: 10 });
      expect(result).toHaveLength(1);
    });
  });
});

describe('InsightService', () => {
  let service: InsightService;
  beforeEach(() => { jest.clearAllMocks(); service = new InsightService(); });

  describe('generateComparison', () => {
    it('should generate comparison report', async () => {
      const result = await service.generateComparison('comp-123');
      expect(result).toBeDefined();
    });
  });

  describe('getCompetitorMetrics', () => {
    it('should return competitor metrics', async () => {
      const CompetitorPost = require('../models').CompetitorPost;
      CompetitorPost.aggregate.mockResolvedValue([{ totalPosts: 100, avgEngagement: 50 }]);
      const result = await service.getCompetitorMetrics('comp-123', 30);
      expect(result).toBeDefined();
    });
  });

  describe('trackEngagementTrend', () => {
    it('should track engagement trends', async () => {
      const CompetitorPost = require('../models').CompetitorPost;
      CompetitorPost.find.mockReturnValue({ sort: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([createMockCompetitorPost()]) });
      const result = await service.trackEngagementTrend('comp-123', 30);
      expect(result).toBeDefined();
    });
  });
});