/**
 * Connector Factory - Creates configured connector instances
 *
 * Provides a centralized way to create connector instances with consistent configuration.
 * Supports both singleton and new instance creation patterns.
 *
 * @example
 * ```typescript
 * import { createConnector } from '@rez/connector-sdk';
 *
 * // Create individual connectors
 * const auth = createConnector('auth', {
 *   baseUrl: 'http://auth-service:4002',
 *   internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN,
 * });
 *
 * // Create all connectors at once
 * const connectors = createAllConnectors({
 *   internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN,
 * });
 * console.log(connectors.auth);
 * console.log(connectors.wallet);
 * ```
 */

import { AuthConnector, AuthConnectorConfig } from './auth';
import { WalletConnector, WalletConnectorConfig } from './wallet';
import { PaymentConnector, PaymentConnectorConfig } from './payment';
import { NotificationConnector, NotificationConnectorConfig } from './notification';
import { EventBusConnector, EventBusConnectorConfig } from './eventBus';
import { IntentGraphConnector, IntentGraphConnectorConfig } from './intent';
import { ConnectorConfig } from './types';

// ============================================================================
// Connector Types
// ============================================================================

export type ConnectorType = 'auth' | 'wallet' | 'payment' | 'notification' | 'eventBus' | 'intent';

export interface AllConnectorConfigs {
  /** Shared internal service token for all connectors */
  internalServiceToken?: string;
  /** Shared debug mode for all connectors */
  debug?: boolean;
  /** Shared timeout for all connectors (ms) */
  timeout?: number;
  /** Shared retry count for all connectors */
  retries?: number;
  /** Auth connector specific config */
  auth?: Partial<AuthConnectorConfig>;
  /** Wallet connector specific config */
  wallet?: Partial<WalletConnectorConfig>;
  /** Payment connector specific config */
  payment?: Partial<PaymentConnectorConfig>;
  /** Notification connector specific config */
  notification?: Partial<NotificationConnectorConfig>;
  /** Event bus connector specific config */
  eventBus?: Partial<EventBusConnectorConfig>;
  /** Intent connector specific config */
  intent?: Partial<IntentGraphConnectorConfig>;
}

export interface AllConnectors {
  auth: AuthConnector;
  wallet: WalletConnector;
  payment: PaymentConnector;
  notification: NotificationConnector;
  eventBus: EventBusConnector;
  intent: IntentGraphConnector;
}

// ============================================================================
// Base Configuration Builder
// ============================================================================

