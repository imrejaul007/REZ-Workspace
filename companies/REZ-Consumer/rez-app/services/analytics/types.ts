// @ts-nocheck
/**
 * Analytics Types
 *
 * Comprehensive type definitions for analytics tracking system
 */

export interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  providers: AnalyticsProviderConfig[];
  batchSize: number;
  flushInterval: number;
  offlineQueueEnabled: boolean;
  privacyMode: boolean;
}

export interface AnalyticsProviderConfig {
  name: 'google_analytics' | 'firebase' | 'mixpanel' | 'amplitude' | 'custom';
  enabled: boolean;
  config;
}

export interface AnalyticsProvider {
  name: string;
  initialize(config): Promise<void>;
  trackEvent(name: string, properties?: Record<string, unknown>): void;
  trackScreen(name: string, properties?: Record<string, unknown>): void;
  setUserId(userId: string): void;
  setUserProperties(properties: Record<string, unknown>): void;
  trackPurchase(transaction: PurchaseTransaction): void;
  trackError(error: Error, context?: Record<string, unknown>): void;
  flush(): Promise<void>;
}

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: number;
  userId?: string;
  sessionId: string;
  platform: 'ios' | 'android' | 'web';
  appVersion?: string;
}

export interface PurchaseTransaction {
  transactionId: string;
  revenue: number;
  tax?: number;
  shipping?: number;
  currency: string;
  items: PurchaseItem[];
  coupon?: string;
  discount?: number;
  paymentMethod?: string;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  variant?: string;
  brand?: string;
}

export interface UserProperties {
  userId?: string;
  email?: string;
  name?: string;
  registrationDate?: string;
  totalPurchases?: number;
  totalRevenue?: number;
  favoriteCategories?: string[];
  averageOrderValue?: number;
  lastPurchaseDate?: string;
  wishlistCount?: number;
  cartItemsCount?: number;
  followedStoresCount?: number;
  loyaltyTier?: string;
  [key: string];
}

// Event type definitions
export interface StoreEvent {
  storeId: string;
  storeName: string;
  storeCategory?: string;
}

export interface ProductEvent {
  productId: string;
  productName: string;
  price: number;
  category: string;
  brand?: string;
  variant?: string;
}

export interface CartEvent extends ProductEvent {
  quantity: number;
  totalValue: number;
}

export interface DealEvent {
  dealId: string;
  dealType: 'discount' | 'voucher' | 'cashback' | 'bundle';
  dealValue: number;
  expiryDate?: string;
}

export interface UGCEvent {
  contentId: string;
  contentType: 'image' | 'video' | 'review';
  authorId?: string;
  productIds?: string[];
}

export interface BookingEvent {
  bookingId: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  totalAmount: number;
}

export interface PayBillEvent {
  billId: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  paymentMethod: string;
}

// Funnel tracking
export interface FunnelStage {
  stage: string;
  count: number;
  timestamp: number;
}

// Cart Abandonment tracking
export type CartAbandonmentStage = 'address' | 'fulfillment' | 'promo' | 'payment' | 'confirm' | 'unknown';

export interface CartAbandonmentItem {
  /** Anonymized product identifier (e.g., category hash, not actual product ID) */
  categoryHash: string;
  quantity: number;
  price: number;
}

export interface CartAbandonmentEvent {
  /** Total cart value at time of abandonment */
  cartValue: number;
  /** Number of distinct items in cart */
  itemCount: number;
  /** Stage where user abandoned checkout */
  dropOffStage: CartAbandonmentStage;
  /** Time spent on checkout page in seconds */
  timeSpentSeconds: number;
  /** Anonymized cart contents for analysis */
  cartContents?: CartAbandonmentItem[];
  /** Store identifier */
  storeId?: string;
  /** Store name */
  storeName?: string;
  /** Fulfillment type selected (delivery/pickup/dine_in/drive_thru) */
  fulfillmentType?: string;
  /** Applied promo code (anonymized if present) */
  appliedPromoCode?: string;
  /** Applied deal redemption code */
  appliedRedemption?: string;
  /** Optional reason for abandonment if selectable */
  abandonmentReason?: CartAbandonmentReason;
  /** User ID if authenticated */
  userId?: string;
  /** Session identifier */
  sessionId?: string;
}

export type CartAbandonmentReason =
  | 'too_expensive'
  | 'found_cheaper_elsewhere'
  | 'payment_issues'
  | 'security_concerns'
  | 'just_browsing'
  | 'technical_issues'
  | 'changed_mind'
  | 'other';

export interface EcommerceFunnel {
  productDiscovery: number;
  productView: number;
  addToCart: number;
  viewCart: number;
  checkoutStarted: number;
  paymentInfo: number;
  purchaseCompleted: number;
  conversionRate: number;
  dropOffRates: {
    discovery_to_view: number;
    view_to_cart: number;
    cart_to_checkout: number;
    checkout_to_payment: number;
    payment_to_purchase: number;
  };
}

// Event validation
export interface EventValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Analytics consent
export interface AnalyticsConsent {
  granted: boolean;
  timestamp: number;
  version: string;
  categories: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
    personalization: boolean;
  };
}

// Session Path Tracking Types
export type FeatureType =
  | 'home'
  | 'search'
  | 'store'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'profile'
  | 'wallet'
  | 'orders'
  | 'offers'
  | 'karma'
  | 'settings'
  | 'notifications'
  | 'onboarding'
  | 'auth'
  | 'splash';

export interface TransitionTime {
  from: FeatureType;
  to: FeatureType;
  ms: number;
  timestamp: number;
}

export interface SessionMetadata {
  sessionId: string;
  userId: string | null;
  startTime: number;
  lastActiveTime: number;
  featurePath: FeatureType[];
  transitionTimes: TransitionTime[];
  sessionDepthScore: number;
  sessionQuality: 'low' | 'medium' | 'high';
  featureVisits: Record<FeatureType, number>;
  maxSessionDuration: number;
  isActive: boolean;
}

export interface SessionExportData {
  sessionId: string;
  userId: string | null;
  startTime: number;
  lastActiveTime: number;
  featurePath: FeatureType[];
  transitionTimes: TransitionTime[];
  sessionDepthScore: number;
  sessionQuality: 'low' | 'medium' | 'high';
  featureVisits: Record<FeatureType, number>;
  maxSessionDuration: number;
}
