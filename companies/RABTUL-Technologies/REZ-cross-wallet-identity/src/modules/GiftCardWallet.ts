/**
 * GiftCardWallet - Gift card wallet implementation
 *
 * Manages gift cards with redemption, balance checking, and expiry tracking
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
 * Gift card types
 */
export enum GiftCardType {
  PHYSICAL = 'physical',
  DIGITAL = 'digital',
  ECODE = 'ecode',
  VIRTUAL = 'virtual'
}

/**
 * Gift card data
 */
interface GiftCard {
  cardId: string;
  code: string;
  type: GiftCardType;
  balance: number;
  originalAmount: number;
  currency: string;
  merchant: string;
  merchantId: string;
  category: string;
  issuedAt: string;
  expiresAt: string;
  redeemedAt?: string;
  status: 'active' | 'expired' | 'redeemed' | 'partial';
}

/**
 * Gift card wallet data
 */
interface GiftCardWalletData {
  wallet: Wallet;
  giftCards: Map<string, GiftCard>;
  transactions: GiftCardTransaction[];
}

/**
 * Gift card transaction
 */
interface GiftCardTransaction extends Transaction {
  card_id: string;
  card_code?: string;
  merchant: string;
  merchant_id: string;
  remaining_balance?: number;
}

/**
 * Redemption options
 */
export interface RedemptionOptions {
  amount?: number;  // Partial redemption amount
  merchantId?: string;
  category?: string;
  autoRedeem?: boolean;
}

/**
 * GiftCardWallet implementation
 */
export class GiftCardWallet implements IWalletModule {
  private config?: WalletConfig;
  private wallets: Map<string, GiftCardWalletData> = new Map();

  // Merchant registry
  private merchantRegistry: Map<string, MerchantInfo> = new Map();

  // Redemption fees
  private readonly REDEMPTION_FEE_PERCENT = 0;
  private readonly MIN_REDEMPTION = 0.01;

  constructor(config?: WalletConfig) {
    this.config = config;
    this.initializeMerchantRegistry();
  }

  /**
   * Initialize merchant registry with default merchants
   */
  private initializeMerchantRegistry(): void {
    const defaultMerchants: MerchantInfo[] = [
      { id: 'amazon', name: 'Amazon', category: 'retail', supportsPartial: true },
      { id: 'target', name: 'Target', category: 'retail', supportsPartial: true },
      { id: 'walmart', name: 'Walmart', category: 'retail', supportsPartial: true },
      { id: 'starbucks', name: 'Starbucks', category: 'food', supportsPartial: false },
      { id: 'uber', name: 'Uber', category: 'transport', supportsPartial: true },
      { id: 'netflix', name: 'Netflix', category: 'entertainment', supportsPartial: false },
      { id: 'apple', name: 'Apple', category: 'tech', supportsPartial: true },
      { id: 'googleplay', name: 'Google Play', category: 'tech', supportsPartial: false }
    ];

    for (const merchant of defaultMerchants) {
      this.merchantRegistry.set(merchant.id, merchant);
    }
  }

  /**
   * Initialize the wallet module
   */
  async initialize(_config: WalletConfig): Promise<void> {
    // Initialize provider connections
  }

  /**
   * Create a new gift card wallet
   */
  async createWallet(userId: string): Promise<Wallet> {
    const walletId = uuidv4();
    const now = new Date().toISOString();

    const wallet: Wallet = {
      wallet_id: walletId,
      type: WalletType.GIFTCARD,
      provider: 'giftcard',
      balance: 0,
      currency: 'USD',
      linked: true,
      created_at: now,
      metadata: {
        userId,
        cardCount: 0
      }
    };

    this.wallets.set(walletId, {
      wallet,
      giftCards: new Map(),
      transactions: []
    });

    return wallet;
  }

  /**
   * Get wallet balance (total of all gift cards)
   */
  async getBalance(walletId: string): Promise<WalletBalance> {
    const data = this.wallets.get(walletId);
    if (!data) {
      throw new ValidationError('Wallet not found', { walletId });
    }

    // Calculate total balance
    const totalBalance = this.calculateTotalBalance(data);
    data.wallet.balance = totalBalance;

    // Count active cards
    const activeCards = Array.from(data.giftCards.values())
      .filter(c => c.status === 'active' || c.status === 'partial');

    return {
      wallet_id: walletId,
      type: WalletType.GIFTCARD,
      balance: totalBalance,
      currency: data.wallet.currency,
      last_synced: new Date().toISOString(),
      pending_transactions: 0
    };
  }

