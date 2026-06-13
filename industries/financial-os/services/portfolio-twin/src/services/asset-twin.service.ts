import { AssetTwinModel, type IAssetTwin } from '../models/index.js';
import { getEventEmitter } from '../events/index.js';
import { logger } from '../utils/index.js';
import type {
  CreateAssetTwinRequest,
  UpdateAssetTwinRequest,
  UpdatePricingRequest,
  AddNewsRequest,
} from '../schemas/index.js';

// ============================================================================
// ASSET TWIN QUERY INTERFACE
// ============================================================================

export interface AssetTwinQuery {
  page?: number;
  limit?: number;
  ticker?: string;
  asset_class?: string;
  trend?: string;
}

// ============================================================================
// ASSET TWIN STATS INTERFACE
// ============================================================================

export interface AssetTwinStats {
  total_assets: number;
  by_class: Record<string, number>;
  by_trend: Record<string, number>;
  avg_pe_ratio: number;
  avg_rsi: number;
}

// ============================================================================
// ASSET TWIN SERVICE
// ============================================================================

export class AssetTwinService {
  private static instance: AssetTwinService;

  private constructor() {}

  static getInstance(): AssetTwinService {
    if (!AssetTwinService.instance) {
      AssetTwinService.instance = new AssetTwinService();
    }
    return AssetTwinService.instance;
  }

  /**
   * Create a new asset twin
   */
  async create(data: CreateAssetTwinRequest): Promise<IAssetTwin> {
    // Check if asset already exists
    const existing = await AssetTwinModel.findOne({ asset_id: data.asset_id });
    if (existing) {
      throw new Error(`Asset twin already exists: ${data.asset_id}`);
    }

    // Create the twin
    const twin_id = `twin.finance.asset.${data.asset_id}`;
    const assetTwin = new AssetTwinModel({
      ...data,
      twin_id,
      pricing: data.pricing || {
        last_price: 0,
        bid: 0,
        ask: 0,
        bid_size: 0,
        ask_size: 0,
        volume: 0,
        avg_volume_30d: 0,
        updated_at: new Date(),
      },
      fundamentals: data.fundamentals || {
        market_cap: 0,
        enterprise_value: 0,
        pe_ratio: 0,
        forward_pe: 0,
        peg_ratio: 0,
        pb_ratio: 0,
        ps_ratio: 0,
        dividend_yield: 0,
        dividend_amount: 0,
        beta: 1,
        revenue: 0,
        ebitda: 0,
        eps: 0,
        eps_growth: 0,
      },
      technical: data.technical || {
        sma_50: 0,
        sma_200: 0,
        w52_high: 0,
        w52_low: 0,
        rsi_14: 50,
        macd: 'neutral',
        trend: 'neutral',
      },
      ownership: data.ownership || {
        institutions_pct: 0,
        insiders_pct: 0,
        public_float_pct: 100,
        top_holders: [],
      },
      islamic_compliance: data.islamic_compliance || {
        screened: false,
        compliance_status: 'review',
        debt_ratio: 0,
        interest_income_pct: 0,
        cash_flow_operations: [],
      },
      news: data.news || [],
    });

    await assetTwin.save();

    // Emit event
    const emitter = getEventEmitter();
    emitter.emit('asset_twin.created', {
      twin_id,
      asset_id: data.asset_id,
      ticker: data.profile.ticker,
      timestamp: new Date().toISOString(),
    });

    logger.info('Asset twin created', { twin_id, asset_id: data.asset_id });

    return assetTwin;
  }

  /**
   * Get asset twin by ID
   */
  async getById(assetId: string): Promise<IAssetTwin | null> {
    // Try to find by asset_id first
    let twin = await AssetTwinModel.findOne({ asset_id: assetId });

    // If not found and looks like a twin_id, try that
    if (!twin && assetId.startsWith('twin.finance.asset.')) {
      twin = await AssetTwinModel.findOne({ twin_id: assetId });
    }

    // If still not found, try by ticker
    if (!twin) {
      twin = await AssetTwinModel.findOne({ 'profile.ticker': assetId.toUpperCase() });
    }

    return twin;
  }

