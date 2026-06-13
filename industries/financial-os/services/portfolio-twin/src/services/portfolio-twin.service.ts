import { v4 as uuidv4 } from 'uuid';
import { PortfolioTwinModel, type IPortfolioTwin } from '../models/index.js';
import { getEventEmitter } from '../events/index.js';
import { logger } from '../utils/index.js';
import type {
  CreatePortfolioTwinRequest,
  UpdatePortfolioTwinRequest,
  AddHoldingRequest,
  UpdateHoldingRequest,
  RebalanceRequest,
  UpdatePerformanceRequest,
  UpdateRiskMetricsRequest,
} from '../schemas/index.js';

// ============================================================================
// PORTFOLIO TWIN QUERY INTERFACE
// ============================================================================

export interface PortfolioTwinQuery {
  page?: number;
  limit?: number;
  investor_id?: string;
  type?: string;
  status?: string;
}

// ============================================================================
// PORTFOLIO TWIN STATS INTERFACE
// ============================================================================

export interface PortfolioTwinStats {
  total_portfolios: number;
  total_value: number;
  total_aum: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  avg_ytd_return: number;
  avg_sharpe_ratio: number;
}

// ============================================================================
// PORTFOLIO TWIN SERVICE
// ============================================================================

export class PortfolioTwinService {
  private static instance: PortfolioTwinService;

  private constructor() {}

  static getInstance(): PortfolioTwinService {
    if (!PortfolioTwinService.instance) {
      PortfolioTwinService.instance = new PortfolioTwinService();
    }
    return PortfolioTwinService.instance;
  }

  /**
   * Create a new portfolio twin
   */
  async create(data: CreatePortfolioTwinRequest): Promise<IPortfolioTwin> {
    // Check if portfolio already exists
    const existing = await PortfolioTwinModel.findOne({ portfolio_id: data.portfolio_id });
    if (existing) {
      throw new Error(`Portfolio twin already exists: ${data.portfolio_id}`);
    }

    // Create the twin
    const twin_id = `twin.finance.portfolio.${data.portfolio_id}`;
    const portfolioTwin = new PortfolioTwinModel({
      ...data,
      twin_id,
      inception_date: new Date(data.inception_date),
      status: data.status || 'active',
      holdings: data.holdings || [],
      cash: data.cash || { available: 0, pending: 0, currency: 'USD' },
      performance: data.performance || {
        total_value: 0,
        total_cost: 0,
        total_gain_loss: 0,
        total_gain_loss_pct: 0,
        day_change: 0,
        day_change_pct: 0,
        mtd_return: 0,
        ytd_return: 0,
        '1yr_return': 0,
        '3yr_return': 0,
        '5yr_return': 0,
        since_inception: 0,
      },
      risk_metrics: data.risk_metrics || {
        volatility: 0,
        sharpe_ratio: 0,
        sortino_ratio: 0,
        max_drawdown: 0,
        var_95: 0,
        beta: 1,
        correlation_to_benchmark: 1,
      },
      allocation: data.allocation || {
        by_asset_class: { equity: 0, fixed_income: 0, cash: 100, alternatives: 0, real_estate: 0 },
        by_sector: {},
        by_geography: {},
        by_currency: { USD: 100 },
      },
      compliance: data.compliance || {
        concentration_limit: 10,
        largest_position_pct: 0,
        sector_concentration_pct: 0,
        compliant: true,
        violations: [],
      },
      benchmark: data.benchmark || { name: 'S&P 500', ytd_return: 0, tracking_error: 0 },
    });

    await portfolioTwin.save();

    // Emit event
    const emitter = getEventEmitter();
    emitter.emit('portfolio_twin.created', {
      twin_id,
      portfolio_id: data.portfolio_id,
      investor_id: data.investor_id,
      timestamp: new Date().toISOString(),
    });

    logger.info('Portfolio twin created', { twin_id, portfolio_id: data.portfolio_id });

    return portfolioTwin;
  }

  /**
   * Get portfolio twin by ID
   */
  async getById(portfolioId: string): Promise<IPortfolioTwin | null> {
    // Try to find by portfolio_id first
    let twin = await PortfolioTwinModel.findOne({ portfolio_id: portfolioId });

    // If not found and looks like a twin_id, try that
    if (!twin && portfolioId.startsWith('twin.finance.portfolio.')) {
      twin = await PortfolioTwinModel.findOne({ twin_id: portfolioId });
    }

    return twin;
  }

