/**
 * Crisis Alert Service - Models Tests
 */

import { z } from 'zod';
import { AlertSeverity, AlertType, AlertStatus } from '../models/CrisisAlert';
import { IMonitoringKeyword } from '../models/MonitoringKeyword';
import { ICrisisPlaybook } from '../models/CrisisPlaybook';

const alertSchema = z.object({
  alertId: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  type: z.enum(['negative_sentiment', 'viral_negative', 'brand_mention', 'competitor_mention', 'crisis']),
  title: z.string(),
  description: z.string(),
  source: z.object({
    platform: z.string(),
    postId: z.string().optional(),
    postUrl: z.string().optional(),
    authorUsername: z.string().optional(),
  }),
  metrics: z.object({ mentions: z.number(), sentiment: z.number(), reach: z.number().optional(), velocity: z.number().optional() }),
  status: z.enum(['active', 'acknowledged', 'escalated', 'resolved']),
  affectedBrand: z.string().optional(),
});

const playbookSchema = z.object({
  playbookId: z.string(),
  name: z.string(),
  triggerConditions: z.object({
    sentimentThreshold: z.number().optional(),
    mentionThreshold: z.number().optional(),
    velocityThreshold: z.number().optional(),
    keywords: z.array(z.string()).optional(),
  }),
  notifications: z.array(z.object({ type: z.string(), recipients: z.array(z.string()) })),
  isActive: z.boolean(),
});

const keywordSchema = z.object({
  keywordId: z.string(),
  keyword: z.string(),
  platforms: z.array(z.string()),
  alertOnMatch: z.boolean(),
  createdAt: z.date(),
});

describe('CrisisAlert Model', () => {
  describe('Schema Validation', () => {
    it('should validate correct alert', () => {
      const validData = { alertId: 'ALERT-123', severity: 'high', type: 'negative_sentiment', title: 'Test Alert', description: 'Test', source: { platform: 'twitter' }, metrics: { mentions: 100, sentiment: -0.5 }, status: 'active' };
      expect(alertSchema.safeParse(validData).success).toBe(true);
    });

    it('should reject invalid severity', () => {
      const invalid = { alertId: 'ALERT-123', severity: 'extreme', type: 'negative_sentiment', title: 'Test', description: 'Test', source: { platform: 'twitter' }, metrics: { mentions: 100, sentiment: -0.5 }, status: 'active' };
      expect(alertSchema.safeParse(invalid).success).toBe(false);
    });

    it('should reject invalid type', () => {
      const invalid = { alertId: 'ALERT-123', severity: 'high', type: 'invalid', title: 'Test', description: 'Test', source: { platform: 'twitter' }, metrics: { mentions: 100, sentiment: -0.5 }, status: 'active' };
      expect(alertSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('Alert Enums', () => {
    it('should have valid severity values', () => {
      const severities: AlertSeverity[] = ['critical', 'high', 'medium', 'low'];
      severities.forEach(s => expect(['critical', 'high', 'medium', 'low']).toContain(s));
    });

    it('should have valid type values', () => {
      const types: AlertType[] = ['negative_sentiment', 'viral_negative', 'brand_mention', 'competitor_mention', 'crisis'];
      types.forEach(t => expect(['negative_sentiment', 'viral_negative', 'brand_mention', 'competitor_mention', 'crisis']).toContain(t));
    });

    it('should have valid status values', () => {
      const statuses: AlertStatus[] = ['active', 'acknowledged', 'escalated', 'resolved'];
      statuses.forEach(s => expect(['active', 'acknowledged', 'escalated', 'resolved']).toContain(s));
    });
  });
});

describe('CrisisPlaybook Model', () => {
  describe('Schema Validation', () => {
    it('should validate correct playbook', () => {
      const validData = { playbookId: 'PLAY-123', name: 'Test Playbook', triggerConditions: { sentimentThreshold: -0.5 }, notifications: [{ type: 'email', recipients: ['test@example.com'] }], isActive: true };
      expect(playbookSchema.safeParse(validData).success).toBe(true);
    });

    it('should allow empty trigger conditions', () => {
      const validData = { playbookId: 'PLAY-123', name: 'Test', triggerConditions: {}, notifications: [], isActive: true };
      expect(playbookSchema.safeParse(validData).success).toBe(true);
    });
  });
});

describe('MonitoringKeyword Model', () => {
  describe('Schema Validation', () => {
    it('should validate correct keyword', () => {
      const validData = { keywordId: 'KW-123', keyword: 'brand', platforms: ['twitter', 'instagram'], alertOnMatch: true, createdAt: new Date() };
      expect(keywordSchema.safeParse(validData).success).toBe(true);
    });

    it('should reject empty keyword', () => {
      const invalid = { keywordId: 'KW-123', keyword: '', platforms: ['twitter'], alertOnMatch: true, createdAt: new Date() };
      expect(keywordSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('IMonitoringKeyword Interface', () => {
    it('should have correct structure', () => {
      const keyword: IMonitoringKeyword = { keywordId: 'KW-123', keyword: 'brand', platforms: ['twitter'], alertOnMatch: true, createdAt: new Date() };
      expect(keyword.keyword).toBe('brand');
    });
  });
});

describe('ICrisisPlaybook Interface', () => {
  it('should have correct structure', () => {
    const playbook: ICrisisPlaybook = { playbookId: 'PLAY-123', name: 'Test', triggerConditions: { mentionThreshold: 50 }, notifications: [{ type: 'email', recipients: ['admin@example.com'] }], isActive: true, createdAt: new Date() } as ICrisisPlaybook;
    expect(playbook.name).toBe('Test');
  });
});

describe('Model Indexes', () => {
  it('should verify CrisisAlert has required fields', () => {
    const model = require('../models/CrisisAlert').CrisisAlert;
    const schemaObj = model.schema.obj;
    expect(schemaObj.alertId).toBeDefined();
    expect(schemaObj.severity).toBeDefined();
    expect(schemaObj.status).toBeDefined();
  });

  it('should verify CrisisPlaybook has required fields', () => {
    const model = require('../models/CrisisPlaybook').CrisisPlaybook;
    const schemaObj = model.schema.obj;
    expect(schemaObj.playbookId).toBeDefined();
    expect(schemaObj.isActive).toBeDefined();
  });
});