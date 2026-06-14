/**
 * Pre-configured Singleton Connectors
 *
 * Provides immediately usable singleton instances with default configuration.
 * These connect to services using environment variables or localhost defaults.
 *
 * @example
 * ```typescript
 * // Import singletons directly
 * import { auth, wallet, payment, notification, eventBus, intent } from '@rez/connector-sdk';
 *
 * // Use immediately without configuration
 * const user = await auth.getUser('user-123');
 * const balance = await wallet.getBalance('user-123');
 *
 * // Access from anywhere in your application
 * // Singleton instances are lazily initialized and reused
 * ```
 *
 * @note
 * Singletons use these default ports:
 * - Auth: 4002
 * - Wallet: 4004
 * - Payment: 4003
 * - Notification: 4011
 * - Event Bus: 4051
 * - Intent: 4018
 */

import {
  AuthConnector,
  WalletConnector,
  PaymentConnector,
  NotificationConnector,
  EventBusConnector,
  IntentGraphConnector,
} from './factory';

// ============================================================================
// Lazy Initialization Map
// ============================================================================

type ConnectorConstructor<T> = new (config?: Record<string, unknown>) => T;

interface SingletonEntry<T> {
  instance: T | null;
  config: Record<string, unknown>;
  Constructor: ConnectorConstructor<T>;
}

const singletons = new Map<string, SingletonEntry<unknown>>();

// ============================================================================
// Singleton Management
// ============================================================================

