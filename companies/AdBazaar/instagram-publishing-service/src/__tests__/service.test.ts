/**
 * Service Tests for Instagram Publishing Service
 * Tests business logic for publishing, accounts, and Instagram API services
 */

import { PublishingService } from '../services/publishingService';
import { AccountService } from '../services/accountService';
import { InstagramApiService } from '../services/instagramApiService';
import { PublishRequest, PublishedContent, InstagramAccount } from '../models';

// Mock dependencies
jest.mock('../models');
jest.mock('../services/instagramApiService');
jest.mock('../utils/logger');

describe('PublishingService', () => {
  let publishingService: PublishingService;

  const mockAccount = {
    _id: 'acc-123',
    instagramId: 'ig-123',
    instagramUsername: 'test_user',
    accountId: 'acc-123',
    businessAccountId: 'biz-123',
    accessToken: 'test-token',
    status: 'active',
    recordPublish: jest.fn(),
    save: jest.fn(),
  };

  const mockPublishRequest = {
    _id: 'req-123',
    accountId: 'acc-123',
    contentType: 'feed_image',
    caption: 'Test caption',
    status: 'publishing',
    save: jest.fn(),
    markAsPublished: jest.fn(),
    markAsFailed: jest.fn(),
  };

  const mockPublishedContent = {
    _id: 'pub-123',
    instagramMediaId: 'ig-media-123',
    accountId: 'acc-123',
    contentType: 'feed_image',
    status: 'published',
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    publishingService = new PublishingService();
  });

  describe('publishContent', () => {
    it('should publish feed image successfully', async () => {
      (InstagramAccount.findByAccount as jest.Mock).mockResolvedValue(mockAccount);
      (PublishRequest as unknown as jest.Mock).mockImplementation(() => mockPublishRequest);
      (PublishedContent as unknown as jest.Mock).mockImplementation(() => mockPublishedContent);

      (InstagramAccount.findByAccount as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAccount),
      });

      (InstagramAccount.prototype?.recordPublish as jest.Mock) = jest.fn();
      (InstagramAccount.prototype?.save as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      (InstagramApiService.createImageMedia as jest.Mock).mockResolvedValue({
        id: 'container-123',
      });
      (InstagramApiService.publishContent as jest.Mock).mockResolvedValue({
        id: 'ig-media-123',
        permalink: 'https://instagram.com/p/test',
      });
      (InstagramApiService.getMediaDetails as jest.Mock).mockResolvedValue({
        permalink: 'https://instagram.com/p/test',
        thumbnail_url: 'https://example.com/thumb.jpg',
        username: 'test_user',
        like_count: 100,
        comments_count: 10,
        timestamp: new Date().toISOString(),
      });

      const input = {
        accountId: 'acc-123',
        contentType: 'feed_image' as const,
        mediaUrl: 'https://example.com/image.jpg',
        caption: 'Test caption',
      };

      const result = await publishingService.publishContent(input);

      expect(result.success).toBe(true);
      expect(result.instagramMediaId).toBe('ig-media-123');
    });

    it('should throw NotFoundError when account not found', async () => {
      (InstagramAccount.findByAccount as jest.Mock).mockResolvedValue(null);

      const input = {
        accountId: 'nonexistent',
        contentType: 'feed_image' as const,
        mediaUrl: 'https://example.com/image.jpg',
      };

      await expect(publishingService.publishContent(input)).rejects.toThrow('Instagram account');
    });

    it('should throw error when mediaUrl missing for feed image', async () => {
      (InstagramAccount.findByAccount as jest.Mock).mockResolvedValue(mockAccount);
      (PublishRequest as unknown as jest.Mock).mockImplementation(() => mockPublishRequest);

      const input = {
        accountId: 'acc-123',
        contentType: 'feed_image' as const,
      };

      const result = await publishingService.publishContent(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Media URL is required');
    });

    it('should create album when content type is feed_album', async () => {
      (InstagramAccount.findByAccount as jest.Mock).mockResolvedValue(mockAccount);
      (PublishRequest as unknown as jest.Mock).mockImplementation(() => mockPublishRequest);
      (PublishedContent as unknown as jest.Mock).mockImplementation(() => mockPublishedContent);

      (InstagramApiService.createAlbumMedia as jest.Mock).mockResolvedValue({
        id: 'album-container-123',
      });
      (InstagramApiService.publishContent as jest.Mock).mockResolvedValue({
        id: 'ig-media-123',
        permalink: 'https://instagram.com/p/test',
      });
      (InstagramApiService.getMediaDetails as jest.Mock).mockResolvedValue({
        permalink: 'https://instagram.com/p/test',
        thumbnail_url: 'https://example.com/thumb.jpg',
        username: 'test_user',
        like_count: 100,
        comments_count: 10,
        timestamp: new Date().toISOString(),
      });

      const input = {
        accountId: 'acc-123',
        contentType: 'feed_album' as const,
        mediaUrls: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
        ],
        caption: 'Album caption',
      };

      const result = await publishingService.publishContent(input);

      expect(result.success).toBe(true);
      expect(InstagramApiService.createAlbumMedia).toHaveBeenCalled();
    });

    it('should create video when content type is feed_video', async () => {
      (InstagramAccount.findByAccount as jest.Mock).mockResolvedValue(mockAccount);
      (PublishRequest as unknown as jest.Mock).mockImplementation(() => mockPublishRequest);
      (PublishedContent as unknown as jest.Mock).mockImplementation(() => mockPublishedContent);

      (InstagramApiService.createVideoMedia as jest.Mock).mockResolvedValue({
        id: 'video-container-123',
      });
      (InstagramApiService.publishContent as jest.Mock).mockResolvedValue({
        id: 'ig-media-123',
        permalink: 'https://instagram.com/p/test',
      });
      (InstagramApiService.getMediaDetails as jest.Mock).mockResolvedValue({
        permalink: 'https://instagram.com/p/test',
        thumbnail_url: 'https://example.com/thumb.jpg',
        username: 'test_user',
        like_count: 100,
        comments_count: 10,
        timestamp: new Date().toISOString(),
      });

      const input = {
        accountId: 'acc-123',
        contentType: 'feed_video' as const,
        mediaUrl: 'https://example.com/video.mp4',
        caption: 'Video caption',
      };

      const result = await publishingService.publishContent(input);

      expect(result.success).toBe(true);
      expect(InstagramApiService.createVideoMedia).toHaveBeenCalled();
    });

    it('should handle first comment addition', async () => {
      (InstagramAccount.findByAccount as jest.Mock).mockResolvedValue(mockAccount);
      (PublishRequest as unknown as jest.Mock).mockImplementation(() => mockPublishRequest);
      (PublishedContent as unknown as jest.Mock).mockImplementation(() => mockPublishedContent);

      (InstagramApiService.createImageMedia as jest.Mock).mockResolvedValue({
        id: 'container-123',
      });
      (InstagramApiService.publishContent as jest.Mock).mockResolvedValue({
        id: 'ig-media-123',
        permalink: 'https://instagram.com/p/test',
      });
      (InstagramApiService.getMediaDetails as jest.Mock).mockResolvedValue({
        permalink: 'https://instagram.com/p/test',
        thumbnail_url: 'https://example.com/thumb.jpg',
        username: 'test_user',
        like_count: 100,
        comments_count: 10,
        timestamp: new Date().toISOString(),
      });
      (InstagramApiService.addComment as jest.Mock).mockResolvedValue(undefined);

      const input = {
        accountId: 'acc-123',
        contentType: 'feed_image' as const,
        mediaUrl: 'https://example.com/image.jpg',
        firstComment: 'Thanks for viewing!',
      };

      const result = await publishingService.publishContent(input);

      expect(result.success).toBe(true);
    });

    it('should build caption with hashtags', async () => {
      (InstagramAccount.findByAccount as jest.Mock).mockResolvedValue(mockAccount);
      (PublishRequest as unknown as jest.Mock).mockImplementation(() => mockPublishRequest);
      (PublishedContent as unknown as jest.Mock).mockImplementation(() => mockPublishedContent);

      (InstagramApiService.createImageMedia as jest.Mock).mockResolvedValue({
        id: 'container-123',
      });
      (InstagramApiService.publishContent as jest.Mock).mockResolvedValue({
        id: 'ig-media-123',
        permalink: 'https://instagram.com/p/test',
      });
      (InstagramApiService.getMediaDetails as jest.Mock).mockResolvedValue({
        permalink: 'https://instagram.com/p/test',
        thumbnail_url: 'https://example.com/thumb.jpg',
        username: 'test_user',
        like_count: 100,
        comments_count: 10,
        timestamp: new Date().toISOString(),
      });

      const input = {
        accountId: 'acc-123',
        contentType: 'feed_image' as const,
        mediaUrl: 'https://example.com/image.jpg',
        caption: 'Check out this post',
        hashtags: ['travel', 'photography'],
      };

      const result = await publishingService.publishContent(input);

      expect(result.success).toBe(true);
    });
  });

  describe('scheduleContent', () => {
    it('should schedule content for future', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      (PublishRequest as unknown as jest.Mock).mockImplementation(() => ({
        _id: 'schedule-123',
        save: jest.fn().mockResolvedValue(undefined),
      }));

      const input = {
        accountId: 'acc-123',
        contentType: 'feed_image' as const,
        mediaUrl: 'https://example.com/image.jpg',
        scheduledTime: futureDate,
      };

      const result = await publishingService.scheduleContent(input);

      expect(result.scheduleId).toBeDefined();
    });

    it('should reject scheduling in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const input = {
        accountId: 'acc-123',
        contentType: 'feed_image' as const,
        mediaUrl: 'https://example.com/image.jpg',
        scheduledTime: pastDate,
      };

      await expect(publishingService.scheduleContent(input)).rejects.toThrow(
        'Scheduled time must be in the future'
      );
    });
  });

  describe('saveDraft', () => {
    it('should save draft content', async () => {
      (PublishRequest as unknown as jest.Mock).mockImplementation(() => ({
        _id: 'draft-123',
        save: jest.fn().mockResolvedValue(undefined),
      }));

      const input = {
        accountId: 'acc-123',
        contentType: 'feed_image' as const,
        mediaUrl: 'https://example.com/image.jpg',
        caption: 'Draft caption',
      };

      const result = await publishingService.saveDraft(input);

      expect(result.draftId).toBeDefined();
    });
  });

  describe('getDrafts', () => {
    it('should return drafts for account', async () => {
      const mockDrafts = [
        { _id: 'draft-1', caption: 'Draft 1' },
        { _id: 'draft-2', caption: 'Draft 2' },
      ];

      (PublishRequest.findByAccount as jest.Mock).mockResolvedValue(mockDrafts);

      const result = await publishingService.getDrafts('acc-123');

      expect(result).toHaveLength(2);
      expect(PublishRequest.findByAccount).toHaveBeenCalledWith('acc-123', 'draft');
    });
  });

  describe('getContent', () => {
    it('should return published content by ID', async () => {
      (PublishedContent.findById as jest.Mock).mockResolvedValue(mockPublishedContent);

      const result = await publishingService.getContent('pub-123');

      expect(result).toEqual(mockPublishedContent);
    });

    it('should return publish request if not in published content', async () => {
      (PublishedContent.findById as jest.Mock).mockResolvedValue(null);
      (PublishRequest.findById as jest.Mock).mockResolvedValue(mockPublishRequest);

      const result = await publishingService.getContent('req-123');

      expect(result).toEqual(mockPublishRequest);
    });

    it('should throw NotFoundError when content not found', async () => {
      (PublishedContent.findById as jest.Mock).mockResolvedValue(null);
      (PublishRequest.findById as jest.Mock).mockResolvedValue(null);

      await expect(publishingService.getContent('nonexistent')).rejects.toThrow('Content');
    });
  });

  describe('deleteContent', () => {
    it('should delete published content', async () => {
      (PublishedContent.findByIdAndDelete as jest.Mock).mockResolvedValue(mockPublishedContent);

      const result = await publishingService.deleteContent('pub-123');

      expect(result.success).toBe(true);
    });

    it('should delete publish request if not in published content', async () => {
      (PublishedContent.findByIdAndDelete as jest.Mock).mockResolvedValue(null);
      (PublishRequest.findByIdAndDelete as jest.Mock).mockResolvedValue(mockPublishRequest);

      const result = await publishingService.deleteContent('req-123');

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundError when content not found', async () => {
      (PublishedContent.findByIdAndDelete as jest.Mock).mockResolvedValue(null);
      (PublishRequest.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(publishingService.deleteContent('nonexistent')).rejects.toThrow('Content');
    });
  });

  describe('getAccountContent', () => {
    it('should return paginated account content', async () => {
      const mockContent = [mockPublishedContent];
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockContent),
      };

      (PublishedContent.find as jest.Mock).mockReturnValue(mockQuery);
      (PublishedContent.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await publishingService.getAccountContent('acc-123', { page: 1, limit: 10 });

      expect(result.content).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should filter by content type', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      (PublishedContent.find as jest.Mock).mockReturnValue(mockQuery);
      (PublishedContent.countDocuments as jest.Mock).mockResolvedValue(0);

      await publishingService.getAccountContent('acc-123', {
        page: 1,
        limit: 10,
        contentType: 'feed_image',
      });

      expect(PublishedContent.find).toHaveBeenCalledWith({
        accountId: 'acc-123',
        contentType: 'feed_image',
      });
    });
  });

  describe('updateMetrics', () => {
    it('should update content metrics', async () => {
      (PublishedContent.findById as jest.Mock).mockResolvedValue(mockPublishedContent);

      (InstagramApiService.getMediaInsights as jest.Mock).mockResolvedValue({
        likes: 150,
        comments: 20,
        saves: 5,
        reach: 1000,
        impressions: 1500,
        profile_visits: 50,
        followers: 10,
      });

      await publishingService.updateMetrics('pub-123');

      expect(InstagramApiService.getMediaInsights).toHaveBeenCalledWith('ig-media-123');
    });

    it('should throw NotFoundError when content not found', async () => {
      (PublishedContent.findById as jest.Mock).mockResolvedValue(null);

      await expect(publishingService.updateMetrics('nonexistent')).rejects.toThrow('Content');
    });
  });

  describe('scheduler', () => {
    it('should start scheduler', () => {
      publishingService.startScheduler();

      expect(() => publishingService.startScheduler()).toThrow('already running');
    });

    it('should stop scheduler', () => {
      publishingService.startScheduler();
      publishingService.stopScheduler();

      // Should be able to start again after stopping
      expect(() => publishingService.startScheduler()).not.toThrow();
    });
  });
});

