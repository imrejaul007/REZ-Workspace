// @ts-nocheck
/**
 * WhatsApp API Tests
 * Tests for whatsappApi.ts - WhatsApp commerce
 */

import * as whatsappApi from '@/services/whatsappApi';

// Mock the API client
jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  ApiResponse: {},
}));

import apiClient from '@/services/apiClient';

describe('WhatsApp API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWhatsAppCart', () => {
    it('should fetch WhatsApp cart', async () => {
      const mockCart = {
        id: 'wacart-123',
        userId: 'user-1',
        phone: '919876543210',
        items: [{ productId: 'prod-1', name: 'Pizza', price: 299, quantity: 2 }],
        total: 598,
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockCart,
      });

      const result = await whatsappApi.getWhatsAppCart('user-1');
      expect(result.success).toBe(true);
      expect(result.data?.items).toHaveLength(1);
    });
  });

  describe('addToWhatsAppCart', () => {
    it('should add item to WhatsApp cart', async () => {
      const mockCart = {
        id: 'wacart-123',
        userId: 'user-1',
        items: [{ productId: 'prod-1', name: 'Burger', price: 199, quantity: 1 }],
        total: 199,
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockCart,
      });

      const result = await whatsappApi.addToWhatsAppCart('user-1', {
        productId: 'prod-1',
        name: 'Burger',
        price: 199,
        quantity: 1,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('removeFromWhatsAppCart', () => {
    it('should remove item from cart', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: { id: 'wacart-123', items: [], total: 0 },
      });

      const result = await whatsappApi.removeFromWhatsAppCart('user-1', 'prod-1');
      expect(result.success).toBe(true);
    });
  });

  describe('placeWhatsAppOrder', () => {
    it('should place order via WhatsApp', async () => {
      const mockOrder = {
        id: 'waorder-123',
        userId: 'user-1',
        items: [{ productId: 'prod-1', name: 'Pizza', price: 299, quantity: 1 }],
        total: 299,
        status: 'confirmed' as const,
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockOrder,
      });

      const result = await whatsappApi.placeWhatsAppOrder('user-1', 'addr-1');
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('confirmed');
    });
  });

  describe('sendWhatsAppMessage', () => {
    it('should send WhatsApp message', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
      });

      const result = await whatsappApi.sendWhatsAppMessage('user-1', 'Hello, I need help!');
      expect(result.success).toBe(true);
    });
  });
});
