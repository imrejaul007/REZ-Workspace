/**
 * CashWallet - Cash/fiat wallet implementation
 *
 * Supports multiple providers (Razorpay, Stripe) with unified interface
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Wallet,
  WalletType,
  WalletConfig,
  Transaction,
  TransactionType,
  TransactionStatus,
  WalletBalance,
  IWalletModule
} from '../types';
import { TransactionError, ValidationError, ProviderError } from '../errors';

/**
 * Cash wallet specific data
 */
interface CashWalletData {
  wallet: Wallet;
  transactions: CashTransaction[];
  pendingDeposits: PendingDeposit[];
  pendingWithdrawals: PendingWithdrawal[];
}

/**
 * Cash transaction with payment details
 */
interface CashTransaction extends Transaction {
  payment_method?: 'card' | 'bank_transfer' | 'upi' | 'wallet';
  provider_reference?: string;
  fees?: number;
  net_amount?: number;
}

/**
 * Pending deposit
 */
interface PendingDeposit {
  depositId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  providerReference?: string;
}

/**
 * Pending withdrawal
 */
interface PendingWithdrawal {
  withdrawalId: string;
  amount: number;
  currency: string;
  destination: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  providerReference?: string;
  failureReason?: string;
}

/**
 * CashWallet implementation
 */
export class CashWallet implements IWalletModule {
  private config?: WalletConfig;
  private wallets: Map<string, CashWalletData> = new Map();
  private provider: 'razorpay' | 'stripe' | 'rez' = 'rez';

  // Fee configuration
  private readonly WITHDRAWAL_FEE_PERCENT = 0.025; // 0.25%
  private readonly MIN_WITHDRAWAL = 1.0;
  private readonly MAX_WITHDRAWAL = 100000;

  constructor(config?: WalletConfig) {
    if (config?.provider) {
      this.provider = this.normalizeProvider(config.provider);
    }
  }

  /**
   * Initialize the wallet module
   */
  async initialize(config: WalletConfig): Promise<void> {
    this.config = config;
    if (config.provider) {
      this.provider = this.normalizeProvider(config.provider);
    }
  }

  /**
   * Create a new cash wallet
   */
  async createWallet(userId: string, currency: string = 'USD'): Promise<Wallet> {
    const walletId = uuidv4();
    const now = new Date().toISOString();

    const wallet: Wallet = {
      wallet_id: walletId,
      type: WalletType.CASH,
      provider: this.provider,
      balance: 0,
      currency: currency.toUpperCase(),
      linked: true,
      created_at: now,
      metadata: {
        userId,
        paymentMethods: []
      }
    };

    this.wallets.set(walletId, {
      wallet,
      transactions: [],
      pendingDeposits: [],
      pendingWithdrawals: []
    });

    return wallet;
  }

  /**
   * Get wallet balance
   */
  async getBalance(walletId: string): Promise<WalletBalance> {
    const data = this.wallets.get(walletId);
    if (!data) {
      throw new ValidationError('Wallet not found', { walletId });
    }

    // Sync with provider if needed
    await this.syncWithProvider(walletId);

    return {
      wallet_id: walletId,
      type: WalletType.CASH,
      balance: data.wallet.balance,
      currency: data.wallet.currency,
      last_synced: new Date().toISOString(),
      pending_transactions: data.pendingDeposits.length + data.pendingWithdrawals.length
    };
  }

  /**
   * Credit funds to wallet
   */
  async credit(
    walletId: string,
    amount: number,
    metadata?: Record<string, unknown>
  ): Promise<Transaction> {
    this.validateAmount(amount);

    const data = this.wallets.get(walletId);
    if (!data) {
      throw new TransactionError('Wallet not found', undefined, walletId);
    }

    // Process deposit based on payment method
    const paymentMethod = (metadata?.payment_method as string) || 'bank_transfer';
    const deposit = await this.processDeposit(walletId, amount, data.wallet.currency, paymentMethod);

    // Create transaction record
    const transaction: CashTransaction = {
      transaction_id: uuidv4(),
      wallet_id: walletId,
      type: TransactionType.CREDIT,
      status: TransactionStatus.COMPLETED,
      amount,
      currency: data.wallet.currency,
      description: (metadata?.description as string) || 'Deposit',
      metadata,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      payment_method: paymentMethod as 'card' | 'bank_transfer' | 'upi' | 'wallet',
      provider_reference: deposit.providerReference,
      net_amount: amount
    };

    // Update balance
    data.wallet.balance += amount;
    data.transactions.push(transaction);

    return transaction;
  }

  /**
   * Debit funds from wallet
   */
  async debit(
    walletId: string,
    amount: number,
    metadata?: Record<string, unknown>
  ): Promise<Transaction> {
    this.validateAmount(amount);

    const data = this.wallets.get(walletId);
    if (!data) {
      throw new TransactionError('Wallet not found', undefined, walletId);
    }

    // Check balance
    if (data.wallet.balance < amount) {
      throw new TransactionError(
        'Insufficient funds',
        undefined,
        walletId,
        { available: data.wallet.balance, requested: amount }
      );
    }

    // Calculate fees for withdrawals
    const isWithdrawal = metadata?.is_withdrawal === true;
    const fees = isWithdrawal ? this.calculateWithdrawalFees(amount) : 0;
    const netAmount = amount - fees;

    // Process withdrawal
    if (isWithdrawal) {
      const withdrawal = await this.processWithdrawal(
        walletId,
        amount,
        data.wallet.currency,
        (metadata?.destination as string) || ''
      );
      if (withdrawal.status === 'failed') {
        throw new TransactionError(
          withdrawal.failureReason || 'Withdrawal failed',
          undefined,
          walletId
        );
      }
    }

    // Create transaction record
    const transaction: CashTransaction = {
      transaction_id: uuidv4(),
      wallet_id: walletId,
      type: TransactionType.DEBIT,
      status: TransactionStatus.COMPLETED,
      amount,
      currency: data.wallet.currency,
      description: (metadata?.description as string) || (isWithdrawal ? 'Withdrawal' : 'Debit'),
      metadata,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      fees,
      net_amount: netAmount
    };

    // Update balance
    data.wallet.balance -= amount;
    data.transactions.push(transaction);

    return transaction;
  }

