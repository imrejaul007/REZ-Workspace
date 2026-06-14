/**
 * BalanceAggregator - Aggregates balances across multiple wallets
 *
 * Provides unified balance calculations with currency conversion support
 */

import {
  Wallet,
  WalletType,
  TotalBalance,
  ConversionRate
} from './types';
import { ConversionError, ValidationError } from './errors';

/**
 * Balance breakdown by type
 */
export interface BalanceBreakdown {
  points: number;
  cash: number;
  crypto: number;
  giftcard: number;
  total_usd_equivalent: number;
}

/**
 * Currency conversion rates (cached)
 */
interface ConversionRates {
  rates: Map<string, number>;
  lastUpdated: string;
}

/**
 * BalanceAggregator handles balance aggregation logic
 */
export class BalanceAggregator {
  private wallets: Map<string, Wallet>;
  private conversionRates: ConversionRates = {
    rates: new Map(),
    lastUpdated: ''
  };
  private baseCurrency: string = 'USD';

  // Default conversion rates (would be fetched from API in production)
  private readonly defaultRates: Record<string, number> = {
    'PTS_USD': 0.01,    // 1 point = $0.01
    'ETH_USD': 2000,    // 1 ETH = $2000
    'BTC_USD': 40000,   // 1 BTC = $40000
    'USD_USD': 1,
    'EUR_USD': 1.1,
    'GBP_USD': 1.25,
    'INR_USD': 0.012
  };

  constructor(wallets: Map<string, Wallet>) {
    this.wallets = wallets;
    this.initializeDefaultRates();
  }

  /**
   * Initialize default conversion rates
   */
  private initializeDefaultRates(): void {
    for (const [key, rate] of Object.entries(this.defaultRates)) {
      this.conversionRates.rates.set(key, rate);
    }
    this.conversionRates.lastUpdated = new Date().toISOString();
  }

  /**
   * Update conversion rates
   */
  updateConversionRates(rates: ConversionRate[]): void {
    for (const rate of rates) {
      const key = `${rate.from_currency}_${rate.to_currency}`;
      this.conversionRates.rates.set(key, rate.rate);
    }
    this.conversionRates.lastUpdated = new Date().toISOString();
  }

  /**
   * Get conversion rate
   */
  getConversionRate(fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const directKey = `${fromCurrency}_${toCurrency}`;
    const directRate = this.conversionRates.rates.get(directKey);
    if (directRate !== undefined) {
      return directRate;
    }

    // Try inverse rate
    const inverseKey = `${toCurrency}_${fromCurrency}`;
    const inverseRate = this.conversionRates.rates.get(inverseKey);
    if (inverseRate !== undefined) {
      return 1 / inverseRate;
    }

    // Try through USD
    const toUsdKey = `${fromCurrency}_USD`;
    const toUsdRate = this.conversionRates.rates.get(toUsdKey);
    const fromUsdKey = `USD_${toCurrency}`;
    const fromUsdRate = this.conversionRates.rates.get(fromUsdKey);

    if (toUsdRate !== undefined && fromUsdRate !== undefined) {
      return toUsdRate * fromUsdRate;
    }

    throw new ConversionError(
      fromCurrency,
      toCurrency,
      `Unable to find conversion rate from ${fromCurrency} to ${toCurrency}`
    );
  }

  /**
   * Convert amount between currencies
   */
  convert(amount: number, fromCurrency: string, toCurrency: string): number {
    const rate = this.getConversionRate(fromCurrency, toCurrency);
    return amount * rate;
  }

  /**
   * Aggregate total balance across all wallets
   */
  aggregateTotal(wallets: Wallet[]): TotalBalance {
    const breakdown = this.aggregateByType(wallets);

    return {
      points: breakdown.points,
      cash_equivalent: breakdown.cash,
      crypto_usd: this.convertToUSD(breakdown.crypto, WalletType.CRYPTO),
      giftcards: breakdown.giftcard
    };
  }

  /**
   * Aggregate balance by wallet type
   */
  aggregateByType(wallets: Wallet[]): BalanceBreakdown {
    const result: BalanceBreakdown = {
      points: 0,
      cash: 0,
      crypto: 0,
      giftcard: 0,
      total_usd_equivalent: 0
    };

    for (const wallet of wallets) {
      switch (wallet.type) {
        case WalletType.POINTS:
          result.points += wallet.balance;
          break;
        case WalletType.CASH:
          result.cash += this.convert(wallet.balance, wallet.currency, this.baseCurrency);
          break;
        case WalletType.CRYPTO:
          result.crypto += this.convert(wallet.balance, wallet.currency, this.baseCurrency);
          break;
        case WalletType.GIFTCARD:
          result.giftcard += wallet.balance;
          break;
      }
    }

    result.total_usd_equivalent = this.calculateUSDTotal(result);
    return result;
  }

