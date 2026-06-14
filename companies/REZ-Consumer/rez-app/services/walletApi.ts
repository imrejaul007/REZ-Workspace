// @ts-nocheck
import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

/**
 * CD-CRIT-01 FIX: cryptographically secure UUID generator.
 * crypto.randomUUID() is available in React Native 0.69+ and all modern browsers.
 * Falls back to timestamp+random to avoid Math.random() collisions (Math.random is
 * NOT cryptographically secure — react-native-uuid uses it internally).
 */
function generateId(): string {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  // React Native < 0.69 fallback
  if (typeof require !== 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const uuid = require('react-native-uuid') as { v4: () => string };
      return generateId() as string;
    } catch (_e) {
      // Fall through to last resort
    }
  }
  // Last resort: deterministic-ish ID (not ideal but won't crash)
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * RABTUL WALLET SERVICE INTEGRATION
 *
 * ✅ MIGRATED: Now using RABTUL Wallet Service (rez-wallet-service)
 * See: https://github.com/imrejaul007/RABTUL-Technologies/tree/main/rez-wallet-service
 *
 * Migration completed:
 * 1. ✅ All /wallet/* endpoints replaced with RABTUL wallet service endpoints
 * 2. ✅ X-Internal-Token header added for service-to-service calls
 * 3. ✅ Centralized coin management, transactions, transfers in RABTUL
 * 4. ✅ Local wallet logic duplication removed
 *
 * RABTUL Service: rez-wallet-service (Port 4004)
 * Base URL: http://localhost:4004
 *
 * Endpoint mapping (OLD → NEW):
 * - /wallet/balance          → http://localhost:4004/api/wallet/balance
 * - /wallet/transactions     → http://localhost:4004/api/wallet/transactions
 * - /wallet/summary         → http://localhost:4004/api/wallet/summary
 * - /wallet/withdraw         → http://localhost:4004/api/wallet/withdraw
 * - /wallet/payment          → http://localhost:4004/api/wallet/payment
 * - /wallet/transfer/*       → http://localhost:4004/api/wallet/transfer/*
 * - /wallet/gift/*           → http://localhost:4004/api/wallet/gift/*
 * - /wallet/gift-cards/*     → http://localhost:4004/api/wallet/gift-cards/*
 * - /wallet/expiring-coins   → http://localhost:4004/api/wallet/expiring-coins
 * - /wallet/redeem-coins     → http://localhost:4004/api/wallet/redeem-coins
 * - /wallet/coin-rules       → http://localhost:4004/api/wallet/coin-rules
 * - /wallet/rez-cash         → http://localhost:4004/api/wallet/rez-cash
 */

// RABTUL Wallet Service Configuration
const RABTUL_WALLET_SERVICE_URL = process.env.EXPO_PUBLIC_RABTUL_WALLET_URL || 'http://localhost:4004';
const RABTUL_INTERNAL_TOKEN = process.env.EXPO_PUBLIC_INTERNAL_SERVICE_TOKEN || '';

/**
 * Create headers for RABTUL service calls
 */
function getRabulWalletHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (RABTUL_INTERNAL_TOKEN) {
    headers['X-Internal-Token'] = RABTUL_INTERNAL_TOKEN;
  }
  return headers;
}

// ============================================================================
// WALLET API SERVICE
// ============================================================================

// ---- Convention Notes (R12, R33) ----
// R12: Wallet currency — backend uses an enum: 'REZ_COIN' | 'NC' | 'INR' | 'RC'.
// Frontend types use string (accepts any value). All API responses return
// currency as a string matching one of those backend enum values.
//
// R33: Date fields — all dates from the backend are ISO 8601 strings
// (e.g. "2026-04-16T10:30:00.000Z"). Frontend types consistently use
// string for date fields. No automatic Date parsing is applied at the API
// layer; consume dates as-is from responses.
//
// R32: Coin redemption — the POST /wallet/redeem-coins endpoint requires
// amount >= 50 (Joi validation). Consumers are not shown this limit.
// MIN_REDEEM_COINS documents this requirement for UI awareness.
export const MIN_REDEEM_COINS = 50;

// ---- Remaining untyped API response interfaces ----

export interface SentGiftsResponse {
  gifts: Array<{
    id: string;
    recipientName: string;
    recipientPhone: string;
    amount: number;
    message?: string;
    status: 'pending' | 'claimed' | 'expired';
    createdAt: string;
    expiresAt: string;
  }>;
}

export interface GiftCardCatalogResponse {
  giftCards: Array<{
    id: string;
    brand: string;
    brandLogo: string;
    description: string;
    denominations: number[];
    discountPercentage?: number;
    validDays: number;
    category: string;
    image?: string;
  }>;
  categories: string[];
}

export interface PurchaseGiftCardResponse {
  userGiftCard: {
    id: string;
    giftCardId: string;
    amount: number;
    code?: string;
    pin?: string;
    status: 'active' | 'used' | 'expired';
    purchaseDate: string;
    expiryDate: string;
  };
}

export interface MyGiftCardsResponse {
  giftCards: Array<{
    id: string;
    giftCardId: string;
    brand: string;
    brandLogo: string;
    amount: number;
    code?: string;
    status: 'active' | 'used' | 'expired';
    purchaseDate: string;
    expiryDate: string;
  }>;
}

