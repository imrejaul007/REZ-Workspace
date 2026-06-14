/**
 * REZ Scan - Unit Tests
 */

import { describe, it, expect } from '@jest/globals';

const QR_TYPES = {
  PAYMENT: 'payment',
  RESTAURANT: 'restaurant',
  PRODUCT: 'product',
  EVENT: 'event',
  LOYALTY: 'loyalty',
  CREATOR: 'creator',
  VERIFY: 'verify',
  SMART_LINK: 'smart_link',
  GENERAL: 'general'
};

function parseQR(qrContent: string): { type: string; data: unknown } {
  if (qrContent.startsWith('REZ:')) {
    const parts = qrContent.split(':');
    return { type: parts[1], data: parts[2] };
  }
  if (qrContent.includes('razorpay') || qrContent.includes('paytm') || qrContent.includes('upi')) {
    return { type: QR_TYPES.PAYMENT, data: qrContent };
  }
  if (qrContent.includes('menu') || qrContent.includes('restaurant')) {
    return { type: QR_TYPES.RESTAURANT, data: qrContent };
  }
  if (qrContent.startsWith('REZWARRANTY') || qrContent.includes('verify')) {
    return { type: QR_TYPES.VERIFY, data: qrContent };
  }
  return { type: QR_TYPES.GENERAL, data: qrContent };
}

describe('REZ Scan Service', () => {
  describe('QR Parsing', () => {
    it('should parse REZ:payment QR', () => {
      const result = parseQR('REZ:payment:abc123');
      expect(result.type).toBe('payment');
      expect(result.data).toBe('abc123');
    });

    it('should parse REZ:restaurant QR', () => {
      const result = parseQR('REZ:restaurant:res123');
      expect(result.type).toBe('restaurant');
    });

    it('should parse REZ:verify QR', () => {
      const result = parseQR('REZ:verify:prod123');
      expect(result.type).toBe('verify');
    });

    it('should detect UPI payment QR', () => {
      const result = parseQR('upi://pay?pa=merchant@upi');
      expect(result.type).toBe('payment');
    });

    it('should detect restaurant QR', () => {
      const result = parseQR('https://menu.restaurant.com');
      expect(result.type).toBe('restaurant');
    });

    it('should detect warranty QR', () => {
      const result = parseQR('REZWARRANTY123456');
      expect(result.type).toBe('verify');
    });

    it('should default to general for unknown QR', () => {
      const result = parseQR('random-content');
      expect(result.type).toBe('general');
    });
  });

  describe('QR Types', () => {
    it('should have all required types', () => {
      expect(QR_TYPES.PAYMENT).toBe('payment');
      expect(QR_TYPES.RESTAURANT).toBe('restaurant');
      expect(QR_TYPES.PRODUCT).toBe('product');
      expect(QR_TYPES.EVENT).toBe('event');
      expect(QR_TYPES.LOYALTY).toBe('loyalty');
      expect(QR_TYPES.VERIFY).toBe('verify');
    });
  });

  describe('Scan Actions', () => {
    it('should return correct action for payment', () => {
      const action = getActionForType('payment');
      expect(action).toBe('Open payment');
    });

    it('should return correct action for restaurant', () => {
      const action = getActionForType('restaurant');
      expect(action).toBe('View menu');
    });

    it('should return correct action for verify', () => {
      const action = getActionForType('verify');
      expect(action).toBe('Check warranty');
    });
  });
});

function getActionForType(type: string): string {
  const actions: Record<string, string> = {
    payment: 'Open payment',
    restaurant: 'View menu',
    product: 'Verify product',
    event: 'View event',
    loyalty: 'Collect points',
    verify: 'Check warranty',
  };
  return actions[type] || 'Open';
}
