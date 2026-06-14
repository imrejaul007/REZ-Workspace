import { AnomalyDetector, LoginContext } from '../../services/anomalyDetector';

// Mock dependencies
jest.mock('../../models', () => ({
  MFAUser: {
    findOne: jest.fn(),
  },
  LoginAttempt: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('AnomalyDetector', () => {
  const baseContext: LoginContext = {
    userId: 'user123',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
    method: 'totp',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectAnomalies', () => {
    it('should detect no anomalies for normal login', async () => {
      const { LoginAttempt } = require('../../models');
      LoginAttempt.find.mockResolvedValue([]);

      const anomalies = await AnomalyDetector.detectAnomalies(baseContext);

      expect(anomalies).toHaveLength(0);
    });

    it('should detect unusual location anomaly', async () => {
      const { LoginAttempt } = require('../../models');
      const oneHourAgo = new Date(Date.now() - 30 * 60 * 1000);

      LoginAttempt.find.mockResolvedValue([
        { city: 'New York', timestamp: oneHourAgo },
        { city: 'New York', timestamp: oneHourAgo },
      ]);

      const context = {
        ...baseContext,
        city: 'Los Angeles',
      };

      const anomalies = await AnomalyDetector.detectAnomalies(context);

      expect(anomalies.some(a => a.type === 'unusual_location')).toBe(true);
    });

    it('should detect multiple failures anomaly', async () => {
      const { LoginAttempt } = require('../../models');
      const recentAttempts = [];
      for (let i = 0; i < 5; i++) {
        recentAttempts.push({
          city: 'New York',
          timestamp: new Date(),
          success: false,
        });
      }

      LoginAttempt.find.mockResolvedValue(recentAttempts);

      const anomalies = await AnomalyDetector.detectAnomalies(baseContext);

      expect(anomalies.some(a => a.type === 'multiple_failures')).toBe(true);
    });

    it('should detect suspicious IP anomaly', async () => {
      const { LoginAttempt } = require('../../models');
      const recentAttempts = [];
      for (let i = 0; i < 12; i++) {
        recentAttempts.push({
          ipAddress: '192.168.1.100',
          timestamp: new Date(),
          success: true,
        });
      }

      LoginAttempt.find.mockResolvedValue(recentAttempts);

      const anomalies = await AnomalyDetector.detectAnomalies(baseContext);

      expect(anomalies.some(a => a.type === 'suspicious_ip')).toBe(true);
    });
  });

  describe('generateRiskReport', () => {
    it('should return low risk for user with no attempts', async () => {
      const { LoginAttempt } = require('../../models');
      LoginAttempt.find.mockResolvedValue([]);

      const report = await AnomalyDetector.generateRiskReport('user123');

      expect(report.riskLevel).toBe('low');
      expect(report.anomalies).toHaveLength(0);
      expect(report.recentAttempts).toBe(0);
    });

    it('should return high risk for user with multiple failures', async () => {
      const { LoginAttempt } = require('../../models');
      const attempts = [];
      for (let i = 0; i < 6; i++) {
        attempts.push({
          success: false,
          anomalyTypes: ['multiple_failures'],
          timestamp: new Date(),
        });
      }

      LoginAttempt.find.mockResolvedValue(attempts);

      const report = await AnomalyDetector.generateRiskReport('user123');

      expect(report.riskLevel).toBe('high');
      expect(report.recentAttempts).toBe(6);
    });
  });

  describe('isTrustedDevice', () => {
    it('should return false for non-existent user', async () => {
      const { MFAUser } = require('../../models');
      MFAUser.findOne.mockResolvedValue(null);

      const result = await AnomalyDetector.isTrustedDevice('user123', 'device1', '192.168.1.1');

      expect(result.trusted).toBe(false);
    });

    it('should return false for unknown device', async () => {
      const { MFAUser } = require('../../models');
      MFAUser.findOne.mockResolvedValue({
        trustedDevices: [
          { deviceId: 'device2', ipAddress: '192.168.1.1' },
        ],
      });

      const result = await AnomalyDetector.isTrustedDevice('user123', 'device1', '192.168.1.1');

      expect(result.trusted).toBe(false);
    });

    it('should return true for known device with matching IP', async () => {
      const { MFAUser } = require('../../models');
      const mockSave = jest.fn().mockResolvedValue(undefined);
      const lastUsedAt = new Date();

      MFAUser.findOne.mockResolvedValue({
        trustedDevices: [
          {
            deviceId: 'device1',
            ipAddress: '192.168.1.1',
            lastUsedAt,
            save: mockSave,
          },
        ],
      });

      const result = await AnomalyDetector.isTrustedDevice('user123', 'device1', '192.168.1.1');

      expect(result.trusted).toBe(true);
      expect(result.lastUsed).toBeDefined();
    });
  });
});
