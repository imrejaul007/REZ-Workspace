/**
 * UGC Management Service - Service Tests
 * Tests business logic for content moderation, rights management, and display
 */

import { ModerationService } from '../services/moderationService';
import { RightsService } from '../services/rightsService';
import { DisplayService } from '../services/displayService';
import { UGCCollectorService } from '../services/ugcCollectorService';
import { IUGCContent, UGCContent } from '../models/UGCContent';
import { UGCCampaign } from '../models/UGCCampaign';
import { UGCRights } from '../models/UGCRights';

// Mock models
jest.mock('../models/UGCContent', () => {
  const mockSave = jest.fn().mockResolvedValue(true);
  const mockModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn(),
  };
  return {
    UGCContent: {
      ...mockModel,
      new: jest.fn().mockImplementation(() => ({
        save: mockSave,
      })),
    },
    IUGCContent: {},
  };
});

jest.mock('../models/UGCCampaign', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../models/UGCRights', () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
}));

describe('ModerationService', () => {
  let service: ModerationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ModerationService();
  });

  describe('autoModerate', () => {
    it('should throw error if campaign not found', async () => {
      (UGCCampaign.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.autoModerate('nonexistent-campaign')).rejects.toThrow('Campaign not found');
    });

    it('should process pending content', async () => {
      const mockCampaign = createMockUGCCampaign({
        approvalRequired: false,
        moderationRules: {},
      });
      (UGCCampaign.findById as jest.Mock).mockResolvedValue(mockCampaign);

      const mockContent = createMockUGCContent({
        campaignId: 'campaign-123',
        caption: 'Great product!',
      });
      (UGCContent.find as jest.Mock).mockResolvedValue([mockContent]);
      (UGCContent.findById as jest.Mock).mockResolvedValue(mockContent);

      const result = await service.autoModerate('campaign-123');

      expect(result.processed).toBe(1);
    });
  });

  describe('moderateContent', () => {
    it('should approve valid content', async () => {
      const content = createMockUGCContent({
        caption: 'Amazing product, love it! #best',
        hashtags: ['#test'],
      });

      const result = await service.moderateContent(content, {});

      expect(result.approved).toBe(true);
      expect(result.sentiment).toBe('positive');
    });

    it('should reject content with low follower count', async () => {
      const content = createMockUGCContent({
        author: { ...createMockUGCContent().author, followerCount: 100 },
        caption: 'Test caption',
      });
      const rules = { minFollowers: 1000 };

      const result = await service.moderateContent(content, rules as any);

      expect(result.approved).toBe(false);
      expect(result.reason).toContain('Follower count');
    });

    it('should reject content with excluded hashtags', async () => {
      const content = createMockUGCContent({
        hashtags: ['#spam', '#test'],
      });
      const rules = { excludeHashtags: ['#spam'] };

      const result = await service.moderateContent(content, rules as any);

      expect(result.approved).toBe(false);
      expect(result.reason).toContain('excluded hashtags');
    });

    it('should reject content missing required hashtags', async () => {
      const content = createMockUGCContent({
        hashtags: ['#random'],
      });
      const rules = { requireHashtags: ['#required'] };

      const result = await service.moderateContent(content, rules as any);

      expect(result.approved).toBe(false);
      expect(result.reason).toContain('Missing required hashtags');
    });

    it('should reject spam content', async () => {
      const content = createMockUGCContent({
        caption: 'BUY NOW! Click here for free money! Act now!',
        hashtags: ['#one', '#two', '#three', '#four', '#five', '#six', '#seven', '#eight', '#nine', '#ten', '#eleven'],
      });

      const result = await service.moderateContent(content, {});

      expect(result.approved).toBe(false);
      expect(result.reason).toContain('spam');
    });

    it('should reject content with excessive caps', async () => {
      const content = createMockUGCContent({
        caption: 'THIS IS ALL CAPS AND VERY LOUD AND ANNOYING CONTENT THAT NOBODY WANTS TO READ',
      });

      const result = await service.moderateContent(content, {});

      expect(result.approved).toBe(false);
    });

    it('should analyze sentiment correctly', async () => {
      const content = createMockUGCContent({
        caption: 'This is amazing and excellent! Best product ever!',
      });

      const result = await service.moderateContent(content, {});

      expect(result.sentiment).toBe('positive');
      expect(result.sentimentScore).toBeGreaterThan(0);
    });

    it('should handle negative sentiment', async () => {
      const content = createMockUGCContent({
        caption: 'This is terrible and awful! Worst experience ever!',
      });

      const result = await service.moderateContent(content, {});

      expect(result.sentiment).toBe('negative');
      expect(result.sentimentScore).toBeLessThan(0);
    });
  });

  describe('approveContent', () => {
    it('should throw error if content not found', async () => {
      (UGCContent.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.approveContent('nonexistent', 'admin')).rejects.toThrow('Content not found');
    });

    it('should approve content successfully', async () => {
      const mockContent = createMockUGCContent();
      (UGCContent.findById as jest.Mock).mockResolvedValue(mockContent);
      (UGCCampaign.findByIdAndUpdate as jest.Mock).mockResolvedValue(true);

      const result = await service.approveContent('ugc-123', 'admin');

      expect(mockContent.status).toBe('approved');
      expect(mockContent.approvedBy).toBe('admin');
    });
  });

  describe('rejectContent', () => {
    it('should reject content with reason', async () => {
      const mockContent = createMockUGCContent();
      (UGCContent.findById as jest.Mock).mockResolvedValue(mockContent);

      const result = await service.rejectContent('ugc-123', 'admin', 'Inappropriate content');

      expect(mockContent.status).toBe('rejected');
      expect(mockContent.moderationNotes).toBe('Inappropriate content');
    });
  });

  describe('bulkModerate', () => {
    it('should bulk approve content', async () => {
      const mockContent = createMockUGCContent();
      (UGCContent.findById as jest.Mock).mockResolvedValue(mockContent);
      (UGCCampaign.findByIdAndUpdate as jest.Mock).mockResolvedValue(true);

      const result = await service.bulkModerate(['ugc-1', 'ugc-2'], 'approve', 'admin');

      expect(result.processed).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should handle partial failures', async () => {
      (UGCContent.findById as jest.Mock)
        .mockResolvedValueOnce(createMockUGCContent())
        .mockResolvedValueOnce(null); // Second one fails

      const result = await service.bulkModerate(['ugc-1', 'ugc-2'], 'approve', 'admin');

      expect(result.processed).toBe(2);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
    });
  });
});

