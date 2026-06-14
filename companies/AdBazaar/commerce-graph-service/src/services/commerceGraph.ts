/**
 * Commerce Graph Service
 *
 * Unified commerce intelligence connecting:
 * - Orders
 * - Products
 * - Merchants
 * - Categories
 * - User behavior
 * - Attribution
 *
 * Port: 4540
 */

import express, { Request, Response } from 'express';
import mongoose, { Schema, Document, model } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';

// ============================================================================
// MODELS
// ============================================================================

/**
 * Order with product and category data
 */
interface ICommerceOrder extends Document {
  orderId: string;
  userId: string;
  merchantId: string;
  merchantName: string;

  items: Array<{
    productId: string;
    productName: string;
    category: string;
    subcategory?: string;
    brand?: string;
    quantity: number;
    price: number;
    discount?: number;
  }>;

  total: number;
  discount: number;
  finalAmount: number;

  // Location
  city: string;
  area?: string;

  // Attribution
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;

  // Behavior
  isFirstOrder: boolean;
  repeatCustomer: boolean;
  orderHour: number;
  orderDay: number;

  // Ad exposure
  adImpressions: number;
  adClicks: number;
  adAttribution?: {
    campaignId: string;
    touchpointId: string;
    source: string;
  };

  createdAt: Date;
}

const commerceOrderSchema = new Schema<ICommerceOrder>({
  orderId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  merchantName: String,

  items: [{
    productId: String,
    productName: String,
    category: String,
    subcategory: String,
    brand: String,
    quantity: Number,
    price: Number,
    discount: Number,
  }],

  total: Number,
  discount: Number,
  finalAmount: Number,

  city: { type: String, index: true },
  area: String,

  utmSource: String,
  utmMedium: String,
  utmCampaign: String,

  isFirstOrder: Boolean,
  repeatCustomer: Boolean,
  orderHour: Number,
  orderDay: Number,

  adImpressions: { type: Number, default: 0 },
  adClicks: { type: Number, default: 0 },
  adAttribution: {
    campaignId: String,
    touchpointId: String,
    source: String,
  },

  createdAt: { type: Date, default: Date.now, index: true },
});

commerceOrderSchema.index({ merchantId: 1, createdAt: -1 });
commerceOrderSchema.index({ 'items.category': 1 });

const CommerceOrder = model<ICommerceOrder>('CommerceOrder', commerceOrderSchema);

/**
 * User commerce profile
 */
interface IUserProfile extends Document {
  userId: string;

  // Demographics
  city: string;
  avgOrderValue: number;
  totalOrders: number;
  totalSpend: number;

  // Behavior
  avgItemsPerOrder: number;
  repeatRate: number;
  avgDaysBetweenOrders: number;

  // Preferences
  topCategories: string[];
  topBrands: string[];
  topMerchants: string[];

  // Ad responsiveness
  adImpressions: number;
  adClicks: number;
  adConversionRate: number;

  // LTV
  predictedLTV: number;
  churnRisk: 'low' | 'medium' | 'high';

  updatedAt: Date;
}

const userProfileSchema = new Schema<IUserProfile>({
  userId: { type: String, required: true, unique: true, index: true },

  city: String,
  avgOrderValue: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  totalSpend: { type: Number, default: 0 },

  avgItemsPerOrder: { type: Number, default: 0 },
  repeatRate: { type: Number, default: 0 },
  avgDaysBetweenOrders: { type: Number, default: 0 },

  topCategories: [String],
  topBrands: [String],
  topMerchants: [String],

  adImpressions: { type: Number, default: 0 },
  adClicks: { type: Number, default: 0 },
  adConversionRate: { type: Number, default: 0 },

  predictedLTV: { type: Number, default: 0 },
  churnRisk: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },

  updatedAt: { type: Date, default: Date.now },
});

const UserProfile = model<IUserProfile>('UserProfile', userProfileSchema);

/**
 * Category intelligence
 */
interface ICategoryGraph extends Document {
  category: string;
  subcategories: string[];

  // Volume
  totalOrders: number;
  totalGMV: number;
  avgOrderValue: number;

  // Growth
  momGrowth: number;
  wowGrowth: number;

  // Ad performance
  avgCTR: number;
  avgConversionRate: number;
  roiBySource: Record<string, number>;

  // User overlap
  topUsers: string[];
  relatedCategories: Array<{ category: string; overlap: number }>;

  updatedAt: Date;
}

