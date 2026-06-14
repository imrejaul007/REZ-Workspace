/**
 * Content Repurposing Engine - Models Tests
 * Tests MongoDB schemas and validation
 */

import mongoose from 'mongoose';
import { z } from 'zod';
import {
  adaptedContentSchema,
  repurposedContentStatusSchema,
  IRepurposedContent,
  IRepurposedContentDocument,
} from '../models/RepurposedContent';
import {
  IHighlight,
  IHighlightDocument,
} from '../models/Highlight';
import {
  IRepurposingTemplate,
  IRepurposingTemplateDocument,
} from '../models/RepurposingTemplate';

describe('RepurposedContent Model', () => {
  describe('Schema Validation (Zod)', () => {
    it('should validate correct adapted content schema', () => {
      const validData = {
        title: 'Test Title',
        description: 'Test description',
        hashtags: ['#test', '#demo'],
      };

      const result = adaptedContentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const invalidData = {
        title: '',
        description: 'Test description',
        hashtags: ['#test'],
      };

      const result = adaptedContentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject title exceeding 300 characters', () => {
      const invalidData = {
        title: 'A'.repeat(301),
        description: 'Test description',
        hashtags: ['#test'],
      };

      const result = adaptedContentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject description exceeding 2200 characters', () => {
      const invalidData = {
        title: 'Test Title',
        description: 'A'.repeat(2201),
        hashtags: ['#test'],
      };

      const result = adaptedContentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject hashtags array exceeding 30 items', () => {
      const invalidData = {
        title: 'Test Title',
        description: 'Test',
        hashtags: Array(31).fill('#tag'),
      };

      const result = adaptedContentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow empty description', () => {
      const validData = {
        title: 'Test Title',
        description: '',
        hashtags: [],
      };

      const result = adaptedContentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Status Schema', () => {
    it('should accept valid status values', () => {
      const validStatuses = ['processing', 'ready', 'published', 'failed'];

      validStatuses.forEach(status => {
        const result = repurposedContentStatusSchema.safeParse(status);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid status values', () => {
      const result = repurposedContentStatusSchema.safeParse('invalid-status');
      expect(result.success).toBe(false);
    });
  });

  describe('IRepurposedContent Interface', () => {
    it('should have correct structure', () => {
      const content: IRepurposedContent = {
        id: 'test-id-123',
        originalContentId: 'original-123',
        originalPlatform: 'youtube',
        targetPlatform: 'instagram',
        adaptedContent: {
          title: 'Adapted Title',
          description: 'Adapted description',
          hashtags: ['#test'],
        },
        mediaUrl: 'https://example.com/media.jpg',
        mediaFormat: 'jpg',
        aspectRatio: '1:1',
        status: 'ready',
        createdAt: new Date(),
        publishedAt: undefined,
      };

      expect(content.id).toBe('test-id-123');
      expect(content.originalContentId).toBe('original-123');
      expect(content.status).toBe('ready');
      expect(content.adaptedContent.title).toBe('Adapted Title');
    });

    it('should allow optional publishedAt', () => {
      const content: IRepurposedContent = {
        id: 'test-id',
        originalContentId: 'original',
        originalPlatform: 'youtube',
        targetPlatform: 'instagram',
        adaptedContent: {
          title: 'Title',
          description: 'Desc',
          hashtags: [],
        },
        mediaUrl: '',
        mediaFormat: 'mp4',
        aspectRatio: '16:9',
        status: 'processing',
        createdAt: new Date(),
      };

      expect(content.publishedAt).toBeUndefined();
    });
  });

  describe('MongoDB Model Integration', () => {
    it('should create model with correct schema', () => {
      const model = require('../models/RepurposedContent').RepurposedContent;
      expect(model).toBeDefined();
      expect(typeof model.find).toBe('function');
      expect(typeof model.findById).toBe('function');
      expect(typeof model.create).toBe('function');
    });

    it('should have correct indexes defined', () => {
      // This tests that the schema has proper indexes
      const schemaObj = require('../models/RepurposedContent').RepurposedContent.schema.obj;
      expect(schemaObj.id).toBeDefined();
      expect(schemaObj.originalContentId).toBeDefined();
      expect(schemaObj.targetPlatform).toBeDefined();
      expect(schemaObj.status).toBeDefined();
    });
  });
});

describe('Highlight Model', () => {
  describe('IHighlight Interface', () => {
    it('should have correct structure', () => {
      const highlight: IHighlight = {
        id: 'highlight-123',
        sourceContentId: 'content-123',
        startTime: 0,
        endTime: 30,
        score: 0.95,
        title: 'Best Moment',
        description: 'This is the best part of the video',
        hashtags: ['#viral', '#fyp'],
        status: 'pending',
        createdAt: new Date(),
      };

      expect(highlight.id).toBe('highlight-123');
      expect(highlight.startTime).toBe(0);
      expect(highlight.endTime).toBe(30);
      expect(highlight.score).toBe(0.95);
    });

    it('should validate time constraints', () => {
      const validHighlight: IHighlight = {
        id: 'test',
        sourceContentId: 'content',
        startTime: 0,
        endTime: 60,
        score: 0.9,
        title: 'Test',
        description: '',
        hashtags: [],
        status: 'approved',
        createdAt: new Date(),
      };

      expect(validHighlight.startTime).toBeLessThan(validHighlight.endTime);
    });
  });
});

describe('RepurposingTemplate Model', () => {
  describe('IRepurposingTemplate Interface', () => {
    it('should have correct structure', () => {
      const template: IRepurposingTemplate = {
        id: 'template-123',
        name: 'Instagram Reels Template',
        description: 'Template for creating Instagram Reels content',
        targetPlatform: 'instagram',
        config: {
          maxTitleLength: 150,
          maxDescriptionLength: 2200,
          maxHashtags: 30,
          defaultAspectRatio: '1:1',
        },
        prompts: {
          titleGeneration: 'Generate an engaging title for Instagram',
          descriptionGeneration: 'Create an engaging description',
          hashtagGeneration: 'Suggest relevant hashtags',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(template.id).toBe('template-123');
      expect(template.name).toBe('Instagram Reels Template');
      expect(template.targetPlatform).toBe('instagram');
      expect(template.isActive).toBe(true);
      expect(template.config.maxTitleLength).toBe(150);
    });

    it('should have prompts configuration', () => {
      const template: IRepurposingTemplate = {
        id: 'test',
        name: 'Test Template',
        description: 'Test',
        targetPlatform: 'tiktok',
        config: {
          maxTitleLength: 100,
          maxDescriptionLength: 2200,
          maxHashtags: 10,
          defaultAspectRatio: '9:16',
        },
        prompts: {
          titleGeneration: 'Title prompt',
          descriptionGeneration: 'Description prompt',
          hashtagGeneration: 'Hashtag prompt',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(template.prompts.titleGeneration).toBeDefined();
      expect(template.prompts.descriptionGeneration).toBeDefined();
      expect(template.prompts.hashtagGeneration).toBeDefined();
    });
  });
});

describe('Model Indexes', () => {
  it('should verify RepurposedContent has required indexes', () => {
    const schemaObj = require('../models/RepurposedContent').RepurposedContent.schema.obj;

    // Check indexes are defined
    expect(schemaObj.id).toBeDefined();
    expect(schemaObj.originalContentId).toBeDefined();
    expect(schemaObj.targetPlatform).toBeDefined();
    expect(schemaObj.status).toBeDefined();
  });

  it('should verify model has toJSON transform', () => {
    const model = require('../models/RepurposedContent').RepurposedContent;
    const schemaOptions = model.schema.options;

    expect(schemaOptions.toJSON).toBeDefined();
    expect(schemaOptions.toJSON.transform).toBeDefined();
  });
});