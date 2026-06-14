/**
 * Shared TypeScript types and Zod schemas for RABTUL services
 */

// ============================================================================
// User Types
// ============================================================================

export interface UserPayload {
  userId: string;
  email?: string;
  phone?: string;
  name?: string;
  role?: string;
  iat: number;
  exp: number;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  avatar?: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Auth Service Types
// ============================================================================

export interface VerifyTokenResponse {
  valid: boolean;
  user?: UserPayload;
}

export interface SendOTPResponse {
  success: boolean;
  messageId?: string;
}

export interface VerifyOTPResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ============================================================================
// Wallet Service Types
// ============================================================================

export interface BalanceResponse {
  balance: number;
  cashbackBalance: number;
}

export interface CashbackResponse {
  success: boolean;
  transactionId?: string;
}

export interface DeductResponse {
  success: boolean;
  transactionId?: string;
}

export interface TransferResponse {
  success: boolean;
  transactionId: string;
  amount: number;
  fromUserId: string;
  toMerchantId: string;
  timestamp: string;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  source: string;
  description?: string;
  balanceAfter: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface WalletHistoryResponse {
  transactions: Transaction[];
  total: number;
  page?: number;
  limit?: number;
}

export interface MerchantBalanceResponse {
  balance: number;
  pending: number;
  available: number;
}

export interface WithdrawResponse {
  success: boolean;
  withdrawalId: string;
  amount: number;
  bankAccountId: string;
  status: 'pending' | 'completed' | 'failed';
  estimatedArrival?: string;
}

// ============================================================================
// Payment Service Types
// ============================================================================

export interface CreateOrderParams {
  amount: number;
  userId: string;
  merchantId: string;
  metadata?: Record<string, unknown>;
  currency?: string;
  description?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'expired' | 'cancelled';
  createdAt: string;
  expiresAt: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  amount?: number;
}

export interface RefundResponse {
  refundId: string;
  paymentId: string;
  amount: number;
  status: 'pending' | 'processed' | 'failed';
  reason: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'wallet' | 'bank_transfer';
  name: string;
  last4?: string;
  bank?: string;
  issuer?: string;
  isDefault: boolean;
}

export interface PaymentMethodsResponse {
  methods: PaymentMethod[];
}

export interface QRCodeResponse {
  qrCode: string;
  qrId: string;
  expiresAt: string;
  amount: number;
  orderId?: string;
}

export interface VerifyQRPaymentResponse {
  paid: boolean;
  amount?: number;
  paymentId?: string;
  qrId?: string;
}

// ============================================================================
// Notification Service Types
// ============================================================================

export interface PushNotificationParams {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: 'high' | 'normal' | 'low';
  imageUrl?: string;
  clickAction?: string;
}

export interface SMSParams {
  phone: string;
  message: string;
  senderId?: string;
}

export interface WhatsAppParams {
  phone: string;
  template: string;
  variables?: Record<string, string>;
  language?: string;
}

export interface EmailParams {
  to: string;
  subject: string;
  template: string;
  variables?: Record<string, string>;
  cc?: string[];
  bcc?: string[];
  attachments?: { filename: string; url: string }[];
}

export interface BulkSMSParams {
  messages: Array<{ phone: string; message: string }>;
}

export interface BulkPushParams {
  notifications: Array<{
    userId: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }>;
}

export interface SendResponse {
  messageId: string;
  success: boolean;
  timestamp: string;
}

export interface BulkSendResponse {
  sent: number;
  failed: number;
  failedItems?: Array<{ phone?: string; userId?: string; error: string }>;
}

export interface NotificationRecord {
  id: string;
  type: 'push' | 'sms' | 'whatsapp' | 'email';
  title?: string;
  body?: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationHistoryResponse {
  notifications: NotificationRecord[];
  total: number;
  page?: number;
  limit?: number;
}

export interface NotificationPreferences {
  push: boolean;
  sms: boolean;
  email: boolean;
  whatsapp: boolean;
  quietHours?: {
    start: string;
    end: string;
    timezone?: string;
  };
}

export interface UpdatePreferencesResponse {
  success: boolean;
  preferences: NotificationPreferences;
}

// ============================================================================
// Event Bus Types
// ============================================================================

export interface PublishEventResponse {
  eventId: string;
  topic: string;
  publishedAt: string;
}

export interface EventRecord {
  id: string;
  topic: string;
  data: Record<string, unknown>;
  publishedAt: string;
  metadata?: Record<string, unknown>;
}

export interface EventHistoryResponse {
  events: EventRecord[];
  total: number;
}

// ============================================================================
// Intent Service Types
// ============================================================================

export interface TrackEventParams {
  userId: string;
  event: string;
  properties?: Record<string, unknown>;
  timestamp?: string;
}

export interface IntentSignal {
  type: string;
  value: string | number | boolean;
  weight: number;
  source: string;
  timestamp: string;
}

export interface IntentResponse {
  intent: string;
  confidence: number;
  signals: IntentSignal[];
  predictedAt: string;
}

export interface Preference {
  key: string;
  value: string | number | boolean;
  category: string;
  confidence: number;
}

export interface PreferencesResponse {
  preferences: Preference[];
  userId: string;
  computedAt: string;
}

export interface PredictionResponse {
  action: string;
  probability: number;
  factors: Array<{ key: string; contribution: number }>;
  predictedAt: string;
}

// ============================================================================
// Common Types
// ============================================================================

export interface ConnectorConfig {
  baseUrl?: string;
  internalServiceToken?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  debug?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// Zod Schemas (for runtime validation)
// ============================================================================

import { z } from 'zod';

// Auth schemas
export const VerifyTokenSchema = z.object({});
export const SendOTPSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number format'),
});
export const VerifyOTPSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number format'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});
export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export const ValidateJWTSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});
export const GetUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

