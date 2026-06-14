/**
 * TreasuryOS - FX Hedging Service
 * Currency risk management and hedging strategies
 */

import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface FXRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
  source: string;
}

export interface HedgePosition {
  positionId: string;
  businessId: string;
  currency: string;
  type: 'forward' | 'option' | 'swap' | 'spot';
  notionalAmount: number;
  hedgedAmount: number;
  hedgeRatio: number;
  strikeRate?: number;
  premium?: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'settled' | 'cancelled' | 'expired';
  realizedPnL: number;
  unrealizedPnL: number;
  counterparty?: string;
}

export interface HedgeStrategy {
  strategyId: string;
  businessId: string;
  name: string;
  currency: string;
  riskTolerance: 'low' | 'medium' | 'high';
  hedgeRatio: number;
  instruments: Array<'forward' | 'option' | 'swap'>;
  minimumExposure: number;
  maximumTenor: number;
  autoRenew: boolean;
  active: boolean;
}

export interface FXExposure {
  currency: string;
  totalExposure: number;
  hedgedAmount: number;
  unhedgedAmount: number;
  hedgeRatio: number;
  var95: number; // Value at Risk (95% confidence)
  var99: number; // Value at Risk (99% confidence)
  dailyVaR: number;
}

export interface HedgeRecommendation {
  currency: string;
  currentExposure: number;
  currentHedgeRatio: number;
  recommendedHedgeRatio: number;
  recommendedAmount: number;
  instrument: 'forward' | 'option';
  estimatedCost: number;
  potentialSavings: number;
  riskReduction: number;
  confidence: number;
}

export interface SpotRate {
  from: string;
  to: string;
  bid: number;
  ask: number;
  mid: number;
  spread: number;
  timestamp: Date;
}

const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY', 'CNY', 'AUD', 'CAD'];
const BASE_CURRENCY = 'INR';

// Mock FX rates (in production, these come from an FX data provider)
const MOCK_RATES: Record<string, Record<string, number>> = {
  INR: { USD: 0.012, EUR: 0.011, GBP: 0.0095, AED: 0.044, SGD: 0.016, JPY: 1.78, CNY: 0.086, AUD: 0.018, CAD: 0.016 },
  USD: { INR: 83.5, EUR: 0.92, GBP: 0.79, AED: 3.67, SGD: 1.34, JPY: 148, CNY: 7.24, AUD: 1.53, CAD: 1.36 },
  EUR: { INR: 90.5, USD: 1.09, GBP: 0.86, AED: 4.0, SGD: 1.46, JPY: 161, CNY: 7.87, AUD: 1.66, CAD: 1.48 },
  GBP: { INR: 105.2, USD: 1.26, EUR: 1.16, AED: 4.64, SGD: 1.69, JPY: 187, CNY: 9.15, AUD: 1.93, CAD: 1.72 },
};

export class FXHedgingService {
  private positions: Map<string, HedgePosition[]> = new Map();
  private strategies: Map<string, HedgeStrategy[]> = new Map();

  /**
   * Get current FX rate
   */
  async getRate(from: string, to: string): Promise<FXRate> {
    if (from === to) {
      return { from, to, rate: 1, timestamp: new Date(), source: 'self' };
    }

    const rate = MOCK_RATES[from]?.[to] || MOCK_RATES[BASE_CURRENCY]?.[to] / (MOCK_RATES[BASE_CURRENCY]?.[from] || 1);

    if (!rate) {
      throw new Error(`FX rate not available for ${from}/${to}`);
    }

    return {
      from,
      to,
      rate,
      timestamp: new Date(),
      source: 'mock_provider',
    };
  }

  /**
   * Get spot rates for a currency pair
   */
  async getSpotRate(from: string, to: string): Promise<SpotRate> {
    const midRate = (await this.getRate(from, to)).rate;
    const spreadPercent = 0.002; // 0.2% spread

    return {
      from,
      to,
      bid: midRate * (1 - spreadPercent / 2),
      ask: midRate * (1 + spreadPercent / 2),
      mid: midRate,
      spread: midRate * spreadPercent,
      timestamp: new Date(),
    };
  }

  /**
   * Convert amount between currencies
   */
  async convert(amount: number, from: string, to: string): Promise<number> {
    const rate = await this.getRate(from, to);
    return new Decimal(amount).times(rate.rate).toNumber();
  }