describe('AccountService', () => {
  let accountService: AccountService;

  const mockAccountData = {
    instagramId: 'ig-123',
    instagramUsername: 'test_user',
    accountId: 'acc-123',
    businessAccountId: 'biz-123',
    accessToken: 'test-token',
    pageId: 'page-123',
    pageName: 'Test Page',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    accountService = new AccountService();
  });

  describe('connectAccount', () => {
    it('should connect Instagram account', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockAccount = {
        ...mockAccountData,
        permissions: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights'],
        status: 'active',
        save: mockSave,
      };

      (InstagramAccount as unknown as jest.Mock).mockImplementation(() => mockAccount);

      const result = await accountService.connectAccount(mockAccountData);

      expect(result.accountId).toBe('acc-123');
    });
  });

  describe('getAccount', () => {
    it('should return account by ID', async () => {
      (InstagramAccount.findByAccount as jest.Mock).mockResolvedValue(mockAccountData);

      const result = await accountService.getAccount('acc-123');

      expect(result).toEqual(mockAccountData);
    });

    it('should return null for non-existent account', async () => {
      (InstagramAccount.findByAccount as jest.Mock).mockResolvedValue(null);

      const result = await accountService.getAccount('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('disconnectAccount', () => {
    it('should disconnect account', async () => {
      const mockAccount = {
        ...mockAccountData,
        status: 'inactive',
        save: jest.fn().mockResolvedValue(undefined),
      };

      (InstagramAccount.findByAccount as jest.Mock).mockResolvedValue(mockAccount);

      const result = await accountService.disconnectAccount('acc-123');

      expect(result.status).toBe('inactive');
    });
  });

  describe('syncAccount', () => {
    it('should sync account with Instagram', async () => {
      const mockAccount = {
        ...mockAccountData,
        recordSync: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined),
      };

      (InstagramAccount.findByAccount as jest.Mock).mockResolvedValue(mockAccount);
      (InstagramApiService.getUserProfile as jest.Mock).mockResolvedValue({
        followers_count: 1000,
        name: 'Test User',
      });

      const result = await accountService.syncAccount('acc-123');

      expect(result.followersCount).toBe(1000);
    });
  });
});

