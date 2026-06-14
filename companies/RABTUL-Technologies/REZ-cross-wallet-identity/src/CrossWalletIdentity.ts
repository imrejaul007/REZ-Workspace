/**
 * CrossWalletIdentity - Main class for managing cross-wallet identity
 *
 * Provides unified interface for managing multiple wallets across different providers,
 * aggregating balances, and routing transactions.
 */

import { v4 as uuidv4 } from 'uuid';
import EventEmitter from 'eventemitter3';
import {
  CrossWalletIdentity as ICrossWalletIdentity,
  Wallet,
  WalletType,
  TotalBalance,
  TransactionSummary,
  RedemptionSummary,
  LinkedAccount,
  WalletEvent,
  CrossWalletConfig
} from './types';
import { ValidationError, WalletNotFoundError } from './errors';
import { WalletLinker } from './WalletLinker';
import { BalanceAggregator } from './BalanceAggregator';
import { TransactionRouter } from './TransactionRouter';
import { WalletSync } from './sync/WalletSync';

/**
 * CrossWalletIdentity - Main orchestrator for cross-wallet operations
 */
export class CrossWalletIdentity {
  private readonly userId: string;
  private wallets: Map<string, Wallet> = new Map();
  private linkedAccounts: LinkedAccount[] = [];
  private readonly createdAt: string;
  private updatedAt: string;
  private eventEmitter: EventEmitter;
  private config: CrossWalletConfig;

  // Component instances
  private walletLinker: WalletLinker;
  private balanceAggregator: BalanceAggregator;
  private transactionRouter: TransactionRouter;
  private walletSync: WalletSync;

  constructor(userId: string, config?: Partial<CrossWalletConfig>) {
    if (!userId || userId.trim() === '') {
      throw new ValidationError('User ID is required', { userId });
    }

    this.userId = userId;
    this.createdAt = new Date().toISOString();
    this.updatedAt = this.createdAt;
    this.eventEmitter = new EventEmitter();

    // Initialize configuration
    this.config = {
      userId,
      providers: config?.providers || {},
      syncIntervalMs: config?.syncIntervalMs || 30000,
      enableAutoSync: config?.enableAutoSync ?? true,
      conversionRates: config?.conversionRates || []
    };

    // Initialize components
    this.walletLinker = new WalletLinker(this);
    this.balanceAggregator = new BalanceAggregator(this.wallets);
    this.transactionRouter = new TransactionRouter(this.wallets, this.balanceAggregator);
    this.walletSync = new WalletSync(this.wallets, this.config.syncIntervalMs);

    // Set up event forwarding from components
    this.setupEventHandlers();
  }

  /**
   * Set up event handlers to forward events from child components
   */
  private setupEventHandlers(): void {
    this.walletLinker.on('wallet_linked', (event: WalletEvent) => {
      this.updatedAt = new Date().toISOString();
      this.emit('wallet_linked', event);
    });

    this.walletLinker.on('wallet_unlinked', (event: WalletEvent) => {
      this.updatedAt = new Date().toISOString();
      this.emit('wallet_unlinked', event);
    });

    this.transactionRouter.on('transaction_completed', (event: WalletEvent) => {
      this.updatedAt = new Date().toISOString();
      this.emit('transaction_completed', event);
    });

    this.walletSync.on('sync_completed', (event: WalletEvent) => {
      this.emit('sync_completed', event);
    });
  }

  // ============================================================================
  // IDENTITY METHODS
  // ============================================================================