  /**
   * Get portfolio twin by twin_id
   */
  async getByTwinId(twinId: string): Promise<IPortfolioTwin | null> {
    return PortfolioTwinModel.findOne({ twin_id: twinId });
  }

  /**
   * List portfolio twins with pagination
   */
  async list(query: PortfolioTwinQuery): Promise<{
    twins: IPortfolioTwin[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.investor_id) filter.investor_id = query.investor_id;
    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;

    const [twins, total] = await Promise.all([
      PortfolioTwinModel.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
      PortfolioTwinModel.countDocuments(filter),
    ]);

    return { twins, total, page, limit };
  }

  /**
   * Update portfolio twin
   */
  async update(portfolioId: string, data: UpdatePortfolioTwinRequest): Promise<IPortfolioTwin | null> {
    const twin = await this.getById(portfolioId);
    if (!twin) return null;

    // Update fields
    if (data.name !== undefined) twin.name = data.name;
    if (data.type !== undefined) twin.type = data.type;
    if (data.strategy !== undefined) twin.strategy = data.strategy;
    if (data.status !== undefined) twin.status = data.status;
    if (data.holdings !== undefined) twin.holdings = data.holdings;
    if (data.cash !== undefined) twin.cash = data.cash;
    if (data.benchmark !== undefined) twin.benchmark = data.benchmark;

    // Recalculate derived fields
    this.recalculateDerivedFields(twin);

    await twin.save();

    // Emit event
    const emitter = getEventEmitter();
    emitter.emit('portfolio_twin.updated', {
      twin_id: twin.twin_id,
      portfolio_id: twin.portfolio_id,
      changes: Object.keys(data),
      timestamp: new Date().toISOString(),
    });

    logger.info('Portfolio twin updated', { twin_id: twin.twin_id });

    return twin;
  }

  /**
   * Add a holding to portfolio
   */
  async addHolding(portfolioId: string, holding: AddHoldingRequest): Promise<IPortfolioTwin | null> {
    const twin = await this.getById(portfolioId);
    if (!twin) return null;

    // Calculate weight and gain/loss
    const totalHoldingValue = twin.holdings.reduce((sum, h) => sum + h.current_value, 0) + holding.current_value;
    const weight = (holding.current_value / totalHoldingValue) * 100;
    const unrealized_gain_loss = holding.current_value - holding.cost_basis;
    const unrealized_gain_loss_pct = ((holding.current_value - holding.cost_basis) / holding.cost_basis) * 100;

    twin.holdings.push({
      ...holding,
      weight,
      unrealized_gain_loss,
      unrealized_gain_loss_pct,
    });

    // Recalculate
    this.recalculateDerivedFields(twin);
    await twin.save();

    // Emit event
    const emitter = getEventEmitter();
    emitter.emit('portfolio_twin.holding_added', {
      twin_id: twin.twin_id,
      portfolio_id: twin.portfolio_id,
      asset_id: holding.asset_id,
      timestamp: new Date().toISOString(),
    });

    return twin;
  }

  /**
   * Update a holding
   */
  async updateHolding(
    portfolioId: string,
    assetId: string,
    data: UpdateHoldingRequest
  ): Promise<IPortfolioTwin | null> {
    const twin = await this.getById(portfolioId);
    if (!twin) return null;

    const holdingIndex = twin.holdings.findIndex((h) => h.asset_id === assetId);
    if (holdingIndex === -1) return null;

    const holding = twin.holdings[holdingIndex];

    if (data.quantity !== undefined) holding.quantity = data.quantity;
    if (data.cost_basis !== undefined) holding.cost_basis = data.cost_basis;
    if (data.current_value !== undefined) {
      holding.current_value = data.current_value;
      holding.unrealized_gain_loss = holding.current_value - (holding.cost_basis * holding.quantity);
      holding.unrealized_gain_loss_pct = ((holding.current_value - holding.cost_basis) / holding.cost_basis) * 100;
    }

    // Recalculate weights
    this.recalculateWeights(twin);
    this.recalculateDerivedFields(twin);
    await twin.save();

    return twin;
  }

