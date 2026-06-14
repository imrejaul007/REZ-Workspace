/**
 * PointsWallet - Loyalty points wallet implementation
 *
 * Manages loyalty points with expiration, tier bonuses, and earning rules
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
import { TransactionError, ValidationError } from '../errors';

/**
 * Points expiration rule
 */
export interface ExpirationRule {
  monthsValid: number;
  tierMultiplier: Record<string, number>; // e.g., { gold: 1.5, platinum: 2 }
}

/**
 * Earning rule configuration
 */
export interface EarningRule {
  category: string;
  pointsPerDollar: number;
  bonusMultiplier: number;
}

/**
 * Points wallet transaction with additional metadata
 */
export interface PointsTransaction extends Transaction {
  points_type: 'earned' | 'redeemed' | 'expired' | 'bonus' | 'transferred';
  expiration_date?: string;
  tier_at_transaction?: string;
}

/**
 * PointsWallet implementation
 */
export class PointsWallet implements IWalletModule {
  private config?: WalletConfig;
  private wallets: Map<string, PointsWalletData> = new Map();
  private expirationRules: ExpirationRule;
  private earningRules: EarningRule[] = [];

  constructor(_config?: WalletConfig) {
    this.expirationRules = {
      monthsValid: 12,
      tierMultiplier: {
        bronze: 1.0,
        silver: 1.25,
        gold: 1.5,
        platinum: 2.0,
        diamond: 2.5
      }
    };
  }

  /**
   * Initialize the wallet module
   */
  async initialize(config: WalletConfig): Promise<void> {
    this.config = config;
  }

