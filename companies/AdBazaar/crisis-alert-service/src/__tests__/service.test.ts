/**
 * Crisis Alert Service - Service Tests
 */

import { AlertService } from '../services/alertService';
import { MonitoringService } from '../services/monitoringService';
import { NotificationService } from '../services/notificationService';

// Mock models
jest.mock('../models', () => ({
  CrisisAlert: { find: jest.fn(), findOne: jest.fn(), findByIdAndUpdate: jest.fn(), findOneAndUpdate: jest.fn(), countDocuments: jest.fn(), deleteOne: jest.fn(), aggregate: jest.fn() },
  CrisisPlaybook: { find: jest.fn(), findById: jest.fn(), create: jest.fn() },
  MonitoringKeyword: { find: jest.fn(), findById: jest.fn(), create: jest.fn(), deleteOne: jest.fn() },
  PostMortem: { find: jest.fn(), findById: jest.fn(), create: jest.fn(), findOneAndUpdate: jest.fn() },
}));

describe('AlertService', () => {
  let service: typeof AlertService;

  beforeEach(() => { jest.clearAllMocks(); });

  describe('createAlert', () => {
    it('should create a new alert', async () => {
      const CrisisAlert = require('../models').CrisisAlert;
      CrisisAlert.mockImplementation(() => ({ save: jest.fn().mockResolvedValue(createMockAlert()) }));
      CrisisAlert.aggregate.mockResolvedValue([]);
      const CrisisPlaybook = require('../models').CrisisPlaybook;
      CrisisPlaybook.find.mockResolvedValue([]);

      const result = await AlertService.createAlert({ severity: 'high', type: 'negative_sentiment', title: 'Test', description: 'Test', source: { platform: 'twitter' }, metrics: { mentions: 100, sentiment: -0.5 } });

      expect(result).toBeDefined();
    });
  });

  describe('listAlerts', () => {
    it('should return paginated alerts', async () => {
      const CrisisAlert = require('../models').CrisisAlert;
      CrisisAlert.find.mockReturnValue({ sort: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue([createMockAlert()]) });
      CrisisAlert.countDocuments.mockResolvedValue(1);

      const result = await AlertService.listAlerts({}, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter by status', async () => {
      const CrisisAlert = require('../models').CrisisAlert;
      CrisisAlert.find.mockReturnValue({ sort: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue([]) });
      CrisisAlert.countDocuments.mockResolvedValue(0);

      const result = await AlertService.listAlerts({ status: 'active' as any }, {});

      expect(result.data).toHaveLength(0);
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge an alert', async () => {
      const CrisisAlert = require('../models').CrisisAlert;
      CrisisAlert.findByIdAndUpdate.mockResolvedValue(createMockAlert({ status: 'acknowledged' }));
      CrisisAlert.aggregate.mockResolvedValue([]);

      const result = await AlertService.acknowledgeAlert('ALERT-123', 'user-123');

      expect(result?.status).toBe('acknowledged');
    });
  });

  describe('resolveAlert', () => {
    it('should resolve an alert', async () => {
      const CrisisAlert = require('../models').CrisisAlert;
      CrisisAlert.findOneAndUpdate.mockResolvedValue(createMockAlert({ status: 'resolved' }));
      CrisisAlert.aggregate.mockResolvedValue([]);

      const result = await AlertService.resolveAlert('ALERT-123', 'Issue resolved', 'user-123');

      expect(result?.status).toBe('resolved');
    });
  });

  describe('getAlertStats', () => {
    it('should return alert statistics', async () => {
      const CrisisAlert = require('../models').CrisisAlert;
      CrisisAlert.find.mockResolvedValue([createMockAlert({ status: 'resolved', resolvedAt: new Date() })]);

      const result = await AlertService.getAlertStats(30);

      expect(result).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getDailyDigest', () => {
    it('should return daily digest', async () => {
      const CrisisAlert = require('../models').CrisisAlert;
      CrisisAlert.find.mockResolvedValue([createMockAlert({ severity: 'high' })]);

      const result = await AlertService.getDailyDigest();

      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.bySeverity).toBeDefined();
      expect(result.byStatus).toBeDefined();
    });
  });
});

describe('MonitoringService', () => {
  let service: MonitoringService;

  beforeEach(() => { jest.clearAllMocks(); service = new MonitoringService(); });

  describe('addKeyword', () => {
    it('should add a monitoring keyword', async () => {
      const MonitoringKeyword = require('../models').MonitoringKeyword;
      MonitoringKeyword.create.mockResolvedValue(createMockKeyword());

      const result = await service.addKeyword('brand', ['twitter', 'instagram'], true);

      expect(result.keyword).toBe('brand');
    });
  });

  describe('removeKeyword', () => {
    it('should remove a keyword', async () => {
      const MonitoringKeyword = require('../models').MonitoringKeyword;
      MonitoringKeyword.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await service.removeKeyword('KW-123');

      expect(result).toBe(true);
    });
  });

  describe('getKeywords', () => {
    it('should return all keywords', async () => {
      const MonitoringKeyword = require('../models').MonitoringKeyword;
      MonitoringKeyword.find.mockResolvedValue([createMockKeyword(), createMockKeyword({ keyword: 'product' })]);

      const result = await service.getKeywords();

      expect(result).toHaveLength(2);
    });
  });
});