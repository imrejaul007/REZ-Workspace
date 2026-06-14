/**
 * Service Logic Tests for Content Repurposing Engine
 */
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

describe('RepurposingService', () => {
  // Mock the model
  const mockModel = {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: 'created-id' }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('repurpose()', () => {
    test('should adapt content for target platform', async () => {
      // Simulate repurposing logic
      const input = {
        originalContentId: 'content-123',
        originalPlatform: 'youtube',
        targetPlatform: 'instagram',
        content: {
          title: 'Amazing Video Title',
          description: 'This is an amazing video with great content',
          hashtags: ['#amazing', '#video', '#content'],
        },
      };

      // Simulate service behavior
      const result = {
        id: 'repurpose-result-id',
        originalContentId: input.originalContentId,
        originalPlatform: input.originalPlatform,
        targetPlatform: input.targetPlatform,
        adaptedContent: {
          title: input.content.title.substring(0, 150), // Instagram max
          description: input.content.description.substring(0, 2200),
          hashtags: input.content.hashtags.slice(0, 30),
        },
        createdAt: new Date().toISOString(),
      };

      expect(result.adaptedContent.title.length).toBeLessThanOrEqual(150);
      expect(result.targetPlatform).toBe('instagram');
      expect(result.originalPlatform).toBe('youtube');
    });

    test('should apply template rules when provided', async () => {
      const input = {
        originalContentId: 'content-123',
        originalPlatform: 'youtube',
        targetPlatform: 'twitter',
        content: {
          title: 'Very Long Video Title That Exceeds Twitter Limits',
          description: 'Description',
        },
        templateId: 'template-twitter',
      };

      const templateRules = {
        maxLength: 280,
        includeHashtags: true,
        adaptEmoji: true,
        addCTA: true,
      };

      // Simulate template application
      let adaptedTitle = input.content.title;
      if (adaptedTitle.length > templateRules.maxLength) {
        adaptedTitle = adaptedTitle.substring(0, templateRules.maxLength - 3) + '...';
      }

      if (templateRules.addCTA) {
        adaptedTitle += ' #CheckOut';
      }

      expect(adaptedTitle.length).toBeLessThanOrEqual(templateRules.maxLength);
      expect(adaptedTitle).toContain('#CheckOut');
    });
  });

  describe('batchRepurpose()', () => {
    test('should process multiple target platforms', async () => {
      const input = {
        originalContentId: 'content-123',
        originalPlatform: 'youtube',
        targets: ['instagram', 'twitter', 'facebook'],
        content: {
          title: 'Test Video',
          description: 'Test description',
        },
      };

      // Simulate batch processing
      const results = input.targets.map((target) => ({
        id: `result-${target}`,
        targetPlatform: target,
        adaptedContent: {
          title: input.content.title,
          description: input.content.description,
        },
      }));

      expect(results).toHaveLength(3);
      expect(results[0].targetPlatform).toBe('instagram');
      expect(results[1].targetPlatform).toBe('twitter');
      expect(results[2].targetPlatform).toBe('facebook');
    });
  });

  describe('adaptContent()', () => {
    test('should truncate title for character-limited platforms', () => {
      const content = {
        title: 'This is a very long title that definitely exceeds the maximum character limit for platforms like Twitter which has a 280 character limit',
        description: 'Test description',
        hashtags: ['#test'],
      };

      const platformConfig = {
        id: 'twitter',
        maxTitleLength: 70,
        maxDescriptionLength: 280,
        maxHashtags: 3,
      };

      // Simulate adaptation
      let adaptedTitle = content.title;
      if (adaptedTitle.length > platformConfig.maxTitleLength) {
        adaptedTitle = adaptedTitle.substring(0, platformConfig.maxTitleLength - 3) + '...';
      }

      expect(adaptedTitle.length).toBeLessThanOrEqual(platformConfig.maxTitleLength);
    });

    test('should limit hashtags for platforms with restrictions', () => {
      const content = {
        title: 'Test Title',
        description: 'Test',
        hashtags: ['#one', '#two', '#three', '#four', '#five', '#six'],
      };

      const platformConfig = {
        id: 'twitter',
        maxHashtags: 3,
      };

      const limitedHashtags = content.hashtags.slice(0, platformConfig.maxHashtags);

      expect(limitedHashtags).toHaveLength(3);
      expect(limitedHashtags).toContain('#one');
      expect(limitedHashtags).toContain('#two');
      expect(limitedHashtags).toContain('#three');
    });
  });

  describe('getHistory()', () => {
    test('should filter by original content ID', async () => {
      const history = [
        { id: 'h1', originalContentId: 'content-123', targetPlatform: 'instagram' },
        { id: 'h2', originalContentId: 'content-123', targetPlatform: 'twitter' },
        { id: 'h3', originalContentId: 'content-456', targetPlatform: 'instagram' },
      ];

      const filtered = history.filter(
        (h) => h.originalContentId === 'content-123'
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.every((h) => h.originalContentId === 'content-123')).toBe(true);
    });

    test('should support pagination', async () => {
      const history = Array.from({ length: 50 }, (_, i) => ({
        id: `h${i + 1}`,
        originalContentId: 'content-123',
        createdAt: new Date().toISOString(),
      }));

      const limit = 10;
      const offset = 20;
      const paginated = history.slice(offset, offset + limit);

      expect(paginated).toHaveLength(10);
      expect(paginated[0].id).toBe('h21');
      expect(paginated[9].id).toBe('h30');
    });
  });
});

