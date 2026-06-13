import { PortfolioTwinModel, InvestorTwinModel, type IPortfolioTwin, type IInvestorTwin } from '../models/index.js';
import { getEventEmitter } from '../events/index.js';
import { logger } from '../utils/index.js';
import type {
  CreateInvestorTwinRequest,
  UpdateInvestorTwinRequest,
  LinkAccountRequest,
} from '../schemas/index.js';

// ============================================================================
// INVESTOR TWIN QUERY INTERFACE
// ============================================================================

export interface InvestorTwinQuery {
  page?: number;
  limit?: number;
  investor_type?: string;
  risk_rating?: string;
}

// ============================================================================
// INVESTOR TWIN STATS INTERFACE
// ============================================================================

export interface InvestorTwinStats {
  total_investors: number;
  by_type: Record<string, number>;
  by_kyc_status: Record<string, number>;
  by_risk_rating: Record<string, number>;
  avg_net_worth: number;
  total_aum: number;
}

// ============================================================================
// INVESTOR TWIN SERVICE
// ============================================================================

export class InvestorTwinService {
  private static instance: InvestorTwinService;

  private constructor() {}

  static getInstance(): InvestorTwinService {
    if (!InvestorTwinService.instance) {
      InvestorTwinService.instance = new InvestorTwinService();
    }
    return InvestorTwinService.instance;
  }

  /**
   * Create a new investor twin
   */
  async create(data: CreateInvestorTwinRequest): Promise<IInvestorTwin> {
    // Check if investor already exists
    const existing = await InvestorTwinModel.findOne({ investor_id: data.investor_id });
    if (existing) {
      throw new Error(`Investor twin already exists: ${data.investor_id}`);
    }

    // Create the twin
    const twin_id = `twin.finance.investor.${data.investor_id}`;
    const investorTwin = new InvestorTwinModel({
      ...data,
      twin_id,
      kyc: data.kyc || {
        status: 'pending',
        risk_rating: 'moderate',
        aml_check: 'pending',
      },
      preferences: data.preferences || {
        investment_goals: [],
        risk_tolerance: 'moderate',
        time_horizon: 'medium_term',
        liquidity_needs: 'medium',
        ethical_screening: [],
        preferred_asset_classes: [],
        geographic_focus: [],
      },
      financial_profile: data.financial_profile || {
        net_worth: 0,
        liquid_net_worth: 0,
        annual_income: 0,
        investment_capacity: 0,
        debt_obligations: 0,
      },
      portfolios: data.portfolios || [],
      connected_accounts: data.connected_accounts || [],
      activity: data.activity || {
        last_login: undefined,
        last_trade: undefined,
        total_trades: 0,
        avg_session_duration: 0,
      },
      permissions: data.permissions || {
        can_trade: true,
        can_leverage: false,
        can_short: false,
        max_position_size: 100000,
        allowed_strategies: [],
      },
    });

    await investorTwin.save();

    // Emit event
    const emitter = getEventEmitter();
    emitter.emit('investor_twin.created', {
      twin_id,
      investor_id: data.investor_id,
      timestamp: new Date().toISOString(),
    });

    logger.info('Investor twin created', { twin_id, investor_id: data.investor_id });

    return investorTwin;
  }

  /**
   * Get investor twin by ID
   */
  async getById(investorId: string): Promise<IInvestorTwin | null> {
    // Try to find by investor_id first
    let twin = await InvestorTwinModel.findOne({ investor_id: investorId });

    // If not found and looks like a twin_id, try that
    if (!twin && investorId.startsWith('twin.finance.investor.')) {
      twin = await InvestorTwinModel.findOne({ twin_id: investorId });
    }

    return twin;
  }

  /**
   * Get investor twin by twin_id
   */
  async getByTwinId(twinId: string): Promise<IInvestorTwin | null> {
    return InvestorTwinModel.findOne({ twin_id: twinId });
  }

