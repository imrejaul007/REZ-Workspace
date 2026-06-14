/**
 * Model Tests for Instagram Publishing Service
 * Tests MongoDB schemas and model validation
 */

import mongoose from 'mongoose';
import { PublishRequest, IPublishRequest, ContentType, PublishStatus } from '../models/PublishRequest';
import { PublishedContent, IPublishedContent, PublishedStatus, IMetrics } from '../models/PublishedContent';
import { InstagramAccount, IInstagramAccount, AccountStatus } from '../models/InstagramAccount';

describe('PublishRequest Model', () => {
  describe('Schema Validation', () => {
    it('should require accountId field', () => {
      const request = new PublishRequest({
        contentType: 'feed_image',
        caption: 'Test caption',
      });

      const error = request.validateSync();
      expect(error?.errors.accountId).toBeDefined();
    });

    it('should require contentType field', () => {
      const request = new PublishRequest({
        accountId: 'acc-123',
        caption: 'Test caption',
      });

      const error = request.validateSync();
      expect(error?.errors.contentType).toBeDefined();
    });

    it('should accept valid content types', () => {
      const validTypes: ContentType[] = ['feed_image', 'feed_album', 'feed_video', 'reel', 'story'];

      validTypes.forEach((type) => {
        const request = new PublishRequest({
          accountId: 'acc-123',
          contentType: type,
        });

        const error = request.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid content types', () => {
      const request = new PublishRequest({
        accountId: 'acc-123',
        contentType: 'invalid_type' as ContentType,
      });

      const error = request.validateSync();
      expect(error?.errors.contentType).toBeDefined();
    });

    it('should limit caption to 2200 characters', () => {
      const request = new PublishRequest({
        accountId: 'acc-123',
        contentType: 'feed_image',
        caption: 'A'.repeat(2201),
      });

      const error = request.validateSync();
      expect(error?.errors.caption).toBeDefined();
    });

    it('should set default status to draft', () => {
      const request = new PublishRequest({
        accountId: 'acc-123',
        contentType: 'feed_image',
      });

      expect(request.status).toBe('draft');
    });

    it('should set default retryCount to 0', () => {
      const request = new PublishRequest({
        accountId: 'acc-123',
        contentType: 'feed_image',
      });

      expect(request.retryCount).toBe(0);
    });

    it('should validate product tags', () => {
      const request = new PublishRequest({
        accountId: 'acc-123',
        contentType: 'feed_image',
        productTags: [
          { productId: 'prod-1', x: 0.5, y: 0.5 },
        ],
      });

      const error = request.validateSync();
      expect(error).toBeUndefined();
    });

    it('should reject product tags with invalid coordinates', () => {
      const request = new PublishRequest({
        accountId: 'acc-123',
        contentType: 'feed_image',
        productTags: [
          { productId: 'prod-1', x: 1.5, y: 0.5 },
        ],
      });

      const error = request.validateSync();
      expect(error?.errors['productTags.0.x']).toBeDefined();
    });

    it('should validate story config types', () => {
      const request = new PublishRequest({
        accountId: 'acc-123',
        contentType: 'story',
        storyConfig: {
          type: 'poll',
          pollQuestion: 'What do you think?',
          pollOptions: ['Yes', 'No'],
        },
      });

      const error = request.validateSync();
      expect(error).toBeUndefined();
    });
  });

  describe('Instance Methods', () => {
    it('should mark as publishing', () => {
      const request = new PublishRequest({
        accountId: 'acc-123',
        contentType: 'feed_image',
        status: 'draft',
      });

      request.markAsPublishing();

      expect(request.status).toBe('publishing');
    });

    it('should mark as published with content ID', () => {
      const request = new PublishRequest({
        accountId: 'acc-123',
        contentType: 'feed_image',
        status: 'publishing',
      });

      request.markAsPublished('pub-123');

      expect(request.status).toBe('published');
      expect(request.publishedAt).toBeDefined();
      expect(request.publishedContentId).toBe('pub-123');
    });

    it('should mark as failed with error message', () => {
      const request = new PublishRequest({
        accountId: 'acc-123',
        contentType: 'feed_image',
        status: 'publishing',
        retryCount: 0,
      });

      request.markAsFailed('API error');

      expect(request.status).toBe('failed');
      expect(request.errorMessage).toBe('API error');
      expect(request.retryCount).toBe(1);
    });
  });

  describe('Virtual Properties', () => {
    it('should generate full caption with hashtags', () => {
      const request = new PublishRequest({
        accountId: 'acc-123',
        contentType: 'feed_image',
        caption: 'Check out this post',
        hashtags: ['travel', 'photography'],
      });

      expect(request.fullCaption).toBe('Check out this post\n\n#travel #photography');
    });

    it('should return empty string when no caption or hashtags', () => {
      const request = new PublishRequest({
        accountId: 'acc-123',
        contentType: 'feed_image',
      });

      expect(request.fullCaption).toBe('');
    });
  });

  describe('Indexes', () => {
    it('should have accountId index', () => {
      const indexes = PublishRequest.schema.indexes();
      expect(indexes).toContainEqual(['accountId', 1]);
    });

    it('should have scheduledTime index', () => {
      const indexes = PublishRequest.schema.indexes();
      expect(indexes).toContainEqual(['scheduledTime', 1]);
    });

    it('should have status index', () => {
      const indexes = PublishRequest.schema.indexes();
      expect(indexes).toContainEqual(['status', 1]);
    });
  });
});

describe('PublishedContent Model', () => {
  describe('Schema Validation', () => {
    it('should require instagramMediaId field', () => {
      const content = new PublishedContent({
        accountId: 'acc-123',
        contentType: 'feed_image',
      });

      const error = content.validateSync();
      expect(error?.errors.instagramMediaId).toBeDefined();
    });

    it('should require accountId field', () => {
      const content = new PublishedContent({
        instagramMediaId: 'ig-media-123',
        contentType: 'feed_image',
      });

      const error = content.validateSync();
      expect(error?.errors.accountId).toBeDefined();
    });

    it('should require contentType field', () => {
      const content = new PublishedContent({
        instagramMediaId: 'ig-media-123',
        accountId: 'acc-123',
      });

      const error = content.validateSync();
      expect(error?.errors.contentType).toBeDefined();
    });

    it('should accept valid content types', () => {
      const validTypes = ['feed_image', 'feed_album', 'feed_video', 'reel', 'story'];

      validTypes.forEach((type) => {
        const content = new PublishedContent({
          instagramMediaId: 'ig-media-123',
          accountId: 'acc-123',
          contentType: type,
        });

        const error = content.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('should set default status to published', () => {
      const content = new PublishedContent({
        instagramMediaId: 'ig-media-123',
        accountId: 'acc-123',
        contentType: 'feed_image',
      });

      expect(content.status).toBe('published');
    });

    it('should validate mediaType enum', () => {
      const content = new PublishedContent({
        instagramMediaId: 'ig-media-123',
        accountId: 'acc-123',
        contentType: 'feed_image',
        mediaType: 'IMAGE',
      });

      const error = content.validateSync();
      expect(error).toBeUndefined();
    });

    it('should set default metrics to zero', () => {
      const content = new PublishedContent({
        instagramMediaId: 'ig-media-123',
        accountId: 'acc-123',
        contentType: 'feed_image',
      });

      expect(content.metrics).toEqual({
        likes: 0,
        comments: 0,
        saves: 0,
        reach: 0,
        impressions: 0,
        profileVisits: 0,
        follows: 0,
      });
    });
  });

  describe('Instance Methods', () => {
    it('should update metrics', () => {
      const content = new PublishedContent({
        instagramMediaId: 'ig-media-123',
        accountId: 'acc-123',
        contentType: 'feed_image',
        metrics: {
          likes: 100,
          comments: 10,
          saves: 5,
          reach: 1000,
          impressions: 1500,
          profileVisits: 50,
          follows: 10,
        },
      });

      content.updateMetrics({ likes: 150 });

      expect(content.metrics?.likes).toBe(150);
      expect(content.metrics?.comments).toBe(10);
    });

    it('should mark as failed', () => {
      const content = new PublishedContent({
        instagramMediaId: 'ig-media-123',
        accountId: 'acc-123',
        contentType: 'feed_image',
        status: 'published',
      });

      content.markAsFailed();

      expect(content.status).toBe('failed');
    });
  });

  describe('Indexes', () => {
    it('should have instagramMediaId unique index', () => {
      const indexes = PublishedContent.schema.indexes();
      const uniqueIndex = indexes.find(
        (idx) => idx[0] === 'instagramMediaId' && idx[1] === 1
      );
      expect(uniqueIndex).toBeDefined();
    });

    it('should have accountId and publishedAt compound index', () => {
      const indexes = PublishedContent.schema.indexes();
      const compoundIndex = indexes.find(
        (idx) =>
          idx[0] &&
          typeof idx[0] === 'object' &&
          'accountId' in idx[0] &&
          'publishedAt' in idx[0]
      );
      expect(compoundIndex).toBeDefined();
    });
  });
});

describe('InstagramAccount Model', () => {
  describe('Schema Validation', () => {
    it('should require instagramId field', () => {
      const account = new InstagramAccount({
        instagramUsername: 'test_user',
        accountId: 'acc-123',
        businessAccountId: 'biz-123',
        accessToken: 'test-token',
      });

      const error = account.validateSync();
      expect(error?.errors.instagramId).toBeDefined();
    });

    it('should require instagramUsername field', () => {
      const account = new InstagramAccount({
        instagramId: 'ig-123',
        accountId: 'acc-123',
        businessAccountId: 'biz-123',
        accessToken: 'test-token',
      });

      const error = account.validateSync();
      expect(error?.errors.instagramUsername).toBeDefined();
    });

    it('should require accountId field', () => {
      const account = new InstagramAccount({
        instagramId: 'ig-123',
        instagramUsername: 'test_user',
        businessAccountId: 'biz-123',
        accessToken: 'test-token',
      });

      const error = account.validateSync();
      expect(error?.errors.accountId).toBeDefined();
    });

    it('should require businessAccountId field', () => {
      const account = new InstagramAccount({
        instagramId: 'ig-123',
        instagramUsername: 'test_user',
        accountId: 'acc-123',
        accessToken: 'test-token',
      });

      const error = account.validateSync();
      expect(error?.errors.businessAccountId).toBeDefined();
    });

    it('should require accessToken field', () => {
      const account = new InstagramAccount({
        instagramId: 'ig-123',
        instagramUsername: 'test_user',
        accountId: 'acc-123',
        businessAccountId: 'biz-123',
      });

      const error = account.validateSync();
      expect(error?.errors.accessToken).toBeDefined();
    });

    it('should accept valid status values', () => {
      const validStatuses: AccountStatus[] = ['active', 'inactive', 'expired', 'error'];

      validStatuses.forEach((status) => {
        const account = new InstagramAccount({
          instagramId: 'ig-123',
          instagramUsername: 'test_user',
          accountId: 'acc-123',
          businessAccountId: 'biz-123',
          accessToken: 'test-token',
          status,
        });

        const error = account.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid status values', () => {
      const account = new InstagramAccount({
        instagramId: 'ig-123',
        instagramUsername: 'test_user',
        accountId: 'acc-123',
        businessAccountId: 'biz-123',
        accessToken: 'test-token',
        status: 'invalid_status' as AccountStatus,
      });

      const error = account.validateSync();
      expect(error?.errors.status).toBeDefined();
    });

    it('should set default permissions', () => {
      const account = new InstagramAccount({
        instagramId: 'ig-123',
        instagramUsername: 'test_user',
        accountId: 'acc-123',
        businessAccountId: 'biz-123',
        accessToken: 'test-token',
      });

      expect(account.permissions).toEqual([
        'instagram_basic',
        'instagram_content_publish',
        'instagram_manage_insights',
      ]);
    });

    it('should set default status to active', () => {
      const account = new InstagramAccount({
        instagramId: 'ig-123',
        instagramUsername: 'test_user',
        accountId: 'acc-123',
        businessAccountId: 'biz-123',
        accessToken: 'test-token',
      });

      expect(account.status).toBe('active');
    });

    it('should set default followersCount to 0', () => {
      const account = new InstagramAccount({
        instagramId: 'ig-123',
        instagramUsername: 'test_user',
        accountId: 'acc-123',
        businessAccountId: 'biz-123',
        accessToken: 'test-token',
      });

      expect(account.followersCount).toBe(0);
    });
  });

  describe('Instance Methods', () => {
    it('should return true for valid token without expiry', () => {
      const account = new InstagramAccount({
        instagramId: 'ig-123',
        instagramUsername: 'test_user',
        accountId: 'acc-123',
        businessAccountId: 'biz-123',
        accessToken: 'test-token',
      });

      expect(account.isTokenValid()).toBe(true);
    });

    it('should return false for expired token', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const account = new InstagramAccount({
        instagramId: 'ig-123',
        instagramUsername: 'test_user',
        accountId: 'acc-123',
        businessAccountId: 'biz-123',
        accessToken: 'test-token',
        accessTokenExpiresAt: pastDate,
      });

      expect(account.isTokenValid()).toBe(false);
    });

    it('should return true for future token expiry', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const account = new InstagramAccount({
        instagramId: 'ig-123',
        instagramUsername: 'test_user',
        accountId: 'acc-123',
        businessAccountId: 'biz-123',
        accessToken: 'test-token',
        accessTokenExpiresAt: futureDate,
      });

      expect(account.isTokenValid()).toBe(true);
    });

    it('should mark as expired', () => {
      const account = new InstagramAccount({
        instagramId: 'ig-123',
        instagramUsername: 'test_user',
        accountId: 'acc-123',
        businessAccountId: 'biz-123',
        accessToken: 'test-token',
        status: 'active',
      });

      account.markAsExpired();

      expect(account.status).toBe('expired');
    });

    it('should mark as error with message', () => {
      const account = new InstagramAccount({
        instagramId: 'ig-123',
        instagramUsername: 'test_user',
        accountId: 'acc-123',
        businessAccountId: 'biz-123',
        accessToken: 'test-token',
        status: 'active',
      });

      account.markAsError('Token refresh failed');

      expect(account.status).toBe('error');
      expect(account.errorMessage).toBe('Token refresh failed');
    });

    it('should record publish time', () => {
      const account = new InstagramAccount({
        instagramId: 'ig-123',
        instagramUsername: 'test_user',
        accountId: 'acc-123',
        businessAccountId: 'biz-123',
        accessToken: 'test-token',
      });

      account.recordPublish();

      expect(account.lastPublishAt).toBeDefined();
    });

    it('should record sync time', () => {
      const account = new InstagramAccount({
        instagramId: 'ig-123',
        instagramUsername: 'test_user',
        accountId: 'acc-123',
        businessAccountId: 'biz-123',
        accessToken: 'test-token',
      });

      account.recordSync();

      expect(account.lastSyncAt).toBeDefined();
    });
  });

  describe('Indexes', () => {
    it('should have instagramId unique index', () => {
      const indexes = InstagramAccount.schema.indexes();
      const uniqueIndex = indexes.find(
        (idx) => idx[0] === 'instagramId' && idx[1] === 1
      );
      expect(uniqueIndex).toBeDefined();
    });

    it('should have accountId index', () => {
      const indexes = InstagramAccount.schema.indexes();
      expect(indexes).toContainEqual(['accountId', 1]);
    });

    it('should have businessAccountId index', () => {
      const indexes = InstagramAccount.schema.indexes();
      expect(indexes).toContainEqual(['businessAccountId', 1]);
    });

    it('should have status index', () => {
      const indexes = InstagramAccount.schema.indexes();
      expect(indexes).toContainEqual(['status', 1]);
    });
  });
});