const categoryGraphSchema = new Schema<ICategoryGraph>({
  category: { type: String, required: true, unique: true, index: true },
  subcategories: [String],

  totalOrders: { type: Number, default: 0 },
  totalGMV: { type: Number, default: 0 },
  avgOrderValue: { type: Number, default: 0 },

  momGrowth: { type: Number, default: 0 },
  wowGrowth: { type: Number, default: 0 },

  avgCTR: { type: Number, default: 0 },
  avgConversionRate: { type: Number, default: 0 },
  roiBySource: { type: Schema.Types.Mixed, default: {} },

  topUsers: [String],
  relatedCategories: [{
    category: String,
    overlap: Number,
  }],

  updatedAt: { type: Date, default: Date.now },
});

const CategoryGraph = model<ICategoryGraph>('CategoryGraph', categoryGraphSchema);

// ============================================================================
// SERVICES
// ============================================================================

class CommerceGraphService {
  /**
   * Get user commerce profile
   */
  async getUserProfile(userId: string): Promise<IUserProfile | null> {
    return UserProfile.findOne({ userId });
  }

  /**
   * Get top categories for targeting
   */
  async getTopCategories(limit: number = 10): Promise<ICategoryGraph[]> {
    return CategoryGraph.find()
      .sort({ totalGMV: -1 })
      .limit(limit);
  }

  /**
   * Get users by category preference
   */
  async getUsersByCategory(category: string): Promise<string[]> {
    const profiles = await UserProfile.find({
      topCategories: category,
    }).limit(1000);

    return profiles.map(p => p.userId);
  }

  /**
   * Get category performance for ad attribution
   */
  async getCategoryPerformance(category: string): Promise<{
    avgCTR: number;
    avgConversionRate: number;
    roi: number;
    topSources: string[];
  }> {
    const cat = await CategoryGraph.findOne({ category });

    if (!cat) {
      return { avgCTR: 0, avgConversionRate: 0, roi: 0, topSources: [] };
    }

    const sources = Object.entries(cat.roiBySource)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source]) => source);

    return {
      avgCTR: cat.avgCTR,
      avgConversionRate: cat.avgConversionRate,
      roi: cat.totalGMV / 1000, // Simplified
      topSources: sources,
    };
  }

  /**
   * Get commerce lookalike audience
   */
  async getLookalikes(
    userId: string,
    limit: number = 100
  ): Promise<string[]> {
    const sourceProfile = await this.getUserProfile(userId);

    if (!sourceProfile) {
      return [];
    }

    // Find users with similar patterns
    const lookalikes = await UserProfile.find({
      userId: { $ne: userId },
      city: sourceProfile.city,
      topCategories: { $in: sourceProfile.topCategories.slice(0, 3) },
      avgOrderValue: {
        $gte: sourceProfile.avgOrderValue * 0.7,
        $lte: sourceProfile.avgOrderValue * 1.3,
      },
    })
      .sort({ repeatRate: -1 })
      .limit(limit);

    return lookalikes.map(l => l.userId);
  }

  /**
   * Predict user LTV and churn
   */
  async predictUserMetrics(userId: string): Promise<{
    predictedLTV: number;
    churnRisk: 'low' | 'medium' | 'high';
    nextOrderProbability: number;
  }> {
    const profile = await this.getUserProfile(userId);

    if (!profile) {
      return {
        predictedLTV: 0,
        churnRisk: 'high',
        nextOrderProbability: 0.1,
      };
    }

    // Simple LTV prediction
    const avgMonthlyOrders = profile.totalOrders / 6; // Assuming 6 months
    const predictedLTV = profile.avgOrderValue * avgMonthlyOrders * 12; // Annual

    // Churn risk based on days since last order
    // In production, calculate from actual recency
    let churnRisk: 'low' | 'medium' | 'high' = 'low';
    if (profile.repeatRate < 0.3) churnRisk = 'high';
    else if (profile.repeatRate < 0.5) churnRisk = 'medium';

    return {
      predictedLTV,
      churnRisk,
      nextOrderProbability: Math.min(0.9, profile.repeatRate + 0.1),
    };
  }

  /**
   * Get cross-sell opportunities
   */
  async getCrossSellOpportunities(
    userId: string,
    limit: number = 5
  ): Promise<Array<{ category: string; productName: string; score: number }>> {
    const profile = await this.getUserProfile(userId);

    if (!profile) {
      return [];
    }

    // Find categories user hasn't purchased from but related users have
    const relatedCategories = await CategoryGraph.find({
      category: { $nin: profile.topCategories },
    })
      .sort({ totalGMV: -1 })
      .limit(limit);

    return relatedCategories.map(cat => ({
      category: cat.category,
      productName: `${cat.category} products`,
      score: cat.totalGMV / 10000,
    }));
  }

  /**
   * Get orders with ad attribution
   */
  async getAdAttributedOrders(params: {
    campaignId?: string;
    source?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ICommerceOrder[]> {
    const query: Record<string, unknown> = {};

    if (params.campaignId) {
      query['adAttribution.campaignId'] = params.campaignId;
    }
    if (params.source) {
      query['adAttribution.source'] = params.source;
    }
    if (params.startDate || params.endDate) {
      query['createdAt'] = {};
      if (params.startDate) query['createdAt'].$gte = params.startDate;
      if (params.endDate) query['createdAt'].$lte = params.endDate;
    }

    return CommerceOrder.find(query).sort({ createdAt: -1 });
  }
}

const commerceGraph = new CommerceGraphService();

// ============================================================================
// APP
// ============================================================================

const app = express();
const PORT = parseInt(process.env.PORT || '4540', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/commerce-graph';

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'commerce-graph', version: '1.0.0' });
});

