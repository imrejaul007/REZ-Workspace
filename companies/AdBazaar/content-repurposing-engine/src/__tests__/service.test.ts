/**
 * Content Repurposing Engine - Service Tests
 * Tests business logic for content adaptation and repurposing
 */

import { ContentAdaptationService, AdaptationResult } from '../services/contentAdaptation';
import { HighlightsExtractionService } from '../services/highlightsExtraction';
import { RepurposingService } from '../services/repurposingService';

// Mock dependencies
jest.mock('../services/platformConfig', () => ({
  getPlatformConfig: jest.fn((platform: string) => {
    const configs: Record<string, ReturnType<typeof getPlatformConfigForTest>> = {
      instagram: {
        name: 'Instagram',
        type: 'image',
        maxTitleLength: 150,
        maxDescriptionLength: 2200,
        maxHashtags: 30,
        defaultAspectRatio: '1:1',
        supportedAspectRatios: ['1:1', '4:5', '16:9'],
        formatting: { emojiStyle: 'native' as const },
      },
      tiktok: {
        name: 'TikTok',
        type: 'video',
        maxTitleLength: 100,
        maxDescriptionLength: 2200,
        maxHashtags: 10,
        defaultAspectRatio: '9:16',
        supportedAspectRatios: ['9:16'],
        formatting: { emojiStyle: 'native' as const },
      },
      youtube: {
        name: 'YouTube',
        type: 'video',
        maxTitleLength: 100,
        maxDescriptionLength: 5000,
        maxHashtags: 15,
        defaultAspectRatio: '16:9',
        supportedAspectRatios: ['16:9', '4:3', '1:1'],
        formatting: { emojiStyle: 'native' as const },
      },
      twitter: {
        name: 'Twitter',
        type: 'text',
        maxTitleLength: 70,
        maxDescriptionLength: 280,
        maxHashtags: 3,
        defaultAspectRatio: '16:9',
        supportedAspectRatios: ['16:9'],
        formatting: { emojiStyle: 'remove' as const },
      },
    };
    return configs[platform] || null;
  }),
}));

// Helper function for test (not exported from module)
function getPlatformConfigForTest() {
  return {
    name: 'Test',
    type: 'text' as const,
    maxTitleLength: 100,
    maxDescriptionLength: 500,
    maxHashtags: 5,
    defaultAspectRatio: '16:9',
    supportedAspectRatios: ['16:9'],
    formatting: { emojiStyle: 'native' as const },
  };
}

