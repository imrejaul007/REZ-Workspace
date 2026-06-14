// @ts-nocheck
/**
 * Delivery API Tests
 * Tests for deliveryApi.ts - Delivery tracking
 */

import * as deliveryApi from '@/services/deliveryApi';

// Mock the API client
jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
  ApiResponse: {},
}));

import apiClient from '@/services/apiClient';

describe('Delivery API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDeliveryByOrderId', () => {
    it('should fetch delivery by order ID', async () => {
      const mockDelivery = {
        id: 'del-123',
        orderId: 'order-1',
        status: 'in_transit',
        driver: { name: 'John', phone: '1234567890' },
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockDelivery,
      });

      const result = await deliveryApi.getDeliveryByOrderId('order-1');
      expect(result.success).toBe(true);
      expect(result.data?.orderId).toBe('order-1');
      expect(apiClient.get).toHaveBeenCalledWith('/delivery/order/order-1');
    });

    it('should handle not found', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Delivery not found',
      });

      const result = await deliveryApi.getDeliveryByOrderId('nonexistent');
      expect(result.success).toBe(false);
    });
  });

  describe('getDriverLocation', () => {
    it('should fetch driver location', async () => {
      const mockLocation = {
        latitude: 12.9716,
        longitude: 77.5946,
        timestamp: '2026-05-15T10:00:00Z',
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockLocation,
      });

      const result = await deliveryApi.getDriverLocation('del-123');
      expect(result.success).toBe(true);
      expect(result.data?.latitude).toBe(12.9716);
    });
  });

  describe('getDeliveryETA', () => {
    it('should fetch delivery ETA', async () => {
      const mockETA = {
        estimatedArrival: '2026-05-15T12:00:00Z',
        distance: 5000,
        duration: 1800,
        isDelayed: false,
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockETA,
      });

      const result = await deliveryApi.getDeliveryETA('del-123');
      expect(result.success).toBe(true);
      expect(result.data?.isDelayed).toBe(false);
    });

    it('should show delay when present', async () => {
      const mockETA = {
        estimatedArrival: '2026-05-15T14:00:00Z',
        distance: 5000,
        duration: 3600,
        isDelayed: true,
        delayMinutes: 30,
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockETA,
      });

      const result = await deliveryApi.getDeliveryETA('del-123');
      expect(result.data?.isDelayed).toBe(true);
      expect(result.data?.delayMinutes).toBe(30);
    });
  });

  describe('cancelDelivery', () => {
    it('should cancel delivery before pickup', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: { success: true, message: 'Cancelled' },
      });

      const result = await deliveryApi.cancelDelivery('del-123', {
        reason: 'Changed my mind',
        cancelType: 'customer',
      });

      expect(result.success).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith('/delivery/del-123/cancel', {
        reason: 'Changed my mind',
        cancelType: 'customer',
      });
    });
  });

  describe('verifyDeliveryOTP', () => {
    it('should verify OTP successfully', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: { success: true },
      });

      const result = await deliveryApi.verifyDeliveryOTP('del-123', '1234');
      expect(result.success).toBe(true);
    });

    it('should reject invalid OTP', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Invalid OTP',
      });

      const result = await deliveryApi.verifyDeliveryOTP('del-123', '0000');
      expect(result.success).toBe(false);
    });
  });
});