  /**
   * Remove a holding
   */
  async removeHolding(portfolioId: string, assetId: string): Promise<IPortfolioTwin | null> {
    const twin = await this.getById(portfolioId);
    if (!twin) return null;

    const initialLength = twin.holdings.length;
    twin.holdings = twin.holdings.filter((h) => h.asset_id !== assetId);

    if (twin.holdings.length === initialLength) return null;

    // Recalculate
    this.recalculateWeights(twin);
    this.recalculateDerivedFields(twin);
    await twin.save();

    // Emit event
    const emitter = getEventEmitter();
    emitter.emit('portfolio_twin.holding_removed', {
      twin_id: twin.twin_id,
      portfolio_id: twin.portfolio_id,
      asset_id: assetId,
      timestamp: new Date().toISOString(),
    });

    return twin;
  }

  /**
   * Rebalance portfolio
   */
  async rebalance(portfolioId: string, request: RebalanceRequest): Promise<IPortfolioTwin | null> {
    const twin = await this.getById(portfolioId);
    if (!twin) return null;

    const { target_allocation, threshold } = request;
    const currentAllocation = twin.allocation.by_asset_class;

    // Check if rebalancing is needed
    const deviations: Record<string, number> = {};
    let needsRebalancing = false;

    for (const [assetClass, target] of Object.entries(target_allocation)) {
      const current = currentAllocation[assetClass as keyof typeof currentAllocation] || 0;
      const deviation = Math.abs(current - target);
      deviations[assetClass] = deviation;
      if (deviation > threshold) {
        needsRebalancing = true;
      }
    }

    if (!needsRebalancing) {
      logger.info('Portfolio does not need rebalancing', { twin_id: twin.twin_id });
      return twin;
    }

    // Update target allocation
    twin.allocation.by_asset_class = target_allocation;

    // Emit rebalance recommendation event
    const emitter = getEventEmitter();
    emitter.emit('portfolio_twin.rebalance_recommended', {
      twin_id: twin.twin_id,
      portfolio_id: twin.portfolio_id,
      deviations,
      threshold,
      timestamp: new Date().toISOString(),
    });

    logger.info('Rebalance recommended', { twin_id: twin.twin_id, deviations });

    return twin;
  }

  /**
   * Update performance metrics
   */
  async updatePerformance(
    portfolioId: string,
    data: UpdatePerformanceRequest
  ): Promise<IPortfolioTwin | null> {
    const twin = await this.getById(portfolioId);
    if (!twin) return null;

    if (data.total_value !== undefined) twin.performance.total_value = data.total_value;
    if (data.day_change !== undefined) twin.performance.day_change = data.day_change;
    if (data.day_change_pct !== undefined) twin.performance.day_change_pct = data.day_change_pct;
    if (data.mtd_return !== undefined) twin.performance.mtd_return = data.mtd_return;
    if (data.ytd_return !== undefined) twin.performance.ytd_return = data.ytd_return;

    // Recalculate totals
    twin.performance.total_gain_loss = twin.performance.total_value - twin.performance.total_cost;
    twin.performance.total_gain_loss_pct =
      twin.performance.total_cost > 0
        ? ((twin.performance.total_value - twin.performance.total_cost) / twin.performance.total_cost) * 100
        : 0;

    await twin.save();

    // Emit event
    const emitter = getEventEmitter();
    emitter.emit('portfolio_twin.performance_updated', {
      twin_id: twin.twin_id,
      portfolio_id: twin.portfolio_id,
      total_value: twin.performance.total_value,
      timestamp: new Date().toISOString(),
    });

    return twin;
  }

  /**
   * Update risk metrics
   */
  async updateRiskMetrics(
    portfolioId: string,
    data: UpdateRiskMetricsRequest
  ): Promise<IPortfolioTwin | null> {
    const twin = await this.getById(portfolioId);
    if (!twin) return null;

    if (data.volatility !== undefined) twin.risk_metrics.volatility = data.volatility;
    if (data.sharpe_ratio !== undefined) twin.risk_metrics.sharpe_ratio = data.sharpe_ratio;
    if (data.sortino_ratio !== undefined) twin.risk_metrics.sortino_ratio = data.sortino_ratio;
    if (data.max_drawdown !== undefined) twin.risk_metrics.max_drawdown = data.max_drawdown;
    if (data.var_95 !== undefined) twin.risk_metrics.var_95 = data.var_95;
    if (data.beta !== undefined) twin.risk_metrics.beta = data.beta;
    if (data.correlation_to_benchmark !== undefined) {
      twin.risk_metrics.correlation_to_benchmark = data.correlation_to_benchmark;
    }

    await twin.save();

    return twin;
  }

