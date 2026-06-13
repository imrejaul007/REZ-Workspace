import { v4 as uuidv4 } from 'uuid';
import { InvestorTwin } from '../models/investor-twin.model';
import {
  CreateInvestorTwinRequest,
  CreateInvestorTwinResponse,
  GetInvestorTwinResponse,
  UpdateRiskProfileRequest,
  UpdateRiskProfileResponse,
  UpdatePortfolioRequest,
  UpdatePortfolioResponse,
  UpdateHoldingsRequest,
  UpdateHoldingsResponse,
  AddTransactionRequest,
  AddTransactionResponse,
  UpdateMetricsRequest,
  UpdateMetricsResponse,
  AddToWatchlistRequest,
  AddToWatchlistResponse,
  RemoveFromWatchlistRequest,
  RemoveFromWatchlistResponse,
  UpdatePreferencesRequest,
  UpdatePreferencesResponse,
  ListInvestorsRequest,
  ListInvestorsResponse,
  GetPortfolioSummaryResponse,
  PortfolioAllocation,
  SectorAllocation,
  Holdings,
  Watchlist,
  defaultRiskProfile,
  defaultPerformanceMetrics,
  defaultPreferences,
  defaultPortfolioAllocations
} from '../schemas/investor-twin.schema';
import { logger } from '../utils/logger';
import { messageBroker } from '../utils/message-broker';
import { tradingClient } from '../utils/trading-client';
import { portfolioClient } from '../utils/portfolio-client';
import { riskAnalyticsClient } from '../utils/risk-analytics-client';
import { marketDataClient } from '../utils/market-data-client';
import { rezDashboardClient } from '../utils/rez-dashboard-client';

