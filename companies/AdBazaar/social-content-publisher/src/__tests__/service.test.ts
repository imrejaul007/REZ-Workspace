/**
 * Service Tests for Social Content Publisher
 * Tests business logic for multi-platform content publishing
 */

import { ContentPublisher } from '../services/contentPublisher';
import { PlatformManager } from '../services/platformManager';
import { SchedulerService } from '../services/schedulerService';
import { AnalyticsService } from '../services/analyticsService';
import { Content, PublishedContent, Platform, PlatformCredentials } from '../models';

// Mock dependencies
jest.mock('../models');
jest.mock('../services/platformManager');
jest.mock('../services/schedulerService');
jest.mock('../config/logger');

describe('ContentPublisher', () => {
  let contentPublisher: ContentPublisher;

  const mockContent = {
    _id: 'content-123',
    title: 'Test Content',
    body: 'This is test content',
    mediaUrls: ['https://example.com/image.jpg'],
    author: 'user-123',
    companyId: 'company-123',
    status: 'draft',
    platforms: ['instagram', 'facebook', 'twitter'],
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    contentPublisher = new ContentPublisher();
  });

  describe('createContent', () => {
    it('should create new content', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      const MockContentModel = jest.mocked(Content).mockImplementation(
        jest.fn().mockImplementation(() => ({
          ...mockContent,
          save: mockSave,
        })) as any
      );

      const input = {
        title: 'New Post',
        body: 'Content body',
        mediaUrls: ['https://example.com/image.jpg'],
        author: 'user-123',
        companyId: 'company-123',
        platforms: ['instagram'],
      };

      const result = await contentPublisher.createContent(input);

      expect(result).toBeDefined();
      expect(result.title).toBe('New Post');
    });

    it('should throw error for missing required fields', async () => {
      const input = {
        title: 'New Post',
        // missing body
        author: 'user-123',
        companyId: 'company-123',
      };

      await expect(contentPublisher.createContent(input)).rejects.toThrow();
    });
  });

  describe('publishToPlatform', () => {
    it('should publish content to a single platform', async () => {
      const mockPublish = jest.fn().mockResolvedValue({
        platformPostId: 'ig-post-123',
        url: 'https://instagram.com/p/test',
      });

      (PlatformManager.publishContent as jest.Mock).mockImplementation(mockPublish);

      const result = await contentPublisher.publishToPlatform(
        'content-123',
        'instagram'
      );

      expect(result.success).toBe(true);
      expect(result.platformPostId).toBe('ig-post-123');
    });

    it('should handle publish failure', async () => {
      (PlatformManager.publishContent as jest.Mock).mockRejectedValue(
        new Error('API error')
      );

      const result = await contentPublisher.publishToPlatform(
        'content-123',
        'instagram'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('publishToMultiplePlatforms', () => {
    it('should publish content to multiple platforms', async () => {
      (PlatformManager.publishContent as jest.Mock).mockResolvedValue({
        platformPostId: 'post-123',
        url: 'https://example.com/post',
      });

      const result = await contentPublisher.publishToMultiplePlatforms(
        'content-123',
        ['instagram', 'facebook']
      );

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    it('should track failed publishes', async () => {
      (PlatformManager.publishContent as jest.Mock)
        .mockResolvedValueOnce({ platformPostId: 'post-123', url: 'https://example.com' })
        .mockRejectedValueOnce(new Error('Twitter API error'));

      const result = await contentPublisher.publishToMultiplePlatforms(
        'content-123',
        ['instagram', 'twitter']
      );

      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
    });
  });

  describe('scheduleContent', () => {
    it('should schedule content for future publishing', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      (SchedulerService.schedule as jest.Mock).mockResolvedValue({
        jobId: 'job-123',
        scheduledTime: futureDate,
      });

      const result = await contentPublisher.scheduleContent(
        'content-123',
        futureDate,
        ['instagram']
      );

      expect(result.jobId).toBeDefined();
    });

    it('should reject scheduling in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await expect(
        contentPublisher.scheduleContent('content-123', pastDate, ['instagram'])
      ).rejects.toThrow('Scheduled time must be in the future');
    });
  });

  describe('getContent', () => {
    it('should return content by ID', async () => {
      (Content.findById as jest.Mock).mockResolvedValue(mockContent);

      const result = await contentPublisher.getContent('content-123');

      expect(result).toEqual(mockContent);
    });

    it('should return null for non-existent content', async () => {
      (Content.findById as jest.Mock).mockResolvedValue(null);

      const result = await contentPublisher.getContent('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateContent', () => {
    it('should update content fields', async () => {
      const updatedContent = { ...mockContent, title: 'Updated Title' };

      (Content.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedContent);

      const result = await contentPublisher.updateContent('content-123', {
        title: 'Updated Title',
      });

      expect(result?.title).toBe('Updated Title');
    });

    it('should return null for non-existent content', async () => {
      (Content.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await contentPublisher.updateContent('nonexistent', {
        title: 'New Title',
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteContent', () => {
    it('should delete content', async () => {
      (Content.findByIdAndDelete as jest.Mock).mockResolvedValue(mockContent);

      const result = await contentPublisher.deleteContent('content-123');

      expect(result).toBe(true);
    });

    it('should return false for non-existent content', async () => {
      (Content.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const result = await contentPublisher.deleteContent('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('listContent', () => {
    it('should list content with pagination', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockContent]),
      };

      (Content.find as jest.Mock).mockReturnValue(mockQuery);
      (Content.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await contentPublisher.listContent({
        page: 1,
        limit: 10,
      });

      expect(result.content).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      (Content.find as jest.Mock).mockReturnValue(mockQuery);
      (Content.countDocuments as jest.Mock).mockResolvedValue(0);

      await contentPublisher.listContent({ status: 'published', page: 1, limit: 10 });

      expect(Content.find).toHaveBeenCalledWith(expect.objectContaining({ status: 'published' }));
    });
  });
});

describe('PlatformManager', () => {
  let platformManager: PlatformManager;

  beforeEach(() => {
    jest.clearAllMocks();
    platformManager = new PlatformManager();
  });

  describe('registerPlatform', () => {
    it('should register a new platform', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockPlatform = {
        name: 'instagram',
        credentials: {},
        save: mockSave,
      };

      (Platform as unknown as jest.Mock).mockImplementation(() => mockPlatform);

      const result = await platformManager.registerPlatform('instagram', {});

      expect(result.name).toBe('instagram');
    });
  });

  describe('publishContent', () => {
    it('should publish to Instagram', async () => {
      const mockCredentials = {
        accessToken: 'test-token',
        accountId: 'acc-123',
      };

      (PlatformCredentials.findOne as jest.Mock).mockResolvedValue(mockCredentials);

      const result = await platformManager.publishContent('instagram', {
        title: 'Test',
        body: 'Content',
        mediaUrls: [],
      });

      expect(result.success).toBe(true);
    });

    it('should throw error for missing credentials', async () => {
      (PlatformCredentials.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        platformManager.publishContent('instagram', {
          title: 'Test',
          body: 'Content',
          mediaUrls: [],
        })
      ).rejects.toThrow('Credentials not found');
    });
  });

  describe('getPlatformStatus', () => {
    it('should return platform status', async () => {
      const mockPlatform = {
        name: 'instagram',
        status: 'active',
        lastSync: new Date(),
      };

      (Platform.findOne as jest.Mock).mockResolvedValue(mockPlatform);

      const result = await platformManager.getPlatformStatus('instagram');

      expect(result.status).toBe('active');
    });
  });
});

describe('SchedulerService', () => {
  let schedulerService: SchedulerService;

  beforeEach(() => {
    jest.clearAllMocks();
    schedulerService = new SchedulerService();
  });

  describe('schedule', () => {
    it('should schedule a job', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      const result = await schedulerService.schedule({
        contentId: 'content-123',
        platform: 'instagram',
        scheduledTime: futureDate,
      });

      expect(result.jobId).toBeDefined();
    });

    it('should reject invalid schedule time', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      await expect(
        schedulerService.schedule({
          contentId: 'content-123',
          platform: 'instagram',
          scheduledTime: pastDate,
        })
      ).rejects.toThrow('Invalid scheduled time');
    });
  });

  describe('cancel', () => {
    it('should cancel a scheduled job', async () => {
      const result = await schedulerService.cancel('job-123');

      expect(result.success).toBe(true);
    });

    it('should return error for non-existent job', async () => {
      const result = await schedulerService.cancel('nonexistent');

      expect(result.success).toBe(false);
    });
  });

  describe('getScheduledJobs', () => {
    it('should return scheduled jobs', async () => {
      const mockJobs = [
        { jobId: 'job-1', contentId: 'content-1' },
        { jobId: 'job-2', contentId: 'content-2' },
      ];

      (Content.find as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockJobs),
      });

      const result = await schedulerService.getScheduledJobs('company-123');

      expect(result).toHaveLength(2);
    });
  });
});

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsService = new AnalyticsService();
  });

  describe('trackPublish', () => {
    it('should track a publish event', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockAnalytics = {
        contentId: 'content-123',
        platform: 'instagram',
        save: mockSave,
      };

      (PublishedContent as unknown as jest.Mock).mockImplementation(() => mockAnalytics);

      const result = await analyticsService.trackPublish({
        contentId: 'content-123',
        platform: 'instagram',
        postId: 'ig-post-123',
        url: 'https://instagram.com/p/test',
      });

      expect(result).toBeDefined();
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics summary', async () => {
      const mockAggregate = jest.fn().mockResolvedValue([
        {
          _id: 'instagram',
          totalPosts: 100,
          totalEngagement: 5000,
        },
      ]);

      (PublishedContent.aggregate as jest.Mock).mockImplementation(mockAggregate);

      const result = await analyticsService.getAnalytics('company-123', {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      expect(result).toBeDefined();
    });
  });

  describe('getTopContent', () => {
    it('should return top performing content', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      (PublishedContent.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await analyticsService.getTopContent('company-123', {
        platform: 'instagram',
        limit: 10,
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });
});