  /**
   * List investor twins with pagination
   */
  async list(query: InvestorTwinQuery): Promise<{
    twins: IInvestorTwin[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.investor_type) filter['profile.investor_type'] = query.investor_type;
    if (query.risk_rating) filter['kyc.risk_rating'] = query.risk_rating;

    const [twins, total] = await Promise.all([
      InvestorTwinModel.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
      InvestorTwinModel.countDocuments(filter),
    ]);

    return { twins, total, page, limit };
  }

  /**
   * Update investor twin
   */
  async update(investorId: string, data: UpdateInvestorTwinRequest): Promise<IInvestorTwin | null> {
    const twin = await this.getById(investorId);
    if (!twin) return null;

    // Update nested objects
    if (data.profile) {
      twin.profile = { ...twin.profile, ...data.profile };
    }
    if (data.kyc) {
      twin.kyc = { ...twin.kyc, ...data.kyc };
    }
    if (data.preferences) {
      twin.preferences = { ...twin.preferences, ...data.preferences };
    }
    if (data.financial_profile) {
      twin.financial_profile = { ...twin.financial_profile, ...data.financial_profile };
    }
    if (data.permissions) {
      twin.permissions = { ...twin.permissions, ...data.permissions };
    }

    await twin.save();

    // Emit event
    const emitter = getEventEmitter();
    emitter.emit('investor_twin.updated', {
      twin_id: twin.twin_id,
      investor_id: twin.investor_id,
      changes: Object.keys(data),
      timestamp: new Date().toISOString(),
    });

    logger.info('Investor twin updated', { twin_id: twin.twin_id });

    return twin;
  }

  /**
   * Link account to investor
   */
  async linkAccount(investorId: string, account: LinkAccountRequest): Promise<IInvestorTwin | null> {
    const twin = await this.getById(investorId);
    if (!twin) return null;

    // Check if account already linked
    const existingAccount = twin.connected_accounts.find((a) => a.account_id === account.account_id);
    if (existingAccount) {
      throw new Error(`Account already linked: ${account.account_id}`);
    }

    twin.connected_accounts.push({
      ...account,
      last_synced: new Date(),
    });

    await twin.save();

    // Emit event
    const emitter = getEventEmitter();
    emitter.emit('investor_twin.account_linked', {
      twin_id: twin.twin_id,
      investor_id: twin.investor_id,
      account_id: account.account_id,
      timestamp: new Date().toISOString(),
    });

    return twin;
  }

  /**
   * Unlink account from investor
   */
  async unlinkAccount(investorId: string, accountId: string): Promise<IInvestorTwin | null> {
    const twin = await this.getById(investorId);
    if (!twin) return null;

    const initialLength = twin.connected_accounts.length;
    twin.connected_accounts = twin.connected_accounts.filter((a) => a.account_id !== accountId);

    if (twin.connected_accounts.length === initialLength) return null;

    await twin.save();

    // Emit event
    const emitter = getEventEmitter();
    emitter.emit('investor_twin.account_unlinked', {
      twin_id: twin.twin_id,
      investor_id: twin.investor_id,
      account_id: accountId,
      timestamp: new Date().toISOString(),
    });

    return twin;
  }

  /**
   * Add portfolio to investor
   */
  async addPortfolio(investorId: string, portfolioId: string): Promise<IInvestorTwin | null> {
    const twin = await this.getById(investorId);
    if (!twin) return null;

    if (!twin.portfolios.includes(portfolioId)) {
      twin.portfolios.push(portfolioId);
      await twin.save();
    }

    return twin;
  }

  /**
   * Remove portfolio from investor
   */
  async removePortfolio(investorId: string, portfolioId: string): Promise<IInvestorTwin | null> {
    const twin = await this.getById(investorId);
    if (!twin) return null;

    twin.portfolios = twin.portfolios.filter((p) => p !== portfolioId);
    await twin.save();

    return twin;
  }

