/**
 * Type definitions for Webhook Verification Service
 */

import { z } from 'zod';

// Verification algorithm types
export enum VerificationAlgorithm {
  HMAC_SHA256 = 'hmac_sha256',
  HMAC_SHA1 = 'hmac_sha1',
  HMAC_MD5 = 'hmac_md5',
  JWT = 'jwt',
  RSA_SHA256 = 'rsa_sha256',
  ECDSA_SHA256 = 'ecdsa_sha256',
  CUSTOM = 'custom'
}

// Supported providers
export enum ProviderType {
  RAZORPAY = 'razorpay',
  PAYU = 'payu',
  PHONEPE = 'phonepe',
  PAYTM = 'paytm',
  STRIPE = 'stripe',
  SHOPIFY = 'shopify',
  WOOCOMMERCE = 'woocommerce',
  CUSTOM = 'custom'
}

// Webhook event status
export enum WebhookEventStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
  RELAYED = 'relayed',
  DEDUPLICATED = 'deduplicated',
  RETRY_SCHEDULED = 'retry_scheduled'
}

// Payload schema for webhook verification
export const WebhookVerificationSchema = z.object({
  providerId: z.string().min(1),
  payload: z.unknown(),
  signature: z.string().min(1),
  timestamp: z.string().optional(),
  headers: z.record(z.string()).optional()
});

export type WebhookVerification = z.infer<typeof WebhookVerificationSchema>;

// Provider configuration schema
export const ProviderConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.nativeEnum(ProviderType),
  algorithm: z.nativeEnum(VerificationAlgorithm),
  secret: z.string().min(1),
  publicKey: z.string().optional(),
  signatureHeader: z.string().default('x-signature'),
  timestampHeader: z.string().optional(),
  timestampTolerance: z.number().default(300), // seconds
  enabled: z.boolean().default(true),
  relayUrl: z.string().url().optional(),
  allowedEvents: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional()
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

// Webhook event schema
export const WebhookEventSchema = z.object({
  id: z.string().uuid(),
  providerId: z.string(),
  eventType: z.string(),
  payload: z.unknown(),
  signature: z.string(),
  status: z.nativeEnum(WebhookEventStatus),
  verificationResult: z.object({
    isValid: z.boolean(),
    algorithm: z.string(),
    error: z.string().optional()
  }).optional(),
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3),
  nextRetryAt: z.date().optional(),
  relayResult: z.object({
    success: z.boolean(),
    statusCode: z.number().optional(),
    response: z.unknown().optional(),
    error: z.string().optional(),
    relayedAt: z.date()
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

// Relay request schema
export const RelayRequestSchema = z.object({
  eventId: z.string().uuid().optional(),
  targetUrl: z.string().url(),
  payload: z.unknown(),
  headers: z.record(z.string()).optional(),
  method: z.enum(['POST', 'PUT', 'PATCH']).default('POST'),
  timeout: z.number().min(1000).max(30000).default(10000)
});

export type RelayRequest = z.infer<typeof RelayRequestSchema>;

// Add provider request schema
export const AddProviderSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(ProviderType),
  algorithm: z.nativeEnum(VerificationAlgorithm),
  secret: z.string().min(1),
  publicKey: z.string().optional(),
  signatureHeader: z.string().optional(),
  timestampHeader: z.string().optional(),
  timestampTolerance: z.number().optional(),
  relayUrl: z.string().url().optional(),
  allowedEvents: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional()
});

export type AddProviderRequest = z.infer<typeof AddProviderSchema>;

// Event types registry
export interface EventTypeDefinition {
  name: string;
  category: string;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
  handlers: string[];
}

// Verification result
export interface VerificationResult {
  isValid: boolean;
  algorithm: string;
  expectedSignature?: string;
  receivedSignature?: string;
  error?: string;
  details?: Record<string, unknown>;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}

// Relay response
export interface RelayResponse {
  success: boolean;
  statusCode?: number;
  response?: unknown;
  error?: string;
  duration: number;
}
