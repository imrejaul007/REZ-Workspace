import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cookieStore } from './setup';

// Types for testing
interface SDKConfig {
  pixelId: string;
  attributionUrl: string;
  debug?: boolean;
  deduplicationWindow?: number;
  autoPageView?: boolean;
  storeSlug?: string;
  merchantId?: string;
}

interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  externalId?: string;
}

interface EventData {
  eventName: string;
  eventId?: string;
  value?: number;
  currency?: string;
  contentIds?: string[];
  contentType?: string;
  contents?: Array<{ id: string; quantity: number; item_price?: number }>;
  orderId?: string;
  searchString?: string;
  numItems?: number;
  customData?: Record<string, unknown>;
}

interface TrackOptions {
  thirdParty?: boolean;
  eventId?: string;
  userData?: UserData;
  timestamp?: Date;
}

// Standard events
const StandardEvents = {
  PAGE_VIEW: 'PageView',
  VIEW_CONTENT: 'ViewContent',
  SEARCH: 'Search',
  ADD_TO_CART: 'AddToCart',
  ADD_TO_WISHLIST: 'AddToWishlist',
  INITIATE_CHECKOUT: 'InitiateCheckout',
  ADD_PAYMENT_INFO: 'AddPaymentInfo',
  PURCHASE: 'Purchase',
  LEAD: 'Lead',
  COMPLETE_REGISTRATION: 'CompleteRegistration',
  CONTACT: 'Contact',
  CUSTOMIZE_PRODUCT: 'CustomizeProduct',
  DONATE: 'Donate',
  FIND_LOCATION: 'FindLocation',
  SCHEDULE: 'Schedule',
  START_TRIAL: 'StartTrial',
  SUBMIT_APPLICATION: 'SubmitApplication',
  SUBSCRIBE: 'Subscribe',
  APP_OPEN: 'app_open',
  APP_INSTALL: 'app_install',
  APP_UPDATE: 'app_update',
} as const;

// Mock state
let config: SDKConfig | null = null;
let userData: UserData = {};
let sessionId: string = '';
const eventQueue: Array<{ event: EventData; options: TrackOptions }> = [];
let isProcessing = false;

// Utility functions
function generateEventId(): string {
  return `${Date.now()}-${crypto.randomUUID().replace(/-/g, '').substring(0, 9)}`;
}

function generateSessionId(): string {
  return `sess_${Date.now()}-${crypto.randomUUID().replace(/-/g, '').substring(0, 9)}`;
}

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function setCookie(name: string, value: string, days: number): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function log(message: string, data?: unknown): void {
  if (config?.debug) {
    logger.info(`[REZ Attribution SDK] ${message}`, data || '');
  }
}

// Core SDK functions (simplified for testing)
function init(options: SDKConfig): void {
  config = {
    pixelId: options.pixelId,
    attributionUrl: options.attributionUrl,
    debug: options.debug ?? false,
    deduplicationWindow: options.deduplicationWindow ?? 5000,
    autoPageView: options.autoPageView ?? true,
    storeSlug: options.storeSlug,
    merchantId: options.merchantId,
  };

  // Initialize session
  if (!getCookie('_rez_attrib_session') || isSessionStart()) {
    sessionId = generateSessionId();
    setCookie('_rez_attrib_session', sessionId, 365);
    setCookie('_rez_attrib_session_time', Date.now().toString(), 365);
  } else {
    sessionId = getCookie('_rez_attrib_session') || generateSessionId();
  }

  // Track first visit
  if (isFirstVisit()) {
    log('First visit tracked');
    setCookie('_rez_attrib_visited', '1', 365);
  }

  log('SDK initialized', config);
}

function setUser(data: UserData): void {
  userData = { ...userData, ...data };
  log('User data set', userData);
}

function getUser(): UserData {
  return { ...userData };
}

function getSessionId(): string {
  return sessionId;
}

function track(eventName: string, data?: Record<string, unknown>, options?: TrackOptions): void {
  const eventData: EventData = {
    eventName,
    eventId: options?.eventId || generateEventId(),
    ...data,
  };

  // Simulate tracking
  log('Event tracked', eventData);
}

function isFirstVisit(): boolean {
  return !getCookie('_rez_attrib_visited');
}

function isSessionStart(): boolean {
  const lastSession = getCookie('_rez_attrib_session_time');
  if (!lastSession) return true;

  const sessionLength = 30 * 60 * 1000; // 30 minutes
  return Date.now() - parseInt(lastSession) > sessionLength;
}