  /**
   * Create a forward contract hedge
   */
  async createForwardHedge(params: {
    businessId: string;
    currency: string;
    amount: number;
    hedgeRatio: number;
    forwardRate?: number;
    startDate: Date;
    endDate: Date;
    counterparty?: string;
  }): Promise<HedgePosition> {
    const { businessId, currency, amount, hedgeRatio, startDate, endDate, counterparty } = params;

    // Get forward rate (in production, this comes from forward markets)
    const spotRate = await this.getRate(currency, BASE_CURRENCY);
    const forwardRate = params.forwardRate || spotRate.rate;

    const hedgedAmount = new Decimal(amount).times(hedgeRatio).toNumber();

    const position: HedgePosition = {
      positionId: `hedge_${uuidv4()}`,
      businessId,
      currency,
      type: 'forward',
      notionalAmount: amount,
      hedgedAmount,
      hedgeRatio,
      strikeRate: forwardRate,
      startDate,
      endDate,
      status: 'active',
      realizedPnL: 0,
      unrealizedPnL: 0,
      counterparty,
    };

    // Store position
    const positions = this.positions.get(businessId) || [];
    positions.push(position);
    this.positions.set(businessId, positions);

    return position;
  }

  /**
   * Create an FX option hedge
   */
  async createOptionHedge(params: {
    businessId: string;
    currency: string;
    amount: number;
    hedgeRatio: number;
    strikeRate: number;
    premium: number;
    optionType: 'call' | 'put';
    expiryDate: Date;
    counterparty?: string;
  }): Promise<HedgePosition> {
    const { businessId, currency, amount, hedgeRatio, strikeRate, premium, expiryDate, counterparty } = params;

    const hedgedAmount = new Decimal(amount).times(hedgeRatio).toNumber();

    const position: HedgePosition = {
      positionId: `hedge_${uuidv4()}`,
      businessId,
      currency,
      type: 'option',
      notionalAmount: amount,
      hedgedAmount,
      hedgeRatio,
      strikeRate,
      premium,
      startDate: new Date(),
      endDate: expiryDate,
      status: 'active',
      realizedPnL: 0,
      unrealizedPnL: 0,
      counterparty,
    };

    const positions = this.positions.get(businessId) || [];
    positions.push(position);
    this.positions.set(businessId, positions);

    return position;
  }

  /**
   * Calculate FX exposure for a business
   */
  async calculateExposure(businessId: string, currency: string): Promise<FXExposure> {
    const positions = this.positions.get(businessId) || [];
    const activePositions = positions.filter(p => p.currency === currency && p.status === 'active');

    // In production, this would calculate from actual receivables/payables
    const totalExposure = 1000000; // Mock: ₹10L USD exposure
    const hedgedAmount = activePositions.reduce((sum, p) => sum + p.hedgedAmount, 0);
    const unhedgedAmount = Math.max(0, totalExposure - hedgedAmount);
    const hedgeRatio = totalExposure > 0 ? hedgedAmount / totalExposure : 0;

    // Calculate VaR (simplified)
    const volatility = 0.02; // 2% daily volatility
    const var95 = unhedgedAmount * 1.65 * volatility;
    const var99 = unhedgedAmount * 2.33 * volatility;
    const dailyVaR = var95;

    return {
      currency,
      totalExposure,
      hedgedAmount,
      unhedgedAmount,
      hedgeRatio,
      var95,
      var99,
      dailyVaR,
    };
  }

  /**
   * Get hedge recommendations
   */
  async getRecommendations(businessId: string): Promise<HedgeRecommendation[]> {
    const recommendations: HedgeRecommendation[] = [];
    const currencies = ['USD', 'EUR', 'GBP']; // Common exposure currencies

    for (const currency of currencies) {
      const exposure = await this.calculateExposure(businessId, currency);

      if (exposure.totalExposure < 10000) continue; // Skip small exposures

      const currentRatio = exposure.hedgeRatio;
      let recommendedRatio = currentRatio;

      // Recommend based on risk tolerance
      if (currentRatio < 0.5 && exposure.var95 > 50000) {
        recommendedRatio = 0.7; // Recommend 70% hedge
      } else if (currentRatio < 0.3) {
        recommendedRatio = 0.5; // Recommend minimum 50% hedge
      }

      if (recommendedRatio <= currentRatio) continue; // No recommendation needed

      const recommendedAmount = exposure.totalExposure * recommendedRatio - exposure.hedgedAmount;
      const currentSpotRate = await this.getRate(currency, BASE_CURRENCY);
      const estimatedCost = recommendedAmount * 0.01; // ~1% cost estimate
      const potentialSavings = exposure.var95 * 0.3; // 30% risk reduction estimate

      recommendations.push({
        currency,
        currentExposure: exposure.totalExposure,
        currentHedgeRatio: currentRatio,
        recommendedHedgeRatio: recommendedRatio,
        recommendedAmount,
        instrument: recommendedAmount > 100000 ? 'forward' : 'option',
        estimatedCost,
        potentialSavings,
        riskReduction: potentialSavings / exposure.var95,
        confidence: 0.85,
      });
    }

    return recommendations;
  }