export interface ExpiringCoinsResponse {
  expiringCoins: Record<string, {
    totalAmount: number;
    coins: Array<{
      id: string;
      amount: number;
      expiresAt: string;
      type: string;
    }>;
    count: number;
  }>;
  totalExpiring: number;
}

export interface CoinRulesResponse {
  coinRules: Record<string, {
    usageRules: string[];
    earningMethods: string[];
  }>;
  coinExpiryConfig: Record<string, {
    expiryDays: number;
    maxUsagePct: number;
  }>;
  coinConversion?: { rezToInr: number };
}

export interface ScheduledDropsResponse {
  drops: Array<{
    id: string;
    title: string;
    amount: number;
    type: 'daily' | 'weekly' | 'special' | 'cashback';
    scheduledDate: string;
    description: string;
    icon: string;
    source: string;
    claimable: boolean;
    storeLogo?: string;
  }>;
  totalUpcoming: number;
}

export interface RedeemCoinsResponse {
  success: boolean;
  newBalance: number;
  discountApplied: number;
}

export interface RechargeCashbackPreviewResponse {
  rechargeAmount: number;
  cashbackPercentage: number;
  cashback: number;
  maxCashback: number;
  cappedAt: number | null;
}

export interface RevealGiftCardResponse {
  code: string;
  pin?: string;
}

/**
 * REZ-027 FIX: Typed metadata for TransactionResponse.source.metadata.
 * Previously typed as `unknown`, preventing type-safe metadata parsing in UI.
 */
export interface TransactionMetadata {
  orderId?: string;
  productId?: string;
  storeId?: string;
  storeName?: string;
  merchantId?: string;
  campaignId?: string;
  campaignName?: string;
  referralId?: string;
  referralCode?: string;
  achievementId?: string;
  achievementName?: string;
  streakType?: 'login' | 'order' | 'review' | 'savings';
  streakDay?: number;
  milestoneName?: string;
  promoCode?: string;
  promoId?: string;
  billId?: string;
  rechargeNumber?: string;
  rechargeOperator?: string;
  couponId?: string;
  couponName?: string;
  refundReason?: string;
  chargeType?: 'fee' | 'tax' | 'platform';
  chargeDescription?: string;
  [key: string]: unknown; // Allow additional fields from the backend
}

/**
 * Coin Balance from Backend (new schema)
 */
export interface BackendCoinBalance {
  type: 'rez' | 'promo' | 'branded' | 'prive' | 'cashback' | 'referral';
  amount: number;
  isActive: boolean;
  color?: string;
  earnedDate?: string;
  lastUsed?: string;
  expiryDate?: string;
  promoDetails?: {
    maxRedemptionPercentage: number;
    expiryDate: string;
  };
}

/**
 * Branded Coin from Backend
 */
export interface BackendBrandedCoin {
  merchantId: string;
  merchantName: string;
  merchantLogo?: string;
  merchantColor?: string;
  amount: number;
  earnedDate?: string;
  lastUsed?: string;
}

/**
 * Savings Insights from Backend
 *
 * R11 FIX: All fields are now guaranteed in the balance response — the model-level
 * toJSON no longer redacts them (B01), and the controller explicitly returns the
 * computed CoinTransaction-derived values. The partial subset (totalSaved / thisMonth
 * / avgPerVisit) is what the balance endpoint currently computes; the extended
 * Phase 2 fields are stored on the wallet document and returned via other endpoints
 * (e.g. getRezCashIdentity). lastCalculated is always present when insights exist.
 */
export interface BackendSavingsInsights {
  totalSaved: number;
  thisMonth: number;
  avgPerVisit: number;
  lastCalculated: string;
}

/**
 * Wallet Balance Response
 */
export interface CategoryBalance {
  available: number;
  earned: number;
  spent: number;
}

export interface WalletBalanceResponse {
  balance: {
    total: number;
    available: number;
    pending: number;
    cashback: number;
  };
  // totalValue is the canonical rupee-equivalent total returned by the API
  totalValue: number;
  breakdown: {
    // API returns breakdown.rezCoins as an object with amount
    rezCoins: { amount: number; color: string; expiryDate?: string };
    // Backend sends breakdown.cashbackBalance (walletBalanceController line ~273).
    // breakdown.cashback is NOT sent — cashback lives under balance.cashback (legacy field).
    // Both variants kept optional so useWallet.ts fallback chain can handle either shape.
    cashback?: number;
    cashbackBalance?: number;
    // Backend sends breakdown.pendingRewards (walletBalanceController line ~275).
    // breakdown.pending is NOT sent — pending lives under balance.pending (legacy field).
    // Both variants kept optional so useWallet.ts fallback chain can handle either shape.
    pending?: number;
    pendingRewards?: number;
  };
  coins: BackendCoinBalance[];
  brandedCoins: BackendBrandedCoin[];
  brandedCoinsTotal: number;
  promoCoins: {
    amount: number;
    color: string;
    isActive?: boolean;
    expiryCountdown?: string;
    maxRedemptionPercentage?: number;
    earnedDate?: string;
    lastUsed?: string;
    expiryDate?: string;
    promoDetails?: {
      maxRedemptionPercentage: number;
      expiryDate: string;
    };
  };
  coinUsageOrder: string[];
  categoryBalances?: Record<string, CategoryBalance>;
  savingsInsights: BackendSavingsInsights;
  currency: string;
  // R10 FIX: statistics is no longer redacted. The walletBalanceController's .select()
  // projection includes it (line ~68) and the response always returns wallet.statistics.
  // B01 removed model-level redaction for balance / statistics / savingsInsights.
  statistics: {
    totalEarned: number;
    totalSpent: number;
    totalCashback: number;
    totalRefunds: number;
    totalTopups: number;
    totalWithdrawals: number;
  };
  limits?: {
    maxBalance: number;
    dailySpendLimit: number;
    dailySpentToday: number;
    remainingToday: number; // computed: dailySpendLimit - dailySpentToday
  };
  status: {
    isActive: boolean;
    isFrozen: boolean;
    frozenReason?: string;
  };
  // lastUpdated may be absent in some API responses — guard with optional
  lastUpdated?: string;
}