  /**
   * Get portfolio statistics
   */
  async getStats(investorId?: string): Promise<PortfolioTwinStats> {
    const filter: Record<string, unknown> = {};
    if (investorId) filter.investor_id = investorId;

    const twins = await PortfolioTwinModel.find(filter);

    const stats: PortfolioTwinStats = {
      total_portfolios: twins.length,
      total_value: twins.reduce((sum, t) => sum + t.performance.total_value, 0),
      total_aum: twins.reduce((sum, t) => sum + t.performance.total_value, 0),
      by_type: {},
      by_status: {},
      avg_ytd_return: 0,
      avg_sharpe_ratio: 0,
    };

    for (const twin of twins) {
      stats.by_type[twin.type] = (stats.by_type[twin.type] || 0) + 1;
      stats.by_status[twin.status] = (stats.by_status[twin.status] || 0) + 1;
    }

    if (twins.length > 0) {
      stats.avg_ytd_return =
        twins.reduce((sum, t) => sum + t.performance.ytd_return, 0) / twins.length;
      stats.avg_sharpe_ratio =
        twins.reduce((sum, t) => sum + t.risk_metrics.sharpe_ratio, 0) / twins.length;
    }

    return stats;
  }

  /**
   * Delete portfolio twin
   */
  async delete(portfolioId: string): Promise<boolean> {
    const twin = await this.getById(portfolioId);
    if (!twin) return false;

    await PortfolioTwinModel.deleteOne({ portfolio_id: portfolioId });

    // Emit event
    const emitter = getEventEmitter();
    emitter.emit('portfolio_twin.deleted', {
      twin_id: twin.twin_id,
      portfolio_id: twin.portfolio_id,
      timestamp: new Date().toISOString(),
    });

    logger.info('Portfolio twin deleted', { twin_id: twin.twin_id });

    return true;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Recalculate weights for all holdings
   */
  private recalculateWeights(twin: IPortfolioTwin): void {
    const totalValue = twin.holdings.reduce((sum, h) => sum + h.current_value, 0);

    for (const holding of twin.holdings) {
      holding.weight = totalValue > 0 ? (holding.current_value / totalValue) * 100 : 0;
    }
  }

  /**
   * Recalculate all derived fields
   */
  private recalculateDerivedFields(twin: IPortfolioTwin): void {
    // Total value from holdings
    twin.performance.total_value =
      twin.holdings.reduce((sum, h) => sum + h.current_value, 0) + twin.cash.available + twin.cash.pending;

    // Total cost from holdings
    twin.performance.total_cost = twin.holdings.reduce((sum, h) => sum + h.cost_basis * h.quantity, 0);

    // Gain/loss
    twin.performance.total_gain_loss = twin.performance.total_value - twin.performance.total_cost;
    twin.performance.total_gain_loss_pct =
      twin.performance.total_cost > 0
        ? ((twin.performance.total_value - twin.performance.total_cost) / twin.performance.total_cost) * 100
        : 0;

    // Check compliance
    this.checkCompliance(twin);
  }

  /**
   * Check compliance rules
   */
  private checkCompliance(twin: IPortfolioTwin): void {
    const violations: string[] = [];

    // Check largest position
    const largestHolding = twin.holdings.reduce(
      (largest, h) => (h.weight > largest ? h.weight : largest),
      0
    );
    twin.compliance.largest_position_pct = largestHolding;

    if (largestHolding > twin.compliance.concentration_limit) {
      violations.push(`Largest position (${largestHolding.toFixed(2)}%) exceeds limit`);
    }

    twin.compliance.violations = violations;
    twin.compliance.compliant = violations.length === 0;
  }
}

// ============================================================================
// SERVICE EXPORT
// ============================================================================

export const portfolioTwinService = PortfolioTwinService.getInstance();
