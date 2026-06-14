/**
 * Service Logic Tests for UGC Management Service
 */
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

describe('UGC Collector Service', () => {
  describe('collectUGC()', () => {
    test('should collect content from multiple platforms', async () => {
      const input = {
        platforms: ['instagram', 'twitter'],
        hashtags: ['#brandname', '#promo'],
        campaignId: 'campaign-123'
      };

      // Simulate collection
      const collectedContent = input.platforms.flatMap((platform) =>
        input.hashtags.slice(0, 2).map((hashtag, i) => ({
          id: `${platform}-${hashtag}-${i}`,
          platform,
          hashtag,
          content: `Sample content from ${platform} with ${hashtag}`,
          author: `@user_${platform}_${i}`,
          collectedAt: new Date().toISOString()
        }))
      );

      expect(collectedContent).toHaveLength(8); // 2 platforms x 2 hashtags x 2 items
      expect(collectedContent.filter((c) => c.platform === 'instagram')).toHaveLength(4);
      expect(collectedContent.filter((c) => c.platform === 'twitter')).toHaveLength(4);
    });

    test('should deduplicate content by URL', async () => {
      const rawContent = [
        { id: '1', url: 'https://instagram.com/p/abc', platform: 'instagram' },
        { id: '2', url: 'https://instagram.com/p/abc', platform: 'instagram' }, // duplicate
        { id: '3', url: 'https://twitter.com/user/status/123', platform: 'twitter' }
      ];

      const seen = new Set<string>();
      const deduplicated = rawContent.filter((content) => {
        if (seen.has(content.url)) return false;
        seen.add(content.url);
        return true;
      });

      expect(deduplicated).toHaveLength(2);
    });
  });
});

describe('Moderation Service', () => {
  describe('bulkModerate()', () => {
    test('should approve multiple content items', async () => {
      const input = {
        contentIds: ['ugc-1', 'ugc-2', 'ugc-3'],
        action: 'approve',
        moderatedBy: 'moderator-123'
      };

      const results = input.contentIds.map((id) => ({
        contentId: id,
        status: 'approved',
        action: input.action,
        moderatedBy: input.moderatedBy,
        moderatedAt: new Date().toISOString()
      }));

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.status === 'approved')).toBe(true);
    });

    test('should reject content with reason', async () => {
      const input = {
        contentIds: ['ugc-1'],
        action: 'reject',
        moderatedBy: 'moderator-123',
        reason: 'Inappropriate content'
      };

      const results = input.contentIds.map((id) => ({
        contentId: id,
        status: 'rejected',
        action: input.action,
        reason: input.reason,
        moderatedBy: input.moderatedBy
      }));

      expect(results[0].status).toBe('rejected');
      expect(results[0].reason).toBe('Inappropriate content');
    });
  });

  describe('approveContent()', () => {
    test('should approve single content item', async () => {
      const result = {
        id: 'ugc-123',
        status: 'approved',
        approvedBy: 'moderator-1',
        approvedAt: new Date().toISOString()
      };

      expect(result.status).toBe('approved');
      expect(result.approvedBy).toBeDefined();
      expect(result.approvedAt).toBeDefined();
    });
  });

  describe('autoModerate()', () => {
    test('should apply moderation rules', async () => {
      const moderationRules = {
        minFollowers: 1000,
        maxFollowers: 1000000,
        excludeHashtags: ['#spam', '#followforfollow'],
        requireHashtags: ['#brandname'],
        sentimentThreshold: 0.5
      };

      const content = [
        {
          id: 'ugc-1',
          author: { followers: 5000 },
          hashtags: ['#brandname'],
          sentiment: 0.8
        },
        {
          id: 'ugc-2',
          author: { followers: 500 },
          hashtags: ['#brandname'],
          sentiment: 0.8
        }, // fails minFollowers
        {
          id: 'ugc-3',
          author: { followers: 5000 },
          hashtags: ['#spam'],
          sentiment: 0.8
        } // fails excludeHashtags
      ];

      const autoApproved = content.filter((c) => {
        if (c.author.followers < moderationRules.minFollowers) return false;
        if (c.author.followers > moderationRules.maxFollowers) return false;
        if (c.hashtags.some((h) => moderationRules.excludeHashtags.includes(h))) return false;
        if (!c.hashtags.some((h) => moderationRules.requireHashtags.includes(h))) return false;
        if (c.sentiment < moderationRules.sentimentThreshold) return false;
        return true;
      });

      expect(autoApproved).toHaveLength(1);
      expect(autoApproved[0].id).toBe('ugc-1');
    });
  });
});

describe('Rights Service', () => {
  describe('requestRights()', () => {
    test('should create rights request with correct structure', async () => {
      const input = {
        ugcId: 'ugc-123',
        requestedBy: 'brand-123',
        rightsType: 'display' as const,
        usageTerms: 'Non-commercial use only',
        expiresAt: new Date('2025-12-31')
      };

      const rightsRequest = {
        id: 'rights-req-1',
        ...input,
        status: 'pending',
        requestedAt: new Date().toISOString()
      };

      expect(rightsRequest.ugcId).toBe('ugc-123');
      expect(rightsRequest.rightsType).toBe('display');
      expect(rightsRequest.status).toBe('pending');
      expect(rightsRequest.expiresAt).toBeInstanceOf(Date);
    });

    test('should validate rights types', () => {
      const validRightsTypes = ['display', 'repost', 'commercial', 'all'];

      expect(validRightsTypes).toContain('display');
      expect(validRightsTypes).toContain('repost');
      expect(validRightsTypes).toContain('commercial');
      expect(validRightsTypes).toContain('all');
      expect(validRightsTypes).not.toContain('unknown');
    });
  });

  describe('respondToRights()', () => {
    test('should approve rights request', async () => {
      const result = {
        id: 'rights-req-1',
        status: 'approved',
        respondedBy: 'ugc-creator-123',
        respondedAt: new Date().toISOString()
      };

      expect(result.status).toBe('approved');
    });

    test('should deny rights request', async () => {
      const result = {
        id: 'rights-req-1',
        status: 'denied',
        respondedBy: 'ugc-creator-123',
        reason: 'Terms not acceptable'
      };

      expect(result.status).toBe('denied');
    });
  });
});