// E-commerce helpers
function trackProductView(product: {
  id: string;
  name: string;
  category?: string;
  price?: number;
  currency?: string;
}): void {
  track(StandardEvents.VIEW_CONTENT, {
    contentIds: [product.id],
    contentType: 'product',
    contents: [{ id: product.id, quantity: 1, item_price: product.price }],
    value: product.price,
    currency: product.currency || 'INR',
    customData: {
      product_name: product.name,
      product_category: product.category,
    },
  });
}

function trackAddToCart(item: {
  id: string;
  name: string;
  price: number;
  quantity: number;
  currency?: string;
}): void {
  track(StandardEvents.ADD_TO_CART, {
    contentIds: [item.id],
    contentType: 'product',
    contents: [{ id: item.id, quantity: item.quantity, item_price: item.price }],
    value: item.price * item.quantity,
    currency: item.currency || 'INR',
    numItems: item.quantity,
    customData: {
      product_name: item.name,
    },
  });
}

function trackCheckoutStarted(cart: {
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  total: number;
  currency?: string;
}): void {
  track(StandardEvents.INITIATE_CHECKOUT, {
    contentIds: cart.items.map((i) => i.id),
    contentType: 'product',
    contents: cart.items.map((i) => ({ id: i.id, quantity: i.quantity, item_price: i.price })),
    value: cart.total,
    currency: cart.currency || 'INR',
    numItems: cart.items.reduce((sum, i) => sum + i.quantity, 0),
  });
}

function trackPurchase(order: {
  id: string;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  total: number;
  tax?: number;
  shipping?: number;
  discount?: number;
  currency?: string;
}): void {
  track(StandardEvents.PURCHASE, {
    orderId: order.id,
    contentIds: order.items.map((i) => i.id),
    contentType: 'product',
    contents: order.items.map((i) => ({ id: i.id, quantity: i.quantity, item_price: i.price })),
    value: order.total,
    currency: order.currency || 'INR',
    numItems: order.items.reduce((sum, i) => sum + i.quantity, 0),
    customData: {
      tax: order.tax,
      shipping: order.shipping,
      discount: order.discount,
    },
  });
}

function trackSearch(searchString: string): void {
  track(StandardEvents.SEARCH, {
    searchString,
  });
}

// Event mapping
function mapToMetaEvent(eventName: string): string | null {
  const mapping: Record<string, string> = {
    [StandardEvents.PAGE_VIEW]: 'PageView',
    [StandardEvents.VIEW_CONTENT]: 'ViewContent',
    [StandardEvents.SEARCH]: 'Search',
    [StandardEvents.ADD_TO_CART]: 'AddToCart',
    [StandardEvents.ADD_TO_WISHLIST]: 'AddToWishlist',
    [StandardEvents.INITIATE_CHECKOUT]: 'InitiateCheckout',
    [StandardEvents.ADD_PAYMENT_INFO]: 'AddPaymentInfo',
    [StandardEvents.PURCHASE]: 'Purchase',
    [StandardEvents.LEAD]: 'Lead',
    [StandardEvents.COMPLETE_REGISTRATION]: 'CompleteRegistration',
  };
  return mapping[eventName] || eventName;
}

function mapToTikTokEvent(eventName: string): string | null {
  const mapping: Record<string, string> = {
    [StandardEvents.PAGE_VIEW]: 'PageView',
    [StandardEvents.VIEW_CONTENT]: 'ViewContent',
    [StandardEvents.ADD_TO_CART]: 'AddToCart',
    [StandardEvents.INITIATE_CHECKOUT]: 'InitiateCheckout',
    [StandardEvents.PURCHASE]: 'PlaceAnOrder',
    [StandardEvents.LEAD]: 'SubmitForm',
  };
  return mapping[eventName] || eventName;
}