  /**
   * Calculate unrealized P&L for hedge positions
   */
  async updatePositionPnL(positionId: string): Promise<HedgePosition | null> {
    for (const [businessId, positions] of this.positions.entries()) {
      const position = positions.find(p => p.positionId === positionId);
      if (!position) continue;

      const currentRate = await this.getRate(position.currency, BASE_CURRENCY);

      if (position.type === 'forward') {
        // Calculate unrealized P&L for forward
        const forwardRate = position.strikeRate || currentRate.rate;
        position.unrealizedPnL = new Decimal(position.hedgedAmount)
          .times(currentRate.rate - forwardRate)
          .toNumber();
      } else if (position.type === 'option') {
        // Simplified option P&L (needs proper Black-Scholes in production)
        const currentSpotRate = currentRate.rate;
        if (currentSpotRate > (position.strikeRate || 0)) {
          position.unrealizedPnL = position.hedgedAmount * (currentSpotRate - (position.strikeRate || 0));
        }
      }

      return position;
    }

    return null;
  }

  /**
   * Settle a hedge position
   */
  async settlePosition(positionId: string, settlementRate: number): Promise<HedgePosition | null> {
    for (const [businessId, positions] of this.positions.entries()) {
      const position = positions.find(p => p.positionId === positionId);
      if (!position || position.status !== 'active') continue;

      const forwardRate = position.strikeRate || settlementRate;

      position.realizedPnL = new Decimal(position.hedgedAmount)
        .times(settlementRate - forwardRate)
        .toNumber();
      position.status = 'settled';

      return position;
    }

    return null;
  }

  /**
   * Get all positions for a business
   */
  async getPositions(businessId: string): Promise<HedgePosition[]> {
    const positions = this.positions.get(businessId) || [];

    // Update P&L for all positions
    for (const position of positions) {
      if (position.status === 'active') {
        await this.updatePositionPnL(position.positionId);
      }
    }

    return positions;
  }

  /**
   * Create or update hedge strategy
   */
  async createStrategy(strategy: Omit<HedgeStrategy, 'strategyId'>): Promise<HedgeStrategy> {
    const fullStrategy: HedgeStrategy = {
      ...strategy,
      strategyId: `strat_${uuidv4()}`,
    };

    const strategies = this.strategies.get(strategy.businessId) || [];
    strategies.push(fullStrategy);
    this.strategies.set(strategy.businessId, strategies);

    return fullStrategy;
  }

  /**
   * Get hedge strategies for a business
   */
  async getStrategies(businessId: string): Promise<HedgeStrategy[]> {
    return this.strategies.get(businessId) || [];
  }

  /**
   * Execute automatic hedging based on strategy
   */
  async executeAutoHedge(businessId: string): Promise<HedgePosition[]> {
    const strategies = await this.getStrategies(businessId);
    const createdPositions: HedgePosition[] = [];

    for (const strategy of strategies) {
      if (!strategy.active) continue;

      const exposure = await this.calculateExposure(businessId, strategy.currency);

      if (exposure.unhedgedAmount < strategy.minimumExposure) continue;

      // Check if we need to hedge more
      if (exposure.hedgeRatio < strategy.hedgeRatio) {
        const additionalHedge = exposure.unhedgedAmount *
          Math.min(strategy.hedgeRatio, 0.9) - exposure.hedgedAmount;

        if (additionalHedge > 0) {
          const position = await this.createForwardHedge({
            businessId,
            currency: strategy.currency,
            amount: additionalHedge,
            hedgeRatio: 1,
            startDate: new Date(),
            endDate: new Date(Date.now() + strategy.maximumTenor * 24 * 60 * 60 * 1000),
          });

          createdPositions.push(position);
        }
      }
    }

    return createdPositions;
  }

  /**
   * Get historical rate
   */
  async getHistoricalRate(
    from: string,
    to: string,
    date: Date
  ): Promise<FXRate> {
    // In production, this would query historical FX data
    // For now, return current rate with historical timestamp
    const currentRate = await this.getRate(from, to);
    return {
      ...currentRate,
      timestamp: date,
      source: 'historical_mock',
    };
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): string[] {
    return SUPPORTED_CURRENCIES;
  }

  /**
   * Get currency pair list
   */
  getCurrencyPairs(): Array<{ from: string; to: string }> {
    const pairs: Array<{ from: string; to: string }> = [];
    for (const from of SUPPORTED_CURRENCIES) {
      for (const to of SUPPORTED_CURRENCIES) {
        if (from !== to && to === BASE_CURRENCY) {
          pairs.push({ from, to });
        }
      }
    }
    return pairs;
  }
}

export const fxHedgingService = new FXHedgingService();