  /**
   * Update investor preferences
   */
  async updatePreferences(
    investorId: string,
    preferences: UpdateInvestorTwinRequest['preferences'],
    merge: boolean = true
  ): Promise<IInvestorTwin | null> {
    const twin = await this.getById(investorId);
    if (!twin) return null;

    if (merge) {
      twin.preferences = { ...twin.preferences, ...preferences };
    } else {
      twin.preferences = preferences || twin.preferences;
    }

    await twin.save();

    return twin;
  }

  /**
   * Update KYC status
   */
  async updateKYC(
    investorId: string,
    kycData: { status?: string; risk_rating?: string; aml_check?: string }
  ): Promise<IInvestorTwin | null> {
    const twin = await this.getById(investorId);
    if (!twin) return null;

    if (kycData.status) twin.kyc.status = kycData.status as IInvestorTwin['kyc']['status'];
    if (kycData.risk_rating) twin.kyc.risk_rating = kycData.risk_rating as IInvestorTwin['kyc']['risk_rating'];
    if (kycData.aml_check) twin.kyc.aml_check = kycData.aml_check as IInvestorTwin['kyc']['aml_check'];

    if (kycData.status === 'verified' && !twin.kyc.verification_date) {
      twin.kyc.verification_date = new Date();
    }

    await twin.save();

    // Emit event
    const emitter = getEventEmitter();
    emitter.emit('investor_twin.kyc_updated', {
      twin_id: twin.twin_id,
      investor_id: twin.investor_id,
      status: twin.kyc.status,
      timestamp: new Date().toISOString(),
    });

    return twin;
  }

  /**
   * Record investor activity
   */
  async recordActivity(
    investorId: string,
    activity: { last_login?: Date; last_trade?: Date; total_trades?: number }
  ): Promise<IInvestorTwin | null> {
    const twin = await this.getById(investorId);
    if (!twin) return null;

    if (activity.last_login) twin.activity.last_login = activity.last_login;
    if (activity.last_trade) twin.activity.last_trade = activity.last_trade;
    if (activity.total_trades !== undefined) twin.activity.total_trades = activity.total_trades;

    await twin.save();

    return twin;
  }

  /**
   * Get investor statistics
   */
  async getStats(): Promise<InvestorTwinStats> {
    const twins = await InvestorTwinModel.find({});

    // Get portfolio data for AUM calculation
    const portfolioIds = twins.flatMap((t) => t.portfolios);
    const portfolios = await PortfolioTwinModel.find({ portfolio_id: { $in: portfolioIds } });
    const totalAum = portfolios.reduce((sum, p) => sum + p.performance.total_value, 0);

    const stats: InvestorTwinStats = {
      total_investors: twins.length,
      by_type: {},
      by_kyc_status: {},
      by_risk_rating: {},
      avg_net_worth: 0,
      total_aum: totalAum,
    };

    let totalNetWorth = 0;

    for (const twin of twins) {
      const investorType = twin.profile.investor_type;
      stats.by_type[investorType] = (stats.by_type[investorType] || 0) + 1;
      stats.by_kyc_status[twin.kyc.status] = (stats.by_kyc_status[twin.kyc.status] || 0) + 1;
      stats.by_risk_rating[twin.kyc.risk_rating] = (stats.by_risk_rating[twin.kyc.risk_rating] || 0) + 1;
      totalNetWorth += twin.financial_profile.net_worth;
    }

    if (twins.length > 0) {
      stats.avg_net_worth = totalNetWorth / twins.length;
    }

    return stats;
  }

  /**
   * Delete investor twin
   */
  async delete(investorId: string): Promise<boolean> {
    const twin = await this.getById(investorId);
    if (!twin) return false;

    await InvestorTwinModel.deleteOne({ investor_id: investorId });

    // Emit event
    const emitter = getEventEmitter();
    emitter.emit('investor_twin.deleted', {
      twin_id: twin.twin_id,
      investor_id: twin.investor_id,
      timestamp: new Date().toISOString(),
    });

    logger.info('Investor twin deleted', { twin_id: twin.twin_id });

    return true;
  }
}

// ============================================================================
// SERVICE EXPORT
// ============================================================================

export const investorTwinService = InvestorTwinService.getInstance();