// Wallet schemas
export const AddCashbackSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  amount: z.number().positive('Amount must be positive'),
  source: z.string().min(1, 'Source is required'),
});
export const DeductSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  amount: z.number().positive('Amount must be positive'),
  source: z.string().min(1, 'Source is required'),
});
export const TransferToMerchantSchema = z.object({
  fromUserId: z.string().min(1, 'Source user ID is required'),
  toMerchantId: z.string().min(1, 'Merchant ID is required'),
  amount: z.number().positive('Amount must be positive'),
});
export const WalletHistorySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  limit: z.number().int().positive().max(100).optional(),
});
export const GetMerchantBalanceSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
});
export const WithdrawSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  amount: z.number().positive('Amount must be positive'),
  bankAccountId: z.string().min(1, 'Bank account ID is required'),
});

// Payment schemas
export const CreateOrderSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  userId: z.string().min(1, 'User ID is required'),
  merchantId: z.string().min(1, 'Merchant ID is required'),
  metadata: z.record(z.unknown()).optional(),
  currency: z.string().length(3).optional(),
  description: z.string().max(500).optional(),
});
export const VerifyPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
  razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
});
export const RefundSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  amount: z.number().positive('Amount must be positive'),
  reason: z.string().min(1, 'Reason is required'),
});
export const GetPaymentMethodsSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});
export const GenerateQRCodeSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  amount: z.number().positive('Amount must be positive'),
});
export const VerifyQRPaymentSchema = z.object({
  qrId: z.string().min(1, 'QR ID is required'),
});

