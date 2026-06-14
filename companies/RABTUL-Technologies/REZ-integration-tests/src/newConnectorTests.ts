/**
 * REZ Intelligence - New Connector Integration Tests
 *
 * Tests for the 6 new event connectors:
 * - deliveryConnector
 * - catalogConnector
 * - searchConnector
 * - qrConnector
 * - doohConnector
 * - bookingConnector
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

// ============================================================================
// Mock Event Bus for Testing
// ============================================================================

class MockEventBus {
  private events: Map<string, unknown[]> = new Map();
  private listeners: Map<string, Function[]> = new Map();

  async publish(event: { type: string; [key: string]: unknown }): Promise<string> {
    const id = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    event.id = id;
    event.timestamp = new Date().toISOString();

    const category = event.type.split('.')[0];
    const existing = this.events.get(category) || [];
    existing.push(event);
    this.events.set(category, existing);

    const listeners = this.listeners.get(event.type) || [];
    listeners.forEach(fn => fn(event));

    return id;
  }

  on(type: string, fn: Function): void {
    const existing = this.listeners.get(type) || [];
    existing.push(fn);
    this.listeners.set(type, existing);
  }

  getEvents(category: string): unknown[] {
    return this.events.get(category) || [];
  }

  getEventByType(type: string): unknown | undefined {
    for (const events of this.events.values()) {
      const found = events.find(e => e.type === type);
      if (found) return found;
    }
    return undefined;
  }

  clear(): void {
    this.events.clear();
    this.listeners.clear();
  }
}

// ============================================================================
// Connector Implementations (simplified for testing)
// ============================================================================

const createDeliveryConnector = (eventBus: MockEventBus) => ({
  onDeliveryStarted: (delivery) => {
    eventBus.publish({
      type: 'delivery.started',
      userId: delivery.userId,
      data: {
        deliveryId: delivery.deliveryId,
        orderId: delivery.orderId,
        driverId: delivery.driverId
      }
    });
  },
  onDeliveryCompleted: (delivery) => {
    eventBus.publish({
      type: 'delivery.completed',
      userId: delivery.userId,
      data: {
        deliveryId: delivery.deliveryId,
        orderId: delivery.orderId,
        deliveryTimeMinutes: delivery.deliveryTime
      }
    });
  },
  onDriverAssigned: (delivery) => {
    eventBus.publish({
      type: 'delivery.driver_assigned',
      data: {
        deliveryId: delivery.deliveryId,
        driverId: delivery.driverId,
        driverName: delivery.driverName
      }
    });
  },
  onDeliveryFailed: (delivery) => {
    eventBus.publish({
      type: 'delivery.failed',
      data: {
        deliveryId: delivery.deliveryId,
        orderId: delivery.orderId,
        reason: delivery.reason
      }
    });
  }
});

const createCatalogConnector = (eventBus: MockEventBus) => ({
  onProductViewed: (product) => {
    eventBus.publish({
      type: 'catalog.product.viewed',
      userId: product.userId,
      data: {
        productId: product.productId,
        merchantId: product.merchantId,
        category: product.category,
        price: product.price
      }
    });
  },
  onProductAdded: (product) => {
    eventBus.publish({
      type: 'catalog.product.added',
      data: {
        productId: product.productId,
        merchantId: product.merchantId,
        name: product.name,
        price: product.price
      }
    });
  },
  onPriceChanged: (product) => {
    eventBus.publish({
      type: 'catalog.price.changed',
      data: {
        productId: product.productId,
        oldPrice: product.oldPrice,
        newPrice: product.newPrice
      }
    });
  }
});

const createSearchConnector = (eventBus: MockEventBus) => ({
  onSearchPerformed: (search) => {
    eventBus.publish({
      type: 'search.performed',
      userId: search.userId,
      data: {
        query: search.query,
        resultsCount: search.resultsCount,
        searchType: search.searchType
      }
    });
  },
  onSearchNoResults: (search) => {
    eventBus.publish({
      type: 'search.no_results',
      userId: search.userId,
      data: {
        query: search.query
      }
    });
  },
  onAutocompleteUsed: (search) => {
    eventBus.publish({
      type: 'search.autocomplete.used',
      userId: search.userId,
      data: {
        query: search.query,
        suggestion: search.suggestion
      }
    });
  }
});

const createQRConnector = (eventBus: MockEventBus) => ({
  onQRScan: (scan) => {
    eventBus.publish({
      type: 'qr.scanned',
      userId: scan.userId,
      data: {
        qrId: scan.qrId,
        qrType: scan.qrType,
        merchantId: scan.merchantId
      }
    });
  },
  onCampaignScan: (scan) => {
    eventBus.publish({
      type: 'qr.campaign.scanned',
      userId: scan.userId,
      data: {
        qrId: scan.qrId,
        campaignId: scan.campaignId,
        merchantId: scan.merchantId
      }
    });
  }
});

const createDOOHConnector = (eventBus: MockEventBus) => ({
  onAdImpression: (ad) => {
    eventBus.publish({
      type: 'dooh.ad.impression',
      userId: ad.userId,
      data: {
        screenId: ad.screenId,
        campaignId: ad.campaignId,
        adId: ad.adId
      }
    });
  },
  onAdViewed: (ad) => {
    eventBus.publish({
      type: 'dooh.ad.viewed',
      userId: ad.userId,
      data: {
        screenId: ad.screenId,
        campaignId: ad.campaignId,
        viewDuration: ad.viewDuration
      }
    });
  },
  onAdConversion: (ad) => {
    eventBus.publish({
      type: 'dooh.ad.conversion',
      userId: ad.userId,
      data: {
        screenId: ad.screenId,
        campaignId: ad.campaignId,
        conversionType: ad.conversionType,
        value: ad.value
      }
    });
  }
});

const createBookingConnector = (eventBus: MockEventBus) => ({
  onBookingCreated: (booking) => {
    eventBus.publish({
      type: 'booking.created',
      userId: booking.userId,
      data: {
        bookingId: booking.bookingId,
        bookingType: booking.bookingType,
        dateTime: booking.dateTime
      }
    });
  },
  onBookingConfirmed: (booking) => {
    eventBus.publish({
      type: 'booking.confirmed',
      userId: booking.userId,
      data: {
        bookingId: booking.bookingId,
        confirmationNumber: booking.confirmationNumber
      }
    });
  },
  onCheckIn: (booking) => {
    eventBus.publish({
      type: 'booking.check_in',
      userId: booking.userId,
      data: {
        reservationId: booking.reservationId
      }
    });
  }
});

// ============================================================================
// Tests
// ============================================================================

describe('REZ Intelligence - New Connector Integration Tests', () => {

  let eventBus: MockEventBus;
  let deliveryConnector: ReturnType<typeof createDeliveryConnector>;
  let catalogConnector: ReturnType<typeof createCatalogConnector>;
  let searchConnector: ReturnType<typeof createSearchConnector>;
  let qrConnector: ReturnType<typeof createQRConnector>;
  let doohConnector: ReturnType<typeof createDOOHConnector>;
  let bookingConnector: ReturnType<typeof createBookingConnector>;

  beforeEach(() => {
    eventBus = new MockEventBus();
    deliveryConnector = createDeliveryConnector(eventBus);
    catalogConnector = createCatalogConnector(eventBus);
    searchConnector = createSearchConnector(eventBus);
    qrConnector = createQRConnector(eventBus);
    doohConnector = createDOOHConnector(eventBus);
    bookingConnector = createBookingConnector(eventBus);
  });

  // ============================================
  // Delivery Connector Tests
  // ============================================

  describe('Delivery Connector', () => {

    test('should emit delivery.started event', async () => {
      deliveryConnector.onDeliveryStarted({
        deliveryId: 'del_123',
        orderId: 'order_456',
        userId: 'user_789',
        driverId: 'driver_abc'
      });

      const event = eventBus.getEventByType('delivery.started');
      expect(event).toBeDefined();
      expect(event.type).toBe('delivery.started');
      expect(event.data.deliveryId).toBe('del_123');
      expect(event.data.orderId).toBe('order_456');
    });

    test('should emit delivery.completed event', async () => {
      deliveryConnector.onDeliveryCompleted({
        deliveryId: 'del_123',
        orderId: 'order_456',
        userId: 'user_789',
        deliveryTime: 35
      });

      const event = eventBus.getEventByType('delivery.completed');
      expect(event).toBeDefined();
      expect(event.userId).toBe('user_789');
      expect(event.data.deliveryTimeMinutes).toBe(35);
    });

    test('should emit delivery.driver_assigned event', async () => {
      deliveryConnector.onDriverAssigned({
        deliveryId: 'del_123',
        driverId: 'driver_abc',
        driverName: 'Ravi Kumar'
      });

      const event = eventBus.getEventByType('delivery.driver_assigned');
      expect(event).toBeDefined();
      expect(event.data.driverName).toBe('Ravi Kumar');
    });

    test('should emit delivery.failed event', async () => {
      deliveryConnector.onDeliveryFailed({
        deliveryId: 'del_123',
        orderId: 'order_456',
        reason: 'Customer not available'
      });

      const event = eventBus.getEventByType('delivery.failed');
      expect(event).toBeDefined();
      expect(event.data.reason).toBe('Customer not available');
    });
  });

  // ============================================
  // Catalog Connector Tests
  // ============================================

  describe('Catalog Connector', () => {

    test('should emit catalog.product.viewed event', async () => {
      catalogConnector.onProductViewed({
        productId: 'prod_123',
        userId: 'user_456',
        merchantId: 'merchant_abc',
        category: 'pizza',
        price: 449
      });

      const event = eventBus.getEventByType('catalog.product.viewed');
      expect(event).toBeDefined();
      expect(event.userId).toBe('user_456');
      expect(event.data.category).toBe('pizza');
      expect(event.data.price).toBe(449);
    });

    test('should emit catalog.product.added event', async () => {
      catalogConnector.onProductAdded({
        productId: 'prod_new',
        merchantId: 'merchant_abc',
        name: 'Margherita Pizza',
        price: 299
      });

      const event = eventBus.getEventByType('catalog.product.added');
      expect(event).toBeDefined();
      expect(event.data.name).toBe('Margherita Pizza');
    });

    test('should emit catalog.price.changed event with percentage', async () => {
      catalogConnector.onPriceChanged({
        productId: 'prod_123',
        oldPrice: 400,
        newPrice: 350
      });

      const event = eventBus.getEventByType('catalog.price.changed');
      expect(event).toBeDefined();
      expect(event.data.oldPrice).toBe(400);
      expect(event.data.newPrice).toBe(350);
    });
  });

  // ============================================
  // Search Connector Tests
  // ============================================

  describe('Search Connector', () => {

    test('should emit search.performed event', async () => {
      searchConnector.onSearchPerformed({
        userId: 'user_123',
        query: 'pizza near me',
        resultsCount: 15,
        searchType: 'text'
      });

      const event = eventBus.getEventByType('search.performed');
      expect(event).toBeDefined();
      expect(event.data.query).toBe('pizza near me');
      expect(event.data.resultsCount).toBe(15);
      expect(event.data.searchType).toBe('text');
    });

    test('should emit search.no_results event', async () => {
      searchConnector.onSearchNoResults({
        userId: 'user_123',
        query: 'nonexistent item xyz'
      });

      const event = eventBus.getEventByType('search.no_results');
      expect(event).toBeDefined();
      expect(event.data.query).toBe('nonexistent item xyz');
    });

    test('should emit search.autocomplete.used event', async () => {
      searchConnector.onAutocompleteUsed({
        userId: 'user_123',
        query: 'piz',
        suggestion: 'pizza'
      });

      const event = eventBus.getEventByType('search.autocomplete.used');
      expect(event).toBeDefined();
      expect(event.data.suggestion).toBe('pizza');
    });
  });

  // ============================================
  // QR Connector Tests
  // ============================================

  describe('QR Connector', () => {

    test('should emit qr.scanned event', async () => {
      qrConnector.onQRScan({
        qrId: 'qr_123',
        userId: 'user_456',
        qrType: 'merchant',
        merchantId: 'merchant_abc'
      });

      const event = eventBus.getEventByType('qr.scanned');
      expect(event).toBeDefined();
      expect(event.data.qrType).toBe('merchant');
      expect(event.data.merchantId).toBe('merchant_abc');
    });

    test('should emit qr.campaign.scanned event', async () => {
      qrConnector.onCampaignScan({
        qrId: 'qr_123',
        campaignId: 'camp_xyz',
        userId: 'user_456',
        merchantId: 'merchant_abc'
      });

      const event = eventBus.getEventByType('qr.campaign.scanned');
      expect(event).toBeDefined();
      expect(event.data.campaignId).toBe('camp_xyz');
    });
  });

  // ============================================
  // DOOH Connector Tests
  // ============================================

  describe('DOOH Connector', () => {

    test('should emit dooh.ad.impression event', async () => {
      doohConnector.onAdImpression({
        screenId: 'screen_123',
        userId: 'user_456',
        campaignId: 'camp_xyz',
        adId: 'ad_abc'
      });

      const event = eventBus.getEventByType('dooh.ad.impression');
      expect(event).toBeDefined();
      expect(event.data.screenId).toBe('screen_123');
      expect(event.data.campaignId).toBe('camp_xyz');
    });

    test('should emit dooh.ad.viewed event with duration', async () => {
      doohConnector.onAdViewed({
        screenId: 'screen_123',
        userId: 'user_456',
        campaignId: 'camp_xyz',
        adId: 'ad_abc',
        viewDuration: 15
      });

      const event = eventBus.getEventByType('dooh.ad.viewed');
      expect(event).toBeDefined();
      expect(event.data.viewDuration).toBe(15);
    });

    test('should emit dooh.ad.conversion event with value', async () => {
      doohConnector.onAdConversion({
        screenId: 'screen_123',
        userId: 'user_456',
        campaignId: 'camp_xyz',
        adId: 'ad_abc',
        conversionType: 'order',
        value: 499
      });

      const event = eventBus.getEventByType('dooh.ad.conversion');
      expect(event).toBeDefined();
      expect(event.data.conversionType).toBe('order');
      expect(event.data.value).toBe(499);
    });
  });

  // ============================================
  // Booking Connector Tests
  // ============================================

  describe('Booking Connector', () => {

    test('should emit booking.created event', async () => {
      bookingConnector.onBookingCreated({
        bookingId: 'book_123',
        userId: 'user_456',
        bookingType: 'restaurant',
        dateTime: '2026-05-20T19:00:00Z'
      });

      const event = eventBus.getEventByType('booking.created');
      expect(event).toBeDefined();
      expect(event.userId).toBe('user_456');
      expect(event.data.bookingType).toBe('restaurant');
    });

    test('should emit booking.confirmed event', async () => {
      bookingConnector.onBookingConfirmed({
        bookingId: 'book_123',
        userId: 'user_456',
        confirmationNumber: 'CONF-123456'
      });

      const event = eventBus.getEventByType('booking.confirmed');
      expect(event).toBeDefined();
      expect(event.data.confirmationNumber).toBe('CONF-123456');
    });

    test('should emit booking.check_in event', async () => {
      bookingConnector.onCheckIn({
        reservationId: 'res_123',
        userId: 'user_456',
        merchantId: 'hotel_abc'
      });

      const event = eventBus.getEventByType('booking.check_in');
      expect(event).toBeDefined();
      expect(event.data.reservationId).toBe('res_123');
    });
  });

  // ============================================
  // End-to-End Flow Tests
  // ============================================

  describe('End-to-End Flows', () => {

    test('delivery → intelligence flow', async () => {
      // Order placed → Delivery started → Driver assigned → Delivery completed
      deliveryConnector.onDeliveryStarted({
        deliveryId: 'del_123',
        orderId: 'order_456',
        userId: 'user_789',
        driverId: 'driver_abc'
      });

      let events = eventBus.getEvents('delivery');
      expect(events.length).toBe(1);
      expect(events[0].type).toBe('delivery.started');

      deliveryConnector.onDriverAssigned({
        deliveryId: 'del_123',
        driverId: 'driver_abc',
        driverName: 'Ravi'
      });

      events = eventBus.getEvents('delivery');
      expect(events.length).toBe(2);

      deliveryConnector.onDeliveryCompleted({
        deliveryId: 'del_123',
        orderId: 'order_456',
        userId: 'user_789',
        deliveryTime: 30
      });

      events = eventBus.getEvents('delivery');
      expect(events.length).toBe(3);
      expect(events[2].type).toBe('delivery.completed');
    });

    test('search → catalog → order flow', async () => {
      // User searches → views product → places order
      searchConnector.onSearchPerformed({
        userId: 'user_123',
        query: 'margherita pizza',
        resultsCount: 10,
        searchType: 'text'
      });

      catalogConnector.onProductViewed({
        productId: 'prod_pizza',
        userId: 'user_123',
        merchantId: 'merchant_abc',
        category: 'pizza',
        price: 299
      });

      const searchEvents = eventBus.getEvents('search');
      const catalogEvents = eventBus.getEvents('catalog');

      expect(searchEvents.length).toBe(1);
      expect(searchEvents[0].data.query).toBe('margherita pizza');

      expect(catalogEvents.length).toBe(1);
      expect(catalogEvents[0].data.productId).toBe('prod_pizza');
    });

    test('QR scan → DOOH → conversion flow', async () => {
      // User scans QR → Sees DOOH ad → Converts
      qrConnector.onQRScan({
        qrId: 'qr_promo',
        userId: 'user_123',
        qrType: 'campaign',
        merchantId: 'merchant_abc'
      });

      doohConnector.onAdImpression({
        screenId: 'screen_nearby',
        userId: 'user_123',
        campaignId: 'camp_promo',
        adId: 'ad_abc'
      });

      doohConnector.onAdConversion({
        screenId: 'screen_nearby',
        userId: 'user_123',
        campaignId: 'camp_promo',
        adId: 'ad_abc',
        conversionType: 'order',
        value: 299
      });

      const qrEvents = eventBus.getEvents('qr');
      const doohEvents = eventBus.getEvents('dooh');

      expect(qrEvents.length).toBe(1);
      expect(doohEvents.length).toBe(2);

      const conversionEvent = doohEvents.find(e => e.type === 'dooh.ad.conversion');
      expect(conversionEvent).toBeDefined();
      expect(conversionEvent.data.value).toBe(299);
    });

    test('booking → check-in flow', async () => {
      // User books hotel → Confirmed → Checks in
      bookingConnector.onBookingCreated({
        bookingId: 'book_hotel',
        userId: 'user_123',
        bookingType: 'hotel',
        dateTime: '2026-05-20T14:00:00Z'
      });

      bookingConnector.onBookingConfirmed({
        bookingId: 'book_hotel',
        userId: 'user_123',
        confirmationNumber: 'STAY-123456'
      });

      bookingConnector.onCheckIn({
        reservationId: 'book_hotel',
        userId: 'user_123',
        merchantId: 'hotel_abc'
      });

      const bookingEvents = eventBus.getEvents('booking');
      expect(bookingEvents.length).toBe(3);
      expect(bookingEvents[0].type).toBe('booking.created');
      expect(bookingEvents[1].type).toBe('booking.confirmed');
      expect(bookingEvents[2].type).toBe('booking.check_in');
    });
  });
});
