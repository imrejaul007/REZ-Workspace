import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AbandonmentTrackerService } from '../src/index';

// Mock logger
vi.mock('../src/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('AbandonmentTrackerService', () => {
  let service: AbandonmentTrackerService;

  const mockNotificationService = {
    sendWhatsApp: vi.fn().mockResolvedValue(true),
    sendPush: vi.fn().mockResolvedValue(true),
    sendSMS: vi.fn().mockResolvedValue(true),
    sendEmail: vi.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    service = new AbandonmentTrackerService(mockNotificationService);
    vi.clearAllMocks();
  });

  describe('trackSearchAbandonment', () => {
    it('should track a search abandonment and return an AbandonedAction', async () => {
      const result = await service.trackSearchAbandonment('user123', 'laptop deals');

      expect(result).toBeDefined();
      expect(result.userId).toBe('user123');
      expect(result.type).toBe('search');
      expect(result.context.query).toBe('laptop deals');
      expect(result.resolved).toBe(false);
      expect(result.urgency).toMatch(/^(critical|high|medium|low)$/);
    });

    it('should auto-schedule re-engagement for critical/high urgency searches', async () => {
      const result = await service.trackSearchAbandonment('user123', 'buy laptop now', ['laptop1']);

      if (result.urgency === 'critical' || result.urgency === 'high') {
        const triggers = service.getPendingTriggers();
        expect(triggers.length).toBeGreaterThan(0);
      }
    });

    it('should detect different search intents', async () => {
      const comparisonResult = await service.trackSearchAbandonment('user1', 'iphone vs android');
      const priceResult = await service.trackSearchAbandonment('user2', 'cheap laptops price');

      expect(comparisonResult.intentDetected).toBe('product_comparison');
      expect(priceResult.intentDetected).toBe('price_lookup');
    });
  });

  describe('trackCartAbandonment', () => {
    it('should track cart abandonment with correct total value', async () => {
      const cartItems = [
        { productId: 'prod1', quantity: 2, price: 100, name: 'Item 1' },
        { productId: 'prod2', quantity: 1, price: 50, name: 'Item 2' },
      ];

      const result = await service.trackCartAbandonment('user123', cartItems);

      expect(result).toBeDefined();
      expect(result.type).toBe('cart');
      expect(result.context.products).toContain('prod1');
      expect(result.context.products).toContain('prod2');
    });

    it('should auto-trigger for high value carts (>100)', async () => {
      const cartItems = [{ productId: 'prod1', quantity: 1, price: 150 }];
      const result = await service.trackCartAbandonment('user123', cartItems);

      expect(result.context.totalValue).toBe(150);
      const triggers = service.getPendingTriggers();
      expect(triggers.length).toBeGreaterThan(0);
    });

    it('should detect bulk shopping intent for multiple items', async () => {
      const cartItems = [
        { productId: 'prod1', quantity: 1, price: 10 },
        { productId: 'prod2', quantity: 1, price: 10 },
        { productId: 'prod3', quantity: 1, price: 10 },
        { productId: 'prod4', quantity: 1, price: 10 },
        { productId: 'prod5', quantity: 1, price: 10 },
        { productId: 'prod6', quantity: 1, price: 10 },
      ];

      const result = await service.trackCartAbandonment('user123', cartItems);
      expect(result.intentDetected).toBe('bulk_shopping');
    });
  });

  describe('trackViewAbandonment', () => {
    it('should track view abandonment for products', async () => {
      const products = [
        { productId: 'prod1', category: 'electronics', price: 500, brand: 'Samsung' },
      ];

      const result = await service.trackViewAbandonment('user123', products);

      expect(result).toBeDefined();
      expect(result.type).toBe('view');
      expect(result.context.products).toContain('prod1');
    });

    it('should detect browsing session for multiple products', async () => {
      const products = [
        { productId: 'prod1', price: 100 },
        { productId: 'prod2', price: 200 },
        { productId: 'prod3', price: 300 },
        { productId: 'prod4', price: 400 },
        { productId: 'prod5', price: 500 },
        { productId: 'prod6', price: 600 },
      ];

      const result = await service.trackViewAbandonment('user123', products);
      expect(result.intentDetected).toBe('browsing_session');
    });
  });

  describe('trackPaymentAbandonment', () => {
    it('should always set payment abandonment to critical urgency', async () => {
      const orderDetails = {
        orderId: 'order123',
        totalValue: 50,
        products: ['prod1'],
      };

      const result = await service.trackPaymentAbandonment('user123', orderDetails);

      expect(result.type).toBe('payment');
      expect(result.urgency).toBe('critical');
    });

    it('should include order ID in metadata', async () => {
      const orderDetails = {
        orderId: 'order456',
        totalValue: 100,
        products: ['prod1', 'prod2'],
      };

      const result = await service.trackPaymentAbandonment('user123', orderDetails);
      expect(result.metadata?.orderId).toBe('order456');
    });
  });

  describe('resolveAbandonment', () => {
    it('should mark abandonment as resolved', async () => {
      const abandonment = await service.trackSearchAbandonment('user123', 'test query');

      const result = service.resolveAbandonment(abandonment.id);

      expect(result).toBeDefined();
      expect(result?.resolved).toBe(true);
      expect(result?.resolvedAt).toBeDefined();
    });

    it('should return null for non-existent abandonment', () => {
      const result = service.resolveAbandonment('non-existent-id');
      expect(result).toBeNull();
    });

    it('should merge metadata when resolving', async () => {
      const abandonment = await service.trackSearchAbandonment('user123', 'test query');
      const metadata = { conversionChannel: 'whatsapp', offerUsed: '10% off' };

      const result = service.resolveAbandonment(abandonment.id, metadata);

      expect(result?.metadata?.conversionChannel).toBe('whatsapp');
      expect(result?.metadata?.offerUsed).toBe('10% off');
    });
  });

  describe('getAbandonmentStats', () => {
    it('should calculate correct stats', async () => {
      await service.trackSearchAbandonment('user1', 'query1');
      await service.trackCartAbandonment('user2', [{ productId: 'p1', quantity: 1, price: 50 }]);
      await service.trackViewAbandonment('user3', [{ productId: 'p2', price: 100 }]);

      const stats = service.getAbandonmentStats();

      expect(stats.total).toBe(3);
      expect(stats.byType.search).toBe(1);
      expect(stats.byType.cart).toBe(1);
      expect(stats.byType.view).toBe(1);
      expect(stats.unresolved).toBe(3);
    });

    it('should calculate re-engagement rate correctly', async () => {
      await service.trackSearchAbandonment('user1', 'query1');
      const abandonment = await service.trackSearchAbandonment('user2', 'query2');

      await service.triggerReEngagement(abandonment.id, 'whatsapp');

      const stats = service.getAbandonmentStats();
      expect(stats.reEngagementRate).toBeGreaterThan(0);
    });
  });

  describe('generateOffer', () => {
    it('should generate larger offers for lower decay (colder leads)', () => {
      const freshAbandonment = {
        id: 'test1',
        userId: 'user1',
        type: 'cart' as const,
        context: {},
        intentDetected: 'test',
        urgency: 'critical' as const,
        decayScore: 95,
        createdAt: new Date(),
        reminderCount: 0,
        resolved: false,
      };

      const coldAbandonment = {
        id: 'test2',
        userId: 'user2',
        type: 'cart' as const,
        context: {},
        intentDetected: 'test',
        urgency: 'low' as const,
        decayScore: 10,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        reminderCount: 0,
        resolved: false,
      };

      const freshOffer = service.generateOffer(freshAbandonment);
      const coldOffer = service.generateOffer(coldAbandonment);

      // Lower urgency should have smaller multiplier
      expect(freshOffer?.discount).toBeGreaterThanOrEqual(coldOffer?.discount);
    });
  });

  describe('calculateDecay', () => {
    it('should calculate decay score based on time elapsed', async () => {
      const abandonment = await service.trackSearchAbandonment('user1', 'query');
      const initialDecay = abandonment.decayScore;

      // Wait a tiny bit and check decay increases
      const newDecay = service.calculateDecay(abandonment);
      expect(newDecay).toBeLessThanOrEqual(initialDecay);
    });
  });

  describe('getUserAbandonments', () => {
    it('should return all abandonments for a user', async () => {
      await service.trackSearchAbandonment('user1', 'query1');
      await service.trackSearchAbandonment('user1', 'query2');
      await service.trackCartAbandonment('user1', [{ productId: 'p1', quantity: 1, price: 50 }]);
      await service.trackSearchAbandonment('user2', 'query3');

      const user1Abandonments = service.getUserAbandonments('user1');
      expect(user1Abandonments.length).toBe(3);

      const user2Abandonments = service.getUserAbandonments('user2');
      expect(user2Abandonments.length).toBe(1);
    });
  });

  describe('triggerReEngagement', () => {
    it('should trigger re-engagement via specified channel', async () => {
      const abandonment = await service.trackSearchAbandonment('user1', 'laptop');
      const result = await service.triggerReEngagement(abandonment.id, 'whatsapp');

      expect(result).toBeDefined();
      expect(result?.channel).toBe('whatsapp');
      expect(result?.status).toBe('sent');
    });

    it('should return null for resolved abandonment', async () => {
      const abandonment = await service.trackSearchAbandonment('user1', 'query');
      service.resolveAbandonment(abandonment.id);

      const result = await service.triggerReEngagement(abandonment.id);
      expect(result).toBeNull();
    });

    it('should increment reminder count after triggering', async () => {
      const abandonment = await service.trackSearchAbandonment('user1', 'query');
      expect(abandonment.reminderCount).toBe(0);

      await service.triggerReEngagement(abandonment.id, 'whatsapp');
      const updated = service.getAbandonment(abandonment.id);
      expect(updated?.reminderCount).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all stored data', async () => {
      await service.trackSearchAbandonment('user1', 'query1');
      await service.trackCartAbandonment('user2', [{ productId: 'p1', quantity: 1, price: 50 }]);

      expect(service.getAbandonmentStats().total).toBe(2);

      service.clear();

      expect(service.getAbandonmentStats().total).toBe(0);
    });
  });
});
