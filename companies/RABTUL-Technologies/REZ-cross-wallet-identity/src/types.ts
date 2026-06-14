/**
 * Type definitions for Cross-Wallet Identity System
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export enum WalletType {
  POINTS = 'points',
  CASH = 'cash',
  CRYPTO = 'crypto',
  GIFTCARD = 'giftcard'
}

export enum WalletProvider {
  REZ = 'rez',
  RAZORPAY = 'razorpay',
  STRIPE = 'stripe',
  ETHEREUM = 'ethereum',
  BITCOIN = 'bitcoin',
  GIFTCARD = 'giftcard'
}

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  TRANSFER = 'transfer',
  CONVERSION = 'conversion',
  REDEMPTION = 'redemption'
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  ERROR = 'error',
  PARTIAL = 'partial'
}

// ============================================================================
// ZOD SCHEMAS (Validation)
// ============================================================================

export const WalletSchema = z.object({
  wallet_id: z.string().uuid(),
  type: z.nativeEnum(WalletType),
  provider: z.string().min(1),
  address: z.string().optional(),
  public_address: z.string().optional(),
  balance: z.number().min(0),
  currency: z.string().length(3),
  linked: z.boolean(),
  created_at: z.string().datetime(),
  metadata: z.record(z.unknown()).optional()
});

export const CrossWalletIdentitySchema = z.object({
  user_id: z.string(),
  wallets: z.array(WalletSchema),
  total_balance: z.object({
    points: z.number().min(0),
    cash_equivalent: z.number().min(0),
    crypto_usd: z.number().min(0),
    giftcards: z.number().min(0)
  }),
  transactions: z.object({
    total_count: z.number().min(0),
    total_volume: z.number().min(0),
    by_wallet_type: z.record(z.string(), z.number())
  }),
  redemptions: z.object({
    total_redeemed: z.number().min(0),
    by_merchant: z.record(z.string(), z.number()),
    by_category: z.record(z.string(), z.number())
  }),
  linked_accounts: z.array(z.object({
    platform: z.string(),
    user_id: z.string(),
    wallet_address: z.string()
  })),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export const TransactionSchema = z.object({
  transaction_id: z.string().uuid(),
  wallet_id: z.string().uuid(),
  type: z.nativeEnum(TransactionType),
  status: z.nativeEnum(TransactionStatus),
  amount: z.number(),
  currency: z.string().length(3),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.string().datetime(),
  completed_at: z.string().datetime().optional(),
  failure_reason: z.string().optional()
});

export const LinkWalletRequestSchema = z.object({
  user_id: z.string(),
  wallet_type: z.nativeEnum(WalletType),
  provider: z.string(),
  wallet_address: z.string(),
  linking_code: z.string().optional(),
  verification_method: z.enum(['sms', 'email', 'wallet_signature']).optional()
});

export const RedemptionRequestSchema = z.object({
  user_id: z.string(),
  merchant_id: z.string(),
  amount: z.number().positive(),
  wallet_type: z.nativeEnum(WalletType).optional(),
  preferred_currency: z.string().length(3).optional(),
  category: z.string().optional()
});

// ============================================================================
// INTERFACES
// ============================================================================

export interface Wallet {
  wallet_id: string;
  type: WalletType;
  provider: string;
  address?: string;
  public_address?: string;
  balance: number;
  currency: string;
  linked: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface TotalBalance {
  points: number;
  cash_equivalent: number;
  crypto_usd: number;
  giftcards: number;
}

export interface TransactionSummary {
  total_count: number;
  total_volume: number;
  by_wallet_type: Record<string, number>;
}

export interface RedemptionSummary {
  total_redeemed: number;
  by_merchant: Record<string, number>;
  by_category: Record<string, number>;
}

export interface LinkedAccount {
  platform: string;
  user_id: string;
  wallet_address: string;
}

export interface CrossWalletIdentity {
  user_id: string;
  wallets: Wallet[];
  total_balance: TotalBalance;
  transactions: TransactionSummary;
  redemptions: RedemptionSummary;
  linked_accounts: LinkedAccount[];
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  transaction_id: string;
  wallet_id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  completed_at?: string;
  failure_reason?: string;
}

export interface LinkWalletRequest {
  user_id: string;
  wallet_type: WalletType;
  provider: string;
  wallet_address: string;
  linking_code?: string;
  verification_method?: 'sms' | 'email' | 'wallet_signature';
}

export interface RedemptionRequest {
  user_id: string;
  merchant_id: string;
  amount: number;
  wallet_type?: WalletType;
  preferred_currency?: string;
  category?: string;
}

export interface SyncResult {
  status: SyncStatus;
  synced_wallets: string[];
  failed_wallets: Array<{ wallet_id: string; error: string }>;
  timestamp: string;
  duration_ms: number;
}

export interface WalletBalance {
  wallet_id: string;
  type: WalletType;
  balance: number;
  currency: string;
  last_synced: string;
  pending_transactions: number;
}

export interface ConversionRate {
  from_currency: string;
  to_currency: string;
  rate: number;
  timestamp: string;
  source: string;
}

// ============================================================================
// WALLET MODULE INTERFACES
// ============================================================================

export interface IWalletModule {
  initialize(config: WalletConfig): Promise<void>;
  getBalance(walletId: string): Promise<WalletBalance>;
  credit(walletId: string, amount: number, metadata?: Record<string, unknown>): Promise<Transaction>;
  debit(walletId: string, amount: number, metadata?: Record<string, unknown>): Promise<Transaction>;
  transfer(fromWalletId: string, toWalletId: string, amount: number): Promise<Transaction>;
  getTransactions(walletId: string, limit?: number): Promise<Transaction[]>;
}

export interface WalletConfig {
  provider: string;
  apiKey?: string;
  apiSecret?: string;
  rpcUrl?: string;
  chainId?: number;
  address?: string;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface WalletEvent {
  type: 'wallet_linked' | 'wallet_unlinked' | 'balance_updated' | 'sync_completed' | 'transaction_completed';
  wallet_id: string;
  user_id: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface BalanceUpdateEvent extends WalletEvent {
  type: 'balance_updated';
  previous_balance: number;
  new_balance: number;
  change_amount: number;
}

export interface SyncCompletedEvent extends WalletEvent {
  type: 'sync_completed';
  synced_wallets: string[];
  failed_wallets: string[];
  duration_ms: number;
}

// ============================================================================
// CONFIG TYPES
// ============================================================================

export interface CrossWalletConfig {
  userId: string;
  providers: {
    [key: string]: WalletConfig;
  };
  syncIntervalMs?: number;
  enableAutoSync?: boolean;
  conversionRates?: ConversionRate[];
}

export interface ProviderCredentials {
  apiKey: string;
  apiSecret?: string;
  rpcUrl?: string;
  chainId?: number;
}