  /**
   * Create a new points wallet
   */
  async createWallet(userId: string, initialBalance: number = 0): Promise<Wallet> {
    const walletId = uuidv4();
    const now = new Date().toISOString();

    const wallet: Wallet = {
      wallet_id: walletId,
      type: WalletType.POINTS,
      provider: this.config?.provider || 'rez',
      balance: initialBalance,
      currency: 'PTS',
      linked: true,
      created_at: now,
      metadata: { userId }
    };

    // Store points-specific data
    this.wallets.set(walletId, {
      wallet,
      pointsHistory: [],
      tier: 'bronze',
      lifetimePoints: initialBalance
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

    // Check for expired points
    const validBalance = await this.calculateValidBalance(walletId);

    return {
      wallet_id: walletId,
      type: WalletType.POINTS,
      balance: validBalance,
      currency: 'PTS',
      last_synced: new Date().toISOString(),
      pending_transactions: 0
    };
  }

  /**
   * Credit points to wallet
   */
  async credit(
    walletId: string,
    amount: number,
    metadata?: Record<string, unknown>
  ): Promise<Transaction> {
    this.validateCreditAmount(amount);

    const data = this.wallets.get(walletId);
    if (!data) {
      throw new TransactionError('Wallet not found', undefined, walletId);
    }

    // Apply tier bonus
    const bonusMultiplier = this.expirationRules.tierMultiplier[data.tier] || 1.0;
    const bonusAmount = Math.floor(amount * bonusMultiplier);
    const totalCredit = amount + bonusAmount;

    // Calculate expiration
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + this.expirationRules.monthsValid);

    // Create transaction record
    const transaction: PointsTransaction = {
      transaction_id: uuidv4(),
      wallet_id: walletId,
      type: TransactionType.CREDIT,
      status: TransactionStatus.COMPLETED,
      amount: totalCredit,
      currency: 'PTS',
      description: (metadata?.description as string) || 'Points earned',
      metadata,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      points_type: 'earned',
      expiration_date: expirationDate.toISOString(),
      tier_at_transaction: data.tier
    };

    // Update balance
    data.wallet.balance += totalCredit;
    data.lifetimePoints += totalCredit;
    data.pointsHistory.push(transaction);

    // Check for tier upgrade
    this.checkTierUpgrade(data);

    return transaction;
  }

  /**
   * Debit points from wallet
   */
  async debit(
    walletId: string,
    amount: number,
    metadata?: Record<string, unknown>
  ): Promise<Transaction> {
    this.validateDebitAmount(amount);

    const data = this.wallets.get(walletId);
    if (!data) {
      throw new TransactionError('Wallet not found', undefined, walletId);
    }

    const validBalance = await this.calculateValidBalance(walletId);
    if (validBalance < amount) {
      throw new TransactionError(
        'Insufficient points balance',
        undefined,
        walletId,
        { available: validBalance, requested: amount }
      );
    }

    // Create transaction record
    const transaction: PointsTransaction = {
      transaction_id: uuidv4(),
      wallet_id: walletId,
      type: TransactionType.DEBIT,
      status: TransactionStatus.COMPLETED,
      amount,
      currency: 'PTS',
      description: (metadata?.description as string) || 'Points redeemed',
      metadata,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      points_type: 'redeemed'
    };

    // Update balance
    data.wallet.balance -= amount;
    data.pointsHistory.push(transaction);

    return transaction;
  }

  /**
   * Transfer points to another wallet
   */
  async transfer(
    fromWalletId: string,
    toWalletId: string,
    amount: number
  ): Promise<Transaction> {
    // Debit from source
    const debitTx = await this.debit(fromWalletId, amount, {
      description: `Transfer to ${toWalletId}`,
      transferTo: toWalletId
    });

    // Credit to destination
    await this.credit(toWalletId, amount, {
      description: `Transfer from ${fromWalletId}`,
      transferFrom: fromWalletId
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

    return data.pointsHistory
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  /**
   * Calculate valid balance (excluding expired points)
   */
  private async calculateValidBalance(walletId: string): Promise<number> {
    const data = this.wallets.get(walletId);
    if (!data) return 0;

    const now = new Date();
    let validBalance = 0;

    for (const tx of data.pointsHistory) {
      if (tx.type !== TransactionType.CREDIT) continue;
      if (tx.points_type === 'expired') continue;

      const expirationDate = tx.expiration_date ? new Date(tx.expiration_date) : null;
      if (!expirationDate || expirationDate > now) {
        validBalance += tx.amount;
      }
    }

    return validBalance;
  }

  /**
   * Check and apply tier upgrades based on lifetime points
   */
  private checkTierUpgrade(data: PointsWalletData): void {
    const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const thresholds = [0, 10000, 50000, 200000, 1000000];

    for (let i = tiers.length - 1; i >= 0; i--) {
      if (data.lifetimePoints >= thresholds[i]) {
        if (tiers[i] !== data.tier) {
          data.tier = tiers[i];
          // Emit tier upgrade event
        }
        break;
      }
    }
  }

  /**
   * Calculate points earned for a purchase
   */
  calculatePointsForPurchase(
    amount: number,
    category: string,
    tier: string
  ): number {
    const rule = this.earningRules.find(r => r.category === category);
    const baseRate = rule?.pointsPerDollar || 1;
    const bonusMultiplier = rule?.bonusMultiplier || 1;
    const tierMultiplier = this.expirationRules.tierMultiplier[tier] || 1;

    return Math.floor(amount * baseRate * bonusMultiplier * tierMultiplier);
  }

  /**
   * Get wallet data
   */
  getWalletData(walletId: string): PointsWalletData | undefined {
    return this.wallets.get(walletId);
  }

  /**
   * Add earning rule
   */
  addEarningRule(rule: EarningRule): void {
    const existing = this.earningRules.findIndex(r => r.category === rule.category);
    if (existing >= 0) {
      this.earningRules[existing] = rule;
    } else {
      this.earningRules.push(rule);
    }
  }

  /**
   * Validate credit amount
   */
  private validateCreditAmount(amount: number): void {
    if (amount <= 0) {
      throw new ValidationError('Credit amount must be positive', { amount });
    }
    if (!Number.isFinite(amount)) {
      throw new ValidationError('Invalid amount', { amount });
    }
  }

  /**
   * Validate debit amount
   */
  private validateDebitAmount(amount: number): void {
    if (amount <= 0) {
      throw new ValidationError('Debit amount must be positive', { amount });
    }
    if (!Number.isInteger(amount)) {
      throw new ValidationError('Debit amount must be an integer', { amount });
    }
  }
}

/**
 * Internal points wallet data
 */
interface PointsWalletData {
  wallet: Wallet;
  pointsHistory: PointsTransaction[];
  tier: string;
  lifetimePoints: number;
}

export { PointsWallet as default };