// Notification schemas
export const PushSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  body: z.string().min(1, 'Body is required').max(500, 'Body too long'),
  data: z.record(z.unknown()).optional(),
  priority: z.enum(['high', 'normal', 'low']).optional(),
  imageUrl: z.string().url().optional(),
  clickAction: z.string().url().optional(),
});
export const SMSSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number'),
  message: z.string().min(1, 'Message is required').max(1600, 'Message too long'),
  senderId: z.string().max(6).optional(),
});
export const WhatsAppSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number'),
  template: z.string().min(1, 'Template is required'),
  variables: z.record(z.string()).optional(),
  language: z.string().max(10).optional(),
});
export const EmailSchema = z.object({
  to: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  template: z.string().min(1, 'Template is required'),
  variables: z.record(z.string()).optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string().url(),
  })).optional(),
});
export const BulkSMSchema = z.object({
  messages: z.array(z.object({
    phone: z.string().regex(/^\+?[1-9]\d{6,14}$/),
    message: z.string().min(1).max(1600),
  })).min(1, 'At least one message required').max(1000, 'Max 1000 messages per batch'),
});
export const BulkPushSchema = z.object({
  notifications: z.array(z.object({
    userId: z.string().min(1),
    title: z.string().min(1).max(100),
    body: z.string().min(1).max(500),
    data: z.record(z.unknown()).optional(),
  })).min(1, 'At least one notification required').max(500, 'Max 500 notifications per batch'),
});
export const NotificationHistorySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  type: z.enum(['push', 'sms', 'whatsapp', 'email']).optional(),
});
export const UpdatePreferencesSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  preferences: z.object({
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
    email: z.boolean().optional(),
    whatsapp: z.boolean().optional(),
    quietHours: z.object({
      start: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
      end: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
      timezone: z.string().optional(),
    }).optional(),
  }),
});

// Event Bus schemas
export const PublishSchema = z.object({
  topic: z.string().min(1, 'Topic is required').regex(/^[a-zA-Z0-9._-]+$/, 'Invalid topic format'),
  data: z.record(z.unknown(), 'Data must be a key-value object'),
});
export const SubscribeSchema = z.object({
  topic: z.string().min(1, 'Topic is required').regex(/^[a-zA-Z0-9._-]+$/, 'Invalid topic format'),
});
export const EventHistorySchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  limit: z.number().int().positive().max(100).optional(),
});

// Intent schemas
export const TrackEventSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  event: z.string().min(1, 'Event name is required'),
  properties: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime().optional(),
});
export const GetIntentSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});
export const GetPreferencesSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});
export const PredictSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  action: z.string().min(1, 'Action is required'),
});

// Re-export Zod types
export type VerifyTokenInput = z.infer<typeof VerifyTokenSchema>;
export type SendOTPInput = z.infer<typeof SendOTPSchema>;
export type VerifyOTPInput = z.infer<typeof VerifyOTPSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type ValidateJWTInput = z.infer<typeof ValidateJWTSchema>;
export type GetUserInput = z.infer<typeof GetUserSchema>;
export type AddCashbackInput = z.infer<typeof AddCashbackSchema>;
export type DeductInput = z.infer<typeof DeductSchema>;
export type TransferToMerchantInput = z.infer<typeof TransferToMerchantSchema>;
export type WalletHistoryInput = z.infer<typeof WalletHistorySchema>;
export type GetMerchantBalanceInput = z.infer<typeof GetMerchantBalanceSchema>;
export type WithdrawInput = z.infer<typeof WithdrawSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;
export type RefundInput = z.infer<typeof RefundSchema>;
export type GetPaymentMethodsInput = z.infer<typeof GetPaymentMethodsSchema>;
export type GenerateQRCodeInput = z.infer<typeof GenerateQRCodeSchema>;
export type VerifyQRPaymentInput = z.infer<typeof VerifyQRPaymentSchema>;
export type PushInput = z.infer<typeof PushSchema>;
export type SMSInput = z.infer<typeof SMSSchema>;
export type WhatsAppInput = z.infer<typeof WhatsAppSchema>;
export type EmailInput = z.infer<typeof EmailSchema>;
export type BulkSMSInput = z.infer<typeof BulkSMSchema>;
export type BulkPushInput = z.infer<typeof BulkPushSchema>;
export type NotificationHistoryInput = z.infer<typeof NotificationHistorySchema>;
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;
export type PublishInput = z.infer<typeof PublishSchema>;
export type SubscribeInput = z.infer<typeof SubscribeSchema>;
export type EventHistoryInput = z.infer<typeof EventHistorySchema>;
export type TrackEventInput = z.infer<typeof TrackEventSchema>;
export type GetIntentInput = z.infer<typeof GetIntentSchema>;
export type GetPreferencesInput = z.infer<typeof GetPreferencesSchema>;
export type PredictInput = z.infer<typeof PredictSchema>;