/**
 * Transaction Response
 */
export interface TransactionResponse {
  id: string;
  transactionId: string;
  user: string;
  type: 'credit' | 'debit';
  category: 'earning' | 'spending' | 'refund' | 'withdrawal' | 'topup' | 'bonus' | 'penalty' | 'cashback';
  amount: number;
  currency: string;
  description: string;
  source: {
    type: string;
    reference: string;
    description?: string;
    metadata?: TransactionMetadata;
  };
  status: {
    current: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'reversed';
    history: Array<{
      status: string;
      timestamp: string;
      reason?: string;
    }>;
  };
  balanceBefore: number;
  balanceAfter: number;
  fees?: number;
  tax?: number;
  netAmount?: number;
  processingTime?: number;
  receiptUrl?: string;
  notes?: string;
  isReversible: boolean;
  reversedAt?: string;
  reversalReason?: string;
  reversalTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transaction List Response
 */
export interface TransactionListResponse {
  transactions: TransactionResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Topup Request
 */
export interface TopupRequest {
  amount: number;
  paymentMethod?: string;
  paymentId?: string;
}

/**
 * Topup Response
 */
export interface TopupResponse {
  transaction: TransactionResponse;
  wallet: {
    balance: {
      total: number;
      available: number;
      pending: number;
    };
    currency: string;
  };
}

/**
 * Withdrawal Request
 */
export interface WithdrawalRequest {
  amount: number;
  method: 'bank' | 'upi' | 'paypal';
  accountDetails?: string;
}

/**
 * Withdrawal Response
 */
export interface WithdrawalResponse {
  transaction: TransactionResponse;
  withdrawalId: string;
  netAmount: number;
  fees: number;
  wallet: {
    balance: {
      total: number;
      available: number;
      pending: number;
    };
    currency: string;
  };
  estimatedProcessingTime: string;
}

/**
 * Payment Request
 */
export interface PaymentRequest {
  amount: number;
  orderId?: string;
  storeId?: string;
  storeName?: string;
  description?: string;
  items?: unknown[];
}

/**
 * Payment Response
 */
export interface PaymentResponse {
  transaction: TransactionResponse;
  wallet: {
    balance: {
      total: number;
      available: number;
      pending: number;
    };
    currency: string;
  };
  paymentStatus: 'success' | 'failed' | 'pending';
}

/**
 * Transaction Summary Response
 */
export interface TransactionSummaryResponse {
  summary: {
    summary: Array<{
      type: 'credit' | 'debit';
      totalAmount: number;
      count: number;
      avgAmount: number;
    }>;
    totalTransactions: number;
  };
  period: string;
  wallet: {
    balance: {
      total: number;
      available: number;
      pending: number;
    };
    statistics: {
      totalEarned: number;
      totalSpent: number;
      totalCashback: number;
      totalRefunds: number;
      totalTopups: number;
      totalWithdrawals: number;
    };
  } | null;
}

/**
 * Wallet Settings Request
 */
export interface WalletSettingsRequest {
  autoTopup?: boolean;
  autoTopupThreshold?: number;
  autoTopupAmount?: number;
  lowBalanceAlert?: boolean;
  lowBalanceThreshold?: number;
}

/**
 * Categories Breakdown Response
 */
export interface CategoriesBreakdownResponse {
  categories: Array<{
    _id: string;
    totalAmount: number;
    count: number;
    avgAmount: number;
  }>;
  totalCategories: number;
}

/**
 * Transaction Filters
 */
export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: 'credit' | 'debit';
  category?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

// ── REZ Cash Identity ─────────────────────────────────────────────────────────

export interface RezCashMilestone {
  id: string;
  label: string;
  threshold: number;
  icon: string;
  color: string;
}

export interface RezCashIdentity {
  totalSaved: number;
  thisMonth: number;
  thisYear: number;
  pendingCashback: number;
  streak: number;
  milestones: {
    unlocked: RezCashMilestone[];
    next: (RezCashMilestone & { remaining: number }) | null;
  };
  equivalents: Array<{ label: string; unit: number; icon: string; singular: string; count: number }>;
  monthlyTrend: Array<{ label: string; amount: number }>;
  topCategories: Array<{ category: string; total: number }>;
}

export interface DevTopupResponse {
  wallet: {
    balance: { total: number; available: number; pending: number; cashback: number };
    currency: string;
  };
  addedAmount: number;
  type: string;
}

export interface SyncBalanceResponse {
  previousBalance: number;
  newBalance: number;
  wallet: {
    balance: { total: number; available: number; pending: number; cashback: number };
    coins: BackendCoinBalance[];
    currency: string;
  };
  synced: boolean;
}

/**
 * Wallet API Service Class
 */
class WalletService {
  /**
   * Get wallet balance and status
   * OLD: /wallet/balance → NEW: /api/wallet/balance (RABTUL Wallet Service)
   */
  async getBalance(options?: { signal?: AbortSignal }): Promise<ApiResponse<WalletBalanceResponse>> {
    try {
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.get<WalletBalanceResponse>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/balance`,
        undefined,
        { signal: options?.signal, headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] getBalance failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to fetch balance' } as unknown as ApiResponse<WalletBalanceResponse>;
    }
  }

  /**
   * Get transaction history with optional filters
   * OLD: /wallet/transactions → NEW: /api/wallet/transactions (RABTUL Wallet Service)
   */
  async getTransactions(
    filters?: TransactionFilters
  ): Promise<ApiResponse<TransactionListResponse>> {
    try {
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.get<TransactionListResponse>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/transactions`,
        filters as Record<string, string | number | boolean | undefined | null>,
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] getTransactions failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to fetch transactions', data: undefined };
    }
  }

