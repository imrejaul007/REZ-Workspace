/**
 * Model Tests for Hashtag Research Engine
 * Tests MongoDB schemas and model validation
 */

import { Hashtag, IHashtag } from '../models/Hashtag';
import { HashtagAnalytics, IHashtagAnalytics } from '../models/HashtagAnalytics';
import { TrendingHashtag, ITrendingHashtag } from '../models/TrendingHashtag';
import { TrackedHashtag, ITrackedHashtag } from '../models/TrackedHashtag';

describe('Hashtag Model', () => {
  describe('Schema Validation', () => {
    it('should require name field', () => {
      const hashtag = new Hashtag({
        postsCount: 1000000,
      });

      const error = hashtag.validateSync();
      expect(error?.errors.name).toBeDefined();
    });

    it('should require postsCount field', () => {
      const hashtag = new Hashtag({
        name: 'travel',
      });

      const error = hashtag.validateSync();
      expect(error?.errors.postsCount).toBeDefined();
    });

    it('should reject negative postsCount', () => {
      const hashtag = new Hashtag({
        name: 'travel',
        postsCount: -100,
      });

      const error = hashtag.validateSync();
      expect(error?.errors.postsCount).toBeDefined();
    });

    it('should set default avgLikes to 0', () => {
      const hashtag = new Hashtag({
        name: 'travel',
        postsCount: 1000000,
      });

      expect(hashtag.avgLikes).toBe(0);
      expect(hashtag.avgComments).toBe(0);
      expect(hashtag.avgReach).toBe(0);
    });

    it('should accept valid category values', () => {
      const categories = ['travel', 'food', 'fashion', 'fitness', 'tech', 'business'];

      categories.forEach((category) => {
        const hashtag = new Hashtag({
          name: 'testHashtag',
          postsCount: 1000,
          category,
        });

        const error = hashtag.validateSync();
        expect(error).toBeUndefined();
      });
    });

    it('should accept valid difficulty values', () => {
      const difficulties = ['low', 'medium', 'high', 'extreme'];

      difficulties.forEach((difficulty) => {
        const hashtag = new Hashtag({
          name: 'testHashtag',
          postsCount: 1000,
          difficulty: difficulty as IHashtag['difficulty'],
        });

        const error = hashtag.validateSync();
        expect(error).toBeUndefined();
      });
    });
  });

  describe('Indexes', () => {
    it('should have name unique index', () => {
      const indexes = Hashtag.schema.indexes();
      const uniqueIndex = indexes.find(
        (idx) => idx[0] === 'name' && idx[1] === 1
      );
      expect(uniqueIndex).toBeDefined();
    });

    it('should have postsCount index for sorting', () => {
      const indexes = Hashtag.schema.indexes();
      expect(indexes).toContainEqual(['postsCount', -1]);
    });
  });
});

describe('HashtagAnalytics Model', () => {
  describe('Schema Validation', () => {
    it('should require hashtagName field', () => {
      const analytics = new HashtagAnalytics({
        date: new Date(),
        avgEngagement: 500,
      });

      const error = analytics.validateSync();
      expect(error?.errors.hashtagName).toBeDefined();
    });

    it('should require date field', () => {
      const analytics = new HashtagAnalytics({
        hashtagName: 'travel',
        avgEngagement: 500,
      });

      const error = analytics.validateSync();
      expect(error?.errors.date).toBeDefined();
    });

    it('should reject negative avgEngagement', () => {
      const analytics = new HashtagAnalytics({
        hashtagName: 'travel',
        date: new Date(),
        avgEngagement: -100,
      });

      const error = analytics.validateSync();
      expect(error?.errors.avgEngagement).toBeDefined();
    });

    it('should accept bestTimes array', () => {
      const analytics = new HashtagAnalytics({
        hashtagName: 'travel',
        date: new Date(),
        bestTimes: [
          { day: 'monday', hour: 9, avgEngagement: 800 },
          { day: 'tuesday', hour: 10, avgEngagement: 750 },
        ],
      });

      const error = analytics.validateSync();
      expect(error).toBeUndefined();
    });

    it('should reject invalid day in bestTimes', () => {
      const analytics = new HashtagAnalytics({
        hashtagName: 'travel',
        date: new Date(),
        bestTimes: [
          { day: 'invalid', hour: 9, avgEngagement: 800 },
        ],
      });

      const error = analytics.validateSync();
      expect(error?.errors['bestTimes.0.day']).toBeDefined();
    });
  });

  describe('Indexes', () => {
    it('should have hashtagName and date compound index', () => {
      const indexes = HashtagAnalytics.schema.indexes();
      const compoundIndex = indexes.find(
        (idx) =>
          idx[0] &&
          typeof idx[0] === 'object' &&
          'hashtagName' in idx[0] &&
          'date' in idx[0]
      );
      expect(compoundIndex).toBeDefined();
    });
  });
});