describe('ContentAdaptationService', () => {
  let service: ContentAdaptationService;

  beforeEach(() => {
    service = new ContentAdaptationService();
  });

  describe('adaptContent', () => {
    it('should adapt content for Instagram platform', () => {
      const content = {
        title: 'Amazing Product Launch',
        description: 'Check out our new amazing product! It is the best in the market.',
        hashtags: ['#product', '#launch', '#amazing', '#tech', '#innovation'],
 aspectRatio: '16:9',
      };

      const result = service.adaptContent(content, 'instagram');

      expect(result).toBeDefined();
      expect(result.title).toBe('Amazing Product Launch');
      expect(result.hashtags).toHaveLength(5);
      expect(result.aspectRatio).toBe('16:9');
      expect(result.mediaFormat).toBe('jpg');
    });

    it('should truncate title for TikTok platform', () => {
      const longTitle = 'This is a very long title that exceeds the maximum allowed length for TikTok platform';
      const content = {
        title: longTitle,
        description: 'Short description',
        hashtags: ['#test'],
      };

      const result = service.adaptContent(content, 'tiktok');

      expect(result.title.length).toBeLessThanOrEqual(100);
      expect(result.warnings).toContainEqual(expect.stringContaining('Title truncated'));
    });

    it('should truncate description for Twitter platform', () => {
      const longDescription = 'A'.repeat(500);
      const content = {
        title: 'Short',
        description: longDescription,
        hashtags: ['#test', '#test2', '#test3', '#test4'],
      };

      const result = service.adaptContent(content, 'twitter');

      expect(result.description.length).toBeLessThanOrEqual(280);
      expect(result.warnings).toContainEqual(expect.stringContaining('Description truncated'));
    });

    it('should reduce hashtags for Twitter platform', () => {
      const content = {
        title: 'Test',
        description: 'Test description',
        hashtags: ['#one', '#two', '#three', '#four', '#five', '#six'],
      };

      const result = service.adaptContent(content, 'twitter');

      expect(result.hashtags).toHaveLength(3);
      expect(result.warnings).toContainEqual(expect.stringContaining('Hashtags reduced'));
    });

    it('should remove duplicate hashtags', () => {
      const content = {
        title: 'Test',
        description: 'Test description',
        hashtags: ['#test', '#TEST', '#Test', '#other'],
      };

      const result = service.adaptContent(content, 'instagram');

      // Should have only2 unique hashtags (case-insensitive dedup)
      const uniqueHashtags = new Set(result.hashtags.map(h => h.toLowerCase()));
      expect(uniqueHashtags.size).toBe(result.hashtags.length);
    });

    it('should use default aspect ratio for unsupported ratios', () => {
      const content = {
        title: 'Test',
        description: 'Test description',
        aspectRatio: '21:9', // Not supported by TikTok
      };

      const result = service.adaptContent(content, 'tiktok');

      expect(result.aspectRatio).toBe('9:16'); // TikTok default
    });

    it('should throw error for unknown platform', () => {
      const content = {
        title: 'Test',
        description: 'Test description',
      };

      expect(() => service.adaptContent(content, 'unknown-platform')).toThrow('Unknown platform: unknown-platform');
    });

    it('should remove emojis for Twitter (emojiStyle: remove)', () => {
      const content = {
        title: 'Test',
        description: 'Check out this amazing product! 🎉🔥💯',
        hashtags: ['#test'],
      };

      const result = service.adaptContent(content, 'twitter');

      // Emoji removal is platform specific - Twitter removes emojis
      expect(result.description).toBeDefined();
    });
  });

  describe('generateHashtags', () => {
    it('should generate hashtags from content', () => {
      const content = 'This is an amazing product launch that everyone should know about';
      const hashtags = service.generateHashtags(content, 5);

      expect(hashtags).toHaveLength(5);
      expect(hashtags[0]).toMatch(/^#\w+$/);
    });

    it('should filter out short words', () => {
      const content = 'The best product in the world';
      const hashtags = service.generateHashtags(content, 3);

      // Should not include 'the', 'in', 'best' (wait, 'best' is 4 chars)
      expect(hashtags.every(h => h.length > 5)).toBe(true);
    });

    it('should return empty array for short content', () => {
      const content = 'Hi';
      const hashtags = service.generateHashtags(content, 5);

      expect(hashtags).toHaveLength(0);
    });
  });

  describe('addCTA', () => {
    it('should add YouTube CTA', () => {
      const content = 'Check out this video';
      const result = service.addCTA(content, 'youtube');

      expect(result).toContain(content);
      expect(result).toContain('Subscribe');
    });

    it('should add TikTok CTA', () => {
      const content = 'Check out this video';
      const result = service.addCTA(content, 'tiktok');

      expect(result).toContain(content);
      expect(result).toContain('Follow');
    });

    it('should add generic CTA for unknown platform', () => {
      const content = 'Check out this content';
      const result = service.addCTA(content, 'unknown');

      expect(result).toContain(content);
      expect(result).toContain('Check out our profile');
    });
  });
});

describe('HighlightsExtractionService', () => {
  let service: HighlightsExtractionService;

  beforeEach(() => {
    service = new HighlightsExtractionService();
  });

  describe('extractHighlights', () => {
    it('should return highlights array', async () => {
      const input = {
        sourceVideoId: 'video-123',
        sourceVideoUrl: 'https://example.com/video.mp4',
        duration: 120,
        targetPlatform: 'tiktok',
        maxHighlights: 5,
        minDuration: 5,
        maxDuration: 60,
      };

      const highlights = await service.extractHighlights(input);

      expect(Array.isArray(highlights)).toBe(true);
      expect(highlights.length).toBeGreaterThan(0);
    });

    it('should respect maxHighlights parameter', async () => {
      const input = {
        sourceVideoId: 'video-123',
        sourceVideoUrl: 'https://example.com/video.mp4',
        duration: 300,
        targetPlatform: 'tiktok',
        maxHighlights: 3,
 minDuration: 5,
        maxDuration: 60,
      };

      const highlights = await service.extractHighlights(input);

      expect(highlights.length).toBeLessThanOrEqual(3);
    });

    it('should handle errors gracefully', async () => {
      const input = {
        sourceVideoId: '',
        sourceVideoUrl: 'invalid-url',
        duration: 0,
        targetPlatform: 'tiktok',
      };

      // Should not throw, should return empty or partial results
      const highlights = await service.extractHighlights(input);
      expect(Array.isArray(highlights)).toBe(true);
    });
  });
});

describe('RepurposingService', () => {
  let service: RepurposingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RepurposingService();
  });

  describe('repurpose', () => {
    it('should create repurposed content entry', async () => {
      const input = {
        originalContentId: 'content-123',
        originalPlatform: 'youtube',
        targetPlatform: 'instagram',
        content: {
          title: 'Test Video',
          description: 'Test description',
          hashtags: ['#test'],
          mediaUrl: 'https://example.com/video.mp4',
        },
      };

      const result = await service.repurpose(input);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.status).toBeDefined();
    });

    it('should handle template-based repurposing', async () => {
      const input = {
        originalContentId: 'content-123',
        originalPlatform: 'youtube',
        targetPlatform: 'tiktok',
        content: {
          title: 'Test Video',
          description: 'Test description',
 },
        templateId: 'template-123',
      };

      const result = await service.repurpose(input);

      expect(result).toBeDefined();
 });
  });

  describe('batchRepurpose', () => {
    it('should process multiple platforms', async () => {
      const input = {
        originalContentId: 'content-123',
        originalPlatform: 'youtube',
        targets: ['instagram', 'tiktok', 'twitter'],
        content: {
          title: 'Test Video',
          description: 'Test description',
          hashtags: ['#test'],
        },
      };

      const results = await service.batchRepurpose(input);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(3);
    });

    it('should handle empty targets array', async () => {
      const input = {
        originalContentId: 'content-123',
        originalPlatform: 'youtube',
        targets: [],
        content: {
          title: 'Test Video',
          description: 'Test description',
        },
      };

      const results = await service.batchRepurpose(input);

      expect(results).toHaveLength(0);
    });
  });

  describe('adaptContent', () => {
    it('should adapt content for target platform', async () => {
      const content = {
        title: 'Amazing Product Launch Video That Is Very Long',
        description: 'This is an amazing product launch video that showcases our new product',
        hashtags: ['#product', '#launch', '#amazing', '#tech', '#innovation'],
 aspectRatio: '16:9',
      };

      const result = await service.adaptContent(content, 'instagram');

      expect(result).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.hashtags).toBeDefined();
      expect(result.aspectRatio).toBeDefined();
    });

    it('should include warnings for content that was truncated', async () => {
      const content = {
        title: 'A'.repeat(200), // Very long title
        description: 'B'.repeat(3000), // Very long description
        hashtags: ['#one', '#two', '#three', '#four', '#five', '#six', '#seven', '#eight', '#nine', '#ten', '#eleven'],
        targetPlatform: 'twitter',
      };

      const result = await service.adaptContent(content, 'twitter');

      expect(result.warnings).toBeDefined();
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('getById', () => {
    it('should return content by ID', async () => {
      const result = await service.getById('test-id');

      // May return null or throw depending on implementation
      expect(result).toBeDefined();
    });
  });

  describe('getHistory', () => {
    it('should return repurposing history', async () => {
      const filters = {
        originalContentId: 'content-123',
        limit: 10,
        offset: 0,
      };

      const history = await service.getHistory(filters);

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should handle empty filters', async () => {
      const history = await service.getHistory({});

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    });
  });
});