export class InvestorTwinService {
  /**
   * Create a new Investor Twin
   */
  async createInvestorTwin(request: CreateInvestorTwinRequest): Promise<CreateInvestorTwinResponse> {
    const twinId = `twin.investor.${request.investorId}`;
    const twinOsEntityId = twinId;

    logger.info('Creating Investor Twin', { investorId: request.investorId, twinId });

    // Check if twin already exists
    const existingTwin = await InvestorTwin.findByInvestorId(request.investorId);
    if (existingTwin) {
      throw new Error(`Investor Twin already exists for investorId: ${request.investorId}`);
    }

    // Create the investor twin document
    const investorTwin = new InvestorTwin({
      twinId,
      investorId: request.investorId,
      type: request.type,
      name: request.name,
      firmName: request.firmName,
      description: request.description,
      contact: request.contact,
      taxId: request.taxId,
      riskProfile: {
        ...defaultRiskProfile,
        ...request.riskProfile
      },
      portfolioAllocations: request.portfolioAllocations || defaultPortfolioAllocations,
      sectorAllocations: request.sectorAllocations || [],
      currentMetrics: defaultPerformanceMetrics,
      holdings: [],
      transactions: [],
      watchlist: [],
      investmentGoals: [],
      totalPortfolioValue: 0,
      cashBalance: 0,
      totalInvested: 0,
      totalReturns: 0,
      returnsPercent: 0,
      documents: [],
      preferences: defaultPreferences,
      status: 'active',
      lastUpdated: new Date().toISOString()
    });

    await investorTwin.save();

    // Publish event to TwinOS
    await messageBroker.publish('investor.twin.created', {
      twinId,
      investorId: request.investorId,
      type: request.type,
      name: request.name,
      twinOsEntityId,
      timestamp: new Date().toISOString()
    });

    // Sync with Trading Service
    await tradingClient.getBalance(request.investorId).catch(() => {
      logger.warn('Could not sync with trading service', { investorId: request.investorId });
    });

    // Notify Dashboard
    await rezDashboardClient.notifyInvestorUpdate(request.investorId, 'created', {
      twinId,
      name: request.name
    });

    logger.info('Investor Twin created successfully', { twinId, investorId: request.investorId });

    return {
      twinId,
      investorId: request.investorId,
      twinOsEntityId,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Get Investor Twin by ID
   */
  async getInvestorTwin(investorId: string): Promise<GetInvestorTwinResponse> {
    logger.info('Fetching Investor Twin', { investorId });

    const investorTwin = await InvestorTwin.findByInvestorId(investorId);
    if (!investorTwin) {
      throw new Error(`Investor Twin not found for investorId: ${investorId}`);
    }

    const json = investorTwin.toJSON();
    return {
      ...json,
      twinOsEntityId: `twin.investor.${investorId}`
    } as unknown as GetInvestorTwinResponse;
  }

  /**
   * Get Portfolio Summary
   */
  async getPortfolioSummary(investorId: string): Promise<GetPortfolioSummaryResponse> {
    logger.info('Fetching Portfolio Summary', { investorId });

    const investorTwin = await InvestorTwin.findByInvestorId(investorId);
    if (!investorTwin) {
      throw new Error(`Investor Twin not found for investorId: ${investorId}`);
    }

    const assetAllocation = investorTwin.portfolioAllocations.map((a: PortfolioAllocation) => ({
      assetClass: a.assetClass,
      value: a.value,
      percentage: a.currentPercentage
    }));

    const sectorAllocation = investorTwin.sectorAllocations.map((s: SectorAllocation) => ({
      sector: s.sector,
      value: s.value,
      percentage: s.percentage
    }));

    const topHoldings = [...investorTwin.holdings]
      .sort((a, b) => b.marketValue - a.marketValue)
      .slice(0, 10);

    const recentTransactions = [...investorTwin.transactions]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return {
      twinId: investorTwin.twinId,
      investorId,
      totalPortfolioValue: investorTwin.totalPortfolioValue,
      cashBalance: investorTwin.cashBalance,
      totalInvested: investorTwin.totalInvested,
      totalReturns: investorTwin.totalReturns,
      returnsPercent: investorTwin.returnsPercent,
      assetAllocation,
      sectorAllocation,
      topHoldings,
      recentTransactions,
      performanceMetrics: investorTwin.currentMetrics
    };
  }

  /**
   * Update Risk Profile
   */
  async updateRiskProfile(
    investorId: string,
    request: UpdateRiskProfileRequest
  ): Promise<UpdateRiskProfileResponse> {
    logger.info('Updating Investor Twin risk profile', { investorId });

    const investorTwin = await InvestorTwin.findByInvestorId(investorId);
    if (!investorTwin) {
      throw new Error(`Investor Twin not found for investorId: ${investorId}`);
    }

    investorTwin.riskProfile = {
      ...investorTwin.riskProfile,
      ...request.riskProfile
    };
    investorTwin.lastUpdated = new Date().toISOString();
    await investorTwin.save();

    // Publish risk profile update event
    await messageBroker.publish('investor.twin.risk.updated', {
      twinId: investorTwin.twinId,
      investorId,
      riskProfile: investorTwin.riskProfile,
      timestamp: new Date().toISOString()
    });

    // Check compliance with new risk profile
    await riskAnalyticsClient.checkCompliance({
      investorId,
      riskTolerance: investorTwin.riskProfile.riskTolerance,
      portfolioAllocations: investorTwin.portfolioAllocations.map(a => ({
        assetClass: a.assetClass,
        percentage: a.currentPercentage
      }))
    }).catch(() => {
      logger.warn('Risk compliance check failed', { investorId });
    });

    logger.info('Investor Twin risk profile updated', { twinId: investorTwin.twinId, investorId });

    return {
      twinId: investorTwin.twinId,
      investorId,
      riskProfile: investorTwin.riskProfile,
      updatedAt: investorTwin.updatedAt.toISOString()
    };
  }

  /**
   * Update Portfolio Allocations
   */
  async updatePortfolio(
    investorId: string,
    request: UpdatePortfolioRequest
  ): Promise<UpdatePortfolioResponse> {
    logger.info('Updating Investor Twin portfolio', { investorId });

    const investorTwin = await InvestorTwin.findByInvestorId(investorId);
    if (!investorTwin) {
      throw new Error(`Investor Twin not found for investorId: ${investorId}`);
    }

    // Recalculate current percentages based on values
    const totalValue = investorTwin.totalPortfolioValue;
    request.portfolioAllocations.forEach((a: PortfolioAllocation) => {
      a.currentPercentage = totalValue > 0 ? (a.value / totalValue) * 100 : 0;
    });

    investorTwin.portfolioAllocations = request.portfolioAllocations;
    if (request.sectorAllocations) {
      investorTwin.sectorAllocations = request.sectorAllocations;
    }
    investorTwin.lastUpdated = new Date().toISOString();
    await investorTwin.save();

    // Publish portfolio update event
    await messageBroker.publish('investor.twin.portfolio.updated', {
      twinId: investorTwin.twinId,
      investorId,
      portfolioAllocations: request.portfolioAllocations,
      timestamp: new Date().toISOString()
    });

    // Sync with Portfolio Service
    await portfolioClient.syncPortfolio({
      investorId,
      holdings: investorTwin.holdings.map((h: Holdings) => ({
        symbol: h.symbol,
        quantity: h.quantity,
        marketValue: h.marketValue
      })),
      totalValue: investorTwin.totalPortfolioValue
    }).catch(() => {
      logger.warn('Portfolio sync failed', { investorId });
    });

    logger.info('Investor Twin portfolio updated', { twinId: investorTwin.twinId, investorId });

    return {
      twinId: investorTwin.twinId,
      investorId,
      portfolioAllocations: investorTwin.portfolioAllocations,
      sectorAllocations: investorTwin.sectorAllocations,
      updatedAt: investorTwin.updatedAt.toISOString()
    };
  }

  /**
   * Update Holdings
   */
  async updateHoldings(
    investorId: string,
    request: UpdateHoldingsRequest
  ): Promise<UpdateHoldingsResponse> {
    logger.info('Updating Investor Twin holdings', { investorId });

    const investorTwin = await InvestorTwin.findByInvestorId(investorId);
    if (!investorTwin) {
      throw new Error(`Investor Twin not found for investorId: ${investorId}`);
    }

    // Calculate total portfolio value and update weights
    let totalValue = investorTwin.cashBalance;
    request.holdings.forEach((h: Holdings) => {
      h.marketValue = h.quantity * h.currentPrice;
      h.unrealizedPL = (h.currentPrice - h.averageCost) * h.quantity;
      h.unrealizedPLPercent = h.averageCost > 0 ? ((h.currentPrice - h.averageCost) / h.averageCost) * 100 : 0;
      totalValue += h.marketValue;
    });

    // Update weights
    request.holdings.forEach((h: Holdings) => {
      h.weight = totalValue > 0 ? (h.marketValue / totalValue) * 100 : 0;
    });

    investorTwin.holdings = request.holdings;
    investorTwin.totalPortfolioValue = totalValue;
    investorTwin.lastUpdated = new Date().toISOString();
    await investorTwin.save();

    // Publish holdings update event
    await messageBroker.publish('investor.twin.holdings.updated', {
      twinId: investorTwin.twinId,
      investorId,
      holdingsCount: request.holdings.length,
      totalValue,
      timestamp: new Date().toISOString()
    });

    // Sync with Trading and Portfolio services
    await Promise.all([
      tradingClient.getPositions(investorId).catch(() => {
        logger.warn('Could not sync positions with trading service', { investorId });
      }),
      portfolioClient.syncPortfolio({
        investorId,
        holdings: request.holdings.map((h: Holdings) => ({
          symbol: h.symbol,
          quantity: h.quantity,
          marketValue: h.marketValue
        })),
        totalValue
      }).catch(() => {
        logger.warn('Portfolio sync failed', { investorId });
      })
    ]);

    logger.info('Investor Twin holdings updated', { twinId: investorTwin.twinId, investorId });

    return {
      twinId: investorTwin.twinId,
      investorId,
      holdings: investorTwin.holdings,
      totalPortfolioValue: investorTwin.totalPortfolioValue,
      updatedAt: investorTwin.updatedAt.toISOString()
    };
  }

  /**
   * Add Transaction
   */
  async addTransaction(
    investorId: string,
    request: AddTransactionRequest
  ): Promise<AddTransactionResponse> {
    logger.info('Adding transaction to Investor Twin', { investorId });

    const investorTwin = await InvestorTwin.findByInvestorId(investorId);
    if (!investorTwin) {
      throw new Error(`Investor Twin not found for investorId: ${investorId}`);
    }

    const transaction = {
      ...request.transaction,
      id: uuidv4()
    };

    investorTwin.transactions.push(transaction);

    // Update cash balance based on transaction type
    switch (transaction.type) {
      case 'buy':
        investorTwin.totalInvested += transaction.amount;
        break;
      case 'sell':
        investorTwin.totalReturns += transaction.amount - (transaction.fees || 0);
        break;
      case 'deposit':
        investorTwin.cashBalance += transaction.amount;
        break;
      case 'withdrawal':
        investorTwin.cashBalance -= transaction.amount;
        break;
      case 'dividend':
      case 'interest':
        investorTwin.cashBalance += transaction.amount - (transaction.fees || 0);
        break;
    }

    // Recalculate returns percentage
    if (investorTwin.totalInvested > 0) {
      investorTwin.returnsPercent = (investorTwin.totalReturns / investorTwin.totalInvested) * 100;
    }

    investorTwin.lastUpdated = new Date().toISOString();
    await investorTwin.save();

    // Publish transaction event
    await messageBroker.publish('investor.twin.transaction.added', {
      twinId: investorTwin.twinId,
      investorId,
      transaction,
      timestamp: new Date().toISOString()
    });

    // Notify Dashboard
    await rezDashboardClient.notifyInvestorUpdate(investorId, 'transaction', {
      transactionId: transaction.id,
      type: transaction.type
    });

    logger.info('Transaction added to Investor Twin', { twinId: investorTwin.twinId, investorId, transactionId: transaction.id });

    return {
      twinId: investorTwin.twinId,
      investorId,
      transaction,
      updatedAt: investorTwin.updatedAt.toISOString()
    };
  }

  /**
   * Update Metrics
   */
  async updateMetrics(
    investorId: string,
    request: UpdateMetricsRequest
  ): Promise<UpdateMetricsResponse> {
    logger.info('Updating Investor Twin metrics', { investorId });

    const investorTwin = await InvestorTwin.findByInvestorId(investorId);
    if (!investorTwin) {
      throw new Error(`Investor Twin not found for investorId: ${investorId}`);
    }

    if (request.currentMetrics) {
      investorTwin.currentMetrics = {
        ...investorTwin.currentMetrics,
        ...request.currentMetrics
      };
    }
    if (request.totalPortfolioValue !== undefined) {
      investorTwin.totalPortfolioValue = request.totalPortfolioValue;
    }
    if (request.cashBalance !== undefined) {
      investorTwin.cashBalance = request.cashBalance;
    }
    if (request.totalInvested !== undefined) {
      investorTwin.totalInvested = request.totalInvested;
    }
    if (request.totalReturns !== undefined) {
      investorTwin.totalReturns = request.totalReturns;
    }
    if (request.returnsPercent !== undefined) {
      investorTwin.returnsPercent = request.returnsPercent;
    }

    investorTwin.lastUpdated = new Date().toISOString();
    await investorTwin.save();

    // Publish metrics update event
    await messageBroker.publish('investor.twin.metrics.updated', {
      twinId: investorTwin.twinId,
      investorId,
      metrics: investorTwin.currentMetrics,
      totalPortfolioValue: investorTwin.totalPortfolioValue,
      timestamp: new Date().toISOString()
    });

    // Push metrics to Dashboard
    await rezDashboardClient.pushMetricsUpdate(investorId, {
      totalPortfolioValue: investorTwin.totalPortfolioValue,
      returnsPercent: investorTwin.returnsPercent,
      metrics: investorTwin.currentMetrics
    }).catch(() => {
      logger.warn('Failed to push metrics to dashboard', { investorId });
    });

    logger.info('Investor Twin metrics updated', { twinId: investorTwin.twinId, investorId });

    return {
      twinId: investorTwin.twinId,
      investorId,
      currentMetrics: investorTwin.currentMetrics,
      totalPortfolioValue: investorTwin.totalPortfolioValue,
      updatedAt: investorTwin.updatedAt.toISOString()
    };
  }

  /**
   * Add to Watchlist
   */
  async addToWatchlist(
    investorId: string,
    request: AddToWatchlistRequest
  ): Promise<AddToWatchlistResponse> {
    logger.info('Adding to Investor Twin watchlist', { investorId, symbol: request.symbol });

    const investorTwin = await InvestorTwin.findByInvestorId(investorId);
    if (!investorTwin) {
      throw new Error(`Investor Twin not found for investorId: ${investorId}`);
    }

    // Check if already in watchlist
    const existingIndex = investorTwin.watchlist.findIndex((w: Watchlist) => w.symbol === request.symbol);
    if (existingIndex >= 0) {
      throw new Error(`Symbol ${request.symbol} already in watchlist`);
    }

    const watchlistItem = {
      symbol: request.symbol,
      name: request.name,
      addedAt: new Date().toISOString(),
      targetPrice: request.targetPrice,
      notes: request.notes
    };

    investorTwin.watchlist.push(watchlistItem);
    investorTwin.lastUpdated = new Date().toISOString();
    await investorTwin.save();

    // Publish watchlist update event
    await messageBroker.publish('investor.twin.watchlist.added', {
      twinId: investorTwin.twinId,
      investorId,
      symbol: request.symbol,
      timestamp: new Date().toISOString()
    });

    logger.info('Symbol added to watchlist', { twinId: investorTwin.twinId, investorId, symbol: request.symbol });

    return {
      twinId: investorTwin.twinId,
      investorId,
      watchlist: investorTwin.watchlist,
      updatedAt: investorTwin.updatedAt.toISOString()
    };
  }

  /**
   * Remove from Watchlist
   */
  async removeFromWatchlist(
    investorId: string,
    request: RemoveFromWatchlistRequest
  ): Promise<RemoveFromWatchlistResponse> {
    logger.info('Removing from Investor Twin watchlist', { investorId, symbol: request.symbol });

    const investorTwin = await InvestorTwin.findByInvestorId(investorId);
    if (!investorTwin) {
      throw new Error(`Investor Twin not found for investorId: ${investorId}`);
    }

    const index = investorTwin.watchlist.findIndex((w: Watchlist) => w.symbol === request.symbol);
    if (index < 0) {
      throw new Error(`Symbol ${request.symbol} not found in watchlist`);
    }

    investorTwin.watchlist.splice(index, 1);
    investorTwin.lastUpdated = new Date().toISOString();
    await investorTwin.save();

    // Publish watchlist update event
    await messageBroker.publish('investor.twin.watchlist.removed', {
      twinId: investorTwin.twinId,
      investorId,
      symbol: request.symbol,
      timestamp: new Date().toISOString()
    });

    logger.info('Symbol removed from watchlist', { twinId: investorTwin.twinId, investorId, symbol: request.symbol });

    return {
      twinId: investorTwin.twinId,
      investorId,
      watchlist: investorTwin.watchlist,
      updatedAt: investorTwin.updatedAt.toISOString()
    };
  }

  /**
   * Update Preferences
   */
  async updatePreferences(
    investorId: string,
    request: UpdatePreferencesRequest
  ): Promise<UpdatePreferencesResponse> {
    logger.info('Updating Investor Twin preferences', { investorId });

    const investorTwin = await InvestorTwin.findByInvestorId(investorId);
    if (!investorTwin) {
      throw new Error(`Investor Twin not found for investorId: ${investorId}`);
    }

    investorTwin.preferences = {
      ...investorTwin.preferences,
      ...request.preferences
    };
    investorTwin.lastUpdated = new Date().toISOString();
    await investorTwin.save();

    // Publish preferences update event
    await messageBroker.publish('investor.twin.preferences.updated', {
      twinId: investorTwin.twinId,
      investorId,
      preferences: investorTwin.preferences,
      timestamp: new Date().toISOString()
    });

    logger.info('Investor Twin preferences updated', { twinId: investorTwin.twinId, investorId });

    return {
      twinId: investorTwin.twinId,
      investorId,
      preferences: investorTwin.preferences,
      updatedAt: investorTwin.updatedAt.toISOString()
    };
  }

  /**
   * List Investors
   */
  async listInvestors(request: ListInvestorsRequest): Promise<ListInvestorsResponse> {
    logger.info('Listing Investor Twins', { request });

    const limit = request.limit || 20;
    const offset = request.offset || 0;

    let query: Record<string, unknown> = {};
    if (request.type) {
      query.type = request.type;
    }
    if (request.status) {
      query.status = request.status;
    }
    if (request.riskTolerance) {
      query['riskProfile.riskTolerance'] = request.riskTolerance;
    }
    if (request.minValue !== undefined) {
      query.totalPortfolioValue = { ...((query.totalPortfolioValue as object) || {}), $gte: request.minValue };
    }
    if (request.maxValue !== undefined) {
      query.totalPortfolioValue = { ...((query.totalPortfolioValue as object) || {}), $lte: request.maxValue };
    }

    const [investors, total] = await Promise.all([
      InvestorTwin.find(query).skip(offset).limit(limit).sort({ name: 1 }),
      InvestorTwin.countDocuments(query)
    ]);

    return {
      investors: investors.map(i => i.toJSON() as any),
      total,
      limit,
      offset
    };
  }

  /**
   * Delete Investor Twin
   */
  async deleteInvestorTwin(investorId: string): Promise<void> {
    logger.info('Deleting Investor Twin', { investorId });

    const result = await InvestorTwin.deleteOne({ investorId });
    if (result.deletedCount === 0) {
      throw new Error(`Investor Twin not found for investorId: ${investorId}`);
    }

    // Publish deletion event
    await messageBroker.publish('investor.twin.deleted', {
      investorId,
      timestamp: new Date().toISOString()
    });

    logger.info('Investor Twin deleted', { investorId });
  }

  /**
   * Refresh Market Data for Holdings
   */
  async refreshMarketData(investorId: string): Promise<UpdateHoldingsResponse> {
    logger.info('Refreshing market data for Investor Twin', { investorId });

    const investorTwin = await InvestorTwin.findByInvestorId(investorId);
    if (!investorTwin) {
      throw new Error(`Investor Twin not found for investorId: ${investorId}`);
    }

    const symbols = investorTwin.holdings.map((h: Holdings) => h.symbol);
    if (symbols.length === 0) {
      return {
        twinId: investorTwin.twinId,
        investorId,
        holdings: investorTwin.holdings,
        totalPortfolioValue: investorTwin.totalPortfolioValue,
        updatedAt: new Date().toISOString()
      };
    }

    // Get current quotes
    const quotes = await marketDataClient.getQuotes(symbols).catch(() => {
      logger.warn('Failed to fetch market quotes', { investorId });
      return [];
    });

    const quoteMap = new Map(quotes.map(q => [q.symbol, q]));

    // Update holdings with current prices
    let totalValue = investorTwin.cashBalance;
    investorTwin.holdings.forEach((h: Holdings) => {
      const quote = quoteMap.get(h.symbol);
      if (quote) {
        h.currentPrice = quote.price;
        h.dayChange = quote.change;
        h.dayChangePercent = quote.changePercent;
        h.marketValue = h.quantity * quote.price;
        h.unrealizedPL = (h.currentPrice - h.averageCost) * h.quantity;
        h.unrealizedPLPercent = h.averageCost > 0 ? ((h.currentPrice - h.averageCost) / h.averageCost) * 100 : 0;
      }
      totalValue += h.marketValue;
    });

    // Update weights
    investorTwin.holdings.forEach((h: Holdings) => {
      h.weight = totalValue > 0 ? (h.marketValue / totalValue) * 100 : 0;
    });

    investorTwin.totalPortfolioValue = totalValue;

    // Recalculate total returns
    investorTwin.totalReturns = investorTwin.holdings.reduce((sum: number, h: Holdings) => sum + h.unrealizedPL, 0);
    if (investorTwin.totalInvested > 0) {
      investorTwin.returnsPercent = (investorTwin.totalReturns / investorTwin.totalInvested) * 100;
    }

    investorTwin.lastUpdated = new Date().toISOString();
    await investorTwin.save();

    // Publish market data refresh event
    await messageBroker.publish('investor.twin.market.refreshed', {
      twinId: investorTwin.twinId,
      investorId,
      holdingsCount: investorTwin.holdings.length,
      totalValue,
      timestamp: new Date().toISOString()
    });

    logger.info('Market data refreshed for Investor Twin', { twinId: investorTwin.twinId, investorId });

    return {
      twinId: investorTwin.twinId,
      investorId,
      holdings: investorTwin.holdings,
      totalPortfolioValue: investorTwin.totalPortfolioValue,
      updatedAt: investorTwin.updatedAt.toISOString()
    };
  }
}

// Export singleton instance
export const investorTwinService = new InvestorTwinService();