describe('RightsService', () => {
  let service: RightsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RightsService();
  });

  describe('requestRights', () => {
    it('should throw error if content not found', async () => {
      (UGCContent.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.requestRights('nonexistent', 'brand-123', 'display')
      ).rejects.toThrow('Content not found');
    });

    it('should create rights request', async () => {
      const mockContent = createMockUGCContent();
      (UGCContent.findById as jest.Mock).mockResolvedValue(mockContent);
      (UGCRights.create as jest.Mock).mockResolvedValue(createMockUGCRights());

      const result = await service.requestRights('ugc-123', 'brand-123', 'display');

      expect(result).toBeDefined();
      expect(UGCRights.create).toHaveBeenCalled();
    });
  });

  describe('respondToRights', () => {
    it('should approve rights request', async () => {
      const mockRights = createMockUGCRights({ status: 'pending' });
      (UGCRights.findById as jest.Mock).mockResolvedValue(mockRights);

      const result = await service.respondToRights('rights-123', 'approve', 'admin');

      expect(mockRights.status).toBe('granted');
      expect(mockRights.respondedBy).toBe('admin');
    });

    it('should deny rights request', async () => {
      const mockRights = createMockUGCRights({ status: 'pending' });
      (UGCRights.findById as jest.Mock).mockResolvedValue(mockRights);

      const result = await service.respondToRights('rights-123', 'deny', 'admin');

      expect(mockRights.status).toBe('denied');
    });
  });

  describe('listRights', () => {
    it('should list rights with filters', async () => {
      const mockRights = [createMockUGCRights()];
      (UGCRights.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockRights),
      });
      (UGCRights.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await service.listRights({
        status: 'pending',
        limit: 10,
        offset: 0,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});

describe('DisplayService', () => {
  let service: DisplayService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DisplayService();
  });

  describe('generateDisplayEmbed', () => {
    it('should generate display embed', async () => {
      const mockCampaign = createMockUGCCampaign();
      const mockContent = [createMockUGCContent({ status: 'approved' })];
      (UGCCampaign.findById as jest.Mock).mockResolvedValue(mockCampaign);
      (UGCContent.find as jest.Mock).mockResolvedValue(mockContent);

      const result = await service.generateDisplayEmbed('campaign-123', {
        displayType: 'grid',
        maxItems: 10,
      });

      expect(result).toBeDefined();
      expect(result.items).toHaveLength(1);
    });
  });

  describe('generateEmbedCode', () => {
    it('should generate HTML embed code', async () => {
      const mockCampaign = createMockUGCCampaign();
      const mockContent = [createMockUGCContent({ status: 'approved' })];
      (UGCCampaign.findById as jest.Mock).mockResolvedValue(mockCampaign);
      (UGCContent.find as jest.Mock).mockResolvedValue(mockContent);

      const result = await service.generateEmbedCode('campaign-123', 'grid', { theme: 'light' });

      expect(result).toContain('iframe');
      expect(result).toContain('campaign-123');
    });
  });

  describe('generateJSONFeed', () => {
    it('should generate JSON feed', async () => {
      const mockContent = [createMockUGCContent({ status: 'approved' })];
      (UGCContent.find as jest.Mock).mockResolvedValue(mockContent);

      const result = await service.generateJSONFeed('campaign-123', 50);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

describe('UGCCollectorService', () => {
  let service: UGCCollectorService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UGCCollectorService();
  });

  describe('collectUGC', () => {
    it('should collect UGC from platforms', async () => {
      const mockCampaign = createMockUGCCampaign();
      (UGCCampaign.findById as jest.Mock).mockResolvedValue(mockCampaign);
      (UGCContent.create as jest.Mock).mockResolvedValue(createMockUGCContent());

      const result = await service.collectUGC(['instagram'], ['#test'], 'campaign-123');

      expect(result).toBeDefined();
      expect(result.collected).toBeGreaterThanOrEqual(0);
    });

    it('should throw error for invalid platform', async () => {
      await expect(
        service.collectUGC(['invalid-platform' as any], ['#test'])
      ).rejects.toThrow('Unsupported platform');
    });
  });
});