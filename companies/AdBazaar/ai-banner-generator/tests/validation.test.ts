/**
 * Validation Middleware Unit Tests
 */

import { z } from 'zod';
import { schemas } from '../src/middleware/validation';

describe('Validation Schemas', () => {
  describe('generateBanner', () => {
    it('should validate valid banner generation request', () => {
      const validRequest = {
        description: 'Summer sale banner',
        dimensions: { width: 728, height: 90 },
        format: 'static',
        style: 'modern',
        colors: ['#FF6B6B', '#4ECDC4'],
      };

      const result = schemas.generateBanner.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject empty description', () => {
      const invalidRequest = {
        description: '',
        dimensions: { width: 728, height: 90 },
      };

      const result = schemas.generateBanner.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject invalid dimensions', () => {
      const invalidRequest = {
        description: 'Test banner',
        dimensions: { width: 50, height: 90 }, // width too small
      };

      const result = schemas.generateBanner.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject invalid color format', () => {
      const invalidRequest = {
        description: 'Test banner',
        dimensions: { width: 728, height: 90 },
        colors: ['invalid-color'],
      };

      const result = schemas.generateBanner.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should accept valid brand guidelines', () => {
      const validRequest = {
        description: 'Test banner',
        dimensions: { width: 728, height: 90 },
        brandGuidelines: {
          primaryColor: '#FF6B6B',
          secondaryColor: '#4ECDC4',
          font: 'Inter',
          logo: 'https://example.com/logo.png',
        },
      };

      const result = schemas.generateBanner.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should default format to static', () => {
      const request = {
        description: 'Test banner',
        dimensions: { width: 728, height: 90 },
      };

      const result = schemas.generateBanner.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.format).toBe('static');
      }
    });
  });

  describe('createTemplate', () => {
    it('should validate valid template request', () => {
      const validRequest = {
        name: 'My Template',
        category: 'promotion',
        dimensions: { width: 728, height: 90 },
        layout: {
          elements: [
            {
              type: 'text',
              position: { x: 10, y: 20 },
              style: { fontSize: 24 },
            },
          ],
        },
        isPublic: true,
      };

      const result = schemas.createTemplate.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject template without elements', () => {
      const invalidRequest = {
        name: 'My Template',
        category: 'promotion',
        dimensions: { width: 728, height: 90 },
        layout: {
          elements: [],
        },
      };

      const result = schemas.createTemplate.safeParse(invalidRequest);
      expect(result.success).toBe(true); // Empty elements array is valid
    });

    it('should reject invalid element type', () => {
      const invalidRequest = {
        name: 'My Template',
        category: 'promotion',
        dimensions: { width: 728, height: 90 },
        layout: {
          elements: [
            {
              type: 'invalid-type',
              position: { x: 10, y: 20 },
              style: {},
            },
          ],
        },
      };

      const result = schemas.createTemplate.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('generateVariants', () => {
    it('should validate variant request', () => {
      const validRequest = {
        baseGenerationId: 'gen-abc123',
        count: 3,
        variations: [
          { style: 'bold' },
          { colors: ['#FF6B6B', '#4ECDC4'] },
        ],
      };

      const result = schemas.generateVariants.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should default count to 3', () => {
      const request = {
        baseGenerationId: 'gen-abc123',
      };

      const result = schemas.generateVariants.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(3);
      }
    });

    it('should reject count over 10', () => {
      const invalidRequest = {
        baseGenerationId: 'gen-abc123',
        count: 15,
      };

      const result = schemas.generateVariants.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('regenerate', () => {
    it('should validate regenerate request with changes', () => {
      const validRequest = {
        changes: {
          description: 'Updated description',
          style: 'bold',
          colors: ['#1A1A2E'],
        },
      };

      const result = schemas.regenerate.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should accept empty changes', () => {
      const request = {
        changes: {},
      };

      const result = schemas.regenerate.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should accept request without changes', () => {
      const request = {};

      const result = schemas.regenerate.safeParse(request);
      expect(result.success).toBe(true);
    });
  });

  describe('listTemplatesQuery', () => {
    it('should validate pagination params', () => {
      const validQuery = {
        category: 'promotion',
        page: '1',
        limit: '20',
      };

      const result = schemas.listTemplatesQuery.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should coerce string numbers', () => {
      const query = {
        page: '5',
        limit: '50',
      };

      const result = schemas.listTemplatesQuery.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.limit).toBe(50);
      }
    });

    it('should reject limit over 100', () => {
      const invalidQuery = {
        limit: '150',
      };

      const result = schemas.listTemplatesQuery.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });
});
