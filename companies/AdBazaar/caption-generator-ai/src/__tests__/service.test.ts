/**
 * Service Tests for Caption Generator AI
 * Tests business logic for caption generation and optimization
 */

import { CaptionGeneratorService } from '../services/captionGeneratorService';
import { CaptionOptimizerService } from '../services/captionOptimizerService';
import { CaptionAnalyticsService } from '../services/captionAnalyticsService';
import { CaptionTemplate, GeneratedCaption } from '../models';

// Mock dependencies
jest.mock('../models');
jest.mock('../utils/logger');

describe('CaptionGeneratorService', () => {
  let captionGeneratorService: CaptionGeneratorService;

  beforeEach(() => {
    jest.clearAllMocks();
    captionGeneratorService = new CaptionGeneratorService();
  });

  describe('generateCaption', () => {
    it('should generate caption from prompt', async () => {
      const mockCaption = {
        text: 'Check out this amazing sunset! #travel #photography',
        hashtags: ['travel', 'photography'],
        style: 'casual',
        tone: 'enthusiastic',
      };

      (GeneratedCaption as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockCaption),
      }));

      const result = await captionGeneratorService.generateCaption({
        prompt: 'Generate a caption for a sunset photo',
        platform: 'instagram',
        style: 'casual',
      });

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
    });

    it('should generate caption with specific tone', async () => {
      const result = await captionGeneratorService.generateCaption({
        prompt: 'Product launch announcement',
        platform: 'instagram',
        tone: 'professional',
      });

      expect(result).toBeDefined();
    });

    it('should generate caption for different platforms', async () => {
      const platforms = ['instagram', 'twitter', 'facebook', 'linkedin'];

      for (const platform of platforms) {
        const result = await captionGeneratorService.generateCaption({
          prompt: 'Test caption',
          platform,
        });

        expect(result).toBeDefined();
      }
    });
  });

  describe('generateMultipleVariations', () => {
    it('should generate multiple caption variations', async () => {
      const result = await captionGeneratorService.generateMultipleVariations({
        prompt: 'Travel photo caption',
        count: 3,
        platform: 'instagram',
      });

      expect(result).toHaveLength(3);
    });

    it('should respect maximum variations limit', async () => {
      const result = await captionGeneratorService.generateMultipleVariations({
        prompt: 'Test',
        count: 10,
        platform: 'instagram',
      });

      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe('optimizeCaption', () => {
    it('should optimize caption for engagement', async () => {
      const result = await captionGeneratorService.optimizeCaption({
        text: 'Good caption',
        platform: 'instagram',
      });

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
    });

    it('should add relevant hashtags', async () => {
      const result = await captionGeneratorService.optimizeCaption({
        text: 'Beach day',
        platform: 'instagram',
        addHashtags: true,
      });

      expect(result.hashtags).toBeDefined();
      expect(result.hashtags.length).toBeGreaterThan(0);
    });
  });

  describe('translateCaption', () => {
    it('should translate caption to target language', async () => {
      const result = await captionGeneratorService.translateCaption(
        'Beautiful sunset today!',
        'es'
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });
});

describe('CaptionOptimizerService', () => {
  let captionOptimizerService: CaptionOptimizerService;

  beforeEach(() => {
    jest.clearAllMocks();
    captionOptimizerService = new CaptionOptimizerService();
  });

  describe('optimizeForEngagement', () => {
    it('should optimize caption for maximum engagement', async () => {
      const result = await captionOptimizerService.optimizeForEngagement(
        'Check out this post'
      );

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
    });

    it('should suggest optimal length', async () => {
      const result = await captionOptimizerService.optimizeForEngagement(
        'Short caption'
      );

      expect(result.suggestions).toBeDefined();
    });
  });

  describe('addCallToAction', () => {
    it('should add call to action to caption', async () => {
      const result = await captionOptimizerService.addCallToAction(
        'Great post!',
        'Shop now'
      );

      expect(result).toContain('Shop now');
    });
  });

  describe('addHashtags', () => {
    it('should add relevant hashtags', async () => {
      const result = await captionOptimizerService.addHashtags(
        'Beach vacation',
        { count: 5, style: 'mixed' }
      );

      expect(result).toContain('#');
    });

    it('should limit hashtag count', async () => {
      const result = await captionOptimizerService.addHashtags(
        'Test caption',
        { count: 30 }
      );

      const hashtagCount = (result.match(/#/g) || []).length;
      expect(hashtagCount).toBeLessThanOrEqual(20);
    });
  });

  describe('improveEmojiUsage', () => {
    it('should add relevant emojis', async () => {
      const result = await captionOptimizerService.improveEmojiUsage(
        'Beach day',
        { style: 'moderate' }
      );

      expect(result).toBeDefined();
    });
  });

  describe('analyzeCaption', () => {
    it('should analyze caption metrics', async () => {
      const result = await captionOptimizerService.analyzeCaption(
        'Great post! Check out our new collection #fashion #style'
      );

      expect(result).toBeDefined();
      expect(result.readability).toBeDefined();
      expect(result.engagementScore).toBeDefined();
    });
  });
});

describe('CaptionAnalyticsService', () => {
  let captionAnalyticsService: CaptionAnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    captionAnalyticsService = new CaptionAnalyticsService();
  });

  describe('trackCaption', () => {
    it('should track generated caption', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      (GeneratedCaption as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await captionAnalyticsService.trackCaption({
        text: 'Test caption',
        platform: 'instagram',
        style: 'casual',
      });

      expect(result).toBeDefined();
    });
  });

  describe('getTopPerformingCaptions', () => {
    it('should return top performing captions', async () => {
      (GeneratedCaption.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await captionAnalyticsService.getTopPerformingCaptions(
        'instagram',
        10
      );

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getCaptionInsights', () => {
    it('should return caption insights', async () => {
      const mockAggregate = jest.fn().mockResolvedValue([{
        avgEngagement: 500,
        topStyle: 'casual',
        topTone: 'friendly',
      }]);

      (GeneratedCaption.aggregate as jest.Mock).mockImplementation(mockAggregate);

      const result = await captionAnalyticsService.getCaptionInsights(
        'instagram'
      );

      expect(result).toBeDefined();
    });
  });

  describe('compareStyles', () => {
    it('should compare caption styles', async () => {
      const mockAggregate = jest.fn().mockResolvedValue([
        { _id: 'casual', avgEngagement: 500 },
        { _id: 'professional', avgEngagement: 400 },
      ]);

      (GeneratedCaption.aggregate as jest.Mock).mockImplementation(mockAggregate);

      const result = await captionAnalyticsService.compareStyles('instagram');

      expect(result).toHaveLength(2);
    });
  });
});
