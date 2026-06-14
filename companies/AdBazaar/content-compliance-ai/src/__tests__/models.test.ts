/** Content Compliance AI - Models Tests */
import { z } from 'zod';

const ruleSchema = z.object({
  ruleId: z.string(),
  name: z.string().min(1),
  type: z.enum(['content_policy', 'legal', 'brand_safety', 'platform_guideline']),
  description: z.string().optional(),
  isActive: z.boolean(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  conditions: z.array(z.object({ field: z.string(), operator: z.string(), value: z.any() })),
});

const checkSchema = z.object({
  checkId: z.string(),
  contentId: z.string(),
  contentType: z.enum(['text', 'image', 'video', 'audio']),
  status: z.enum(['pending', 'passed', 'failed', 'warning']),
  score: z.number().min(0).max(1),
  violations: z.array(z.object({ ruleId: z.string(), severity: z.string(), message: z.string() })),
  checkedAt: z.date(),
});

const reportSchema = z.object({
  reportId: z.string(),
  summary: z.string(),
  totalChecks: z.number().min(0),
  passedChecks: z.number().min(0),
  failedChecks: z.number().min(0),
  warningChecks: z.number().min(0),
  averageScore: z.number().min(0).max(1),
  startDate: z.date(),
  endDate: z.date(),
});

describe('ComplianceRule Model', () => {
  it('should validate correct rule', () => {
    const data = { ruleId: 'rule-123', name: 'No Explicit Content', type: 'content_policy', isActive: true, severity: 'high', conditions: [] };
    expect(ruleSchema.safeParse(data).success).toBe(true);
  });
  it('should reject empty name', () => {
    const data = { ruleId: 'rule-123', name: '', type: 'content_policy', isActive: true, severity: 'high', conditions: [] };
    expect(ruleSchema.safeParse(data).success).toBe(false);
  });
  it('should reject invalid type', () => {
    const data = { ruleId: 'rule-123', name: 'Test', type: 'invalid', isActive: true, severity: 'high', conditions: [] };
    expect(ruleSchema.safeParse(data).success).toBe(false);
  });
  it('should validate conditions', () => {
    const data = { ruleId: 'rule-123', name: 'Test', type: 'brand_safety', isActive: true, severity: 'medium', conditions: [{ field: 'language', operator: 'contains', value: 'explicit' }] };
    expect(ruleSchema.safeParse(data).success).toBe(true);
  });
});

describe('ComplianceCheck Model', () => {
  it('should validate correct check', () => {
    const data = { checkId: 'check-123', contentId: 'content-123', contentType: 'text', status: 'passed', score: 0.95, violations: [], checkedAt: new Date() };
    expect(checkSchema.safeParse(data).success).toBe(true);
  });
  it('should reject invalid status', () => {
    const data = { checkId: 'check-123', contentId: 'content-123', contentType: 'text', status: 'invalid', score: 0.5, violations: [], checkedAt: new Date() };
    expect(checkSchema.safeParse(data).success).toBe(false);
  });
  it('should reject score out of range', () => {
    const data = { checkId: 'check-123', contentId: 'content-123', contentType: 'text', status: 'passed', score: 1.5, violations: [], checkedAt: new Date() };
    expect(checkSchema.safeParse(data).success).toBe(false);
  });
  it('should validate violations', () => {
    const data = { checkId: 'check-123', contentId: 'content-123', contentType: 'text', status: 'failed', score: 0.3, violations: [{ ruleId: 'rule-123', severity: 'high', message: 'Explicit language detected' }], checkedAt: new Date() };
    expect(checkSchema.safeParse(data).success).toBe(true);
  });
});

describe('ComplianceReport Model', () => {
  it('should validate correct report', () => {
    const data = { reportId: 'report-123', summary: 'All checks passed', totalChecks: 100, passedChecks: 95, failedChecks: 3, warningChecks: 2, averageScore: 0.92, startDate: new Date(), endDate: new Date() };
    expect(reportSchema.safeParse(data).success).toBe(true);
  });
  it('should reject checks exceeding total', () => {
    const data = { reportId: 'report-123', summary: 'Test', totalChecks: 50, passedChecks: 60, failedChecks: 0, warningChecks: 0, averageScore: 0.8, startDate: new Date(), endDate: new Date() };
    expect(reportSchema.safeParse(data).success).toBe(false);
  });
  it('should reject negative counts', () => {
    const data = { reportId: 'report-123', summary: 'Test', totalChecks: -10, passedChecks: 0, failedChecks: 0, warningChecks: 0, averageScore: 0.8, startDate: new Date(), endDate: new Date() };
    expect(reportSchema.safeParse(data).success).toBe(false);
  });
});

describe('Model Indexes', () => {
  it('should verify ComplianceRule has required fields', () => {
    const model = require('../models/ComplianceRule').ComplianceRule;
    expect(model.schema.obj.ruleId).toBeDefined();
    expect(model.schema.obj.isActive).toBeDefined();
  });
  it('should verify ComplianceCheck has required fields', () => {
    const model = require('../models/ComplianceCheck').ComplianceCheck;
    expect(model.schema.obj.checkId).toBeDefined();
    expect(model.schema.obj.status).toBeDefined();
  });
});