/**
 * Wallet Connector - RABTUL Wallet Service Client
 *
 * Handles all wallet-related operations including:
 * - Balance queries
 * - Cashback management
 * - User-merchant transfers
 * - Transaction history
 * - Merchant operations
 *
 * @example
 * ```typescript
 * import { WalletConnector } from '@rez/connector-sdk/wallet';
 *
 * const wallet = new WalletConnector({
 *   baseUrl: 'http://localhost:4004',
 *   internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN,
 * });
 *
 * // Get user balance
 * const { balance, cashbackBalance } = await wallet.getBalance('user-123');
 * ```
 */

import { BaseConnector } from '../core';
import {
  ApiError,
  BalanceResponse,
  CashbackResponse,
  DeductResponse,
  TransferResponse,
  WalletHistoryResponse,
  MerchantBalanceResponse,
  WithdrawResponse,
  AddCashbackSchema,
  DeductSchema,
  TransferToMerchantSchema,
  WalletHistorySchema,
  GetMerchantBalanceSchema,
  WithdrawSchema,
} from '../types';

// ============================================================================
// Connector Configuration
// ============================================================================

export interface WalletConnectorConfig {
  /** Wallet service URL (defaults to WALLET_SERVICE_URL env var or http://localhost:4004) */
  baseUrl?: string;
  /** Internal service token for inter-service communication */
  internalServiceToken?: string;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

// ============================================================================
// Connector Class
// ============================================================================

export class WalletConnector extends BaseConnector<WalletConnectorConfig> {
  private static readonly SERVICE_NAME = 'wallet';
  private static readonly DEFAULT_PORT = 4004;
  private static readonly ENV_VAR = 'WALLET_SERVICE_URL';

  constructor(config: WalletConnectorConfig = {}) {
    const completeConfig: WalletConnectorConfig = {
      baseUrl: config.baseUrl || process.env[WalletConnector.ENV_VAR] || `http://localhost:${WalletConnector.DEFAULT_PORT}`,
      internalServiceToken: config.internalServiceToken || process.env.INTERNAL_SERVICE_TOKEN,
      timeout: config.timeout ?? 30000,
      retries: config.retries ?? 3,
      debug: config.debug ?? false,
    };

    super(completeConfig, WalletConnector.SERVICE_NAME);
  }

  // ============================================================================
  // User Wallet Operations
  // ============================================================================