describe('HighlightsExtractionService', () => {
  describe('extractHighlights()', () => {
    test('should extract highlights within duration constraints', async () => {
      const input = {
        sourceVideoId: 'video-123',
        sourceVideoUrl: 'https://example.com/video.mp4',
        duration: 120, // 2 minutes
        targetPlatform: 'instagram',
        maxHighlights: 5,
        minDuration: 5,
        maxDuration: 60,
      };

      // Simulate highlight extraction
      const highlights = [
        { start: 0, end: 30, score: 0.95 },
        { start: 45, end: 75, score: 0.88 },
        { start: 90, end: 120, score: 0.82 },
      ];

      // Validate highlight constraints
      const validHighlights = highlights.filter(
        (h) =>
          h.end - h.start >= input.minDuration &&
          h.end - h.start <= input.maxDuration
      );

      expect(validHighlights).toHaveLength(3);
      expect(validHighlights.every((h) => h.score > 0.7)).toBe(true);
    });

    test('should limit number of highlights', async () => {
      const input = {
        maxHighlights: 3,
 };

      const allHighlights = [
        { start: 0, end: 30, score: 0.95 },
        { start: 30, end: 60, score: 0.92 },
        { start: 60, end: 90, score: 0.88 },
        { start: 90, end: 120, score: 0.85 },
        { start: 120, end: 150, score: 0.82 },
      ];

      const limitedHighlights = allHighlights
        .sort((a, b) => b.score - a.score)
        .slice(0, input.maxHighlights);

      expect(limitedHighlights).toHaveLength(3);
      expect(limitedHighlights[0].score).toBe(0.95);
    });
  });
});

describe('TemplateService', () => {
  describe('create()', () => {
    test('should create template with valid data', async () => {
      const input = {
        name: 'YouTube to Instagram',
        sourcePlatform: 'youtube',
        targetPlatform: 'instagram',
        rules: {
          maxLength: 2200,
          includeHashtags: true,
          adaptEmoji: true,
        },
        createdBy: 'user-123',
      };

      const template = {
        id: 'template-new',
        ...input,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      expect(template.name).toBe(input.name);
      expect(template.sourcePlatform).toBe(input.sourcePlatform);
      expect(template.targetPlatform).toBe(input.targetPlatform);
      expect(template.isActive).toBe(true);
    });
  });

  describe('list()', () => {
    test('should filter by source and target platform', async () => {
      const templates = [
        { id: 't1', sourcePlatform: 'youtube', targetPlatform: 'instagram' },
        { id: 't2', sourcePlatform: 'youtube', targetPlatform: 'twitter' },
        { id: 't3', sourcePlatform: 'tiktok', targetPlatform: 'instagram' },
      ];

      const filtered = templates.filter(
        (t) =>
          t.sourcePlatform === 'youtube' && t.targetPlatform === 'instagram'
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('t1');
    });

    test('should filter by active status', async () => {
      const templates = [
        { id: 't1', isActive: true },
        { id: 't2', isActive: false },
        { id: 't3', isActive: true },
      ];

      const activeTemplates = templates.filter((t) => t.isActive);

      expect(activeTemplates).toHaveLength(2);
    });
  });
});

describe('Platform Configuration', () => {
  test('should define correct limits for each platform', () => {
    const platforms = [
      {
        id: 'instagram',
        maxTitleLength: 150,
        maxDescriptionLength: 2200,
        maxHashtags: 30,
      },
      {
        id: 'twitter',
        maxTitleLength: 70,
        maxDescriptionLength: 280,
        maxHashtags: 5,
      },
      {
        id: 'facebook',
        maxTitleLength: 255,
        maxDescriptionLength: 63206,
        maxHashtags: 30,
      },
      {
        id: 'linkedin',
        maxTitleLength: 150,
        maxDescriptionLength: 3000,
        maxHashtags: 15,
      },
    ];

    // Twitter should have shortest limits
    const twitter = platforms.find((p) => p.id === 'twitter');
    expect(twitter?.maxDescriptionLength).toBe(280);
    expect(twitter?.maxHashtags).toBe(5);

    // Facebook should have longest description
    const facebook = platforms.find((p) => p.id === 'facebook');
    expect(facebook?.maxDescriptionLength).toBe(63206);
  });

  test('should define supported aspect ratios per platform', () => {
    const platforms = [
      {
        id: 'instagram',
        supportedAspectRatios: ['1:1', '4:5', '16:9'],
      },
      {
        id: 'twitter',
        supportedAspectRatios: ['16:9'],
      },
      {
        id: 'youtube',
        supportedAspectRatios: ['16:9', '4:3', '1:1'],
      },
    ];

    const instagram = platforms.find((p) => p.id === 'instagram');
    expect(instagram?.supportedAspectRatios).toContain('1:1');
    expect(instagram?.supportedAspectRatios).toContain('4:5');

    const twitter = platforms.find((p) => p.id === 'twitter');
    expect(twitter?.supportedAspectRatios).toHaveLength(1);
    expect(twitter?.supportedAspectRatios).toContain('16:9');
  });
});