/**
 * RABTUL Connector SDK
 *
 * A unified SDK for connecting to RABTUL microservices including:
 * - Auth Service (Authentication, OTP, User Management)
 * - Wallet Service (Balance, Transfers, Transactions)
 * - Payment Service (Orders, Refunds, QR Codes)
 * - Notification Service (Push, SMS, WhatsApp, Email)
 * - Event Bus (Pub/Sub, Real-time Events)
 * - Intent Service (ML Analytics, Predictions, User Intent)
 *
 * @example
 * ```typescript
 * // Import from main package
 * import { auth, wallet, payment, notification, eventBus, intent } from '@rez/connector-sdk';
 *
 * // Or import specific connectors
 * import { AuthConnector } from '@rez/connector-sdk/auth';
 * import { PaymentConnector } from '@rez/connector-sdk/payment';
 * ```
 *
 * @example
 * ```typescript
 * // Using factory to create connectors
 * import { createAllConnectors } from '@rez/connector-sdk';
 *
 * const connectors = createAllConnectors({
 *   internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN,
 *   debug: process.env.NODE_ENV === 'development',
 * });
 *
 * // Use all connectors
 * const user = await connectors.auth.getUser('user-123');
 * const balance = await connectors.wallet.getBalance('user-123');
 * ```
 */

// ============================================================================
// Main Exports - Singleton Instances
// ============================================================================

export {
  auth,
  wallet,
  payment,
  notification,
  eventBus,
  intent,
  resetSingletons,
  resetSingleton,
} from './singleton';

export type {
  AuthConnectorConfig,
  WalletConnectorConfig,
  PaymentConnectorConfig,
  NotificationConnectorConfig,
  EventBusConnectorConfig,
  IntentGraphConnectorConfig,
} from './singleton';

// ============================================================================
// Factory Exports
// ============================================================================

export {
  createConnector,
  createAllConnectors,
  createAuthConnector,
  createWalletConnector,
  createPaymentConnector,
  createNotificationConnector,
  createEventBusConnector,
  createIntentConnector,
} from './factory';

export type {
  ConnectorType,
  AllConnectorConfigs,
  AllConnectors,
} from './factory';

// ============================================================================
// Individual Connector Exports
// ============================================================================

// Auth Connector
export {
  AuthConnector,
  createAuthConnector as newAuthConnector,
} from './auth';
export type { AuthConnectorConfig } from './auth';

// Wallet Connector
export {
  WalletConnector,
  createWalletConnector as newWalletConnector,
} from './wallet';
export type { WalletConnectorConfig } from './wallet';

// Payment Connector
export {
  PaymentConnector,
  createPaymentConnector as newPaymentConnector,
} from './payment';
export type { PaymentConnectorConfig } from './payment';

// Notification Connector
export {
  NotificationConnector,
  createNotificationConnector as newNotificationConnector,
} from './notification';
export type { NotificationConnectorConfig } from './notification';

// Event Bus Connector
export {
  EventBusConnector,
  createEventBusConnector as newEventBusConnector,
} from './eventBus';
export type { EventBusConnectorConfig } from './eventBus';

// Intent Graph Connector
export {
  IntentGraphConnector,
  createIntentConnector as newIntentConnector,
} from './intent';
export type { IntentGraphConnectorConfig } from './intent';

// ============================================================================
// Type Exports
// ============================================================================

export {
  // User types
  type UserPayload,
  type User,
  // Auth types
  type VerifyTokenResponse,
  type SendOTPResponse,
  type VerifyOTPResponse,
  type RefreshTokenResponse,
  // Wallet types
  type BalanceResponse,
  type CashbackResponse,
  type DeductResponse,
  type TransferResponse,
  type Transaction,
  type WalletHistoryResponse,
  type MerchantBalanceResponse,
  type WithdrawResponse,
  // Payment types
  type CreateOrderParams,
  type CreateOrderResponse,
  type VerifyPaymentResponse,
  type RefundResponse,
  type PaymentMethod,
  type PaymentMethodsResponse,
  type QRCodeResponse,
  type VerifyQRPaymentResponse,
  // Notification types
  type SendResponse,
  type BulkSendResponse,
  type NotificationRecord,
  type NotificationHistoryResponse,
  type NotificationPreferences,
  type UpdatePreferencesResponse,
  // Event Bus types
  type PublishEventResponse,
  type EventRecord,
  type EventHistoryResponse,
  // Intent types
  type IntentResponse,
  type IntentSignal,
  type PreferencesResponse,
  type Preference,
  type PredictionResponse,
  type TrackEventParams,
  // Common types
  type ConnectorConfig,
  type ApiResponse,
  type ApiError,
  type PaginationParams,
  type PaginationResponse,
} from './types';

// Zod Schemas
export {
  // Auth schemas
  VerifyTokenSchema,
  SendOTPSchema,
  VerifyOTPSchema,
  RefreshTokenSchema,
  ValidateJWTSchema,
  GetUserSchema,
  // Wallet schemas
  AddCashbackSchema,
  DeductSchema,
  TransferToMerchantSchema,
  WalletHistorySchema,
  GetMerchantBalanceSchema,
  WithdrawSchema,
  // Payment schemas
  CreateOrderSchema,
  VerifyPaymentSchema,
  RefundSchema,
  GetPaymentMethodsSchema,
  GenerateQRCodeSchema,
  VerifyQRPaymentSchema,
  // Notification schemas
  PushSchema,
  SMSSchema,
  WhatsAppSchema,
  EmailSchema,
  BulkSMSchema,
  BulkPushSchema,
  NotificationHistorySchema,
  UpdatePreferencesSchema,
  // Event Bus schemas
  PublishSchema,
  SubscribeSchema,
  EventHistorySchema,
  // Intent schemas
  TrackEventSchema,
  GetIntentSchema,
  GetPreferencesSchema,
  PredictSchema,
} from './types';

// ============================================================================
// Core Exports
// ============================================================================

export { HttpClient, BaseConnector } from './core';
export type { RetryConfig } from './core';

// ============================================================================
// SDK Version
// ============================================================================

export const SDK_VERSION = '1.0.0';
export const SDK_NAME = '@rez/connector-sdk';


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-connector-sdk',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
