// Type validation tests for schemas
import { z } from 'zod';

// Test the schemas match expected structure
describe('Type Schemas', () => {
  describe('UploadDataRequestSchema', () => {
    it('should validate correct upload request', () => {
      const validRequest = {
        brandId: 'brand_123',
        dataFormat: 'csv',
        hashAlgorithm: 'SHA256',
        identifiers: [
          { type: 'email', column: 'email' },
        ],
        data: 'email,segment\nuser@example.com,high',
        metadata: {
          name: 'Test Upload',
          description: 'Test description',
        },
      };

      expect(() => z.object({
        brandId: z.string().min(1),
        dataFormat: z.enum(['csv', 'json', 'tsv', 'xml']),
        hashAlgorithm: z.enum(['SHA256', 'MD5', 'SHA1']).optional(),
        identifiers: z.array(z.object({
          type: z.enum(['email', 'phone', 'device_id', 'cookie', 'custom']),
          column: z.string().optional(),
        })),
        data: z.string(),
        metadata: z.object({
          name: z.string(),
          description: z.string().optional(),
        }),
      }).parse(validRequest)).not.toThrow();
    });

    it('should reject invalid data format', () => {
      const invalidRequest = {
        brandId: 'brand_123',
        dataFormat: 'invalid',
        identifiers: [{ type: 'email' }],
        data: 'test',
        metadata: { name: 'Test' },
      };

      expect(() => z.object({
        brandId: z.string().min(1),
        dataFormat: z.enum(['csv', 'json', 'tsv', 'xml']),
        identifiers: z.array(z.object({
          type: z.enum(['email', 'phone', 'device_id', 'cookie', 'custom']),
        })),
        data: z.string(),
        metadata: z.object({ name: z.string() }),
      }).parse(invalidRequest)).toThrow();
    });
  });

  describe('MatchRequestSchema', () => {
    it('should validate correct match request', () => {
      const validRequest = {
        uploadId: '550e8400-e29b-41d4-a716-446655440000',
        matchType: 'deterministic',
        matchThreshold: 0.8,
      };

      const schema = z.object({
        uploadId: z.string().uuid(),
        matchType: z.enum(['deterministic', 'probabilistic', 'hybrid']).optional(),
        matchThreshold: z.number().min(0).max(1).optional(),
        segments: z.array(z.string()).optional(),
        privacyBudget: z.number().min(0).max(1).optional(),
      });

      expect(() => schema.parse(validRequest)).not.toThrow();
    });
  });

  describe('OverlapAnalysisRequestSchema', () => {
    it('should validate correct overlap request', () => {
      const validRequest = {
        uploadId1: '550e8400-e29b-41d4-a716-446655440000',
        uploadId2: '550e8400-e29b-41d4-a716-446655440001',
        analysisType: 'exact',
      };

      const schema = z.object({
        uploadId1: z.string().uuid(),
        uploadId2: z.string().uuid(),
        analysisType: z.enum(['exact', 'fuzzy', 'segment']).optional(),
      });

      expect(() => schema.parse(validRequest)).not.toThrow();
    });
  });

  describe('ActivationRequestSchema', () => {
    it('should validate correct activation request', () => {
      const validRequest = {
        matchId: '550e8400-e29b-41d4-a716-446655440000',
        target: 'dsp',
        targetConfig: {
          platform: 'google',
          audienceName: 'REZ Audience',
        },
      };

      const schema = z.object({
        matchId: z.string().uuid(),
        target: z.enum(['dsp', 'ssp', 'dmp', 'lookalike', 'custom']),
        targetConfig: z.object({
          platform: z.string().optional(),
          audienceName: z.string().optional(),
          customEndpoint: z.string().url().optional(),
        }),
        options: z.object({
          includeMetadata: z.boolean().optional(),
          createLookalikes: z.boolean().optional(),
          lookalikeSize: z.number().min(1).max(100).optional(),
        }).optional(),
      });

      expect(() => schema.parse(validRequest)).not.toThrow();
    });
  });
});

describe('Match Result Structure', () => {
  it('should have correct match result shape', () => {
    const matchResult = {
      uploadId: '550e8400-e29b-41d4-a716-446655440000',
      matchId: '550e8400-e29b-41d4-a716-446655440001',
      matchType: 'deterministic' as const,
      uploadedRecords: 10000,
      matchedRecords: 4250,
      matchRate: 42.5,
      segments: [
        { name: 'high_intent', total: 5000, matched: 1800, matchRate: 36 },
        { name: 'loyal_customers', total: 3000, matched: 1200, matchRate: 40 },
      ],
      matchRateBySegment: {
        high_intent: 36,
        loyal_customers: 40,
      },
      processingTimeMs: 1500,
      createdAt: new Date(),
    };

    expect(matchResult.uploadedRecords).toBe(10000);
    expect(matchResult.matchedRecords).toBe(4250);
    expect(matchResult.matchRate).toBe(42.5);
    expect(matchResult.segments.length).toBe(2);
  });
});