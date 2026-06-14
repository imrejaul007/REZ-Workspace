/**
 * Model Tests for Instagram Insights Service
 * Tests MongoDB schemas and model validation
 */

import { InstagramMedia, IInstagramMedia } from '../models/InstagramMedia';
import { InstagramAccountInsights, IInstagramAccountInsights } from '../models/InstagramAccountInsights';
import { InstagramAudienceInsights, IInstagramAudienceInsights } from '../models/InstagramAudienceInsights';

describe('InstagramMedia Model', () => {
  describe('Schema Validation', () => {
    it('should require instagramMediaId field', () => {
      const media = new InstagramMedia({
        instagramAccountId: 'acc-123',
        caption: 'Test post',
        mediaType: 'IMAGE',
      });

      const error = media.validateSync();
      expect(error?.errors.instagramMediaId).toBeDefined();
    });

    it('should require instagramAccountId field', () => {
      const media = new InstagramMedia({
        instagramMediaId: 'ig-media-123',
        caption: 'Test post',
        mediaType: 'IMAGE',
      });

      const error = media.validateSync();
      expect(error?.errors.instagramAccountId).toBeDefined();
    });

    it('should require mediaType field', () => {
      const media = new InstagramMedia({
        instagramMediaId: 'ig-media-123',
        instagramAccountId: 'acc-123',
        caption: 'Test post',
      });

      const error = media.validateSync();
      expect(error?.errors.mediaType).toBeDefined();
    });

    it('should accept valid media types', () => {
      const validTypes = ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'REELS'];

      validTypes.forEach((type) => {
        const media = new InstagramMedia({
          instagramMediaId: 'ig-media-123',
          instagramAccountId: 'acc-123',
          mediaType: type as IInstagramMedia['mediaType'],
        });

        const error = media.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid media types', () => {
      const media = new InstagramMedia({
        instagramMediaId: 'ig-media-123',
        instagramAccountId: 'acc-123',
        mediaType: 'INVALID' as IInstagramMedia['mediaType'],
      });

      const error = media.validateSync();
      expect(error?.errors.mediaType).toBeDefined();
    });

    it('should set default metrics to zero', () => {
      const media = new InstagramMedia({
        instagramMediaId: 'ig-media-123',
        instagramAccountId: 'acc-123',
        mediaType: 'IMAGE',
      });

      expect(media.likeCount).toBe(0);
      expect(media.commentsCount).toBe(0);
      expect(media.saveCount).toBe(0);
      expect(media.shareCount).toBe(0);
      expect(media.reach).toBe(0);
      expect(media.impressions).toBe(0);
    });

    it('should accept hashtags array', () => {
      const media = new InstagramMedia({
        instagramMediaId: 'ig-media-123',
        instagramAccountId: 'acc-123',
        mediaType: 'IMAGE',
        hashtags: ['travel', 'photography', 'lifestyle'],
      });

      const error = media.validateSync();
      expect(error).toBeUndefined();
    });
  });

  describe('Indexes', () => {
    it('should have instagramMediaId unique index', () => {
      const indexes = InstagramMedia.schema.indexes();
      const uniqueIndex = indexes.find(
        (idx) => idx[0] === 'instagramMediaId' && idx[1] === 1
      );
      expect(uniqueIndex).toBeDefined();
    });

    it('should have instagramAccountId index', () => {
      const indexes = InstagramMedia.schema.indexes();
      expect(indexes).toContainEqual(['instagramAccountId', 1]);
    });

    it('should have timestamp index for sorting', () => {
      const indexes = InstagramMedia.schema.indexes();
      const timestampIndex = indexes.find(
        (idx) => idx[0] && typeof idx[0] === 'object' && 'timestamp' in idx[0]
      );
      expect(timestampIndex).toBeDefined();
    });
  });
});

describe('InstagramAccountInsights Model', () => {
  describe('Schema Validation', () => {
    it('should require instagramAccountId field', () => {
      const insights = new InstagramAccountInsights({
        date: new Date(),
        impressions: 1000,
      });

      const error = insights.validateSync();
      expect(error?.errors.instagramAccountId).toBeDefined();
    });

    it('should require date field', () => {
      const insights = new InstagramAccountInsights({
        instagramAccountId: 'acc-123',
        impressions: 1000,
      });

      const error = insights.validateSync();
      expect(error?.errors.date).toBeDefined();
    });

    it('should reject negative impressions', () => {
      const insights = new InstagramAccountInsights({
        instagramAccountId: 'acc-123',
        date: new Date(),
        impressions: -100,
      });

      const error = insights.validateSync();
      expect(error?.errors.impressions).toBeDefined();
    });

    it('should reject negative reach', () => {
      const insights = new InstagramAccountInsights({
        instagramAccountId: 'acc-123',
        date: new Date(),
        impressions: 1000,
        reach: -100,
      });

      const error = insights.validateSync();
      expect(error?.errors.reach).toBeDefined();
    });

    it('should reject negative followerCount', () => {
      const insights = new InstagramAccountInsights({
        instagramAccountId: 'acc-123',
        date: new Date(),
        impressions: 1000,
        followerCount: -100,
      });

      const error = insights.validateSync();
      expect(error?.errors.followerCount).toBeDefined();
    });

    it('should set default values to 0', () => {
      const insights = new InstagramAccountInsights({
        instagramAccountId: 'acc-123',
        date: new Date(),
      });

      expect(insights.impressions).toBe(0);
      expect(insights.reach).toBe(0);
      expect(insights.profileViews).toBe(0);
      expect(insights.websiteClicks).toBe(0);
    });
  });

  describe('Indexes', () => {
    it('should have instagramAccountId and date compound index', () => {
      const indexes = InstagramAccountInsights.schema.indexes();
      const compoundIndex = indexes.find(
        (idx) =>
          idx[0] &&
          typeof idx[0] === 'object' &&
          'instagramAccountId' in idx[0] &&
          'date' in idx[0]
      );
      expect(compoundIndex).toBeDefined();
    });
  });
});

describe('InstagramAudienceInsights Model', () => {
  describe('Schema Validation', () => {
    it('should require instagramAccountId field', () => {
      const audience = new InstagramAudienceInsights({
        date: new Date(),
      });

      const error = audience.validateSync();
      expect(error?.errors.instagramAccountId).toBeDefined();
    });

    it('should require date field', () => {
      const audience = new InstagramAudienceInsights({
        instagramAccountId: 'acc-123',
      });

      const error = audience.validateSync();
      expect(error?.errors.date).toBeDefined();
    });

    it('should accept valid gender distribution', () => {
      const audience = new InstagramAudienceInsights({
        instagramAccountId: 'acc-123',
        date: new Date(),
        gender: { male: 40, female: 60, other: 0 },
      });

      const error = audience.validateSync();
      expect(error).toBeUndefined();
    });

    it('should accept valid age ranges', () => {
      const audience = new InstagramAudienceInsights({
        instagramAccountId: 'acc-123',
        date: new Date(),
        ageRanges: {
          '13-17': 5,
          '18-24': 30,
          '25-34': 40,
          '35-44': 15,
          '45-54': 7,
          '55-64': 2,
          '65+': 1,
        },
      });

      const error = audience.validateSync();
      expect(error).toBeUndefined();
    });

    it('should accept top countries array', () => {
      const audience = new InstagramAudienceInsights({
        instagramAccountId: 'acc-123',
        date: new Date(),
        topCountries: [
          { country: 'IN', percentage: 80 },
          { country: 'US', percentage: 10 },
          { country: 'UK', percentage: 5 },
        ],
      });

      const error = audience.validateSync();
      expect(error).toBeUndefined();
    });

    it('should accept active times data', () => {
      const audience = new InstagramAudienceInsights({
        instagramAccountId: 'acc-123',
        date: new Date(),
        activeTimes: {
          monday: [{ hour: 9, percentage: 20 }, { hour: 12, percentage: 15 }],
          tuesday: [{ hour: 10, percentage: 25 }],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
      });

      const error = audience.validateSync();
      expect(error).toBeUndefined();
    });

    it('should reject percentage over 100 in topCountries', () => {
      const audience = new InstagramAudienceInsights({
        instagramAccountId: 'acc-123',
        date: new Date(),
        topCountries: [{ country: 'IN', percentage: 150 }],
      });

      const error = audience.validateSync();
      expect(error?.errors['topCountries.0.percentage']).toBeDefined();
    });

    it('should reject invalid hour in activeTimes', () => {
      const audience = new InstagramAudienceInsights({
        instagramAccountId: 'acc-123',
        date: new Date(),
        activeTimes: {
          monday: [{ hour: 25, percentage: 20 }],
        },
      });

      const error = audience.validateSync();
      expect(error?.errors['activeTimes.monday.0.hour']).toBeDefined();
    });
  });

  describe('Indexes', () => {
    it('should have instagramAccountId and date compound index', () => {
      const indexes = InstagramAudienceInsights.schema.indexes();
      const compoundIndex = indexes.find(
        (idx) =>
          idx[0] &&
          typeof idx[0] === 'object' &&
          'instagramAccountId' in idx[0] &&
          'date' in idx[0]
      );
      expect(compoundIndex).toBeDefined();
    });
  });
});