/**
 * GET /api/profile/:userId
 * Get user commerce profile
 */
app.get('/api/profile/:userId', async (req: Request, res: Response) => {
  try {
    const profile = await commerceGraph.getUserProfile(req.params.userId);

    if (!profile) {
      res.status(404).json({ success: false, error: 'PROFILE_NOT_FOUND' });
      return;
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/categories/top
 * Get top categories
 */
app.get('/api/categories/top', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const categories = await commerceGraph.getTopCategories(limit);

    res.json({
      success: true,
      data: categories.map(c => ({
        category: c.category,
        totalGMV: c.totalGMV,
        avgOrderValue: c.avgOrderValue,
        avgCTR: c.avgCTR,
        avgConversionRate: c.avgConversionRate,
      })),
    });
  } catch (error) {
    logger.error('Top categories error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/audience/category/:category
 * Get users by category
 */
app.get('/api/audience/category/:category', async (req: Request, res: Response) => {
  try {
    const userIds = await commerceGraph.getUsersByCategory(req.params.category);

    res.json({
      success: true,
      data: { count: userIds.length, userIds },
    });
  } catch (error) {
    logger.error('Category audience error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/audience/lookalike/:userId
 * Get lookalike audience
 */
app.get('/api/audience/lookalike/:userId', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const userIds = await commerceGraph.getLookalikes(req.params.userId, limit);

    res.json({
      success: true,
      data: { count: userIds.length, userIds },
    });
  } catch (error) {
    logger.error('Lookalike error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/predict/:userId
 * Predict user metrics
 */
app.get('/api/predict/:userId', async (req: Request, res: Response) => {
  try {
    const prediction = await commerceGraph.predictUserMetrics(req.params.userId);

    res.json({ success: true, data: prediction });
  } catch (error) {
    logger.error('Predict error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/cross-sell/:userId
 * Get cross-sell opportunities
 */
app.get('/api/cross-sell/:userId', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const opportunities = await commerceGraph.getCrossSellOpportunities(
      req.params.userId,
      limit
    );

    res.json({ success: true, data: opportunities });
  } catch (error) {
    logger.error('Cross-sell error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/orders/attributed
 * Get ad-attributed orders
 */
app.get('/api/orders/attributed', async (req: Request, res: Response) => {
  try {
    const params: Record<string, unknown> = {};

    if (req.query.campaignId) params.campaignId = req.query.campaignId;
    if (req.query.source) params.source = req.query.source;
    if (req.query.startDate) params.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) params.endDate = new Date(req.query.endDate as string);

    const orders = await commerceGraph.getAdAttributedOrders(
      params as Parameters<typeof commerceGraph.getAdAttributedOrders>[0]
    );

    res.json({
      success: true,
      data: {
        count: orders.length,
        totalValue: orders.reduce((sum, o) => sum + o.finalAmount, 0),
        orders: orders.slice(0, 100).map(o => ({
          orderId: o.orderId,
          merchantName: o.merchantName,
          city: o.city,
          finalAmount: o.finalAmount,
          adAttribution: o.adAttribution,
          createdAt: o.createdAt,
        })),
      },
    });
  } catch (error) {
    logger.error('Attributed orders error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

async function start(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('[Commerce Graph] Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`[Commerce Graph] Running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('[Commerce Graph] Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
