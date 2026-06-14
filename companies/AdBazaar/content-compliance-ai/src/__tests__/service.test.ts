/** Content Compliance AI - Service Tests */
import { ComplianceService } from '../services/compliance.service';
import { AIService } from '../services/ai.service';
import { RuleService } from '../services/ruleService';

jest.mock('../models', () => ({
  ComplianceRule: { find: jest.fn(), findById: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn() },
  ComplianceCheck: { find: jest.fn(), create: jest.fn(), countDocuments: jest.fn() },
  ComplianceReport: { find: jest.fn(), create: jest.fn() },
  ComplianceHistory: { create: jest.fn() },
}));

describe('ComplianceService', () => {
  let service: ComplianceService;
  beforeEach(() => { jest.clearAllMocks(); service = new ComplianceService(); });

  describe('checkContent', () => {
    it('should check content for compliance', async () => {
      const ComplianceCheck = require('../models').ComplianceCheck;
      ComplianceCheck.create.mockResolvedValue(createMockComplianceCheck({ status: 'passed' }));
      const result = await service.checkContent({ content: 'Test content', type: 'text' });
      expect(result.status).toBeDefined();
    });

    it('should detect violations', async () => {
      const ComplianceCheck = require('../models').ComplianceCheck;
      ComplianceCheck.create.mockResolvedValue(createMockComplianceCheck({ status: 'failed', violations: ['explicit_content'] }));
      const result = await service.checkContent({ content: 'Explicit content here', type: 'text' });
      expect(result.violations).toBeDefined();
    });
  });

  describe('getCheckHistory', () => {
    it('should return check history', async () => {
      const ComplianceCheck = require('../models').ComplianceCheck;
      ComplianceCheck.find.mockReturnValue({ sort: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([createMockComplianceCheck()]) });
      const result = await service.getCheckHistory('content-123');
      expect(result).toHaveLength(1);
    });
  });

  describe('generateReport', () => {
    it('should generate compliance report', async () => {
      const ComplianceCheck = require('../models').ComplianceCheck;
      ComplianceCheck.countDocuments.mockResolvedValue(100);
      const result = await service.generateReport({ startDate: new Date(), endDate: new Date() });
      expect(result).toBeDefined();
    });
  });
});

describe('AIService', () => {
  let service: AIService;
  beforeEach(() => { jest.clearAllMocks(); service = new AIService(); });

  describe('analyzeContent', () => {
    it('should analyze content with AI', async () => {
      const result = await service.analyzeContent({ content: 'Test content', type: 'text' });
      expect(result).toBeDefined();
      expect(result.categories).toBeDefined();
    });
  });

  describe('detectSensitivities', () => {
    it('should detect sensitive content', async () => {
      const result = await service.detectSensitivities({ content: 'Political content here', type: 'text' });
      expect(result).toBeDefined();
    });
  });

  describe('suggestModifications', () => {
    it('should suggest content modifications', async () => {
      const result = await service.suggestModifications({ content: 'Original content', violations: ['explicit'] });
      expect(result).toBeDefined();
      expect(result.modifiedContent).toBeDefined();
    });
  });
});

describe('RuleService', () => {
  let service: RuleService;
  beforeEach(() => { jest.clearAllMocks(); service = new RuleService(); });

  describe('createRule', () => {
    it('should create compliance rule', async () => {
      const ComplianceRule = require('../models').ComplianceRule;
      ComplianceRule.create.mockResolvedValue(createMockComplianceRule());
      const result = await service.createRule({ name: 'No Explicit Content', type: 'content_policy', severity: 'high' });
      expect(result.name).toBe('No Explicit Content');
    });
  });

  describe('getRules', () => {
    it('should return all rules', async () => {
      const ComplianceRule = require('../models').ComplianceRule;
      ComplianceRule.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([createMockComplianceRule(), createMockComplianceRule({ name: 'Rule 2' })]) });
      const result = await service.getRules({});
      expect(result).toHaveLength(2);
    });
  });

  describe('updateRule', () => {
    it('should update rule', async () => {
      const ComplianceRule = require('../models').ComplianceRule;
      ComplianceRule.findByIdAndUpdate.mockResolvedValue(createMockComplianceRule({ isActive: false }));
      const result = await service.updateRule('rule-123', { isActive: false });
      expect(result?.isActive).toBe(false);
    });
  });
});