function buildBaseConfig(
  sharedConfig: AllConnectorConfigs,
  specificConfig?: Partial<ConnectorConfig>
): ConnectorConfig {
  return {
    internalServiceToken: sharedConfig.internalServiceToken,
    debug: sharedConfig.debug,
    timeout: sharedConfig.timeout,
    retries: sharedConfig.retries,
    ...specificConfig,
  };
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an AuthConnector instance
 *
 * @param config - Optional configuration override
 * @returns AuthConnector instance
 */
export function createAuthConnector(config?: AuthConnectorConfig): AuthConnector {
  return new AuthConnector(config);
}

/**
 * Create a WalletConnector instance
 *
 * @param config - Optional configuration override
 * @returns WalletConnector instance
 */
export function createWalletConnector(config?: WalletConnectorConfig): WalletConnector {
  return new WalletConnector(config);
}

/**
 * Create a PaymentConnector instance
 *
 * @param config - Optional configuration override
 * @returns PaymentConnector instance
 */
export function createPaymentConnector(config?: PaymentConnectorConfig): PaymentConnector {
  return new PaymentConnector(config);
}

/**
 * Create a NotificationConnector instance
 *
 * @param config - Optional configuration override
 * @returns NotificationConnector instance
 */
export function createNotificationConnector(config?: NotificationConnectorConfig): NotificationConnector {
  return new NotificationConnector(config);
}

/**
 * Create an EventBusConnector instance
 *
 * @param config - Optional configuration override
 * @returns EventBusConnector instance
 */
export function createEventBusConnector(config?: EventBusConnectorConfig): EventBusConnector {
  return new EventBusConnector(config);
}

/**
 * Create an IntentGraphConnector instance
 *
 * @param config - Optional configuration override
 * @returns IntentGraphConnector instance
 */
export function createIntentConnector(config?: IntentGraphConnectorConfig): IntentGraphConnector {
  return new IntentGraphConnector(config);
}

/**
 * Create a connector by type
 *
 * @param type - Connector type name
 * @param config - Optional configuration override
 * @returns Connector instance
 */
export function createConnector(
  type: ConnectorType,
  config?: AllConnectorConfigs
): AuthConnector | WalletConnector | PaymentConnector | NotificationConnector | EventBusConnector | IntentGraphConnector {
  switch (type) {
    case 'auth':
      return createAuthConnector({
        ...buildBaseConfig(config || {}),
        ...config?.auth,
      } as AuthConnectorConfig);
    case 'wallet':
      return createWalletConnector({
        ...buildBaseConfig(config || {}),
        ...config?.wallet,
      } as WalletConnectorConfig);
    case 'payment':
      return createPaymentConnector({
        ...buildBaseConfig(config || {}),
        ...config?.payment,
      } as PaymentConnectorConfig);
    case 'notification':
      return createNotificationConnector({
        ...buildBaseConfig(config || {}),
        ...config?.notification,
      } as NotificationConnectorConfig);
    case 'eventBus':
      return createEventBusConnector({
        ...buildBaseConfig(config || {}),
        ...config?.eventBus,
      } as EventBusConnectorConfig);
    case 'intent':
      return createIntentConnector({
        ...buildBaseConfig(config || {}),
        ...config?.intent,
      } as IntentGraphConnectorConfig);
    default:
      throw new Error(`Unknown connector type: ${type}`);
  }
}

/**
 * Create all connectors with shared configuration
 *
 * @param config - Shared configuration for all connectors
 * @returns Object containing all connector instances
 *
 * @example
 * ```typescript
 * const { auth, wallet, payment, notification, eventBus, intent } = createAllConnectors({
 *   internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN,
 *   debug: process.env.NODE_ENV === 'development',
 * });
 *
 * // Use connectors
 * const user = await auth.getUser('user-123');
 * const balance = await wallet.getBalance('user-123');
 * ```
 */
export function createAllConnectors(config: AllConnectorConfigs = {}): AllConnectors {
  return {
    auth: createAuthConnector({
      ...buildBaseConfig(config),
      ...config.auth,
    }),
    wallet: createWalletConnector({
      ...buildBaseConfig(config),
      ...config.wallet,
    }),
    payment: createPaymentConnector({
      ...buildBaseConfig(config),
      ...config.payment,
    }),
    notification: createNotificationConnector({
      ...buildBaseConfig(config),
      ...config.notification,
    }),
    eventBus: createEventBusConnector({
      ...buildBaseConfig(config),
      ...config.eventBus,
    }),
    intent: createIntentConnector({
      ...buildBaseConfig(config),
      ...config.intent,
    }),
  };
}

// ============================================================================
// Re-export Connectors
// ============================================================================

export { AuthConnector, AuthConnectorConfig } from './auth';
export { WalletConnector, WalletConnectorConfig } from './wallet';
export { PaymentConnector, PaymentConnectorConfig } from './payment';
export { NotificationConnector, NotificationConnectorConfig } from './notification';
export { EventBusConnector, EventBusConnectorConfig } from './eventBus';
export { IntentGraphConnector, IntentGraphConnectorConfig } from './intent';

// Re-export factory functions from individual modules
export { createAuthConnector as authFactory } from './auth';
export { createWalletConnector as walletFactory } from './wallet';
export { createPaymentConnector as paymentFactory } from './payment';
export { createNotificationConnector as notificationFactory } from './notification';
export { createEventBusConnector as eventBusFactory } from './eventBus';
export { createIntentConnector as intentFactory } from './intent';