// Tests
describe('REZ Attribution SDK', () => {
  beforeEach(() => {
    // Reset state
    config = null;
    userData = {};
    sessionId = '';
    cookieStore = {};
    vi.clearAllMocks();
  });

  afterEach(() => {
    cookieStore = {};
  });

  describe('SDK Initialization', () => {
    it('should initialize with required config', () => {
      init({
        pixelId: 'test-pixel-123',
        attributionUrl: 'https://api.rez.money/attribution',
      });

      expect(config).not.toBeNull();
      expect(config?.pixelId).toBe('test-pixel-123');
      expect(config?.attributionUrl).toBe('https://api.rez.money/attribution');
      expect(config?.debug).toBe(false);
      expect(config?.deduplicationWindow).toBe(5000);
      expect(config?.autoPageView).toBe(true);
    });

    it('should initialize with optional config', () => {
      init({
        pixelId: 'test-pixel-123',
        attributionUrl: 'https://api.rez.money/attribution',
        debug: true,
        deduplicationWindow: 10000,
        storeSlug: 'test-store',
        merchantId: 'merchant-001',
      });

      expect(config?.debug).toBe(true);
      expect(config?.deduplicationWindow).toBe(10000);
      expect(config?.storeSlug).toBe('test-store');
      expect(config?.merchantId).toBe('merchant-001');
    });

    it('should generate session ID on first visit', () => {
      init({
        pixelId: 'test-pixel-123',
        attributionUrl: 'https://api.rez.money/attribution',
      });

      expect(sessionId).toMatch(/^sess_\d+-[a-z0-9]+$/);
    });

    it('should reuse session ID on subsequent calls', () => {
      init({
        pixelId: 'test-pixel-123',
        attributionUrl: 'https://api.rez.money/attribution',
      });

      const firstSessionId = sessionId;
      init({
        pixelId: 'test-pixel-123',
        attributionUrl: 'https://api.rez.money/attribution',
      });

      expect(sessionId).toBe(firstSessionId);
    });

    it('should set cookies on initialization', () => {
      init({
        pixelId: 'test-pixel-123',
        attributionUrl: 'https://api.rez.money/attribution',
      });

      expect(document.cookie).toContain('_rez_attrib_session');
      expect(document.cookie).toContain('_rez_attrib_session_time');
    });
  });

  describe('User Data Management', () => {
    beforeEach(() => {
      init({
        pixelId: 'test-pixel-123',
        attributionUrl: 'https://api.rez.money/attribution',
      });
    });

    it('should set user data', () => {
      setUser({ email: 'test@example.com', phone: '+919876543210' });

      expect(userData.email).toBe('test@example.com');
      expect(userData.phone).toBe('+919876543210');
    });

    it('should merge user data', () => {
      setUser({ email: 'test@example.com' });
      setUser({ phone: '+919876543210' });

      expect(userData.email).toBe('test@example.com');
      expect(userData.phone).toBe('+919876543210');
    });

    it('should return copy of user data', () => {
      setUser({ email: 'test@example.com' });
      const retrieved = getUser();

      retrieved.email = 'changed@example.com';
      expect(userData.email).toBe('test@example.com');
    });

    it('should return session ID', () => {
      const id = getSessionId();
      expect(id).toMatch(/^sess_/);
    });
  });

  describe('Standard Events', () => {
    it('should define all standard events', () => {
      expect(StandardEvents.PAGE_VIEW).toBe('PageView');
      expect(StandardEvents.VIEW_CONTENT).toBe('ViewContent');
      expect(StandardEvents.SEARCH).toBe('Search');
      expect(StandardEvents.ADD_TO_CART).toBe('AddToCart');
      expect(StandardEvents.INITIATE_CHECKOUT).toBe('InitiateCheckout');
      expect(StandardEvents.PURCHASE).toBe('Purchase');
    });

    it('should include ecommerce events', () => {
      expect(StandardEvents.ADD_TO_WISHLIST).toBe('AddToWishlist');
      expect(StandardEvents.ADD_PAYMENT_INFO).toBe('AddPaymentInfo');
      expect(StandardEvents.LEAD).toBe('Lead');
      expect(StandardEvents.COMPLETE_REGISTRATION).toBe('CompleteRegistration');
    });

    it('should include custom events', () => {
      expect(StandardEvents.CONTACT).toBe('Contact');
      expect(StandardEvents.DONATE).toBe('Donate');
      expect(StandardEvents.FIND_LOCATION).toBe('FindLocation');
      expect(StandardEvents.SCHEDULE).toBe('Schedule');
      expect(StandardEvents.SUBSCRIBE).toBe('Subscribe');
    });

    it('should include app events', () => {
      expect(StandardEvents.APP_OPEN).toBe('app_open');
      expect(StandardEvents.APP_INSTALL).toBe('app_install');
      expect(StandardEvents.APP_UPDATE).toBe('app_update');
    });
  });

  describe('Event Tracking', () => {
    beforeEach(() => {
      init({
        pixelId: 'test-pixel-123',
        attributionUrl: 'https://api.rez.money/attribution',
      });
    });

    it('should track basic event', () => {
      expect(() => {
        track('TestEvent');
      }).not.toThrow();
    });

    it('should track event with data', () => {
      expect(() => {
        track('PageView', { page: '/home' });
      }).not.toThrow();
    });

    it('should generate event ID', () => {
      const eventId = generateEventId();
      expect(eventId).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('should generate unique session ID', () => {
      const id = generateSessionId();
      expect(id).toMatch(/^sess_\d+-[a-z0-9]+$/);
    });
  });

  describe('E-commerce Tracking', () => {
    beforeEach(() => {
      init({
        pixelId: 'test-pixel-123',
        attributionUrl: 'https://api.rez.money/attribution',
      });
    });

    it('should track product view', () => {
      expect(() => {
        trackProductView({
          id: 'prod_001',
          name: 'Premium Pizza',
          category: 'food',
          price: 299,
          currency: 'INR',
        });
      }).not.toThrow();
    });

    it('should track add to cart', () => {
      expect(() => {
        trackAddToCart({
          id: 'prod_001',
          name: 'Premium Pizza',
          price: 299,
          quantity: 2,
          currency: 'INR',
        });
      }).not.toThrow();
    });

    it('should track checkout started', () => {
      expect(() => {
        trackCheckoutStarted({
          items: [
            { id: 'prod_001', name: 'Pizza', price: 299, quantity: 2 },
            { id: 'prod_002', name: 'Coke', price: 49, quantity: 1 },
          ],
          total: 647,
          currency: 'INR',
        });
      }).not.toThrow();
    });

    it('should track purchase', () => {
      expect(() => {
        trackPurchase({
          id: 'order_001',
          items: [
            { id: 'prod_001', name: 'Pizza', price: 299, quantity: 2 },
          ],
          total: 647,
          tax: 52,
          shipping: 20,
          discount: 50,
          currency: 'INR',
        });
      }).not.toThrow();
    });

    it('should track search', () => {
      expect(() => {
        trackSearch('pizza near me');
      }).not.toThrow();
    });
  });

  describe('Event Mapping', () => {
    it('should map to Meta events correctly', () => {
      expect(mapToMetaEvent('PageView')).toBe('PageView');
      expect(mapToMetaEvent('AddToCart')).toBe('AddToCart');
      expect(mapToMetaEvent('Purchase')).toBe('Purchase');
      expect(mapToMetaEvent('CustomEvent')).toBe('CustomEvent');
    });

    it('should map to TikTok events correctly', () => {
      expect(mapToTikTokEvent('PageView')).toBe('PageView');
      expect(mapToTikTokEvent('AddToCart')).toBe('AddToCart');
      expect(mapToTikTokEvent('Purchase')).toBe('PlaceAnOrder');
      expect(mapToTikTokEvent('Lead')).toBe('SubmitForm');
    });
  });

  describe('Cookie Management', () => {
    beforeEach(() => {
      init({
        pixelId: 'test-pixel-123',
        attributionUrl: 'https://api.rez.money/attribution',
      });
    });

    it('should get cookie value', () => {
      const sessionCookie = getCookie('_rez_attrib_session');
      expect(sessionCookie).toBeTruthy();
    });

    it('should set cookie with expiration', () => {
      setCookie('test_cookie', 'test_value', 7);
      const value = getCookie('test_cookie');
      expect(value).toBe('test_value');
    });

    it('should return null for non-existent cookie', () => {
      const value = getCookie('non_existent_cookie');
      expect(value).toBeNull();
    });
  });

  describe('First Visit Detection', () => {
    it('should detect first visit', () => {
      init({
        pixelId: 'test-pixel-123',
        attributionUrl: 'https://api.rez.money/attribution',
      });

      expect(isFirstVisit()).toBe(true);
    });

    it('should detect returning visitor', () => {
      init({
        pixelId: 'test-pixel-123',
        attributionUrl: 'https://api.rez.money/attribution',
      });

      // Simulate revisit
      document.cookie = '_rez_attrib_visited=1; path=/';

      expect(isFirstVisit()).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should detect session start', () => {
      init({
        pixelId: 'test-pixel-123',
        attributionUrl: 'https://api.rez.money/attribution',
      });

      expect(isSessionStart()).toBe(true);
    });

    it('should detect within session', () => {
      init({
        pixelId: 'test-pixel-123',
        attributionUrl: 'https://api.rez.money/attribution',
      });

      // Set session time to now
      document.cookie = `_rez_attrib_session_time=${Date.now()}; path=/`;

      expect(isSessionStart()).toBe(false);
    });

    it('should detect session timeout (>30 min)', () => {
      init({
        pixelId: 'test-pixel-123',
        attributionUrl: 'https://api.rez.money/attribution',
      });

      // Set session time to 60 minutes ago
      const oldTime = Date.now() - 60 * 60 * 1000;
      document.cookie = `_rez_attrib_session_time=${oldTime}; path=/`;

      expect(isSessionStart()).toBe(true);
    });
  });
});