function getOrCreateSingleton<T>(
  name: string,
  Constructor: ConnectorConstructor<T>,
  config: Record<string, unknown>
): T {
  const existing = singletons.get(name) as SingletonEntry<T> | undefined;

  if (!existing) {
    // First time - create and store
    const instance = new Constructor(config);
    singletons.set(name, { instance, config, Constructor });
    return instance;
  }

  // Check if config has changed
  const configKeys = Object.keys(config);
  const needsRecreation = configKeys.some((key) => existing.config[key] !== config[key]);

  if (needsRecreation) {
    // Config changed - recreate instance
    const instance = new Constructor(config);
    singletons.set(name, { instance, config, Constructor });
    return instance;
  }

  // Return existing instance
  return existing.instance as T;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG = {
  auth: {
    baseUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
    internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN,
    timeout: 30000,
    retries: 3,
    debug: process.env.NODE_ENV === 'development',
  },
  wallet: {
    baseUrl: process.env.WALLET_SERVICE_URL || 'http://localhost:4004',
    internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN,
    timeout: 30000,
    retries: 3,
    debug: process.env.NODE_ENV === 'development',
  },
  payment: {
    baseUrl: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4003',
    internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN,
    timeout: 30000,
    retries: 3,
    debug: process.env.NODE_ENV === 'development',
  },
  notification: {
    baseUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011',
    internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN,
    timeout: 30000,
    retries: 3,
    debug: process.env.NODE_ENV === 'development',
  },
  eventBus: {
    baseUrl: process.env.EVENT_BUS_URL || 'http://localhost:4051',
    internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN,
    timeout: 30000,
    retries: 3,
    debug: process.env.NODE_ENV === 'development',
  },
  intent: {
    baseUrl: process.env.INTENT_SERVICE_URL || 'http://localhost:4018',
    internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN,
    timeout: 30000,
    retries: 3,
    debug: process.env.NODE_ENV === 'development',
  },
} as const;

// ============================================================================
// Pre-configured Singleton Instances
// ============================================================================

/**
 * Auth Connector Singleton
 *
 * Handles authentication operations:
 * - Token verification
 * - OTP sending/verification
 * - User management
 * - JWT validation
 *
 * @example
 * ```typescript
 * import { auth } from '@rez/connector-sdk';
 *
 * // Verify a token
 * const result = await auth.verifyToken(token);
 * if (result.valid) {
 *   console.log('User ID:', result.user?.userId);
 * }
 *
 * // Send OTP
 * await auth.sendOTP('+919876543210');
 *
 * // Verify OTP
 * const tokens = await auth.verifyOTP('+919876543210', '123456');
 * ```
 */
export const auth: AuthConnector = getOrCreateSingleton(
  'auth',
  AuthConnector as unknown as ConnectorConstructor<AuthConnector>,
  DEFAULT_CONFIG.auth
);

/**
 * Wallet Connector Singleton
 *
 * Handles wallet operations:
 * - Balance queries
 * - Cashback management
 * - User-merchant transfers
 * - Transaction history
 * - Merchant operations
 *
 * @example
 * ```typescript
 * import { wallet } from '@rez/connector-sdk';
 *
 * // Get balance
 * const { balance, cashbackBalance } = await wallet.getBalance('user-123');
 *
 * // Transfer to merchant
 * await wallet.transferToMerchant('user-123', 'merchant-456', 100);
 *
 * // Get history
 * const history = await wallet.history('user-123', 50);
 * ```
 */
export const wallet: WalletConnector = getOrCreateSingleton(
  'wallet',
  WalletConnector as unknown as ConnectorConstructor<WalletConnector>,
  DEFAULT_CONFIG.wallet
);

/**
 * Payment Connector Singleton
 *
 * Handles payment operations:
 * - Order creation
 * - Payment verification
 * - Refunds
 * - QR code generation
 *
 * @example
 * ```typescript
 * import { payment } from '@rez/connector-sdk';
 *
 * // Create order
 * const order = await payment.createOrder({
 *   amount: 99900,
 *   userId: 'user-123',
 *   merchantId: 'merchant-456',
 * });
 *
 * // Verify payment
 * await payment.verifyPayment(orderId, paymentId, signature);
 * ```
 */
export const payment: PaymentConnector = getOrCreateSingleton(
  'payment',
  PaymentConnector as unknown as ConnectorConstructor<PaymentConnector>,
  DEFAULT_CONFIG.payment
);

/**
 * Notification Connector Singleton
 *
 * Handles notification operations:
 * - Push notifications
 * - SMS
 * - WhatsApp
 * - Email
 * - Bulk messaging
 *
 * @example
 * ```typescript
 * import { notification } from '@rez/connector-sdk';
 *
 * // Send push notification
 * await notification.push('user-123', 'Hello!', 'Your order is ready');
 *
 * // Send SMS
 * await notification.sms('+919876543210', 'Your OTP is 123456');
 *
 * // Send bulk
 * await notification.sendBulkSMS([
 *   { phone: '+919876543210', message: 'Hello!' },
 *   { phone: '+919876543211', message: 'Hello!' },
 * ]);
 * ```
 */
export const notification: NotificationConnector = getOrCreateSingleton(
  'notification',
  NotificationConnector as unknown as ConnectorConstructor<NotificationConnector>,
  DEFAULT_CONFIG.notification
);

/**
 * Event Bus Connector Singleton
 *
 * Handles event operations:
 * - Event publishing
 * - Real-time subscriptions
 * - Event history
 *
 * @example
 * ```typescript
 * import { eventBus } from '@rez/connector-sdk';
 *
 * // Publish event
 * await eventBus.publish('user.created', { userId: '123' });
 *
 * // Subscribe to events
 * eventBus.subscribe('order.placed', (data) => {
 *   console.log('Order:', data);
 * });
 *
 * // Get history
 * const history = await eventBus.getHistory('order.placed', 50);
 * ```
 */
export const eventBus: EventBusConnector = getOrCreateSingleton(
  'eventBus',
  EventBusConnector as unknown as ConnectorConstructor<EventBusConnector>,
  DEFAULT_CONFIG.eventBus
);

/**
 * Intent Graph Connector Singleton
 *
 * Handles ML/intent operations:
 * - Event tracking
 * - Intent analysis
 * - User predictions
 * - Preference management
 *
 * @example
 * ```typescript
 * import { intent } from '@rez/connector-sdk';
 *
 * // Track event
 * await intent.trackEvent('user-123', 'product.viewed', { productId: '456' });
 *
 * // Get user intent
 * const { intent: userIntent, confidence } = await intent.getIntent('user-123');
 *
 * // Predict action
 * const { probability } = await intent.predict('user-123', 'purchase');
 * ```
 */
export const intent: IntentGraphConnector = getOrCreateSingleton(
  'intent',
  IntentGraphConnector as unknown as ConnectorConstructor<IntentGraphConnector>,
  DEFAULT_CONFIG.intent
);

// ============================================================================
// Reset Function
// ============================================================================

/**
 * Reset all singleton instances
 *
 * Useful for testing or when you need to reinitialize connectors with new configuration.
 *
 * @example
 * ```typescript
 * import { resetSingletons, createAllConnectors } from '@rez/connector-sdk';
 *
 * // Reset and reconfigure
 * resetSingletons();
 *
 * // Create new instances with updated config
 * const connectors = createAllConnectors({
 *   internalServiceToken: process.env.NEW_TOKEN,
 * });
 * ```
 */
export function resetSingletons(): void {
  for (const entry of singletons.values()) {
    if (entry.instance && 'destroy' in entry.instance) {
      (entry.instance as EventBusConnector).destroy();
    }
  }
  singletons.clear();
}

/**
 * Reset a specific singleton instance
 *
 * @param name - Name of the connector to reset ('auth' | 'wallet' | 'payment' | 'notification' | 'eventBus' | 'intent')
 *
 * @example
 * ```typescript
 * import { resetSingleton } from '@rez/connector-sdk';
 *
 * resetSingleton('auth');
 * ```
 */
export function resetSingleton(name: 'auth' | 'wallet' | 'payment' | 'notification' | 'eventBus' | 'intent'): void {
  const entry = singletons.get(name);
  if (entry) {
    if (entry.instance && 'destroy' in entry.instance) {
      (entry.instance as EventBusConnector).destroy();
    }
    singletons.delete(name);
  }
}

// ============================================================================
// Type Exports
// ============================================================================

export type {
  AuthConnectorConfig,
} from './auth';
export type {
  WalletConnectorConfig,
} from './wallet';
export type {
  PaymentConnectorConfig,
} from './payment';
export type {
  NotificationConnectorConfig,
} from './notification';
export type {
  EventBusConnectorConfig,
} from './eventBus';
export type {
  IntentGraphConnectorConfig,
} from './intent';