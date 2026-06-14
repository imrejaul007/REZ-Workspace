/**
 * Banner Service Unit Tests
 */

import { BannerGenerationRequest } from '../src/types';

// Mock the dependencies
jest.mock('../src/models', () => ({
  BannerGenerationModel: {
    findOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../src/services/redis.service', () => ({
  redisService: {
    cacheGeneration: jest.fn().mockResolvedValue(true),
    getCachedGeneration: jest.fn().mockResolvedValue(null),
    invalidateGenerationCache: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../src/config', () => ({
  default: {
    PORT: 4840,
    NODE_ENV: 'test',
    MONGODB_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    REDIS_ENABLED: false,
    JWT_SECRET: 'test-secret',
    JWT_EXPIRES_IN: '24h',
    OPENAI_API_KEY: '',
    OPENAI_ENABLED: false,
    IMAGE_CDN_URL: 'https://cdn.adbazaar.com',
    IMAGE_CDN_UPLOAD_PATH: '/banners',
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX_REQUESTS: 100,
    MAX_GENERATION_TIME_MS: 60000,
    DEFAULT_FORMAT: 'static',
    DEFAULT_STYLE: 'modern',
    BANNER_SIZES: {
      leaderboard: { width: 728, height: 90 },
      mediumRectangle: { width: 300, height: 250 },
    },
    ALLOWED_ORIGINS: ['https://rez.money'],
    LOG_LEVEL: 'error',
  },
}));

jest.mock('uuid', () => ({
  v4: () => 'test-uuid-1234-5678',
}));

import { bannerGenerationService } from '../src/services/banner.service';
import { BannerGenerationModel } from '../src/models';

describe('BannerGenerationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateBanner', () => {
    it('should create a new banner generation', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockGeneration = {
        generationId: 'gen-test-uuid-1234',
        advertiserId: 'adv-123',
        request: {
          description: 'Test banner',
          dimensions: { width: 728, height: 90 },
          format: 'static',
        },
        status: 'processing',
        createdAt: new Date(),
        save: mockSave,
      };

      (BannerGenerationModel as unknown as jest.Mock).mockImplementation(() => mockGeneration);
      (BannerGenerationModel.findOneAndUpdate as jest.Mock).mockResolvedValue(mockGeneration);

      const request: BannerGenerationRequest = {
        description: 'Test banner',
        dimensions: { width: 728, height: 90 },
        format: 'static',
      };

      const result = await bannerGenerationService.generateBanner('adv-123', request);

      expect(result).toBeDefined();
      expect(result.advertiserId).toBe('adv-123');
      expect(result.request.description).toBe('Test banner');
    });
  });

  describe('getGeneration', () => {
    it('should return null for non-existent generation', async () => {
      (BannerGenerationModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await bannerGenerationService.getGeneration('non-existent');

      expect(result).toBeNull();
    });

    it('should return generation from database', async () => {
      const mockGeneration = {
        generationId: 'gen-123',
        advertiserId: 'adv-123',
        request: {
          description: 'Test',
          dimensions: { width: 728, height: 90 },
          format: 'static',
        },
        status: 'completed',
        output: {
          imageUrl: 'https://cdn.adbazaar.com/banners/gen-123.png',
          thumbnailUrl: 'https://cdn.adbazaar.com/banners/gen-123_thumb.jpg',
          format: 'png',
          size: 50000,
          dimensions: { width: 728, height: 90 },
        },
        metadata: {
          generationTime: 1500,
          model: 'gpt-image-v2',
          confidence: 0.92,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (BannerGenerationModel.findOne as jest.Mock).mockResolvedValue(mockGeneration);

      const result = await bannerGenerationService.getGeneration('gen-123');

      expect(result).toBeDefined();
      expect(result?.generationId).toBe('gen-123');
      expect(result?.status).toBe('completed');
    });
  });

  describe('getGenerationsByAdvertiser', () => {
    it('should return paginated generations', async () => {
      const mockGenerations = [
        {
          generationId: 'gen-1',
          advertiserId: 'adv-123',
          request: { description: 'Test 1', dimensions: { width: 728, height: 90 }, format: 'static' },
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          generationId: 'gen-2',
          advertiserId: 'adv-123',
          request: { description: 'Test 2', dimensions: { width: 300, height: 250 }, format: 'static' },
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (BannerGenerationModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockGenerations),
      });
      (BannerGenerationModel.countDocuments as jest.Mock).mockResolvedValue(2);

      const result = await bannerGenerationService.getGenerationsByAdvertiser('adv-123', {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('getStatistics', () => {
    it('should return generation statistics', async () => {
      (BannerGenerationModel.aggregate as jest.Mock).mockResolvedValue([
        { _id: 'completed', count: 10, avgTime: 1500 },
        { _id: 'failed', count: 2, avgTime: null },
        { _id: 'processing', count: 1, avgTime: null },
      ]);

      const result = await bannerGenerationService.getStatistics('adv-123');

      expect(result.total).toBe(13);
      expect(result.completed).toBe(10);
      expect(result.failed).toBe(2);
      expect(result.processing).toBe(1);
      expect(result.avgGenerationTime).toBe(1500);
    });
  });

  describe('predictPerformance', () => {
    it('should predict performance for completed generation', async () => {
      const mockGeneration = {
        generationId: 'gen-123',
        advertiserId: 'adv-123',
        request: {
          description: 'Test',
          dimensions: { width: 728, height: 90 },
          format: 'static',
          style: 'modern',
        },
        status: 'completed',
        metadata: {
          generationTime: 1500,
          model: 'gpt-image-v2',
          confidence: 0.92,
        },
 createdAt: new Date(),
        updatedAt: new Date(),
      };

      (BannerGenerationModel.findOne as jest.Mock).mockResolvedValue(mockGeneration);

      const result = await bannerGenerationService.predictPerformance('gen-123');

      expect(result).toBeDefined();
      expect(result.predictedCTR).toBeGreaterThan(0);
      expect(result.predictedConversion).toBeGreaterThan(0);
      expect(result.confidence).toBe(0.92);
    });

    it('should throw error for non-completed generation', async () => {
      const mockGeneration = {
        generationId: 'gen-123',
        status: 'processing',
      };

      (BannerGenerationModel.findOne as jest.Mock).mockResolvedValue(mockGeneration);

      await expect(bannerGenerationService.predictPerformance('gen-123')).rejects.toThrow(
        'Generation not found or not completed'
      );
    });
  });
});