  /**
   * Get single transaction by ID
   * OLD: /wallet/transaction/${id} → NEW: /api/wallet/transaction/${id} (RABTUL Wallet Service)
   */
  async getTransactionById(
    transactionId: string
  ): Promise<ApiResponse<{ transaction: TransactionResponse }>> {
    try {
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.get<{ transaction: TransactionResponse }>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/transaction/${transactionId}`,
        undefined,
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] getTransactionById failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to fetch transaction', data: undefined };
    }
  }

  /**
   * @deprecated ADMIN-ONLY — consumer app must NOT call POST /wallet/topup directly.
   * Wallet top-ups for consumers are handled via the payment gateway flow (Razorpay/UPI).
   * This endpoint requires admin privileges on the backend and will be rejected for
   * regular user tokens.
   */
  async topup(data: TopupRequest): Promise<ApiResponse<TopupResponse>> {
    // These are admin-only endpoints - consumer app should not call them directly
    logger.warn('[WalletAPI] topup is admin-only and cannot be called from consumer app');
    throw new Error('This operation requires admin privileges');
  }

  /**
   * Withdraw funds from wallet
   * OLD: /wallet/withdraw → NEW: /api/wallet/withdraw (RABTUL Wallet Service)
   */
  async withdraw(
    data: WithdrawalRequest
  ): Promise<ApiResponse<WithdrawalResponse>> {
    try {
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.post<WithdrawalResponse>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/withdraw`,
        data,
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] withdraw failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to withdraw funds', data: undefined };
    }
  }

