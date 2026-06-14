/**
 * Template Service Unit Tests
 */

// Mock dependencies
jest.mock('../src/models', () => ({
  BannerTemplateModel: {
    findOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    distinct: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

jest.mock('../src/services/redis.service', () => ({
  redisService: {
    cacheTemplate: jest.fn().mockResolvedValue(true),
    getCachedTemplate: jest.fn().mockResolvedValue(null),
    invalidateTemplateCache: jest.fn().mockResolvedValue(true),
    cacheTemplateList: jest.fn().mockResolvedValue(true),
    getCachedTemplateList: jest.fn().mockResolvedValue(null),
    invalidateAllTemplateCache: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../src/config', () => ({
  default: {
    PORT: 4840,
    NODE_ENV: 'test',
    LOG_LEVEL: 'error',
  },
}));

jest.mock('uuid', () => ({
  v4: () => 'test-uuid-1234-5678',
}));

import { bannerTemplateService } from '../src/services/template.service';
import { BannerTemplateModel } from '../src/models';

describe('BannerTemplateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTemplate', () => {
    it('should create a new template', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockTemplate = {
        templateId: 'tpl-test-uuid-1234',
        name: 'Test Template',
        category: 'promotion',
        dimensions: { width: 728, height: 90 },
        layout: {
          elements: [
            { type: 'text', position: { x: 10, y: 20 }, style: { fontSize: 24 } },
          ],
        },
        usageCount: 0,
        performance: { avgCTR: 0, avgConversion: 0 },
        createdBy: 'user-123',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: mockSave,
      };

      (BannerTemplateModel as unknown as jest.Mock).mockImplementation(() => mockTemplate);

      const result = await bannerTemplateService.createTemplate('user-123', {
        name: 'Test Template',
        category: 'promotion',
        dimensions: { width: 728, height: 90 },
        layout: {
          elements: [
            { type: 'text', position: { x: 10, y: 20 }, style: { fontSize: 24 } },
          ],
        },
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Template');
      expect(result.category).toBe('promotion');
    });
  });

  describe('getTemplate', () => {
    it('should return null for non-existent template', async () => {
      (BannerTemplateModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await bannerTemplateService.getTemplate('non-existent');

      expect(result).toBeNull();
    });

    it('should return template from database', async () => {
      const mockTemplate = {
        templateId: 'tpl-123',
        name: 'Test Template',
        category: 'promotion',
        dimensions: { width: 728, height: 90 },
        layout: { elements: [] },
        usageCount: 5,
        performance: { avgCTR: 0.025, avgConversion: 0.03 },
        createdBy: 'user-123',
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (BannerTemplateModel.findOne as jest.Mock).mockResolvedValue(mockTemplate);

      const result = await bannerTemplateService.getTemplate('tpl-123');

      expect(result).toBeDefined();
      expect(result?.templateId).toBe('tpl-123');
      expect(result?.usageCount).toBe(5);
    });
  });

  describe('listTemplates', () => {
    it('should return paginated templates', async () => {
      const mockTemplates = [
        {
          templateId: 'tpl-1',
          name: 'Template 1',
          category: 'promotion',
          dimensions: { width: 728, height: 90 },
          layout: { elements: [] },
          usageCount: 10,
          performance: { avgCTR: 0.03, avgConversion: 0.04 },
          createdBy: 'user-123',
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          templateId: 'tpl-2',
          name: 'Template 2',
          category: 'promotion',
          dimensions: { width: 300, height: 250 },
          layout: { elements: [] },
          usageCount: 5,
          performance: { avgCTR: 0.02, avgConversion: 0.03 },
          createdBy: 'user-123',
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (BannerTemplateModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTemplates),
      });
      (BannerTemplateModel.countDocuments as jest.Mock).mockResolvedValue(2);

      const result = await bannerTemplateService.listTemplates({
        category: 'promotion',
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('updateTemplate', () => {
    it('should return null for non-existent template', async () => {
      (BannerTemplateModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await bannerTemplateService.updateTemplate('non-existent', 'user-123', {
        name: 'Updated Name',
      });

      expect(result).toBeNull();
    });

    it('should throw error for unauthorized update', async () => {
      const mockTemplate = {
        templateId: 'tpl-123',
        createdBy: 'user-456',
        save: jest.fn(),
      };

      (BannerTemplateModel.findOne as jest.Mock).mockResolvedValue(mockTemplate);

      await expect(
        bannerTemplateService.updateTemplate('tpl-123', 'user-123', { name: 'New Name' })
      ).rejects.toThrow('Unauthorized to update this template');
    });
  });

  describe('deleteTemplate', () => {
    it('should return false for non-existent template', async () => {
      (BannerTemplateModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await bannerTemplateService.deleteTemplate('non-existent', 'user-123');

      expect(result).toBe(false);
    });

    it('should throw error for unauthorized delete', async () => {
      const mockTemplate = {
        templateId: 'tpl-123',
        createdBy: 'user-456',
      };

      (BannerTemplateModel.findOne as jest.Mock).mockResolvedValue(mockTemplate);

      await expect(bannerTemplateService.deleteTemplate('tpl-123', 'user-123')).rejects.toThrow(
        'Unauthorized to delete this template'
      );
    });

    it('should delete template for owner', async () => {
      const mockTemplate = {
        templateId: 'tpl-123',
        createdBy: 'user-123',
      };

      (BannerTemplateModel.findOne as jest.Mock).mockResolvedValue(mockTemplate);
      (BannerTemplateModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const result = await bannerTemplateService.deleteTemplate('tpl-123', 'user-123');

      expect(result).toBe(true);
    });
  });

  describe('getCategories', () => {
    it('should return distinct categories', async () => {
      (BannerTemplateModel.distinct as jest.Mock).mockResolvedValue([
        'promotion',
        'seasonal',
        'product',
      ]);

      const result = await bannerTemplateService.getCategories();

      expect(result).toHaveLength(3);
      expect(result).toContain('promotion');
    });
  });

  describe('getPopularTemplates', () => {
    it('should return templates sorted by usage', async () => {
      const mockTemplates = [
        {
          templateId: 'tpl-1',
          name: 'Popular Template',
          category: 'promotion',
          dimensions: { width: 728, height: 90 },
          layout: { elements: [] },
          usageCount: 100,
          performance: { avgCTR: 0.05, avgConversion: 0.06 },
          createdBy: 'user-123',
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (BannerTemplateModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTemplates),
      });

      const result = await bannerTemplateService.getPopularTemplates(10);

      expect(result).toHaveLength(1);
      expect(result[0].usageCount).toBe(100);
    });
  });

  describe('searchTemplates', () => {
    it('should return matching templates', async () => {
      const mockTemplates = [
        {
          templateId: 'tpl-1',
          name: 'Summer Sale',
          category: 'promotion',
          dimensions: { width: 728, height: 90 },
          layout: { elements: [] },
          usageCount: 50,
          performance: { avgCTR: 0.04, avgConversion: 0.05 },
          createdBy: 'user-123',
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (BannerTemplateModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockTemplates),
      });

      const result = await bannerTemplateService.searchTemplates('summer');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Summer Sale');
    });
  });
});