  /**
   * Get balance for a specific wallet type
   */
  getBalanceByType(wallets: Wallet[], type: WalletType): number {
    return wallets
      .filter(w => w.type === type)
      .reduce((sum, w) => sum + w.balance, 0);
  }

  /**
   * Get wallet with highest balance for a type
   */
  getHighestBalanceWallet(wallets: Wallet[], type: WalletType): Wallet | undefined {
    const typeWallets = wallets.filter(w => w.type === type);
    if (typeWallets.length === 0) return undefined;

    return typeWallets.reduce((highest, current) =>
      current.balance > highest.balance ? current : highest
    );
  }

  /**
   * Get wallet with lowest balance for a type
   */
  getLowestBalanceWallet(wallets: Wallet[], type: WalletType): Wallet | undefined {
    const typeWallets = wallets.filter(w => w.type === type);
    if (typeWallets.length === 0) return undefined;

    return typeWallets.reduce((lowest, current) =>
      current.balance < lowest.balance ? current : lowest
    );
  }

  /**
   * Find optimal wallet for transaction (highest balance)
   */
  findOptimalWallet(wallets: Wallet[], type: WalletType, minAmount: number): Wallet | undefined {
    const candidates = wallets
      .filter(w => w.type === type && w.balance >= minAmount)
      .sort((a, b) => b.balance - a.balance);

    return candidates[0];
  }

  /**
   * Check if user has sufficient total balance across wallets
   */
  hasSufficientBalance(
    wallets: Wallet[],
    requiredAmount: number,
    type: WalletType
  ): boolean {
    const totalBalance = this.getBalanceByType(wallets, type);
    return totalBalance >= requiredAmount;
  }

  /**
   * Find wallets that can cover an amount
   */
  findWalletsForAmount(
    wallets: Wallet[],
    type: WalletType,
    amount: number
  ): Wallet[] {
    const sorted = wallets
      .filter(w => w.type === type)
      .sort((a, b) => b.balance - a.balance);

    const result: Wallet[] = [];
    let remaining = amount;

    for (const wallet of sorted) {
      if (wallet.balance >= remaining) {
        result.push(wallet);
        break;
      } else {
        result.push(wallet);
        remaining -= wallet.balance;
      }
    }

    return result;
  }

  /**
   * Calculate USD equivalent for a crypto amount
   */
  convertToUSD(amount: number, type: WalletType): number {
    switch (type) {
      case WalletType.CRYPTO:
        // Already converted to USD in aggregateByType
        return amount;
      case WalletType.POINTS:
        return amount * this.defaultRates['PTS_USD'];
      case WalletType.CASH:
      case WalletType.GIFTCARD:
        return amount;
      default:
        return amount;
    }
  }

  /**
   * Calculate total USD value
   */
  private calculateUSDTotal(breakdown: BalanceBreakdown): number {
    return breakdown.points * this.defaultRates['PTS_USD'] +
           breakdown.cash +
           breakdown.crypto +
           breakdown.giftcard;
  }

  /**
   * Get balance summary as percentages
   */
  getBalancePercentages(wallets: Wallet[]): Record<WalletType, number> {
    const breakdown = this.aggregateByType(wallets);
    const total = breakdown.total_usd_equivalent;

    if (total === 0) {
      return {
        [WalletType.POINTS]: 0,
        [WalletType.CASH]: 0,
        [WalletType.CRYPTO]: 0,
        [WalletType.GIFTCARD]: 0
      };
    }

    return {
      [WalletType.POINTS]: (breakdown.points * this.defaultRates['PTS_USD']) / total * 100,
      [WalletType.CASH]: breakdown.cash / total * 100,
      [WalletType.CRYPTO]: breakdown.crypto / total * 100,
      [WalletType.GIFTCARD]: breakdown.giftcard / total * 100
    };
  }

  /**
   * Get last rates update time
   */
  getLastRatesUpdate(): string {
    return this.conversionRates.lastUpdated;
  }

  /**
   * Validate wallet balance update
   */
  validateBalanceUpdate(walletId: string, newBalance: number): void {
    if (newBalance < 0) {
      throw new ValidationError('Balance cannot be negative', { walletId, newBalance });
    }
  }
}

export default BalanceAggregator;