  /**
   * Get asset twin by twin_id
   */
  async getByTwinId(twinId: string): Promise<IAssetTwin | null> {
    return AssetTwinModel.findOne({ twin_id: twinId });
  }

  /**
   * Get asset twin by ticker
   */
  async getByTicker(ticker: string): Promise<IAssetTwin | null> {
    return AssetTwinModel.findOne({ 'profile.ticker': ticker.toUpperCase() });
  }

  /**
   * List asset twins with pagination
   */
  async list(query: AssetTwinQuery): Promise<{
    twins: IAssetTwin[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.ticker) filter['profile.ticker'] = new RegExp(query.ticker, 'i');
    if (query.asset_class) filter['profile.asset_class'] = query.asset_class;
    if (query.trend) filter['technical.trend'] = query.trend;

    const [twins, total] = await Promise.all([
      AssetTwinModel.find(filter).sort({ 'pricing.last_price': -1 }).skip(skip).limit(limit),
      AssetTwinModel.countDocuments(filter),
    ]);

    return { twins, total, page, limit };
  }

  /**
   * Update asset twin
   */
  async update(assetId: string, data: UpdateAssetTwinRequest): Promise<IAssetTwin | null> {
    const twin = await this.getById(assetId);
    if (!twin) return null;

    // Update nested objects
    if (data.profile) {
      twin.profile = { ...twin.profile, ...data.profile };
    }
    if (data.pricing) {
      twin.pricing = { ...twin.pricing, ...data.pricing, updated_at: new Date() };
    }
    if (data.fundamentals) {
      twin.fundamentals = { ...twin.fundamentals, ...data.fundamentals };
    }
    if (data.technical) {
      twin.technical = { ...twin.technical, ...data.technical };
    }
    if (data.ownership) {
      twin.ownership = { ...twin.ownership, ...data.ownership };
    }
    if (data.islamic_compliance) {
      twin.islamic_compliance = { ...twin.islamic_compliance, ...data.islamic_compliance };
    }

    await twin.save();

    // Emit event
    const emitter = getEventEmitter();
    emitter.emit('asset_twin.updated', {
      twin_id: twin.twin_id,
      asset_id: twin.asset_id,
      ticker: twin.profile.ticker,
      changes: Object.keys(data),
      timestamp: new Date().toISOString(),
    });

    logger.info('Asset twin updated', { twin_id: twin.twin_id });

    return twin;
  }

  /**
   * Update pricing
   */
  async updatePricing(assetId: string, pricing: UpdatePricingRequest): Promise<IAssetTwin | null> {
    const twin = await this.getById(assetId);
    if (!twin) return null;

    twin.pricing = {
      ...twin.pricing,
      ...pricing,
      updated_at: new Date(),
    };

    // Update technical indicators based on price change
    if (pricing.last_price !== undefined) {
      this.updateTechnicals(twin, pricing.last_price);
    }

    await twin.save();

    // Emit price update event
    const emitter = getEventEmitter();
    emitter.emit('asset_twin.price_update', {
      twin_id: twin.twin_id,
      asset_id: twin.asset_id,
      ticker: twin.profile.ticker,
      price: twin.pricing.last_price,
      timestamp: new Date().toISOString(),
    });

    return twin;
  }

  /**
   * Add news to asset
   */
  async addNews(assetId: string, news: AddNewsRequest): Promise<IAssetTwin | null> {
    const twin = await this.getById(assetId);
    if (!twin) return null;

    twin.news.unshift({
      ...news,
      published_at: new Date(),
    });

    // Keep only last 100 news items
    if (twin.news.length > 100) {
      twin.news = twin.news.slice(0, 100);
    }

    await twin.save();

    return twin;
  }