  /**
   * Add a gift card to wallet
   */
  async addGiftCard(
    walletId: string,
    code: string,
    balance: number,
    options?: {
      merchant?: string;
      merchantId?: string;
      type?: GiftCardType;
      expiresAt?: string;
    }
  ): Promise<GiftCard> {
    const data = this.wallets.get(walletId);
    if (!data) {
      throw new TransactionError('Wallet not found', undefined, walletId);
    }

    // Validate code format (basic check)
    if (!code || code.length < 5) {
      throw new ValidationError('Invalid gift card code', { code });
    }

    if (balance <= 0) {
      throw new ValidationError('Gift card balance must be positive', { balance });
    }

    // Check for duplicate code
    for (const card of data.giftCards.values()) {
      if (card.code === code) {
        throw new ValidationError('Gift card code already exists in wallet', { code });
      }
    }

    const merchant = options?.merchantId
      ? this.merchantRegistry.get(options.merchantId)
      : undefined;

    const cardId = uuidv4();
    const card: GiftCard = {
      cardId,
      code,
      type: options?.type || GiftCardType.DIGITAL,
      balance,
      originalAmount: balance,
      currency: data.wallet.currency,
      merchant: merchant?.name || options?.merchant || 'Unknown',
      merchantId: options?.merchantId || 'unknown',
      category: merchant?.category || 'general',
      issuedAt: new Date().toISOString(),
      expiresAt: options?.expiresAt || this.calculateDefaultExpiry(),
      status: 'active'
    };

    data.giftCards.set(cardId, card);

    // Create transaction record
    const transaction: GiftCardTransaction = {
      transaction_id: uuidv4(),
      wallet_id: walletId,
      type: TransactionType.CREDIT,
      status: TransactionStatus.COMPLETED,
      amount: balance,
      currency: data.wallet.currency,
      description: `Added ${card.merchant} gift card`,
      metadata: { cardId, code: card.code.slice(0, 4) + '****' },
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      card_id: cardId,
      merchant: card.merchant,
      merchant_id: card.merchantId,
      remaining_balance: balance
    };

    data.transactions.push(transaction);

    // Update wallet balance
    data.wallet.balance += balance;

    // Update metadata
    data.wallet.metadata = {
      ...data.wallet.metadata,
      cardCount: data.giftCards.size
    };

    return card;
  }

  /**
   * Redeem gift card (full or partial)
   */
  async redeem(
    walletId: string,
    cardId: string,
    options?: RedemptionOptions
  ): Promise<Transaction> {
    const data = this.wallets.get(walletId);
    if (!data) {
      throw new TransactionError('Wallet not found', undefined, walletId);
    }

    const card = data.giftCards.get(cardId);
    if (!card) {
      throw new TransactionError('Gift card not found', undefined, walletId, { cardId });
    }

    // Validate card status
    if (card.status === 'redeemed') {
      throw new TransactionError('Gift card already fully redeemed', undefined, walletId, { cardId });
    }

    if (card.status === 'expired') {
      throw new TransactionError('Gift card has expired', undefined, walletId, { cardId });
    }

    // Determine redemption amount
    const redemptionAmount = options?.amount || card.balance;

    if (redemptionAmount <= 0) {
      throw new ValidationError('Redemption amount must be positive');
    }

    if (redemptionAmount > card.balance) {
      throw new TransactionError(
        'Insufficient gift card balance',
        undefined,
        walletId,
        { available: card.balance, requested: redemptionAmount }
      );
    }

    // Check minimum redemption
    if (redemptionAmount < this.MIN_REDEMPTION) {
      throw new ValidationError(`Minimum redemption is ${this.MIN_REDEMPTION}`);
    }

    // Check merchant compatibility
    if (options?.merchantId && options.merchantId !== card.merchantId) {
      throw new ValidationError(
        'Gift card can only be redeemed at specified merchant',
        { cardMerchant: card.merchantId, requestedMerchant: options.merchantId }
      );
    }

    // Calculate remaining balance
    const newBalance = card.balance - redemptionAmount;

    // Update card
    if (newBalance <= 0) {
      card.status = 'redeemed';
      card.balance = 0;
      card.redeemedAt = new Date().toISOString();
    } else {
      card.status = 'partial';
      card.balance = newBalance;
    }

    // Create transaction record
    const transaction: GiftCardTransaction = {
      transaction_id: uuidv4(),
      wallet_id: walletId,
      type: TransactionType.REDEMPTION,
      status: TransactionStatus.COMPLETED,
      amount: redemptionAmount,
      currency: card.currency,
      description: `Redeemed at ${card.merchant}`,
      metadata: { cardId, merchant: card.merchant },
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      card_id: cardId,
      card_code: card.code.slice(0, 4) + '****',
      merchant: card.merchant,
      merchant_id: card.merchantId,
      remaining_balance: newBalance
    };

    data.transactions.push(transaction);

    // Update wallet balance
    data.wallet.balance = this.calculateTotalBalance(data);

    return transaction;
  }