  /**
   * Transfer funds between cash wallets
   */
  async transfer(
    fromWalletId: string,
    toWalletId: string,
    amount: number
  ): Promise<Transaction> {
    // Debit from source
    const debitTx = await this.debit(fromWalletId, amount, {
      description: `Transfer to ${toWalletId}`,
      transferTo: toWalletId,
      is_transfer: true
    });

    // Credit to destination
    await this.credit(toWalletId, amount, {
      description: `Transfer from ${fromWalletId}`,
      transferFrom: fromWalletId,
      is_transfer: true
    });

    return debitTx;
  }

  /**
   * Get transaction history
   */
  async getTransactions(walletId: string, limit: number = 50): Promise<Transaction[]> {
    const data = this.wallets.get(walletId);
    if (!data) {
      throw new TransactionError('Wallet not found', undefined, walletId);
    }

    return data.transactions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  /**
   * Process deposit with payment provider
   */
  private async processDeposit(
    walletId: string,
    amount: number,
    currency: string,
    paymentMethod: string
  ): Promise<PendingDeposit> {
    // In production, integrate with actual payment provider
    const deposit: PendingDeposit = {
      depositId: uuidv4(),
      amount,
      currency,
      paymentMethod,
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    // Simulate provider processing
    switch (this.provider) {
      case 'razorpay':
        // await this.processRazorpayDeposit(deposit);
        break;
      case 'stripe':
        // await this.processStripeDeposit(deposit);
        break;
      case 'rez':
      default:
        // Internal processing
        deposit.providerReference = `REZ-${Date.now()}`;
        break;
    }

    return deposit;
  }

  /**
   * Process withdrawal
   */
  private async processWithdrawal(
    walletId: string,
    amount: number,
    currency: string,
    destination: string
  ): Promise<PendingWithdrawal> {
    this.validateWithdrawalAmount(amount);

    const withdrawal: PendingWithdrawal = {
      withdrawalId: uuidv4(),
      amount,
      currency,
      destination,
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    // In production, integrate with actual payment provider
    switch (this.provider) {
      case 'razorpay':
        // await this.processRazorpayWithdrawal(withdrawal);
        break;
      case 'stripe':
        // await this.processStripeWithdrawal(withdrawal);
        break;
      case 'rez':
      default:
        withdrawal.providerReference = `REZ-WD-${Date.now()}`;
        break;
    }

    return withdrawal;
  }

  /**
   * Sync balance with payment provider
   */
  private async syncWithProvider(walletId: string): Promise<void> {
    // In production, fetch latest balance from provider
    // const providerBalance = await this.fetchProviderBalance(walletId);
    // Update local balance if different
  }

  /**
   * Calculate withdrawal fees
   */
  private calculateWithdrawalFees(amount: number): number {
    return Math.max(0.30, amount * this.WITHDRAWAL_FEE_PERCENT);
  }

  /**
   * Validate withdrawal amount
   */
  private validateWithdrawalAmount(amount: number): void {
    if (amount < this.MIN_WITHDRAWAL) {
      throw new TransactionError(
        `Minimum withdrawal is ${this.MIN_WITHDRAWAL}`,
        undefined,
        undefined,
        { amount, minimum: this.MIN_WITHDRAWAL }
      );
    }
    if (amount > this.MAX_WITHDRAWAL) {
      throw new TransactionError(
        `Maximum withdrawal is ${this.MAX_WITHDRAWAL}`,
        undefined,
        undefined,
        { amount, maximum: this.MAX_WITHDRAWAL }
      );
    }
  }

  /**
   * Validate transaction amount
   */
  private validateAmount(amount: number): void {
    if (amount <= 0) {
      throw new ValidationError('Amount must be positive', { amount });
    }
    if (!Number.isFinite(amount)) {
      throw new ValidationError('Invalid amount', { amount });
    }
  }

  /**
   * Normalize provider name
   */
  private normalizeProvider(provider: string): 'razorpay' | 'stripe' | 'rez' {
    const normalized = provider.toLowerCase();
    if (normalized.includes('razor')) return 'razorpay';
    if (normalized.includes('stripe')) return 'stripe';
    return 'rez';
  }

  /**
   * Get pending deposits
   */
  getPendingDeposits(walletId: string): PendingDeposit[] {
    const data = this.wallets.get(walletId);
    return data?.pendingDeposits || [];
  }

  /**
   * Get pending withdrawals
   */
  getPendingWithdrawals(walletId: string): PendingWithdrawal[] {
    const data = this.wallets.get(walletId);
    return data?.pendingWithdrawals || [];
  }
}

export { CashWallet as default };