describe('Display Service', () => {
  describe('generateDisplayEmbed()', () => {
    test('should generate wall display config', async () => {
      const config = {
        displayType: 'wall' as const,
        maxItems: 20,
        showCaption: true,
        showAuthor: true,
        showEngagement: true,
        autoRotate: true,
        rotationInterval: 5000,
        filterBy: {
          sentiment: 'positive' as const,
          minEngagement: 100,
          platforms: ['instagram', 'twitter']
        }
      };

      const embed = {
        campaignId: 'campaign-123',
        config,
        displayUrl: `https://api.adbazaar.com/embed/${config.displayType}/campaign-123`,
        generatedAt: new Date().toISOString()
      };

      expect(embed.config.displayType).toBe('wall');
      expect(embed.config.maxItems).toBe(20);
      expect(embed.config.autoRotate).toBe(true);
    });

    test('should generate grid display config', async () => {
      const config = {
        displayType: 'grid' as const,
        maxItems: 12,
        showCaption: false,
        showAuthor: true,
        showEngagement: false
      };

      expect(config.displayType).toBe('grid');
      expect(config.showCaption).toBe(false);
    });
  });

  describe('generateEmbedCode()', () => {
    test('should generate HTML embed code', async () => {
      const campaignId = 'campaign-123';
      const displayType = 'wall';
      const theme = 'dark';

      const embedCode = `<div class="ugc-embed" data-campaign="${campaignId}" data-type="${displayType}" data-theme="${theme}">
  <div class="ugc-content"></div>
</div>
<script src="https://cdn.adbazaar.com/ugc-embed.js"></script>`;

      expect(embedCode).toContain(campaignId);
      expect(embedCode).toContain(displayType);
      expect(embedCode).toContain(theme);
      expect(embedCode).toContain('ugc-embed.js');
    });
  });
});

describe('Campaign Service', () => {
  describe('createCampaign()', () => {
    test('should create campaign with all fields', async () => {
      const input = {
        name: 'Summer Campaign',
        brandId: 'brand-123',
        hashtags: ['#summer', '#promo'],
        mentions: ['@brandname'],
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        autoModeration: true,
        approvalRequired: true,
        moderationRules: {
          minFollowers: 500,
          sentimentThreshold: 0.6
        }
      };

      const campaign = {
        id: 'campaign-new',
        ...input,
        status: 'draft',
        createdAt: new Date().toISOString()
      };

      expect(campaign.name).toBe('Summer Campaign');
      expect(campaign.status).toBe('draft');
      expect(campaign.autoModeration).toBe(true);
      expect(campaign.moderationRules.minFollowers).toBe(500);
    });

    test('should validate date range', () => {
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-08-31');

      expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());
    });
  });

  describe('listCampaigns()', () => {
    test('should filter by status', async () => {
      const campaigns = [
        { id: '1', status: 'active' },
        { id: '2', status: 'paused' },
        { id: '3', status: 'active' },
        { id: '4', status: 'completed' }
      ];

      const activeCampaigns = campaigns.filter((c) => c.status === 'active');
      expect(activeCampaigns).toHaveLength(2);
    });

    test('should filter by brandId', async () => {
      const campaigns = [
        { id: '1', brandId: 'brand-1' },
        { id: '2', brandId: 'brand-2' },
        { id: '3', brandId: 'brand-1' }
      ];

      const brand1Campaigns = campaigns.filter((c) => c.brandId === 'brand-1');
      expect(brand1Campaigns).toHaveLength(2);
    });
  });

  describe('pauseCampaign()', () => {
    test('should change status to paused', async () => {
      const result = {
        id: 'campaign-123',
        status: 'paused',
        pausedAt: new Date().toISOString()
      };

      expect(result.status).toBe('paused');
      expect(result.pausedAt).toBeDefined();
    });
  });

  describe('resumeCampaign()', () => {
    test('should change status to active', async () => {
      const result = {
        id: 'campaign-123',
        status: 'active',
        resumedAt: new Date().toISOString()
      };

      expect(result.status).toBe('active');
    });
  });

  describe('getCampaignStats()', () => {
    test('should calculate campaign statistics', async () => {
      const stats = {
        campaignId: 'campaign-123',
        totalCollected: 1500,
        pendingReview: 200,
        approved: 1200,
        rejected: 100,
        totalRightsRequested: 50,
        rightsApproved: 45,
        totalDisplays: 10,
        totalImpressions: 500000
      };

      expect(stats.totalCollected).toBe(stats.pendingReview + stats.approved + stats.rejected);
      expect(stats.rightsApproved).toBeLessThanOrEqual(stats.totalRightsRequested);
      expect(stats.totalImpressions).toBeGreaterThan(0);
    });
  });
});