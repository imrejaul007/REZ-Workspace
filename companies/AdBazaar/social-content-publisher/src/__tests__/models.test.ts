/**
 * Model Tests for Social Content Publisher
 * Tests MongoDB schemas and model validation
 */

import { Content, IContent, ContentStatus, ContentPlatform } from '../models/Content';
import { PublishedContent, IPublishedContent, PublishedStatus } from '../models/PublishedContent';
import { Platform, IPlatform, PlatformStatus } from '../models/Platform';
import { PlatformCredentials, IPlatformCredentials } from '../models/PlatformCredentials';

describe('Content Model', () => {
  describe('Schema Validation', () => {
    it('should require title field', () => {
      const content = new Content({
        body: 'Content body',
        author: 'user-123',
        companyId: 'company-123',
      });

      const error = content.validateSync();
      expect(error?.errors.title).toBeDefined();
    });

    it('should require body field', () => {
      const content = new Content({
        title: 'Test Title',
        author: 'user-123',
        companyId: 'company-123',
      });

      const error = content.validateSync();
      expect(error?.errors.body).toBeDefined();
    });

    it('should require author field', () => {
      const content = new Content({
        title: 'Test Title',
        body: 'Content body',
        companyId: 'company-123',
      });

      const error = content.validateSync();
      expect(error?.errors.author).toBeDefined();
    });

    it('should require companyId field', () => {
      const content = new Content({
        title: 'Test Title',
        body: 'Content body',
        author: 'user-123',
      });

      const error = content.validateSync();
      expect(error?.errors.companyId).toBeDefined();
    });

    it('should accept valid content statuses', () => {
      const statuses: ContentStatus[] = ['draft', 'scheduled', 'published', 'archived'];

      statuses.forEach((status) => {
        const content = new Content({
          title: 'Test Title',
          body: 'Content body',
          author: 'user-123',
          companyId: 'company-123',
          status,
        });

        const error = content.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid content status', () => {
      const content = new Content({
        title: 'Test Title',
        body: 'Content body',
        author: 'user-123',
        companyId: 'company-123',
        status: 'invalid_status' as ContentStatus,
      });

      const error = content.validateSync();
      expect(error?.errors.status).toBeDefined();
    });

    it('should accept valid platforms', () => {
      const platforms: ContentPlatform[] = ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube'];

      platforms.forEach((platform) => {
        const content = new Content({
          title: 'Test Title',
          body: 'Content body',
          author: 'user-123',
          companyId: 'company-123',
          platforms: [platform],
        });

        const error = content.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('should set default status to draft', () => {
      const content = new Content({
        title: 'Test Title',
        body: 'Content body',
        author: 'user-123',
        companyId: 'company-123',
      });

      expect(content.status).toBe('draft');
    });

    it('should accept mediaUrls array', () => {
      const content = new Content({
        title: 'Test Title',
        body: 'Content body',
        author: 'user-123',
        companyId: 'company-123',
        mediaUrls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      });

      const error = content.validateSync();
      expect(error).toBeUndefined();
    });

    it('should accept hashtags array', () => {
      const content = new Content({
        title: 'Test Title',
        body: 'Content body',
        author: 'user-123',
        companyId: 'company-123',
        hashtags: ['travel', 'photography', 'lifestyle'],
      });

      const error = content.validateSync();
      expect(error).toBeUndefined();
    });

    it('should limit hashtags to 30', () => {
      const content = new Content({
        title: 'Test Title',
        body: 'Content body',
        author: 'user-123',
        companyId: 'company-123',
        hashtags: Array(31).fill('tag'),
      });

      const error = content.validateSync();
      expect(error?.errors.hashtags).toBeDefined();
    });
  });

  describe('Indexes', () => {
    it('should have companyId index', () => {
      const indexes = Content.schema.indexes();
      expect(indexes).toContainEqual(['companyId', 1]);
    });

    it('should have author index', () => {
      const indexes = Content.schema.indexes();
      expect(indexes).toContainEqual(['author', 1]);
    });

    it('should have status index', () => {
      const indexes = Content.schema.indexes();
      expect(indexes).toContainEqual(['status', 1]);
    });
  });
});

describe('PublishedContent Model', () => {
  describe('Schema Validation', () => {
    it('should require contentId field', () => {
      const published = new PublishedContent({
        platform: 'instagram',
        platformPostId: 'ig-post-123',
        url: 'https://instagram.com/p/test',
        publishedAt: new Date(),
      });

      const error = published.validateSync();
      expect(error?.errors.contentId).toBeDefined();
    });

    it('should require platform field', () => {
      const published = new PublishedContent({
        contentId: 'content-123',
        platformPostId: 'ig-post-123',
        url: 'https://instagram.com/p/test',
        publishedAt: new Date(),
      });

      const error = published.validateSync();
      expect(error?.errors.platform).toBeDefined();
    });

    it('should require platformPostId field', () => {
      const published = new PublishedContent({
        contentId: 'content-123',
        platform: 'instagram',
        url: 'https://instagram.com/p/test',
        publishedAt: new Date(),
      });

      const error = published.validateSync();
      expect(error?.errors.platformPostId).toBeDefined();
    });

    it('should accept valid published statuses', () => {
      const statuses: PublishedStatus[] = ['published', 'scheduled', 'failed'];

      statuses.forEach((status) => {
        const published = new PublishedContent({
          contentId: 'content-123',
          platform: 'instagram',
          platformPostId: 'ig-post-123',
          url: 'https://instagram.com/p/test',
          status,
        });

        const error = published.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('should set default status to published', () => {
      const published = new PublishedContent({
        contentId: 'content-123',
        platform: 'instagram',
        platformPostId: 'ig-post-123',
        url: 'https://instagram.com/p/test',
      });

      expect(published.status).toBe('published');
    });

    it('should set default metrics to zero', () => {
      const published = new PublishedContent({
        contentId: 'content-123',
        platform: 'instagram',
        platformPostId: 'ig-post-123',
        url: 'https://instagram.com/p/test',
      });

      expect(published.likes).toBe(0);
      expect(published.comments).toBe(0);
      expect(published.shares).toBe(0);
      expect(published.views).toBe(0);
      expect(published.engagement).toBe(0);
    });
  });

  describe('Indexes', () => {
    it('should have contentId and platform compound index', () => {
      const indexes = PublishedContent.schema.indexes();
      const compoundIndex = indexes.find(
        (idx) =>
          idx[0] &&
          typeof idx[0] === 'object' &&
          'contentId' in idx[0] &&
          'platform' in idx[0]
      );
      expect(compoundIndex).toBeDefined();
    });

    it('should have publishedAt index', () => {
      const indexes = PublishedContent.schema.indexes();
      expect(indexes).toContainEqual(['publishedAt', -1]);
    });
  });
});

describe('Platform Model', () => {
  describe('Schema Validation', () => {
    it('should require name field', () => {
      const platform = new Platform({
        companyId: 'company-123',
        credentials: {},
      });

      const error = platform.validateSync();
      expect(error?.errors.name).toBeDefined();
    });

    it('should require companyId field', () => {
      const platform = new Platform({
        name: 'instagram',
        credentials: {},
      });

      const error = platform.validateSync();
      expect(error?.errors.companyId).toBeDefined();
    });

    it('should accept valid platform names', () => {
      const names = ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'pinterest'];

      names.forEach((name) => {
        const platform = new Platform({
          name,
          companyId: 'company-123',
          credentials: {},
        });

        const error = platform.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('should accept valid platform statuses', () => {
      const statuses: PlatformStatus[] = ['active', 'inactive', 'error', 'pending'];

      statuses.forEach((status) => {
        const platform = new Platform({
          name: 'instagram',
          companyId: 'company-123',
          credentials: {},
          status,
        });

        const error = platform.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('should set default status to pending', () => {
      const platform = new Platform({
        name: 'instagram',
        companyId: 'company-123',
        credentials: {},
      });

      expect(platform.status).toBe('pending');
    });
  });

  describe('Indexes', () => {
    it('should have name and companyId compound unique index', () => {
      const indexes = Platform.schema.indexes();
      const uniqueIndex = indexes.find(
        (idx) =>
          idx[0] &&
          typeof idx[0] === 'object' &&
          'name' in idx[0] &&
          'companyId' in idx[0]
      );
      expect(uniqueIndex).toBeDefined();
    });
  });
});

describe('PlatformCredentials Model', () => {
  describe('Schema Validation', () => {
    it('should require platform field', () => {
      const credentials = new PlatformCredentials({
        companyId: 'company-123',
        credentials: {},
      });

      const error = credentials.validateSync();
      expect(error?.errors.platform).toBeDefined();
    });

    it('should require companyId field', () => {
      const credentials = new PlatformCredentials({
        platform: 'instagram',
        credentials: {},
      });

      const error = credentials.validateSync();
      expect(error?.errors.companyId).toBeDefined();
    });

    it('should require credentials field', () => {
      const credentials = new PlatformCredentials({
        platform: 'instagram',
        companyId: 'company-123',
      });

      const error = credentials.validateSync();
      expect(error?.errors.credentials).toBeDefined();
    });

    it('should accept valid credentials structure', () => {
      const credentials = new PlatformCredentials({
        platform: 'instagram',
        companyId: 'company-123',
        credentials: {
          accessToken: 'test-token',
          accountId: 'acc-123',
        },
      });

      const error = credentials.validateSync();
      expect(error).toBeUndefined();
    });
  });

  describe('Indexes', () => {
    it('should have platform and companyId compound unique index', () => {
      const indexes = PlatformCredentials.schema.indexes();
      const compoundIndex = indexes.find(
        (idx) =>
          idx[0] &&
          typeof idx[0] === 'object' &&
          'platform' in idx[0] &&
          'companyId' in idx[0]
      );
      expect(compoundIndex).toBeDefined();
    });
  });
});