  /**
   * Get the full cross-wallet identity
   */
  getIdentity(): ICrossWalletIdentity {
    return {
      user_id: this.userId,
      wallets: Array.from(this.wallets.values()),
      total_balance: this.getTotalBalance(),
      transactions: this.getTransactionSummary(),
      redemptions: this.getRedemptionSummary(),
      linked_accounts: this.linkedAccounts,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  /**
   * Get user ID
   */
  getUserId(): string {
    return this.userId;
  }

  /**
   * Get all wallets
   */
  getWallets(): Wallet[] {
    return Array.from(this.wallets.values());
  }

  /**
   * Get wallet by ID
   */
  getWallet(walletId: string): Wallet | undefined {
    return this.wallets.get(walletId);
  }

  /**
   * Get wallets by type
   */
  getWalletsByType(type: WalletType): Wallet[] {
    return Array.from(this.wallets.values()).filter(w => w.type === type);
  }

  // ============================================================================
  // WALLET MANAGEMENT
  // ============================================================================

  /**
   * Add a wallet to the identity
   */
  async addWallet(wallet: Omit<Wallet, 'wallet_id' | 'created_at'>): Promise<Wallet> {
    const newWallet: Wallet = {
      ...wallet,
      wallet_id: uuidv4(),
      created_at: new Date().toISOString()
    };

    this.wallets.set(newWallet.wallet_id, newWallet);
    this.updatedAt = new Date().toISOString();

    this.emit('wallet_linked', {
      type: 'wallet_linked',
      wallet_id: newWallet.wallet_id,
      user_id: this.userId,
      timestamp: new Date().toISOString(),
      data: { wallet: newWallet }
    });

    return newWallet;
  }

  /**
   * Remove a wallet from the identity
   */
  async removeWallet(walletId: string): Promise<void> {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new WalletNotFoundError(walletId);
    }

    this.wallets.delete(walletId);
    this.updatedAt = new Date().toISOString();

    this.emit('wallet_unlinked', {
      type: 'wallet_unlinked',
      wallet_id: walletId,
      user_id: this.userId,
      timestamp: new Date().toISOString(),
      data: { wallet }
    });
  }

  /**
   * Link a wallet (delegates to WalletLinker)
   */
  async linkWallet(
    walletType: WalletType,
    provider: string,
    walletAddress: string,
    options?: { linkingCode?: string; verificationMethod?: 'sms' | 'email' | 'wallet_signature' }
  ): Promise<Wallet> {
    return this.walletLinker.linkWallet(
      this.userId,
      walletType,
      provider,
      walletAddress,
      options
    );
  }

  /**
   * Unlink a wallet
   */
  async unlinkWallet(walletId: string): Promise<void> {
    await this.removeWallet(walletId);
  }

  // ============================================================================
  // BALANCE OPERATIONS
  // ============================================================================

  /**
   * Get aggregated total balance across all wallets
   */
  getTotalBalance(): TotalBalance {
    return this.balanceAggregator.aggregateTotal(Array.from(this.wallets.values()));
  }

  /**
   * Get balance breakdown by wallet type
   */
  getBalanceByType(): Record<WalletType, number> {
    const balances = this.balanceAggregator.aggregateByType(Array.from(this.wallets.values()));
    return {
      [WalletType.POINTS]: balances.points || 0,
      [WalletType.CASH]: balances.cash || 0,
      [WalletType.CRYPTO]: balances.crypto || 0,
      [WalletType.GIFTCARD]: balances.giftcard || 0
    };
  }

  /**
   * Update wallet balance
   */
  updateBalance(walletId: string, newBalance: number): void {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new WalletNotFoundError(walletId);
    }

    const previousBalance = wallet.balance;
    wallet.balance = newBalance;
    this.updatedAt = new Date().toISOString();

    this.emit('balance_updated', {
      type: 'balance_updated',
      wallet_id: walletId,
      user_id: this.userId,
      timestamp: new Date().toISOString(),
      data: {
        previous_balance: previousBalance,
        new_balance: newBalance,
        change_amount: newBalance - previousBalance
      }
    });
  }

  // ============================================================================
  // TRANSACTION OPERATIONS
  // ============================================================================

  /**
   * Get transaction summary
   */
  getTransactionSummary(): TransactionSummary {
    return this.transactionRouter.getSummary();
  }