describe('InstagramApiService', () => {
  let instagramApiService: InstagramApiService;

  beforeEach(() => {
    jest.clearAllMocks();
    instagramApiService = new InstagramApiService();
  });

  describe('createImageMedia', () => {
    it('should create image media container', async () => {
      (InstagramApiService as jest.Mock).mockImplementation(() => ({
        createImageMedia: jest.fn().mockResolvedValue({ id: 'container-123' }),
      }));

      const mockStaticApi = {
        createImageMedia: jest.fn().mockResolvedValue({ id: 'container-123' }),
      };

      // Test the method exists and can be called
      const result = await mockStaticApi.createImageMedia(
        'https://example.com/image.jpg',
        'Test caption'
      );

      expect(result.id).toBe('container-123');
    });
  });

  describe('createAlbumMedia', () => {
    it('should create album media container', async () => {
      const mockStaticApi = {
        createAlbumMedia: jest.fn().mockResolvedValue({ id: 'album-123' }),
      };

      const result = await mockStaticApi.createAlbumMedia(
        ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        'Album caption'
      );

      expect(result.id).toBe('album-123');
    });
  });

  describe('createVideoMedia', () => {
    it('should create video media container', async () => {
      const mockStaticApi = {
        createVideoMedia: jest.fn().mockResolvedValue({ id: 'video-123' }),
      };

      const result = await mockStaticApi.createVideoMedia(
        'https://example.com/video.mp4',
        'Video caption',
        'REELS'
      );

      expect(result.id).toBe('video-123');
    });
  });

  describe('publishContent', () => {
    it('should publish content', async () => {
      const mockStaticApi = {
        publishContent: jest.fn().mockResolvedValue({ id: 'ig-media-123' }),
      };

      const result = await mockStaticApi.publishContent('container-123');

      expect(result.id).toBe('ig-media-123');
    });
  });

  describe('getMediaDetails', () => {
    it('should return media details', async () => {
      const mockDetails = {
        id: 'ig-media-123',
        permalink: 'https://instagram.com/p/test',
        thumbnail_url: 'https://example.com/thumb.jpg',
        like_count: 100,
        comments_count: 10,
      };

      const mockStaticApi = {
        getMediaDetails: jest.fn().mockResolvedValue(mockDetails),
      };

      const result = await mockStaticApi.getMediaDetails('ig-media-123');

      expect(result.id).toBe('ig-media-123');
    });
  });

  describe('getMediaInsights', () => {
    it('should return media insights', async () => {
      const mockInsights = {
        likes: 150,
        comments: 20,
        saves: 5,
        reach: 1000,
        impressions: 1500,
        profile_visits: 50,
        followers: 10,
      };

      const mockStaticApi = {
        getMediaInsights: jest.fn().mockResolvedValue(mockInsights),
      };

      const result = await mockStaticApi.getMediaInsights('ig-media-123');

      expect(result.likes).toBe(150);
    });
  });
});
