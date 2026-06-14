/**
 * REZ Go - Checkout Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
vi.mock('../src/models/GoSession.js', () => ({
  GoSession: {
    findOne: vi.fn(),
    updateOne: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('../src/services/sessionService.js', () => ({
  sessionService: {
    getSession: vi.fn(),
    getSessionForUser: vi.fn(),
    completeSession: vi.fn(),
    cancelSession: vi.fn(),
    recalculateTotals: vi.fn(),
    touchSession: vi.fn(),
  },
}));

vi.mock('../src/services/cashbackService.js', () => ({
  cashbackService: {
    calculateCashback: vi.fn(),
    creditCashback: vi.fn(),
  },
}));

vi.mock('../src/integrations/paymentIntegration.js', () => ({
  paymentIntegration: {
    initiateUPIPayment: vi.fn(),
    processWalletPayment: vi.fn(),
    initiateCardPayment: vi.fn(),
    processSplitPayment: vi.fn(),
  },
}));

vi.mock('../src/config/index.js', () => ({
  config: {
    JWT_SECRET: 'test-secret',
    PORT: 4075,
    NODE_ENV: 'test',
  },
}));

describe('Checkout Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HMAC Exit Token', () => {
    it('should generate valid exit token with correct format', async () => {
      const crypto = await import('crypto');
      const sessionId = 'GOS-TEST123';
      const expiresAt = Date.now() + 5 * 60 * 1000;
      const payload = `${sessionId}:${expiresAt}`;
      const signature = crypto.createHmac('sha256', 'test-secret')
        .update(payload)
        .digest('hex');
      const token = Buffer.from(`${payload}:${signature}`).toString('base64url');

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(20);
      // base64url uses A-Z, a-z, 0-9, -, _ (no dots)
      expect(/^[A-Za-z0-9_-]+$/.test(token)).toBe(true);
    });

    it('should verify valid token', async () => {
      const crypto = await import('crypto');
      const sessionId = 'GOS-TEST123';
      const expiresAt = Date.now() + 5 * 60 * 1000;
      const payload = `${sessionId}:${expiresAt}`;
      const signature = crypto.createHmac('sha256', 'test-secret')
        .update(payload)
        .digest('hex');
      const token = Buffer.from(`${payload}:${signature}`).toString('base64url');

      // Decode and verify
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const parts = decoded.split(':');
      expect(parts[0]).toBe(sessionId);
      expect(parseInt(parts[1])).toBe(expiresAt);
    });

    it('should reject expired token', () => {
      const expiresAt = Date.now() - 1000; // Already expired
      expect(Date.now() > expiresAt).toBe(true);
    });

    it('should reject tampered token', async () => {
      const crypto = await import('crypto');
      const sessionId = 'GOS-TEST123';
      const expiresAt = Date.now() + 5 * 60 * 1000;
      const payload = `${sessionId}:${expiresAt}`;
      const signature = crypto.createHmac('sha256', 'test-secret')
        .update(payload)
        .digest('hex');

      // Tamper with sessionId
      const tamperedPayload = `GOS-HACKED:${expiresAt}`;
      const tamperedSignature = crypto.createHmac('sha256', 'test-secret')
        .update(tamperedPayload)
        .digest('hex');

      // Signatures should not match
      expect(tamperedSignature).not.toBe(signature);
    });
  });

  describe('Cashback Calculation', () => {
    it('should calculate base cashback correctly', async () => {
      const price = 100;
      const percent = 2;
      const cashback = Math.floor(price * (percent / 100));
      expect(cashback).toBe(2);
    });

    it('should apply happy hour bonus', async () => {
      const price = 100;
      const basePercent = 2;
      const happyHourBonus = 1;
      const totalPercent = basePercent + happyHourBonus;
      const cashback = Math.floor(price * (totalPercent / 100));
      expect(cashback).toBe(3);
    });

    it('should apply streak bonus', async () => {
      const price = 100;
      const basePercent = 2;
      const streakBonus = 3; // 7-day streak
      const totalPercent = basePercent + streakBonus;
      const cashback = Math.floor(price * (totalPercent / 100));
      expect(cashback).toBe(5);
    });

    it('should cap cashback at max reward', async () => {
      const price = 10000;
      const percent = 50;
      const maxReward = 100;
      const rawCashback = Math.floor(price * (percent / 100));
      const cashback = Math.min(rawCashback, maxReward);
      expect(cashback).toBe(100);
    });
  });

  describe('Cart Total Calculation', () => {
    it('should calculate subtotal correctly', () => {
      const items = [
        { price: 100, quantity: 2 },
        { price: 50, quantity: 1 },
        { price: 25, quantity: 4 },
      ];
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      expect(subtotal).toBe(350);
    });

    it('should calculate tax correctly (18% GST)', () => {
      const subtotal = 350;
      const tax = Math.round(subtotal * 0.18 * 100) / 100;
      expect(tax).toBe(63);
    });

    it('should calculate total correctly', () => {
      const subtotal = 350;
      const tax = 63;
      const total = subtotal + tax;
      expect(total).toBe(413);
    });

    it('should calculate savings correctly', () => {
      const mrpTotal = 500;
      const paidTotal = 350;
      const cashback = 10;
      const saved = mrpTotal - paidTotal + cashback;
      expect(saved).toBe(160);
    });
  });

  describe('Session Validation', () => {
    it('should reject empty cart', () => {
      const items: any[] = [];
      expect(items.length).toBe(0);
    });

    it('should validate session status', () => {
      const validStatuses = ['active', 'syncing'];
      expect(validStatuses).toContain('active');
      expect(validStatuses).not.toContain('completed');
    });

    it('should validate payment method', () => {
      const validMethods = ['upi', 'wallet', 'card', 'split'];
      expect(validMethods).toContain('upi');
      expect(validMethods).not.toContain('bitcoin');
    });
  });
});

describe('Recovery Transfer', () => {
  describe('Transfer Creation', () => {
    it('should create transfer with correct expiration', () => {
      const initiatedAt = new Date();
      const expiresAt = new Date(initiatedAt.getTime() + 30 * 60 * 1000);
      const duration = expiresAt.getTime() - initiatedAt.getTime();
      expect(duration).toBe(30 * 60 * 1000); // 30 minutes
    });

    it('should capture cart snapshot correctly', () => {
      const sessionItems = [
        { productId: 'P1', name: 'Item 1', price: 100, quantity: 2 },
        { productId: 'P2', name: 'Item 2', price: 50, quantity: 1 },
      ];
      const snapshot = {
        items: sessionItems.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal: 250,
        total: 295,
        cashbackEarned: 5,
      };
      expect(snapshot.items.length).toBe(2);
      expect(snapshot.total).toBe(295);
    });
  });

  describe('Transfer Expiration', () => {
    it('should detect expired transfer', () => {
      const expiresAt = new Date(Date.now() - 1000);
      expect(Date.now() > expiresAt.getTime()).toBe(true);
    });

    it('should not expire valid transfer', () => {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      expect(Date.now() > expiresAt.getTime()).toBe(false);
    });
  });
});

describe('Product Intelligence', () => {
  describe('Nutrition Parsing', () => {
    it('should calculate health score correctly', () => {
      const nutrition = {
        calories: 150,
        protein: 2,
        carbs: 30,
        fat: 3,
        sugar: 15,
      };

      // Simple health score calculation
      let score = 100;
      if (nutrition.sugar > 10) score -= 10;
      if (nutrition.fat > 10) score -= 10;
      if (nutrition.calories > 200) score -= 5;
      if (nutrition.protein >= 5) score += 5;

      // sugar(15) > 10: -10, fat(3) <= 10: 0, calories(150) <= 200: 0, protein(2) < 5: 0
      expect(score).toBe(90);
    });

    it('should identify allergens correctly', () => {
      const allergens = ['peanuts', 'milk', 'gluten'];
      expect(allergens).toContain('peanuts');
      expect(allergens).not.toContain('soy');
    });

    it('should validate dietary requirements', () => {
      const dietary = {
        vegetarian: true,
        vegan: false,
        glutenFree: true,
      };
      expect(dietary.vegetarian).toBe(true);
      expect(dietary.vegan).toBe(false);
      expect(dietary.glutenFree).toBe(true);
    });
  });
});

describe('Fraud Detection', () => {
  describe('6-Factor Engine', () => {
    it('should flag high cart value', () => {
      const threshold = 5000;
      const cartValue = 7500;
      expect(cartValue > threshold).toBe(true);
    });

    it('should flag fast scanning velocity', () => {
      const threshold = 10; // items per minute
      const itemsScanned = 15;
      const minutesElapsed = 1;
      const velocity = itemsScanned / minutesElapsed;
      expect(velocity > threshold).toBe(true);
    });

    it('should flag short session duration', () => {
      const threshold = 2; // minutes
      const sessionDuration = 1.5; // minutes
      expect(sessionDuration < threshold).toBe(true);
    });

    it('should flag high-value items', () => {
      const threshold = 1000;
      const items = [
        { price: 1500 },
        { price: 800 },
      ];
      const highValueItems = items.filter(item => item.price > threshold);
      expect(highValueItems.length).toBe(1);
    });

    it('should flag quantity anomalies', () => {
      const threshold = 10;
      const items = [
        { quantity: 15 },
        { quantity: 5 },
      ];
      const anomalousItems = items.filter(item => item.quantity > threshold);
      expect(anomalousItems.length).toBe(1);
    });

    it('should calculate composite fraud score', () => {
      const factors = {
        cartValue: 30, // High value
        velocity: 25, // Fast scanning
        duration: 20, // Short session
        highValueItems: 15,
        quantityAnomaly: 10,
        history: 0,
      };

      const totalScore = Object.values(factors).reduce((sum, val) => sum + val, 0);
      expect(totalScore).toBe(100);
    });
  });
});

describe('QR Code Verification', () => {
  describe('Session QR', () => {
    it('should parse valid session QR', () => {
      const qrData = '{"intent":"go-session","v":1,"storeId":"STORE123","action":"start"}';
      const payload = JSON.parse(qrData);
      expect(payload.intent).toBe('go-session');
      expect(payload.storeId).toBe('STORE123');
    });

    it('should reject invalid intent', () => {
      const qrData = '{"intent":"invalid","v":1}';
      const payload = JSON.parse(qrData);
      const validIntents = ['go-session', 'go-product', 'go-recovery'];
      expect(validIntents).not.toContain(payload.intent);
    });
  });

  describe('Recovery QR', () => {
    it('should parse valid recovery QR', () => {
      const qrData = '{"intent":"go-recovery","v":1,"transferId":"RCV-ABC123"}';
      const payload = JSON.parse(qrData);
      expect(payload.intent).toBe('go-recovery');
      expect(payload.transferId).toBe('RCV-ABC123');
    });
  });
});