  /**
   * Route a transaction to appropriate wallet(s)
   */
  async routeTransaction(
    amount: number,
    currency: string,
    type: 'credit' | 'debit',
    options?: {
      walletType?: WalletType;
      walletId?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<{ transactionId: string; walletId: string }> {
    return this.transactionRouter.routeTransaction(
      this.userId,
      amount,
      currency,
      type,
      options
    );
  }

  // ============================================================================
  // REDEMPTION OPERATIONS
  // ============================================================================

  /**
   * Get redemption summary
   */
  getRedemptionSummary(): RedemptionSummary {
    // In a real implementation, this would aggregate from transaction history
    return {
      total_redeemed: 0,
      by_merchant: {},
      by_category: {}
    };
  }

  /**
   * Record a redemption
   */
  async recordRedemption(
    merchantId: string,
    amount: number,
    category?: string
  ): Promise<void> {
    // In a real implementation, this would persist to database
    this.emit('transaction_completed', {
      type: 'transaction_completed',
      wallet_id: 'redemption',
      user_id: this.userId,
      timestamp: new Date().toISOString(),
      data: { merchantId, amount, category }
    });
  }

  // ============================================================================
  // LINKED ACCOUNTS
  // ============================================================================

  /**
   * Add a linked account
   */
  addLinkedAccount(account: LinkedAccount): void {
    // Check for duplicates
    const exists = this.linkedAccounts.some(
      a => a.platform === account.platform && a.user_id === account.user_id
    );
    if (exists) {
      throw new ValidationError('Account already linked', { account });
    }

    this.linkedAccounts.push(account);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Remove a linked account
   */
  removeLinkedAccount(platform: string, platformUserId: string): void {
    const index = this.linkedAccounts.findIndex(
      a => a.platform === platform && a.user_id === platformUserId
    );
    if (index === -1) {
      throw new ValidationError('Linked account not found', { platform, platformUserId });
    }

    this.linkedAccounts.splice(index, 1);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Get linked accounts
   */
  getLinkedAccounts(): LinkedAccount[] {
    return [...this.linkedAccounts];
  }

  // ============================================================================
  // SYNC OPERATIONS
  // ============================================================================

  /**
   * Sync all wallets
   */
  async syncAll(): Promise<void> {
    await this.walletSync.syncAll();
  }

  /**
   * Sync a specific wallet
   */
  async syncWallet(walletId: string): Promise<void> {
    await this.walletSync.syncWallet(walletId);
  }

  /**
   * Start automatic sync
   */
  startAutoSync(): void {
    this.walletSync.start();
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    this.walletSync.stop();
  }

  // ============================================================================
  // EVENT HANDLING
  // ============================================================================

  /**
   * Subscribe to events
   */
  on(event: string, handler: (event: WalletEvent) => void): void {
    this.eventEmitter.on(event, handler);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, handler: (event: WalletEvent) => void): void {
    this.eventEmitter.off(event, handler);
  }

  /**
   * Emit an event
   */
  private emit(event: string, data: WalletEvent): void {
    this.eventEmitter.emit(event, data);
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  /**
   * Serialize to JSON
   */
  toJSON(): string {
    return JSON.stringify(this.getIdentity(), null, 2);
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(json: string): CrossWalletIdentity {
    const data = JSON.parse(json) as ICrossWalletIdentity;
    const instance = new CrossWalletIdentity(data.user_id);

    // Restore wallets
    for (const wallet of data.wallets) {
      instance.wallets.set(wallet.wallet_id, wallet);
    }

    // Restore linked accounts
    instance.linkedAccounts = data.linked_accounts;
    instance.createdAt;
    instance.updatedAt = data.updated_at;

    return instance;
  }

  /**
   * Clone the identity
   */
  clone(): CrossWalletIdentity {
    return CrossWalletIdentity.fromJSON(this.toJSON());
  }
}

export default CrossWalletIdentity;