  /**
   * Get user's wallet balance including cashback balance
   *
   * @param userId - The user's unique identifier
   * @returns Object containing balance and cashback balance
   *
   * @example
   * ```typescript
   * const result = await wallet.getBalance('550e8400-e29b-41d4-a716-446655440000');
   * console.log('Main balance:', result.balance);
   * console.log('Cashback:', result.cashbackBalance);
   * ```
   */
  async getBalance(userId: string): Promise<BalanceResponse | null> {
    const result = await this.safeCall<BalanceResponse>(async () => {
      return this.http.get<BalanceResponse>(`/wallets/users/${userId}/balance`);
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Add cashback to user's wallet
   *
   * @param userId - The user's unique identifier
   * @param amount - Amount to add (positive number)
   * @param source - Source of the cashback (e.g., 'promotion', 'refund', 'cashback_campaign')
   * @returns Success status and transaction ID if successful
   *
   * @example
   * ```typescript
   * const result = await wallet.addCashback('user-123', 50.00, 'welcome_offer');
   * if (result.success) {
   *   console.log('Cashback added, transaction:', result.transactionId);
   * }
   * ```
   */
  async addCashback(
    userId: string,
    amount: number,
    source: string
  ): Promise<CashbackResponse | null> {
    // Validate input with Zod
    const parsed = AddCashbackSchema.safeParse({ userId, amount, source });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<CashbackResponse>(async () => {
      return this.http.post<CashbackResponse>(`/wallets/users/${userId}/cashback`, {
        amount,
        source,
      });
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Deduct amount from user's wallet (use with caution)
   *
   * @param userId - The user's unique identifier
   * @param amount - Amount to deduct (positive number)
   * @param source - Reason/source for deduction (e.g., 'order_payment', 'refund')
   * @returns Success status and transaction ID if successful
   *
   * @example
   * ```typescript
   * const result = await wallet.deduct('user-123', 25.00, 'order_payment');
   * if (result.success) {
   *   console.log('Deducted successfully, transaction:', result.transactionId);
   * }
   * ```
   */
  async deduct(
    userId: string,
    amount: number,
    source: string
  ): Promise<DeductResponse | null> {
    // Validate input with Zod
    const parsed = DeductSchema.safeParse({ userId, amount, source });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<DeductResponse>(async () => {
      return this.http.post<DeductResponse>(`/wallets/users/${userId}/deduct`, {
        amount,
        source,
      });
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Transfer funds from user wallet to merchant
   *
   * @param fromUserId - Source user ID
   * @param toMerchantId - Destination merchant ID
   * @param amount - Amount to transfer (positive number)
   * @returns Success status and transaction details
   *
   * @example
   * ```typescript
   * const result = await wallet.transferToMerchant('user-123', 'merchant-456', 100.00);
   * if (result.success) {
   *   console.log('Transfer complete, ID:', result.transactionId);
   * }
   * ```
   */
  async transferToMerchant(
    fromUserId: string,
    toMerchantId: string,
    amount: number
  ): Promise<TransferResponse | null> {
    // Validate input with Zod
    const parsed = TransferToMerchantSchema.safeParse({ fromUserId, toMerchantId, amount });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<TransferResponse>(async () => {
      return this.http.post<TransferResponse>('/wallets/transfers/to-merchant', {
        fromUserId,
        toMerchantId,
        amount,
      });
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Get user's transaction history
   *
   * @param userId - The user's unique identifier
   * @param limit - Maximum number of transactions to return (default: 20, max: 100)
   * @returns List of transactions with pagination info
   *
   * @example
   * ```typescript
   * const result = await wallet.history('user-123', 50);
   * for (const tx of result.transactions) {
   *   console.log(`${tx.type}: ${tx.amount} - ${tx.description}`);
   * }
   * ```
   */
  async history(userId: string, limit?: number): Promise<WalletHistoryResponse | null> {
    // Validate input with Zod
    const parsed = WalletHistorySchema.safeParse({ userId, limit });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<WalletHistoryResponse>(async () => {
      const params = new URLSearchParams();
      if (limit) params.set('limit', String(limit));
      const queryString = params.toString();
      return this.http.get<WalletHistoryResponse>(
        `/wallets/users/${userId}/history${queryString ? `?${queryString}` : ''}`
      );
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  // ============================================================================
  // Merchant Wallet Operations
  // ============================================================================

  /**
   * Get merchant's wallet balance including pending amounts
   *
   * @param merchantId - The merchant's unique identifier
   * @returns Object containing balance, pending, and available amounts
   *
   * @example
   * ```typescript
   * const result = await wallet.getMerchantBalance('merchant-456');
   * console.log('Available:', result.available);
   * console.log('Pending settlement:', result.pending);
   * ```
   */
  async getMerchantBalance(merchantId: string): Promise<MerchantBalanceResponse | null> {
    // Validate input with Zod
    const parsed = GetMerchantBalanceSchema.safeParse({ merchantId });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<MerchantBalanceResponse>(async () => {
      return this.http.get<MerchantBalanceResponse>(`/wallets/merchants/${merchantId}/balance`);
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Initiate withdrawal from merchant wallet to bank account
   *
   * @param merchantId - The merchant's unique identifier
   * @param amount - Amount to withdraw (positive number)
   * @param bankAccountId - Bank account ID to withdraw to
   * @returns Success status and withdrawal details
   *
   * @example
   * ```typescript
   * const result = await wallet.withdraw('merchant-456', 5000.00, 'bank-account-789');
   * if (result.success) {
   *   console.log('Withdrawal ID:', result.withdrawalId);
   *   console.log('ETA:', result.estimatedArrival);
   * }
   * ```
   */
  async withdraw(
    merchantId: string,
    amount: number,
    bankAccountId: string
  ): Promise<WithdrawResponse | null> {
    // Validate input with Zod
    const parsed = WithdrawSchema.safeParse({ merchantId, amount, bankAccountId });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<WithdrawResponse>(async () => {
      return this.http.post<WithdrawResponse>(`/wallets/merchants/${merchantId}/withdraw`, {
        amount,
        bankAccountId,
      });
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  // ============================================================================
  // Additional Utility Methods
  // ============================================================================

  /**
   * Get transaction details by ID
   *
   * @param transactionId - The transaction's unique identifier
   * @returns Transaction details
   */
  async getTransaction(transactionId: string): Promise<{
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    source: string;
    description?: string;
    balanceAfter: number;
    createdAt: string;
    metadata?: Record<string, unknown>;
  } | null> {
    return this.safeCall(async () => {
      return this.http.get<{
        id: string;
        type: 'credit' | 'debit';
        amount: number;
        source: string;
        description?: string;
        balanceAfter: number;
        createdAt: string;
        metadata?: Record<string, unknown>;
      }>(`/wallets/transactions/${transactionId}`);
    }) as Promise<{
      id: string;
      type: 'credit' | 'debit';
      amount: number;
      source: string;
      description?: string;
      balanceAfter: number;
      createdAt: string;
      metadata?: Record<string, unknown>;
    } | null>;
  }

  /**
   * Create a new wallet for a user
   *
   * @param userId - The user's unique identifier
   * @param initialBalance - Initial balance (default: 0)
   * @returns Created wallet details
   */
  async createWallet(
    userId: string,
    initialBalance = 0
  ): Promise<{ success: boolean; walletId?: string; error?: ApiError }> {
    return this.safeCall(async () => {
      return this.http.post<{ walletId: string }>('/wallets/users', {
        userId,
        initialBalance,
      });
    });
  }

  /**
   * Add a bank account for a merchant
   *
   * @param merchantId - The merchant's unique identifier
   * @param bankAccount - Bank account details
   * @returns Created bank account ID
   */
  async addBankAccount(
    merchantId: string,
    bankAccount: {
      bankName: string;
      accountNumber: string;
      ifscCode: string;
      accountHolderName: string;
      isPrimary?: boolean;
    }
  ): Promise<{ success: boolean; bankAccountId?: string; error?: ApiError }> {
    return this.safeCall(async () => {
      return this.http.post<{ bankAccountId: string }>(
        `/wallets/merchants/${merchantId}/bank-accounts`,
        bankAccount
      );
    });
  }

  /**
   * Get merchant's bank accounts
   *
   * @param merchantId - The merchant's unique identifier
   * @returns List of bank accounts
   */
  async getBankAccounts(merchantId: string): Promise<{
    id: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    isPrimary: boolean;
    createdAt: string;
  }[] | null> {
    return this.safeCall(async () => {
      return this.http.get<{
        id: string;
        bankName: string;
        accountNumber: string;
        ifscCode: string;
        accountHolderName: string;
        isPrimary: boolean;
        createdAt: string;
      }[]>(`/wallets/merchants/${merchantId}/bank-accounts`);
    });
  }

  /**
   * Check if the wallet service is healthy
   *
   * @returns Health status
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number }> {
    const start = Date.now();
    try {
      const response = await this.http.get<{ status: string }>('/health');
      return {
        healthy: response.success,
        latency: Date.now() - start,
      };
    } catch {
      return { healthy: false };
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

let walletInstance: WalletConnector | null = null;

/**
 * Get or create a singleton WalletConnector instance
 *
 * @param config - Optional configuration override
 * @returns WalletConnector instance
 */
export function createWalletConnector(config?: WalletConnectorConfig): WalletConnector {
  if (!walletInstance) {
    walletInstance = new WalletConnector(config);
  } else if (config) {
    walletInstance = new WalletConnector(config);
  }
  return walletInstance;
}

/**
 * Reset the singleton instance (mainly for testing)
 */
export function resetWalletConnector(): void {
  walletInstance = null;
}
