/**
 * TransactionRouter - Routes transactions to appropriate wallets
 *
 * Handles transaction routing, splitting, and fallback logic
 */

import { v4 as uuidv4 } from 'uuid';
import EventEmitter from 'eventemitter3';
import {
  Wallet,
  WalletType,
  Transaction,
  TransactionType,
  TransactionStatus,
  TransactionSummary,
  WalletEvent
} from './types';
import {
  ValidationError,
  TransactionError,
  InsufficientBalanceError,
  WalletNotFoundError
} from './errors';
import { BalanceAggregator } from './BalanceAggregator';

/**
 * Transaction request options
 */
export interface TransactionRequest {
  amount: number;
  currency: string;
  type: 'credit' | 'debit';
  walletType?: WalletType;
  walletId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  splitAcross?: boolean;  // Split amount across multiple wallets
}

/**
 * Transaction result
 */
export interface TransactionResult {
  transactionId: string;
  walletId: string;
  status: TransactionStatus;
  amount: number;
  timestamp: string;
}

/**
 * Split transaction result
 */
export interface SplitTransactionResult {
  transactions: TransactionResult[];
  totalAmount: number;
  walletsUsed: string[];
}

/**
 * TransactionRouter handles transaction routing logic
 */
export class TransactionRouter {
  private wallets: Map<string, Wallet>;
  private balanceAggregator: BalanceAggregator;
  private transactions: Map<string, Transaction> = new Map();
  private eventEmitter: EventEmitter;

  // Transaction limits
  private readonly MAX_TRANSACTION_AMOUNT = 1000000; // $1M
  private readonly MIN_TRANSACTION_AMOUNT = 0.01;

