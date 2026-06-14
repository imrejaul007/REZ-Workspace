import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  performHealthCheck,
  getServiceStatus,
  getAllServiceStates,
  resetServiceState
} from '../services/healthCheck.js';

// Mock axios
jest.mock('axios', () => ({
  default: {
    get: jest.fn()
  }
}));

describe('HealthCheck Service', () => {
  beforeEach(() => {
    resetServiceState();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('performHealthCheck', () => {
    test('should return health status for all services', async () => {
      const result = await performHealthCheck();

      expect(result).toHaveProperty('services');
      expect(result).toHaveProperty('overallStatus');
      expect(result).toHaveProperty('timestamp');
      expect(Array.isArray(result.services)).toBe(true);
      expect(result.services.length).toBe(5);
    });

    test('should include required service fields', async () => {
      const result = await performHealthCheck();
      const service = result.services[0];

      expect(service).toHaveProperty('name');
      expect(service).toHaveProperty('status');
      expect(service).toHaveProperty('responseTime');
      expect(service).toHaveProperty('lastChecked');
      expect(service).toHaveProperty('uptime');
    });

    test('should determine overall status correctly', async () => {
      const result = await performHealthCheck();

      const validStatuses = ['healthy', 'degraded', 'unhealthy', 'unknown'];
      expect(validStatuses).toContain(result.overallStatus);
    });
  });

  describe('getServiceStatus', () => {
    test('should return null for unknown service', () => {
      const status = getServiceStatus('unknown-service');
      expect(status).toBeNull();
    });

    test('should return service status for known service', async () => {
      await performHealthCheck();
      const status = getServiceStatus('profile-aggregator');

      expect(status).not.toBeNull();
      if (status) {
        expect(status.name).toBe('profile-aggregator');
        expect(status).toHaveProperty('status');
        expect(status).toHaveProperty('responseTime');
      }
    });
  });

  describe('getAllServiceStates', () => {
    test('should return all service states', () => {
      const states = getAllServiceStates();

      expect(states.size).toBe(5);
      expect(states.has('profile-aggregator')).toBe(true);
      expect(states.has('streak-service')).toBe(true);
      expect(states.has('cross-merchant')).toBe(true);
      expect(states.has('score-service')).toBe(true);
      expect(states.has('karma-bridge')).toBe(true);
    });
  });

  describe('resetServiceState', () => {
    test('should reset specific service state', async () => {
      await performHealthCheck();
      resetServiceState('profile-aggregator');

      const state = getAllServiceStates().get('profile-aggregator');
      expect(state?.consecutiveFailures).toBe(0);
    });

    test('should reset all service states', async () => {
      await performHealthCheck();
      resetServiceState();

      const states = getAllServiceStates();
      states.forEach((state) => {
        expect(state.consecutiveFailures).toBe(0);
      });
    });
  });
});