  /**
   * Transfer gift card to another wallet
   */
  async transferGiftCard(
    fromWalletId: string,
    toWalletId: string,
    cardId: string
  ): Promise<Transaction> {
    const fromData = this.wallets.get(fromWalletId);
    const toData = this.wallets.get(toWalletId);

    if (!fromData) {
      throw new TransactionError('Source wallet not found', undefined, fromWalletId);
    }
    if (!toData) {
      throw new TransactionError('Destination wallet not found', undefined, toWalletId);
    }

    const card = fromData.giftCards.get(cardId);
    if (!card) {
      throw new TransactionError('Gift card not found', undefined, fromWalletId, { cardId });
    }

    // Transfer card
    fromData.giftCards.delete(cardId);
    fromData.wallet.balance = this.calculateTotalBalance(fromData);
    fromData.wallet.metadata = {
      ...fromData.wallet.metadata,
      cardCount: fromData.giftCards.size
    };

    toData.giftCards.set(cardId, { ...card });
    toData.wallet.balance = this.calculateTotalBalance(toData);
    toData.wallet.metadata = {
      ...toData.wallet.metadata,
      cardCount: toData.giftCards.size
    };

    // Create transaction records
    const transaction: GiftCardTransaction = {
      transaction_id: uuidv4(),
      wallet_id: fromWalletId,
      type: TransactionType.TRANSFER,
      status: TransactionStatus.COMPLETED,
      amount: card.balance,
      currency: card.currency,
      description: `Transferred ${card.merchant} gift card to wallet ${toWalletId}`,
      metadata: { cardId, toWalletId },
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      card_id: cardId,
      merchant: card.merchant,
      merchant_id: card.merchantId
    };

    fromData.transactions.push(transaction);

    return transaction;
  }

  /**
   * Get gift cards in wallet
   */
  async getGiftCards(walletId: string): Promise<GiftCard[]> {
    const data = this.wallets.get(walletId);
    if (!data) {
      throw new TransactionError('Wallet not found', undefined, walletId);
    }

    return Array.from(data.giftCards.values());
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
   * Get gift card by code
   */
  getGiftCardByCode(walletId: string, code: string): GiftCard | undefined {
    const data = this.wallets.get(walletId);
    if (!data) return undefined;

    for (const card of data.giftCards.values()) {
      if (card.code === code) return card;
    }
    return undefined;
  }

  /**
   * Calculate total balance
   */
  private calculateTotalBalance(data: GiftCardWalletData): number {
    let total = 0;
    for (const card of data.giftCards.values()) {
      if (card.status === 'active' || card.status === 'partial') {
        total += card.balance;
      }
    }
    return total;
  }

  /**
   * Calculate default expiry (1 year from now)
   */
  private calculateDefaultExpiry(): string {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    return expiry.toISOString();
  }

  /**
   * Register merchant
   */
  registerMerchant(merchant: MerchantInfo): void {
    this.merchantRegistry.set(merchant.id, merchant);
  }

  /**
   * Get merchant info
   */
  getMerchant(merchantId: string): MerchantInfo | undefined {
    return this.merchantRegistry.get(merchantId);
  }

  /**
   * Get all merchants
   */
  getAllMerchants(): MerchantInfo[] {
    return Array.from(this.merchantRegistry.values());
  }
}

/**
 * Merchant information
 */
interface MerchantInfo {
  id: string;
  name: string;
  category: string;
  supportsPartial: boolean;
}

export { GiftCardWallet as default, GiftCardType };