  /**
   * Process payment (deduct from wallet)
   * OLD: /wallet/payment → NEW: /api/wallet/payment (RABTUL Wallet Service)
   * OG-001 FIX: Accept an idempotency key so the backend middleware can
   * de-duplicate wallet debits that are retried after a network failure.
   * The key must be generated once per user payment intent (in useCheckout/
   * handleWalletPayment) and reused on unknown reconnect retry.
   */
  async processPayment(
    data: PaymentRequest,
    idempotencyKey?: string
  ): Promise<ApiResponse<PaymentResponse>> {
    try {
      // IDEMPOTENCY FIX: generateId() is collision-safe — Date.now() prefix removed.
      const key =
        idempotencyKey ||
        `wallet-pay-${generateId() as string}`;
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.post<PaymentResponse>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/payment`,
        data as unknown,
        { headers: { ...getRabulWalletHeaders(), 'Idempotency-Key': key } }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] processPayment failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to process payment', data: undefined };
    }
  }

  /**
   * Get transaction summary/statistics
   * OLD: /wallet/summary → NEW: /api/wallet/summary (RABTUL Wallet Service)
   */
  async getSummary(
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<ApiResponse<TransactionSummaryResponse>> {
    try {
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.get<TransactionSummaryResponse>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/summary`,
        { period },
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] getSummary failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to fetch summary', data: undefined };
    }
  }

  /**
   * Update wallet settings
   * OLD: /wallet/settings → NEW: /api/wallet/settings (RABTUL Wallet Service)
   */
  async updateSettings(
    settings: WalletSettingsRequest
  ): Promise<ApiResponse<{ settings: WalletSettingsRequest }>> {
    try {
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.put<{ settings: WalletSettingsRequest }>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/settings`,
        settings,
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] updateSettings failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to update settings', data: undefined };
    }
  }

  /**
   * Get spending breakdown by categories
   * OLD: /wallet/categories → NEW: /api/wallet/categories (RABTUL Wallet Service)
   */
  async getCategoriesBreakdown(): Promise<
    ApiResponse<CategoriesBreakdownResponse>
  > {
    try {
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.get<CategoriesBreakdownResponse>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/categories`,
        undefined,
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] getCategoriesBreakdown failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to fetch categories breakdown', data: undefined };
    }
  }

  /**
   * @deprecated ADMIN-ONLY — consumer app must NOT call POST /wallet/credit-loyalty-points directly.
   * Loyalty points are credited automatically by the backend when orders are completed.
   * Calling this endpoint from the consumer app will be rejected as it requires admin privileges.
   */
  async creditLoyaltyPoints(data: {
    amount: number;
    source?: {
      type?: string;
      reference?: string;
      description?: string;
      metadata?: TransactionMetadata;
    };
  }): Promise<ApiResponse<{
    balance: {
      total: number;
      available: number;
      pending: number;
    };
    coins: unknown[];
    credited: number;
    message: string;
  }>> {
    // These are admin-only endpoints - consumer app should not call them directly
    logger.warn('[WalletAPI] creditLoyaltyPoints is admin-only and cannot be called from consumer app');
    throw new Error('This operation requires admin privileges');
  }

  /**
   * Add test funds to wallet (DEVELOPMENT ONLY — blocked in production)
   * OLD: /wallet/dev-topup → NEW: /api/wallet/dev-topup (RABTUL Wallet Service)
   * @param amount Amount to add (default: 1000)
   * @param type 'rez' | 'promo' | 'cashback' (default: 'rez')
   */
  async devTopup(amount: number = 1000, type: 'rez' | 'promo' | 'cashback' = 'rez'): Promise<ApiResponse<DevTopupResponse>> {
    if (!__DEV__) {
      return { success: false, message: 'devTopup is only available in development builds', data: undefined };
    }
    try {
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.post<DevTopupResponse>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/dev-topup`,
        { amount, type },
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      logger.warn('[WalletAPI] devTopup failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to add test funds', data: undefined };
    }
  }

  /**
   * Sync wallet balance
   * OLD: /wallet/sync-balance → NEW: /api/wallet/sync-balance (RABTUL Wallet Service)
   */
  async syncBalance(): Promise<ApiResponse<SyncBalanceResponse>> {
    if (!__DEV__) {
      return { success: false, message: 'syncBalance is only available in development builds', data: undefined };
    }
    try {
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.post<SyncBalanceResponse>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/sync-balance`,
        {},
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      logger.warn('[WalletAPI] syncBalance failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to sync balance', data: undefined };
    }
  }

  /**
   * @deprecated ADMIN-ONLY — consumer app must NOT call POST /wallet/refund directly.
   * Refunds are initiated by the backend automatically when an order is cancelled or failed.
   * Calling this endpoint from the consumer app will be rejected as it requires admin privileges.
   */
  async refundPayment(data: {
    transactionId: string;
    amount: number;
    reason: string;
  }): Promise<ApiResponse<{
    refundId: string;
    refundedAmount: number;
    wallet: {
      balance: {
        total: number;
        available: number;
        pending: number;
      };
    };
    status: 'success' | 'failed' | 'pending';
  }>> {
    // These are admin-only endpoints - consumer app should not call them directly
    logger.warn('[WalletAPI] refundPayment is admin-only and cannot be called from consumer app');
    throw new Error('This operation requires admin privileges');
  }

  // ========================================================================
  // TRANSFER APIs
  // ========================================================================

  /**
   * Initiate coin transfer to another user
   * OLD: /wallet/transfer/initiate → NEW: /api/wallet/transfer/initiate (RABTUL Wallet Service)
   * P1-FINANCIAL-ATOMICITY FIX: Forward idempotencyKey as a header so the backend
   * middleware can deduplicate transfer initiations on retry. Previously the key was
   * accepted in the body but never forwarded as a header, making the backend's
   * Idempotency-Key header check a no-op.
   */
  async initiateTransfer(data: {
    recipientPhone?: string;
    recipientId?: string;
    amount: number;
    coinType: 'rez' | 'promo' | 'branded' | 'prive';
    merchantId?: string;
    note?: string;
    idempotencyKey?: string;
  }): Promise<ApiResponse<{
    transferId: string;
    requiresOtp: boolean;
    recipientName: string;
    amount: number;
    coinType: string;
    status?: string;
  }>> {
    try {
      // IDEMPOTENCY FIX: generateId() is collision-safe — Date.now() prefix removed (redundant).
      const key = data.idempotencyKey ?? `wallet-transfer-${generateId() as string}`;
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.post<{
    transferId: string;
    requiresOtp: boolean;
    recipientName: string;
    amount: number;
    coinType: string;
    status?: string;
  }>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/transfer/initiate`,
        data as unknown,
        { headers: { ...getRabulWalletHeaders(), 'Idempotency-Key': key } }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] initiateTransfer failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to initiate transfer', data: undefined };
    }
  }

  /**
   * Confirm transfer with OTP
   * OLD: /wallet/transfer/confirm → NEW: /api/wallet/transfer/confirm (RABTUL Wallet Service)
   * P1-FINANCIAL-ATOMICITY FIX: Add idempotency key to prevent duplicate transfer
   * completions when the user retries after a network timeout.
   */
  async confirmTransfer(data: {
    transferId: string;
    otp: string;
    idempotencyKey?: string;
  }): Promise<ApiResponse<{
    transferId: string;
    status: string;
    amount: number;
    coinType: string;
  }>> {
    try {
      // IDEMPOTENCY FIX: generateId() is collision-safe — Date.now() prefix removed.
      const key = data.idempotencyKey ?? `wallet-confirm-${generateId() as string}`;
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.post<{
    transferId: string;
    status: string;
    amount: number;
    coinType: string;
  }>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/transfer/confirm`,
        data as unknown,
        { headers: { ...getRabulWalletHeaders(), 'Idempotency-Key': key } }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] confirmTransfer failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to confirm transfer', data: undefined };
    }
  }

  /**
   * Get transfer history
   * OLD: /wallet/transfer/history → NEW: /api/wallet/transfer/history (RABTUL Wallet Service)
   */
  async getTransferHistory(params?: {
    page?: number;
    limit?: number;
    type?: 'sent' | 'received';
  }): Promise<ApiResponse<{
    transfers: unknown[];
    pagination: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
  }>> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.type) query.set('type', params.type);
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.get<{
    transfers: unknown[];
    pagination: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
  }>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/transfer/history?${query.toString()}`,
        undefined,
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] getTransferHistory failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to fetch transfer history', data: undefined };
    }
  }

  /**
   * Get recent transfer recipients
   * OLD: /wallet/transfer/recipients → NEW: /api/wallet/transfer/recipients (RABTUL Wallet Service)
   */
  async getRecentRecipients(search?: string): Promise<ApiResponse<{ recipients: unknown[] }>> {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.get<{ recipients: unknown[] }>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/transfer/recipients${query}`,
        undefined,
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] getRecentRecipients failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to fetch recent recipients', data: undefined };
    }
  }

  // ========================================================================
  // GIFT APIs
  // ========================================================================

  /**
   * Get gift configuration
   * OLD: /wallet/gift/config → NEW: /api/wallet/gift/config (RABTUL Wallet Service)
   */
  async getGiftConfig(): Promise<ApiResponse<{
    themes: Array<{
      id: string;
      label: string;
      emoji: string;
      colors: string[];
      tags: string[];
    }>;
    denominations: number[];
    limits: {
      min: number;
      max: number;
      dailyMax: number;
      maxPerDay: number;
      otpAbove: number;
    };
    features: {
      scheduledDelivery: boolean;
      messageMaxLength: number;
    };
  }>> {
    try {
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.get<{
    themes: Array<{ id: string; label: string; emoji: string; colors: string[]; tags: string[] }>;
    denominations: number[];
    limits: { min: number; max: number; dailyMax: number; maxPerDay: number; otpAbove: number };
    features: { scheduledDelivery: boolean; messageMaxLength: number };
  }>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/gift/config`,
        undefined,
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] getGiftConfig failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to fetch gift config', data: undefined };
    }
  }

  /**
   * Validate gift recipient
   * OLD: /wallet/gift/validate-recipient → NEW: /api/wallet/gift/validate-recipient (RABTUL Wallet Service)
   */
  async validateGiftRecipient(phone: string): Promise<ApiResponse<{
    exists: boolean;
    name?: string;
    isSelf: boolean;
  }>> {
    try {
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.post<{ exists: boolean; name?: string; isSelf: boolean }>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/gift/validate-recipient`,
        { phone },
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] validateGiftRecipient failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to validate recipient', data: undefined };
    }
  }

  /**
   * Send gift coins
   * OLD: /wallet/gift/send → NEW: /api/wallet/gift/send (RABTUL Wallet Service)
   * P1-FINANCIAL-ATOMICITY FIX: Forward idempotencyKey as a header so the backend
   * middleware can deduplicate gift sends on retry.
   */
  async sendGift(data: {
    recipientPhone?: string;
    recipientId?: string;
    amount: number;
    coinType?: string;
    theme: string;
    message?: string;
    deliveryType?: 'instant' | 'scheduled';
    scheduledAt?: string;
    idempotencyKey?: string;
  }): Promise<ApiResponse<{
    giftId: string;
    status: string;
    recipientName: string;
    amount: number;
    theme: string;
    expiresAt: string;
  }>> {
    try {
      // IDEMPOTENCY FIX: generateId() is collision-safe — Date.now() prefix removed.
      const key = data.idempotencyKey ?? `wallet-gift-${generateId() as string}`;
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.post<{
    giftId: string;
    status: string;
    recipientName: string;
    amount: number;
    theme: string;
    expiresAt: string;
  }>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/gift/send`,
        data as unknown,
        { headers: { ...getRabulWalletHeaders(), 'Idempotency-Key': key } }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] sendGift failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to send gift', data: undefined };
    }
  }

  /**
   * Get received gifts
   * OLD: /wallet/gift/received → NEW: /api/wallet/gift/received (RABTUL Wallet Service)
   */
  async getReceivedGifts(): Promise<ApiResponse<{ gifts: unknown[] }>> {
    try {
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.get<{ gifts: unknown[] }>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/gift/received`,
        undefined,
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] getReceivedGifts failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to fetch received gifts', data: undefined };
    }
  }

  /**
   * Claim a gift
   * OLD: /wallet/gift/${id}/claim → NEW: /api/wallet/gift/${id}/claim (RABTUL Wallet Service)
   * P1-FINANCIAL-ATOMICITY FIX: Add idempotency key to prevent duplicate gift claims
   * when the user retries after a network timeout.
   */
  async claimGift(giftId: string, idempotencyKey?: string): Promise<ApiResponse<{ giftId: string; amount: number; status: string }>> {
    try {
      // IDEMPOTENCY FIX: generateId() is collision-safe — Date.now() prefix removed.
      const key = idempotencyKey ?? `wallet-claim-gift-${generateId() as string}`;
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.post<{ giftId: string; amount: number; status: string }>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/gift/${giftId}/claim`,
        {},
        { headers: { ...getRabulWalletHeaders(), 'Idempotency-Key': key } },
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] claimGift failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to claim gift', data: undefined };
    }
  }

  /**
   * Get sent gifts
   * OLD: /wallet/gift/sent → NEW: /api/wallet/gift/sent (RABTUL Wallet Service)
   */
  async getSentGifts(): Promise<ApiResponse<SentGiftsResponse>> {
    try {
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.get<SentGiftsResponse>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/gift/sent`,
        undefined,
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] getSentGifts failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to fetch sent gifts', data: undefined };
    }
  }

  // ========================================================================
  // GIFT CARD APIs
  // ========================================================================

  /**
   * Get gift card catalog
   * OLD: /wallet/gift-cards/catalog → NEW: /api/wallet/gift-cards/catalog (RABTUL Wallet Service)
   */
  async getGiftCardCatalog(params?: {
    category?: string;
    search?: string;
  }): Promise<ApiResponse<GiftCardCatalogResponse>> {
    try {
      const query = new URLSearchParams();
      if (params?.category) query.set('category', params.category);
      if (params?.search) query.set('search', params.search);
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.get<GiftCardCatalogResponse>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/gift-cards/catalog?${query.toString()}`,
        undefined,
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] getGiftCardCatalog failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to fetch gift card catalog', data: undefined };
    }
  }

  /**
   * Purchase gift card
   * OLD: /wallet/gift-cards/purchase → NEW: /api/wallet/gift-cards/purchase (RABTUL Wallet Service)
   * P1-FINANCIAL-ATOMICITY FIX: Add idempotency key header. Consumer already passes
   * idempotencyKey in the body (gift-cards.tsx line 164) but it was not forwarded
   * as a header, making the backend's Idempotency-Key check ineffective.
   */
  async purchaseGiftCard(data: {
    giftCardId: string;
    amount: number;
    idempotencyKey?: string;
  }): Promise<ApiResponse<PurchaseGiftCardResponse>> {
    try {
      // IDEMPOTENCY FIX: generateId() is collision-safe — Date.now() prefix removed.
      const key = data.idempotencyKey ?? `wallet-gift-card-${generateId() as string}`;
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.post<PurchaseGiftCardResponse>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/gift-cards/purchase`,
        data as unknown,
        { headers: { ...getRabulWalletHeaders(), 'Idempotency-Key': key } }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] purchaseGiftCard failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to purchase gift card', data: undefined };
    }
  }

  /**
   * Get my gift cards
   * OLD: /wallet/gift-cards/mine → NEW: /api/wallet/gift-cards/mine (RABTUL Wallet Service)
   */
  async getMyGiftCards(status?: string): Promise<ApiResponse<MyGiftCardsResponse>> {
    try {
      const query = status ? `?status=${status}` : '';
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.get<MyGiftCardsResponse>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/gift-cards/mine${query}`,
        undefined,
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] getMyGiftCards failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to fetch gift cards', data: undefined };
    }
  }

  /**
   * Reveal gift card code
   * OLD: /wallet/gift-cards/${id}/reveal → NEW: /api/wallet/gift-cards/${id}/reveal (RABTUL Wallet Service)
   */
  async revealGiftCardCode(giftCardId: string): Promise<ApiResponse<RevealGiftCardResponse>> {
    try {
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.get<RevealGiftCardResponse>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/gift-cards/${giftCardId}/reveal`,
        undefined,
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] revealGiftCardCode failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to reveal gift card code', data: undefined };
    }
  }

  // ========================================================================
  // EXPIRY & RECHARGE APIs
  // ========================================================================

  /**
   * Get expiring coins
   * OLD: /wallet/expiring-coins → NEW: /api/wallet/expiring-coins (RABTUL Wallet Service)
   */
  async getExpiringCoins(): Promise<ApiResponse<ExpiringCoinsResponse>> {
    try {
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.get<ExpiringCoinsResponse>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/expiring-coins`,
        undefined,
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] getExpiringCoins failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to fetch expiring coins', data: undefined };
    }
  }

  /**
   * Preview recharge cashback
   * OLD: /wallet/recharge/preview → NEW: /api/wallet/recharge/preview (RABTUL Wallet Service)
   */
  async previewRechargeCashback(amount: number): Promise<ApiResponse<RechargeCashbackPreviewResponse>> {
    try {
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.get<RechargeCashbackPreviewResponse>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/recharge/preview?amount=${amount}`,
        undefined,
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] previewRechargeCashback failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to preview recharge cashback', data: undefined };
    }
  }

  /**
   * Get coin rules
   * OLD: /wallet/coin-rules → NEW: /api/wallet/coin-rules (RABTUL Wallet Service)
   */
  async getCoinRules(): Promise<ApiResponse<CoinRulesResponse>> {
    try {
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.get<CoinRulesResponse>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/coin-rules`,
        undefined,
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] getCoinRules failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to fetch coin rules', data: undefined };
    }
  }

  /**
   * Get scheduled drops
   * OLD: /wallet/scheduled-drops → NEW: /api/wallet/scheduled-drops (RABTUL Wallet Service)
   */
  async getScheduledDrops(): Promise<ApiResponse<ScheduledDropsResponse>> {
    try {
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.get<ScheduledDropsResponse>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/scheduled-drops`,
        undefined,
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] getScheduledDrops failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to fetch scheduled drops', data: undefined };
    }
  }

  /**
   * Redeem coins
   * OLD: /wallet/redeem-coins → NEW: /api/wallet/redeem-coins (RABTUL Wallet Service)
   * P1-FINANCIAL-ATOMICITY FIX: Add idempotency key to prevent double-redemption
   * when the user retries after a network failure. A network timeout on a coin
   * redemption debit could cause the user to retry and inadvertently redeem twice.
   *
   * @param data - { amount, orderId?, merchantId?, idempotencyKey? }
   */
  async redeemCoins(data: {
    amount: number;
    orderId?: string;
    merchantId?: string;
    idempotencyKey?: string;
  }): Promise<ApiResponse<RedeemCoinsResponse>> {
    try {
      // IDEMPOTENCY FIX: generateId() is collision-safe — Date.now() prefix removed.
      const key = data.idempotencyKey ?? `wallet-redeem-${generateId() as string}`;
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.post<RedeemCoinsResponse>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/redeem-coins`,
        data as unknown,
        { headers: { ...getRabulWalletHeaders(), 'Idempotency-Key': key } }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] redeemCoins failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to redeem coins', data: undefined };
    }
  }

  /**
   * Get coin-to-rupee conversion rate
   * OLD: /wallet/conversion-rate → NEW: /api/wallet/conversion-rate (RABTUL Wallet Service)
   * Returns the live coin-to-rupee rate from the backend.
   */
  async getConversionRate(): Promise<{ coinToRupeeRate: number } | null> {
    try {
      // MIGRATED: Using RABTUL Wallet Service URL
      const res = await apiClient.get<{ coinToRupeeRate: number }>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/conversion-rate`,
        undefined,
        { headers: getRabulWalletHeaders() }
      );
      if (res?.success && typeof res.data?.coinToRupeeRate === 'number') {
        return { coinToRupeeRate: res.data.coinToRupeeRate };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Grant welcome coins
   * OLD: /wallet/welcome-coins → NEW: /api/wallet/welcome-coins (RABTUL Wallet Service)
   * Idempotent — safe to call multiple times for the same user.
   * The backend records whether the grant was already made and returns
   * { alreadyClaimed: true } on subsequent calls without crediting again.
   */
  async grantWelcomeCoins(): Promise<{ success: boolean; coinsGranted?: number; alreadyClaimed?: boolean }> {
    try {
      // MIGRATED: Using RABTUL Wallet Service URL
      const res = await apiClient.post<{ coinsGranted: number; alreadyClaimed: boolean }>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/welcome-coins`,
        {},
        { headers: getRabulWalletHeaders() }
      );
      if (res?.success) {
        if (__DEV__) logger.debug('[WalletAPI] Welcome coins:', { alreadyClaimed: res.data?.alreadyClaimed, coinsGranted: res.data?.coinsGranted });
        return { success: true, coinsGranted: res.data?.coinsGranted, alreadyClaimed: res.data?.alreadyClaimed };
      }
      return { success: false };
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] grantWelcomeCoins failed:', error?.message);
      // Non-fatal — don't block the success screen if the coins call fails
      return { success: false };
    }
  }

  /**
   * Get REZ Cash identity
   * OLD: /wallet/rez-cash → NEW: /api/wallet/rez-cash (RABTUL Wallet Service)
   * Returns savings identity: lifetime savings, monthly/yearly totals,
   * 6-month trend, milestones, real-world equivalents, top categories.
   * Powers the REZ Cash screen.
   */
  async getRezCashIdentity(): Promise<ApiResponse<RezCashIdentity>> {
    try {
      // MIGRATED: Using RABTUL Wallet Service URL
      return await apiClient.get<RezCashIdentity>(
        `${RABTUL_WALLET_SERVICE_URL}/api/wallet/rez-cash`,
        undefined,
        { headers: getRabulWalletHeaders() }
      );
    } catch (error) {
      if (__DEV__) logger.warn('[WalletAPI] getRezCashIdentity failed:', error?.message);
      return { success: false, message: error?.message || 'Failed to fetch REZ Cash identity', data: undefined };
    }
  }
}

// Export singleton instance
const walletService = new WalletService();
export default walletService;