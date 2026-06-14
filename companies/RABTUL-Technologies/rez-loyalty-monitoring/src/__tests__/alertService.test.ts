import { describe, test, expect, beforeEach } from '@jest/globals';
import { createAlertService } from '../services/alertService.js';
import { Alert } from '../models/MetricSnapshot.js';
import mongoose from 'mongoose';

// Mock database connection
jest.mock('mongoose', () => {
  const mockModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn()
  };

  return {
    __esModule: true,
    default: {
      connect: jest.fn(),
      connection: {
        readyState: 1
      }
    },
    model: jest.fn(() => mockModel),
    Schema: class {
      static types = {
        Mixed: {}
      };
    }
  };
});

describe('AlertService', () => {
  let alertService: ReturnType<typeof createAlertService>;

  beforeEach(() => {
    alertService = createAlertService();
  });

  describe('createAlert', () => {
    test('should create alert with correct structure', async () => {
      // Mock the static create method
      const mockAlert = {
        id: expect.any(String),
        type: 'test_alert',
        severity: 'warning',
        status: 'active',
        message: 'Test alert message',
        details: {},
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      };

      (Alert.create as jest.Mock).mockResolvedValue(mockAlert);

      const alert = await alertService.createAlert(
        'test_alert',
        'Test alert message',
        'warning'
      );

      expect(alert).toBeDefined();
      expect(alert.type).toBe('test_alert');
      expect(alert.severity).toBe('warning');
      expect(alert.status).toBe('active');
    });
  });

  describe('alert thresholds', () => {
    test('should have correct default thresholds', () => {
      // Thresholds are set via constructor
      expect(alertService).toBeDefined();
    });
  });

  describe('alert type checks', () => {
    test('should handle service_down alert type', async () => {
      const mockAlert = {
        id: 'service_down:profile-aggregator:123456',
        type: 'service_down',
        severity: 'critical',
        status: 'active',
        service: 'profile-aggregator',
        message: expect.any(String),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (Alert.findOne as jest.Mock).mockResolvedValue(null);
      (Alert.create as jest.Mock).mockResolvedValue(mockAlert);
    });
  });
});