describe('TrendingHashtag Model', () => {
  describe('Schema Validation', () => {
    it('should require name field', () => {
      const trending = new TrendingHashtag({
        category: 'travel',
        growthRate: 50,
      });

      const error = trending.validateSync();
      expect(error?.errors.name).toBeDefined();
    });

    it('should require category field', () => {
      const trending = new TrendingHashtag({
        name: 'trendingHashtag',
        growthRate: 50,
      });

      const error = trending.validateSync();
      expect(error?.errors.category).toBeDefined();
    });

    it('should require growthRate field', () => {
      const trending = new TrendingHashtag({
        name: 'trendingHashtag',
        category: 'travel',
      });

      const error = trending.validateSync();
      expect(error?.errors.growthRate).toBeDefined();
    });

    it('should reject negative growthRate', () => {
      const trending = new TrendingHashtag({
        name: 'trendingHashtag',
        category: 'travel',
        growthRate: -10,
      });

      const error = trending.validateSync();
      expect(error?.errors.growthRate).toBeDefined();
    });

    it('should set default velocity to 0', () => {
      const trending = new TrendingHashtag({
        name: 'trendingHashtag',
        category: 'travel',
        growthRate: 50,
      });

      expect(trending.velocity).toBe(0);
    });
  });

  describe('Indexes', () => {
    it('should have name unique index', () => {
      const indexes = TrendingHashtag.schema.indexes();
      const uniqueIndex = indexes.find(
        (idx) => idx[0] === 'name' && idx[1] === 1
      );
      expect(uniqueIndex).toBeDefined();
    });

    it('should have growthRate index for sorting', () => {
      const indexes = TrendingHashtag.schema.indexes();
      expect(indexes).toContainEqual(['growthRate', -1]);
    });

    it('should have category index', () => {
      const indexes = TrendingHashtag.schema.indexes();
      expect(indexes).toContainEqual(['category', 1]);
    });
  });
});

describe('TrackedHashtag Model', () => {
  describe('Schema Validation', () => {
    it('should require name field', () => {
      const tracked = new TrackedHashtag({
        companyId: 'company-123',
      });

      const error = tracked.validateSync();
      expect(error?.errors.name).toBeDefined();
    });

    it('should require companyId field', () => {
      const tracked = new TrackedHashtag({
        name: 'travel',
      });

      const error = tracked.validateSync();
      expect(error?.errors.companyId).toBeDefined();
    });

    it('should accept valid notification preferences', () => {
      const tracked = new TrackedHashtag({
        name: 'travel',
        companyId: 'company-123',
        notifications: {
          trending: true,
          dailyReport: false,
          competitorMention: true,
        },
      });

      const error = tracked.validateSync();
      expect(error).toBeUndefined();
    });

    it('should set default notification preferences', () => {
      const tracked = new TrackedHashtag({
        name: 'travel',
        companyId: 'company-123',
      });

      expect(tracked.notifications?.trending).toBe(true);
      expect(tracked.notifications?.dailyReport).toBe(true);
      expect(tracked.notifications?.competitorMention).toBe(false);
    });
  });

  describe('Indexes', () => {
    it('should have name and companyId compound unique index', () => {
      const indexes = TrackedHashtag.schema.indexes();
      const compoundIndex = indexes.find(
        (idx) =>
          idx[0] &&
          typeof idx[0] === 'object' &&
          'name' in idx[0] &&
          'companyId' in idx[0]
      );
      expect(compoundIndex).toBeDefined();
    });
  });
});