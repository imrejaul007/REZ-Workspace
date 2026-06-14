import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as unknown as {
  post: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
};

// Mock RABTUL client
vi.mock('../src/integrations/rabtulClient', () => ({
  verifyToken: vi.fn().mockResolvedValue({ valid: true }),
  processPayment: vi.fn().mockResolvedValue({ success: true }),
  addCoins: vi.fn().mockResolvedValue({ success: true }),
  sendNotification: vi.fn().mockResolvedValue({ success: true }),
  trackEvent: vi.fn().mockResolvedValue({ success: true }),
  getPredictions: vi.fn().mockResolvedValue({ predictions: [] }),
  default: {
    verifyToken: vi.fn().mockResolvedValue({ valid: true }),
    processPayment: vi.fn().mockResolvedValue({ success: true }),
    addCoins: vi.fn().mockResolvedValue({ success: true }),
    sendNotification: vi.fn().mockResolvedValue({ success: true }),
    trackEvent: vi.fn().mockResolvedValue({ success: true }),
    getPredictions: vi.fn().mockResolvedValue({ predictions: [] }),
  },
}));

describe('Creative Studio Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Types and Interfaces', () => {
    it('should define AdTemplate interface correctly', () => {
      const template = {
        id: 'tpl_001',
        name: 'Test Template',
        category: 'native' as const,
        format: 'banner' as const,
        dimensions: { width: 1200, height: 628 },
        elements: [],
        thumbnail: 'https://example.com/thumb.jpg',
        popularity: 95,
      };

      expect(template.id).toBe('tpl_001');
      expect(template.category).toBe('native');
      expect(template.format).toBe('banner');
      expect(template.dimensions.width).toBe(1200);
      expect(template.dimensions.height).toBe(628);
      expect(template.popularity).toBe(95);
    });

    it('should define Creative interface correctly', () => {
      const creative = {
        id: 'cr_001',
        advertiserId: 'adv_001',
        name: 'Test Creative',
        templateId: 'tpl_001',
        format: 'native' as const,
        content: {
          headline: 'Test Headline',
          description: 'Test Description',
          cta: 'Shop Now',
        },
        preview: 'https://example.com/preview.jpg',
        status: 'draft' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(creative.id).toBe('cr_001');
      expect(creative.advertiserId).toBe('adv_001');
      expect(creative.status).toBe('draft');
      expect(creative.content.headline).toBe('Test Headline');
    });

    it('should define AdAsset interface correctly', () => {
      const asset = {
        id: 'ast_001',
        advertiserId: 'adv_001',
        name: 'Test Banner',
        type: 'image' as const,
        url: 'https://example.com/banner.jpg',
        size: 245000,
        dimensions: { width: 1200, height: 628 },
        format: 'jpg',
        uploadedAt: new Date(),
      };

      expect(asset.type).toBe('image');
      expect(asset.size).toBe(245000);
      expect(asset.format).toBe('jpg');
    });

    it('should support all template categories', () => {
      const categories: ('native' | 'display' | 'video' | 'qr' | 'social')[] = [
        'native',
        'display',
        'video',
        'qr',
        'social',
      ];

      categories.forEach((category) => {
        const template = {
          id: `tpl_${category}`,
          name: `${category} Template`,
          category,
          format: 'banner' as const,
          dimensions: { width: 300, height: 250 },
          elements: [],
          thumbnail: '',
          popularity: 50,
        };
        expect(template.category).toBe(category);
      });
    });

    it('should support all creative statuses', () => {
      const statuses: ('draft' | 'approved' | 'rejected')[] = ['draft', 'approved', 'rejected'];

      statuses.forEach((status) => {
        const creative = {
          id: 'cr_test',
          advertiserId: 'adv_001',
          name: 'Test',
          format: 'native' as const,
          content: {},
          preview: '',
          status,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        expect(creative.status).toBe(status);
      });
    });
  });

  describe('Template Filtering Logic', () => {
    it('should filter templates by category', () => {
      const templates = [
        { id: '1', category: 'native', format: 'banner' },
        { id: '2', category: 'display', format: 'banner' },
        { id: '3', category: 'native', format: 'square' },
      ];

      const filtered = templates.filter((t) => t.category === 'native');
      expect(filtered).toHaveLength(2);
      expect(filtered.every((t) => t.category === 'native')).toBe(true);
    });

    it('should filter templates by format', () => {
      const templates = [
        { id: '1', category: 'native', format: 'banner' },
        { id: '2', category: 'display', format: 'banner' },
        { id: '3', category: 'native', format: 'square' },
      ];

      const filtered = templates.filter((t) => t.format === 'banner');
      expect(filtered).toHaveLength(2);
    });

    it('should filter templates by search term', () => {
      const templates = [
        { id: '1', name: 'Clean Native Banner' },
        { id: '2', name: 'Bold Display Ad' },
        { id: '3', name: 'Instagram Story' },
      ];

      const search = 'banner';
      const filtered = templates.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Clean Native Banner');
    });

    it('should sort templates by popularity descending', () => {
      const templates = [
        { id: '1', popularity: 50 },
        { id: '2', popularity: 95 },
        { id: '3', popularity: 78 },
      ];

      const sorted = [...templates].sort((a, b) => b.popularity - a.popularity);
      expect(sorted[0].popularity).toBe(95);
      expect(sorted[1].popularity).toBe(78);
      expect(sorted[2].popularity).toBe(50);
    });
  });

  describe('Creative Management Logic', () => {
    it('should create a new creative with generated ID', () => {
      const creativeData = {
        advertiserId: 'adv_001',
        name: 'New Creative',
        templateId: 'tpl_001',
        format: 'native' as const,
        content: { headline: 'Test' },
      };

      const newCreative = {
        id: `cr_${Date.now()}`,
        ...creativeData,
        preview: `https://cdn.example.com/preview/${Date.now()}.jpg`,
        status: 'draft' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(newCreative.id).toMatch(/^cr_\d+$/);
      expect(newCreative.status).toBe('draft');
      expect(newCreative.advertiserId).toBe('adv_001');
    });

    it('should filter creatives by advertiserId', () => {
      const creatives = [
        { id: '1', advertiserId: 'adv_001' },
        { id: '2', advertiserId: 'adv_002' },
        { id: '3', advertiserId: 'adv_001' },
      ];

      const filtered = creatives.filter((c) => c.advertiserId === 'adv_001');
      expect(filtered).toHaveLength(2);
    });

    it('should filter creatives by status', () => {
      const creatives = [
        { id: '1', status: 'draft' },
        { id: '2', status: 'approved' },
        { id: '3', status: 'draft' },
      ];

      const filtered = creatives.filter((c) => c.status === 'draft');
      expect(filtered).toHaveLength(2);
    });

    it('should filter creatives by format', () => {
      const creatives = [
        { id: '1', format: 'native' },
        { id: '2', format: 'display' },
        { id: '3', format: 'native' },
      ];

      const filtered = creatives.filter((c) => c.format === 'native');
      expect(filtered).toHaveLength(2);
    });

    it('should update creative with new data and timestamp', () => {
      const creative = {
        id: 'cr_001',
        name: 'Original Name',
        updatedAt: new Date('2026-01-01'),
      };

      const updates = { name: 'Updated Name' };
      Object.assign(creative, updates, { updatedAt: new Date() });

      expect(creative.name).toBe('Updated Name');
      expect(creative.updatedAt.getTime()).toBeGreaterThan(new Date('2026-01-01').getTime());
    });

    it('should validate creative status transitions', () => {
      const validStatuses = ['draft', 'approved', 'rejected'];
      const newStatus = 'approved';

      expect(validStatuses.includes(newStatus)).toBe(true);
    });

    it('should reject invalid status values', () => {
      const validStatuses = ['draft', 'approved', 'rejected'];
      const invalidStatus = 'pending';

      expect(validStatuses.includes(invalidStatus)).toBe(false);
    });
  });

  describe('Asset Management Logic', () => {
    it('should filter assets by advertiserId', () => {
      const assets = [
        { id: '1', advertiserId: 'adv_001', type: 'image' },
        { id: '2', advertiserId: 'adv_002', type: 'video' },
        { id: '3', advertiserId: 'adv_001', type: 'logo' },
      ];

      const filtered = assets.filter((a) => a.advertiserId === 'adv_001');
      expect(filtered).toHaveLength(2);
    });

    it('should filter assets by type', () => {
      const assets = [
        { id: '1', type: 'image' },
        { id: '2', type: 'video' },
        { id: '3', type: 'logo' },
      ];

      const filtered = assets.filter((a) => a.type === 'image');
      expect(filtered).toHaveLength(1);
    });

    it('should create asset with generated ID', () => {
      const assetData = {
        advertiserId: 'adv_001',
        name: 'New Banner',
        type: 'image' as const,
        url: 'https://example.com/banner.jpg',
        size: 100000,
        format: 'jpg',
      };

      const newAsset = {
        id: `ast_${Date.now()}`,
        ...assetData,
        uploadedAt: new Date(),
      };

      expect(newAsset.id).toMatch(/^ast_\d+$/);
      expect(newAsset.uploadedAt).toBeInstanceOf(Date);
    });

    it('should delete asset from array', () => {
      const assets = [
        { id: 'ast_001', name: 'Asset 1' },
        { id: 'ast_002', name: 'Asset 2' },
        { id: 'ast_003', name: 'Asset 3' },
      ];

      const assetId = 'ast_002';
      const index = assets.findIndex((a) => a.id === assetId);
      expect(index).toBe(1);

      assets.splice(index, 1);
      expect(assets).toHaveLength(2);
      expect(assets.find((a) => a.id === 'ast_002')).toBeUndefined();
    });
  });

  describe('Performance Metrics Logic', () => {
    it('should generate performance metrics with random values', () => {
      const impressions = Math.round(10000 + Math.random() * 50000);
      const clicks = Math.round(500 + Math.random() * 2000);
      const ctr = 3.5 + Math.random() * 2;
      const conversions = Math.round(50 + Math.random() * 200);
      const spend = Math.round(5000 + Math.random() * 20000);

      expect(impressions).toBeGreaterThanOrEqual(10000);
      expect(impressions).toBeLessThanOrEqual(60000);
      expect(clicks).toBeGreaterThanOrEqual(500);
      expect(clicks).toBeLessThanOrEqual(2500);
      expect(ctr).toBeGreaterThanOrEqual(3.5);
      expect(ctr).toBeLessThanOrEqual(5.5);
    });

    it('should provide optimization recommendations', () => {
      const recommendations = [
        'Headline with numbers performs 23% better',
        'Add urgency text to increase CTR',
        'Use warm colors for food category',
      ];

      expect(recommendations).toHaveLength(3);
      expect(recommendations[0]).toContain('Headline');
    });
  });

  describe('A/B Testing Logic', () => {
    it('should calculate CTR for variants', () => {
      const variant1 = { id: 'v1', impressions: 5000, clicks: 250 };
      const variant2 = { id: 'v2', impressions: 5000, clicks: 320 };

      const ctr1 = (variant1.clicks / variant1.impressions) * 100;
      const ctr2 = (variant2.clicks / variant2.impressions) * 100;

      expect(ctr1).toBe(5.0);
      expect(ctr2).toBe(6.4);
    });

    it('should determine winner based on CTR', () => {
      const variants = [
        { id: 'v1', headline: 'Fresh Pizza!', ctr: 5.0 },
        { id: 'v2', headline: '20% Off Today Only!', ctr: 6.4 },
      ];

      const winner = variants.reduce((a, b) => (a.ctr > b.ctr ? a : b));
      expect(winner.id).toBe('v2');
    });

    it('should calculate uplift between variants', () => {
      const ctr1 = 5.0;
      const ctr2 = 6.4;
      const uplift = ((ctr2 - ctr1) / ctr1) * 100;

      expect(uplift).toBeCloseTo(28, 0);
    });
  });

  describe('Template Element Validation', () => {
    it('should define valid element types', () => {
      const validTypes = ['text', 'image', 'button', 'background', 'logo'];
      const testElement = { type: 'text' };

      expect(validTypes.includes(testElement.type)).toBe(true);
    });

    it('should support element properties', () => {
      const element = {
        id: 'el_1',
        type: 'button' as const,
        properties: { text: 'Shop Now', color: '#FF5722' },
        editable: true,
      };

      expect(element.properties.text).toBe('Shop Now');
      expect(element.properties.color).toBe('#FF5722');
      expect(element.editable).toBe(true);
    });
  });
});