  constructor(wallets: Map<string, Wallet>, balanceAggregator: BalanceAggregator) {
    this.wallets = wallets;
    this.balanceAggregator = balanceAggregator;
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Route a transaction to appropriate wallet(s)
   */
  async routeTransaction(
    userId: string,
    amount: number,
    currency: string,
    type: 'credit' | 'debit',
    options?: {
      walletType?: WalletType;
      walletId?: string;
      description?: string;
      metadata?: Record<string, unknown>;
      splitAcross?: boolean;
    }
  ): Promise<TransactionResult> {
    // Validate transaction
    this.validateTransaction(amount, currency, type);

    // Find target wallet(s)
    const targetWallet = this.findTargetWallet(options?.walletId, options?.walletType, type, amount);

    if (!targetWallet) {
      throw new TransactionError(
        'No suitable wallet found for transaction',
        undefined,
        undefined,
        { amount, currency, type, walletType: options?.walletType }
      );
    }

    // For debit transactions, verify balance
    if (type === 'debit') {
      this.verifyBalance(targetWallet.wallet_id, amount);
    }

    // Execute transaction
    const transaction = await this.executeTransaction(
      userId,
      targetWallet,
      amount,
      currency,
      type,
      options?.description,
      options?.metadata
    );

    // Emit event
    this.emitTransactionEvent(transaction, userId);

    return {
      transactionId: transaction.transaction_id,
      walletId: transaction.wallet_id,
      status: transaction.status,
      amount: transaction.amount,
      timestamp: transaction.created_at
    };
  }

  /**
   * Execute a split transaction across multiple wallets
   */
  async routeSplitTransaction(
    userId: string,
    amount: number,
    currency: string,
    walletType: WalletType,
    options?: {
      description?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<SplitTransactionResult> {
    this.validateTransaction(amount, currency, 'debit');

    const wallets = Array.from(this.wallets.values()).filter(w => w.type === walletType);

    if (wallets.length === 0) {
      throw new TransactionError(
        `No wallets found for type: ${walletType}`,
        undefined,
        undefined,
        { walletType }
      );
    }

    // Find wallets that can cover the amount
    const targetWallets = this.balanceAggregator.findWalletsForAmount(wallets, walletType, amount);

    const totalAvailable = targetWallets.reduce((sum, w) => sum + w.balance, 0);
    if (totalAvailable < amount) {
      throw new InsufficientBalanceError(
        walletType,
        totalAvailable,
        amount
      );
    }

    // Execute split transaction
    const results: TransactionResult[] = [];
    let remaining = amount;

    for (const wallet of targetWallets) {
      const walletAmount = Math.min(wallet.balance, remaining);
      const transaction = await this.executeTransaction(
        userId,
        wallet,
        walletAmount,
        currency,
        'debit',
        options?.description || `Split transaction`,
        { ...options?.metadata, split: true }
      );

      results.push({
        transactionId: transaction.transaction_id,
        walletId: transaction.wallet_id,
        status: transaction.status,
        amount: transaction.amount,
        timestamp: transaction.created_at
      });

      remaining -= walletAmount;
      if (remaining <= 0) break;
    }

    return {
      transactions: results,
      totalAmount: amount,
      walletsUsed: results.map(r => r.walletId)
    };
  }

  /**
   * Transfer between wallets
   */
  async transfer(
    userId: string,
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    description?: string
  ): Promise<TransactionResult> {
    const fromWallet = this.wallets.get(fromWalletId);
    const toWallet = this.wallets.get(toWalletId);

    if (!fromWallet) {
      throw new WalletNotFoundError(fromWalletId);
    }
    if (!toWallet) {
      throw new WalletNotFoundError(toWalletId);
    }

    // Verify balance
    this.verifyBalance(fromWalletId, amount);

    // Validate same type transfer
    if (fromWallet.type !== toWallet.type) {
      throw new ValidationError(
        'Cannot transfer between different wallet types without conversion',
        { fromType: fromWallet.type, toType: toWallet.type }
      );
    }

    // Execute debit from source
    const debitTx = await this.executeTransaction(
      userId,
      fromWallet,
      amount,
      fromWallet.currency,
      'debit',
      description || `Transfer to ${toWalletId}`,
      { transferTo: toWalletId }
    );

    // Execute credit to destination
    const creditTx = await this.executeTransaction(
      userId,
      toWallet,
      amount,
      toWallet.currency,
      'credit',
      description || `Transfer from ${fromWalletId}`,
      { transferFrom: fromWalletId }
    );

    // Emit events
    this.emitTransactionEvent(debitTx, userId);
    this.emitTransactionEvent(creditTx, userId);

    return {
      transactionId: debitTx.transaction_id,
      walletId: fromWalletId,
      status: debitTx.status,
      amount: debitTx.amount,
      timestamp: debitTx.created_at
    };
  }

  /**
   * Get transaction by ID
   */
  getTransaction(transactionId: string): Transaction | undefined {
    return this.transactions.get(transactionId);
  }

  /**
   * Get transactions for a wallet
   */
  getWalletTransactions(walletId: string, limit?: number): Transaction[] {
    const transactions = Array.from(this.transactions.values())
      .filter(t => t.wallet_id === walletId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return limit ? transactions.slice(0, limit) : transactions;
  }

  /**
   * Get all transactions for user
   */
  getAllTransactions(limit?: number): Transaction[] {
    const transactions = Array.from(this.transactions.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return limit ? transactions.slice(0, limit) : transactions;
  }

  /**
   * Get transaction summary
   */
  getSummary(): TransactionSummary {
    const transactions = Array.from(this.transactions.values());

    const totalVolume = transactions
      .filter(t => t.status === TransactionStatus.COMPLETED)
      .reduce((sum, t) => sum + t.amount, 0);

    const byWalletType: Record<string, number> = {};
    for (const tx of transactions) {
      const wallet = this.wallets.get(tx.wallet_id);
      if (wallet) {
        const key = wallet.type;
        byWalletType[key] = (byWalletType[key] || 0) + tx.amount;
      }
    }

    return {
      total_count: transactions.length,
      total_volume: totalVolume,
      by_wallet_type: byWalletType
    };
  }

  /**
   * Cancel a pending transaction
   */
  async cancelTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);

    if (!transaction) {
      throw new TransactionError('Transaction not found', transactionId);
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new TransactionError(
        'Can only cancel pending transactions',
        transactionId,
        transaction.wallet_id,
        { currentStatus: transaction.status }
      );
    }

    transaction.status = TransactionStatus.CANCELLED;
    transaction.completed_at = new Date().toISOString();
  }

  /**
   * Event subscription
   */
  on(event: string, handler: (event: WalletEvent) => void): void {
    this.eventEmitter.on(event, handler);
  }

  /**
   * Remove event subscription
   */
  off(event: string, handler: (event: WalletEvent) => void): void {
    this.eventEmitter.off(event, handler);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private validateTransaction(amount: number, currency: string, type: 'credit' | 'debit'): void {
    if (amount <= 0) {
      throw new ValidationError('Transaction amount must be positive', { amount });
    }
    if (amount < this.MIN_TRANSACTION_AMOUNT) {
      throw new ValidationError(
        `Transaction amount must be at least ${this.MIN_TRANSACTION_AMOUNT}`,
        { amount, minimum: this.MIN_TRANSACTION_AMOUNT }
      );
    }
    if (amount > this.MAX_TRANSACTION_AMOUNT) {
      throw new ValidationError(
        `Transaction amount exceeds maximum of ${this.MAX_TRANSACTION_AMOUNT}`,
        { amount, maximum: this.MAX_TRANSACTION_AMOUNT }
      );
    }
    if (!currency || currency.length !== 3) {
      throw new ValidationError('Invalid currency code', { currency });
    }
    if (!['credit', 'debit'].includes(type)) {
      throw new ValidationError('Invalid transaction type', { type });
    }
  }

  private findTargetWallet(
    walletId?: string,
    walletType?: WalletType,
    type?: 'credit' | 'debit',
    amount?: number
  ): Wallet | undefined {
    // If specific wallet ID provided, use it
    if (walletId) {
      return this.wallets.get(walletId);
    }

    // If specific type provided, find optimal wallet
    if (walletType) {
      if (type === 'credit') {
        // For credits, find lowest balance wallet to spread funds
        return this.balanceAggregator.getLowestBalanceWallet(
          Array.from(this.wallets.values()),
          walletType
        );
      } else {
        // For debits, find wallet with sufficient balance
        return this.balanceAggregator.findOptimalWallet(
          Array.from(this.wallets.values()),
          walletType,
          amount || 0
        );
      }
    }

    // Default: find any wallet with matching currency
    for (const wallet of this.wallets.values()) {
      if (wallet.currency === this.getDefaultCurrency() ||
          wallet.type === WalletType.POINTS) {
        if (type === 'credit' || wallet.balance > 0) {
          return wallet;
        }
      }
    }

    return undefined;
  }

  private verifyBalance(walletId: string, amount: number): void {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new WalletNotFoundError(walletId);
    }
    if (wallet.balance < amount) {
      throw new InsufficientBalanceError(walletId, wallet.balance, amount);
    }
  }

  private async executeTransaction(
    userId: string,
    wallet: Wallet,
    amount: number,
    currency: string,
    type: 'credit' | 'debit',
    description?: string,
    metadata?: Record<string, unknown>
  ): Promise<Transaction> {
    const transactionId = uuidv4();
    const now = new Date().toISOString();

    const transaction: Transaction = {
      transaction_id: transactionId,
      wallet_id: wallet.wallet_id,
      type: type === 'credit' ? TransactionType.CREDIT : TransactionType.DEBIT,
      status: TransactionStatus.PROCESSING,
      amount,
      currency,
      description,
      metadata: {
        ...metadata,
        user_id: userId
      },
      created_at: now
    };

    // Store transaction
    this.transactions.set(transactionId, transaction);

    try {
      // Simulate transaction processing
      await this.processTransaction(wallet, amount, type);

      // Update wallet balance
      if (type === 'credit') {
        wallet.balance += amount;
      } else {
        wallet.balance -= amount;
      }

      // Mark as completed
      transaction.status = TransactionStatus.COMPLETED;
      transaction.completed_at = new Date().toISOString();
    } catch (error) {
      transaction.status = TransactionStatus.FAILED;
      transaction.failure_reason = (error as Error).message;
      transaction.completed_at = new Date().toISOString();
    }

    return transaction;
  }

  private async processTransaction(
    wallet: Wallet,
    amount: number,
    type: 'credit' | 'debit'
  ): Promise<void> {
    // Simulate async processing
    // In production, this would integrate with actual provider APIs

    // For crypto wallets, would submit to blockchain
    if (wallet.type === WalletType.CRYPTO) {
      // await submitToBlockchain(wallet, amount, type);
    }

    // For cash wallets, would call payment provider
    if (wallet.type === WalletType.CASH) {
      // await processPaymentProvider(wallet.provider, amount, type);
    }
  }

  private emitTransactionEvent(transaction: Transaction, userId: string): void {
    const event: WalletEvent = {
      type: 'transaction_completed',
      wallet_id: transaction.wallet_id,
      user_id: userId,
      timestamp: new Date().toISOString(),
      data: { transaction }
    };
    this.eventEmitter.emit('transaction_completed', event);
  }

  private getDefaultCurrency(): string {
    return 'USD';
  }
}

export default TransactionRouter;