  /**
   * Get asset statistics
   */
  async getStats(): Promise<AssetTwinStats> {
    const twins = await AssetTwinModel.find({});

    const stats: AssetTwinStats = {
      total_assets: twins.length,
      by_class: {},
      by_trend: {},
      avg_pe_ratio: 0,
      avg_rsi: 0,
    };

    let totalPe = 0;
    let totalRsi = 0;
    let countWithPe = 0;
    let countWithRsi = 0;

    for (const twin of twins) {
      const assetClass = twin.profile.asset_class;
      stats.by_class[assetClass] = (stats.by_class[assetClass] || 0) + 1;
      stats.by_trend[twin.technical.trend] = (stats.by_trend[twin.technical.trend] || 0) + 1;

      if (twin.fundamentals.pe_ratio > 0) {
        totalPe += twin.fundamentals.pe_ratio;
        countWithPe++;
      }

      if (twin.technical.rsi_14 > 0) {
        totalRsi += twin.technical.rsi_14;
        countWithRsi++;
      }
    }

    if (countWithPe > 0) stats.avg_pe_ratio = totalPe / countWithPe;
    if (countWithRsi > 0) stats.avg_rsi = totalRsi / countWithRsi;

    return stats;
  }

  /**
   * Search assets by ticker pattern
   */
  async search(query: string, limit: number = 10): Promise<IAssetTwin[]> {
    return AssetTwinModel.find({
      'profile.ticker': new RegExp(query, 'i'),
    })
      .sort({ 'pricing.volume': -1 })
      .limit(limit);
  }

  /**
   * Get top performers by YTD return (requires external calculation)
   */
  async getTopPerformers(limit: number = 10): Promise<IAssetTwin[]> {
    // This would require external data - return by volume for now
    return AssetTwinModel.find({})
      .sort({ 'pricing.volume': -1 })
      .limit(limit);
  }

  /**
   * Get Islamic-compliant assets
   */
  async getIslamicCompliant(): Promise<IAssetTwin[]> {
    return AssetTwinModel.find({
      'islamic_compliance.screened': true,
      'islamic_compliance.compliance_status': 'compliant',
    });
  }

  /**
   * Delete asset twin
   */
  async delete(assetId: string): Promise<boolean> {
    const twin = await this.getById(assetId);
    if (!twin) return false;

    await AssetTwinModel.deleteOne({ asset_id: assetId });

    // Emit event
    const emitter = getEventEmitter();
    emitter.emit('asset_twin.deleted', {
      twin_id: twin.twin_id,
      asset_id: twin.asset_id,
      ticker: twin.profile.ticker,
      timestamp: new Date().toISOString(),
    });

    logger.info('Asset twin deleted', { twin_id: twin.twin_id });

    return true;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Update technical indicators based on price
   */
  private updateTechnicals(twin: IAssetTwin, newPrice: number): void {
    // Update 52-week high/low
    if (newPrice > twin.technical.w52_high) {
      twin.technical.w52_high = newPrice;
    }
    if (newPrice < twin.technical.w52_low || twin.technical.w52_low === 0) {
      twin.technical.w52_low = newPrice;
    }

    // Simple RSI update (placeholder - real implementation would use historical data)
    // This is a simplified version
    if (newPrice > twin.pricing.last_price) {
      twin.technical.rsi_14 = Math.min(100, twin.technical.rsi_14 + 5);
    } else if (newPrice < twin.pricing.last_price) {
      twin.technical.rsi_14 = Math.max(0, twin.technical.rsi_14 - 5);
    }

    // Update trend
    if (twin.technical.rsi_14 > 60) {
      twin.technical.trend = 'bullish';
    } else if (twin.technical.rsi_14 < 40) {
      twin.technical.trend = 'bearish';
    } else {
      twin.technical.trend = 'neutral';
    }

    // Update MACD signal (simplified)
    twin.technical.macd = newPrice > twin.technical.sma_50 ? 'bullish' : 'bearish';
  }
}

// ============================================================================
// SERVICE EXPORT
// ============================================================================

export const assetTwinService = AssetTwinService.getInstance();
