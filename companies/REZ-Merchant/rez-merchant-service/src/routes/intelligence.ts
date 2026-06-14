import { Router, Request, Response } from 'express';
import { StorePayment } from '../models/StorePayment';
import { Order } from '../models/Order';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';
import axios from 'axios';

const router = Router();
router.use(merchantAuth);

// REZ Mind integration
const REZ_MIND_URL = process.env.REZ_MIND_URL || 'http://localhost:4017';

// MEDIUM FIX: All aggregation pipelines must specify maxTimeMS to prevent runaway queries.
const AGG_OPTIONS = { maxTimeMS: 30000 };

// Helper: validate storeId and verify merchant ownership
async function validateAndGetStoreId(
  storeId: unknown,
  merchantId: string,
): Promise<mongoose.Types.ObjectId | null> {
  if (!storeId || typeof storeId !== 'string' || !mongoose.Types.ObjectId.isValid(storeId)) {
    return null;
  }
  const store = await Store.findOne({
    _id: new mongoose.Types.ObjectId(storeId),
    merchantId: new mongoose.Types.ObjectId(merchantId),
  }).select('_id').lean();
  return store ? store._id as mongoose.Types.ObjectId : null;
}

router.get('/insights', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    if (!storeId || typeof storeId !== 'string') {
      res.status(400).json({ success: false, message: 'storeId required' }); return;
    }
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const [revenue, peakHours] = await Promise.all([
      StorePayment.aggregate([
        { $match: { storeId: new mongoose.Types.ObjectId(storeId), status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$billAmount' }, avg: { $avg: '$billAmount' }, count: { $sum: 1 } } },
      ], AGG_OPTIONS),
      StorePayment.aggregate([
        { $match: { storeId: new mongoose.Types.ObjectId(storeId), status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ], AGG_OPTIONS),
    ]);
    res.json({ success: true, data: { revenue: revenue[0] || { total: 0, avg: 0, count: 0 }, peakHours: peakHours.map(h => ({ hour: h._id, orders: h.count })) } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

const ACTIVE_STATUSES = [
  'placed', 'confirmed', 'preparing', 'ready',
  'dispatched', 'out_for_delivery', 'delivered',
];

const HOUR_LABELS: Record<number, string> = {
  0: '12 AM', 1: '1 AM', 2: '2 AM', 3: '3 AM', 4: '4 AM',
  5: '5 AM', 6: '6 AM', 7: '7 AM', 8: '8 AM', 9: '9 AM',
  10: '10 AM', 11: '11 AM', 12: '12 PM', 13: '1 PM', 14: '2 PM',
  15: '3 PM', 16: '4 PM', 17: '5 PM', 18: '6 PM', 19: '7 PM',
  20: '8 PM', 21: '9 PM', 22: '10 PM', 23: '11 PM',
};

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * GET /merchant/intelligence/empty-slots
 * Finds time slots (day-of-week + hour) with zero orders in the last 30 days.
 * FIX-17: Uses aggregation pipeline instead of Order.find() to prevent OOM.
 */
router.get('/empty-slots', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    if (!storeId || typeof storeId !== 'string') {
      res.status(400).json({ success: false, message: 'storeId is required' }); return;
    }
    const storeObjId = await validateAndGetStoreId(storeId, req.merchantId!);
    if (!storeObjId) {
      res.status(403).json({ success: false, message: 'Store not found or access denied' }); return;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    // FIX-17: Use aggregation pipeline instead of Order.find() to avoid loading
    // all matching orders into Node.js heap (OOM prevention for high-volume merchants).
    const filledSlots = new Set<string>();
    const cursor = Order.aggregate([
      {
        $match: {
          store: storeObjId,
          status: { $nin: ['cancelled', 'refunded'] },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            dayOfWeek: { $isoDayOfWeek: '$createdAt' },
            hour: { $hour: '$createdAt' },
          },
        },
      },
    ], AGG_OPTIONS);

    for await (const doc of cursor) {
      // Convert MongoDB isoDayOfWeek (1=Monday...7=Sunday) to JS getDay() (0=Sunday...6=Saturday)
      const jsDay = doc._id.dayOfWeek === 7 ? 0 : doc._id.dayOfWeek;
      filledSlots.add(`${jsDay}-${doc._id.hour}`);
    }

    // Check all day-hour combinations for business hours 6 AM - 10 PM
    const emptySlots: Array<{ day: string; dayOfWeek: number; hour: number; label: string }> = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 6; hour <= 22; hour++) {
        const key = `${day}-${hour}`;
        if (!filledSlots.has(key)) {
          emptySlots.push({ day: DAY_LABELS[day], dayOfWeek: day, hour, label: HOUR_LABELS[hour] });
        }
      }
    }

    let suggestion = '';
    if (emptySlots.length === 0) {
      suggestion = "Great news! You've had orders at every time slot this month. Consider expanding your hours or adding delivery.";
    } else if (emptySlots.length < 7) {
      suggestion = `You have ${emptySlots.length} time slot${emptySlots.length === 1 ? '' : 's'} with no orders this month. Try a flash deal to fill them.`;
    } else if (emptySlots.length < 21) {
      suggestion = `${emptySlots.length} time slots are empty this month. A targeted offer during slow hours could boost revenue by 15-20%.`;
    } else {
      suggestion = `${emptySlots.length} slots are empty — consider promotions, loyalty rewards, or reducing hours to save costs.`;
    }

    res.json({
      success: true,
      data: {
        suggestion,
        emptySlots: emptySlots.slice(0, 10),
        emptyCount: emptySlots.length,
        totalChecked: 7 * 17,
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /merchant/intelligence/dead-hours
 * Finds hours of the day with below-average order volume in the last 30 days.
 */
router.get('/dead-hours', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    if (!storeId || typeof storeId !== 'string') {
      res.status(400).json({ success: false, message: 'storeId is required' }); return;
    }
    const storeObjId = await validateAndGetStoreId(storeId, req.merchantId!);
    if (!storeObjId) {
      res.status(403).json({ success: false, message: 'Store not found or access denied' }); return;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const hourlyStats = await Order.aggregate([
      {
        $match: {
          store: storeObjId,
          status: { $in: ACTIVE_STATUSES },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totals.total' },
        },
      },
      { $sort: { count: -1 } },
    ], AGG_OPTIONS);

    if (hourlyStats.length === 0) {
      res.json({
        success: true,
        data: {
          suggestion: 'Not enough order data yet. Keep serving customers and check back in a few days.',
          deadHours: [],
        },
      });
      return;
    }

    const avgCount = hourlyStats.reduce((sum, h) => sum + h.count, 0) / hourlyStats.length;
    const deadHours = hourlyStats
      .filter(h => h.count < avgCount * 0.3)
      .map(h => ({
        hour: h._id,
        label: HOUR_LABELS[h._id] || `${h._id}:00`,
        count: h.count,
        revenue: h.totalRevenue,
      }));

    const peakHours = hourlyStats.slice(0, 3).map(h => ({
      hour: h._id,
      label: HOUR_LABELS[h._id] || `${h._id}:00`,
      count: h.count,
    }));

    let suggestion = '';
    if (deadHours.length === 0) {
      suggestion = 'Your busiest and slowest hours are performing well. Consider running loyalty rewards to maintain momentum.';
    } else {
      const slowLabels = deadHours.map(h => h.label).join(', ');
      suggestion = `${deadHours.length} slow hour${deadHours.length === 1 ? '' : 's'} detected (${slowLabels}). ` +
        `Run targeted promotions between ${deadHours[0]?.label} and ${deadHours[deadHours.length - 1]?.label} to boost revenue.`;
    }

    res.json({
      success: true,
      data: {
        suggestion,
        deadHours,
        peakHours,
        avgOrdersPerHour: Math.round(avgCount * 10) / 10,
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /merchant/intelligence/action-center
 * Returns actionable items for the merchant.
 */
router.get('/action-center', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    const query: Record<string, unknown> = { merchantId: req.merchantId };
    if (storeId) query['storeId'] = storeId;
    const actions: Array<{ id: string; type: string; priority: string; message: string; createdAt: Date }> = [];
    res.json({ success: true, data: { actions, count: actions.length } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /merchant/intelligence/network-stats
 * Returns REZ-network attribution metrics for the past 30 days.
 */
router.get('/network-stats', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    if (!storeId || typeof storeId !== 'string') {
      res.status(400).json({ success: false, message: 'storeId is required' }); return;
    }
    const storeObjId = await validateAndGetStoreId(storeId, req.merchantId!);
    if (!storeObjId) {
      res.status(403).json({ success: false, message: 'Store not found or access denied' }); return;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const coinRedemptionStats = await StorePayment.aggregate([
      {
        $match: {
          storeId: storeObjId,
          status: 'completed',
          createdAt: { $gte: thirtyDaysAgo },
          'coinRedemption.totalAmount': { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$userId',
          totalVisits: { $sum: 1 },
          totalSpend: { $sum: '$billAmount' },
          coinsRedeemed: { $sum: '$coinRedemption.totalAmount' },
        },
      },
    ], AGG_OPTIONS);

    const totalCustomers = await StorePayment.distinct('userId', {
      storeId: storeObjId,
      status: 'completed',
      createdAt: { $gte: thirtyDaysAgo },
    });

    const newCustomers = await StorePayment.aggregate([
      { $match: { storeId: storeObjId, status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$userId', firstVisit: { $min: '$createdAt' } } },
      { $match: { firstVisit: { $gte: thirtyDaysAgo } } },
    ], AGG_OPTIONS);

    const networkCustomers = coinRedemptionStats.length;
    const totalUniqueCustomers = totalCustomers.length;
    const networkRevenue = coinRedemptionStats.reduce((s: number, c) => s + c.totalSpend, 0);

    res.json({
      success: true,
      data: {
        period: '30d',
        totalCustomers: totalUniqueCustomers,
        networkCustomers,
        newCustomers: newCustomers.length,
        networkRevenue: Math.round(networkRevenue),
        networkPct: totalUniqueCustomers > 0 ? Math.round((networkCustomers / totalUniqueCustomers) * 100) : 0,
        insight:
          networkCustomers > 0
            ? `${networkCustomers} customer${networkCustomers > 1 ? 's' : ''} came via REZ coins this month, spending \u20b9${Math.round(networkRevenue).toLocaleString('en-IN')}`
            : 'Start rewarding customers to grow your REZ network.',
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// ============================================================================
// LOYALTY INTELLIGENCE - Customer Health & Churn
// ============================================================================

/**
 * GET /api/intelligence/loyalty-dashboard
 * Get complete loyalty intelligence dashboard for merchant
 */
router.get('/loyalty-dashboard', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    const merchantId = (req as unknown).user?.id;

    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId required' });
      return;
    }

    const storeObjId = await validateAndGetStoreId(storeId, merchantId);
    if (!storeObjId) {
      res.status(403).json({ success: false, message: 'Store not found' });
      return;
    }

    // Get loyalty data from orders
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const loyaltyStats = await StorePayment.aggregate([
      { $match: { storeId: storeObjId, status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: '$userId',
          totalVisits: { $sum: 1 },
          totalSpend: { $sum: '$billAmount' },
          avgOrderValue: { $avg: '$billAmount' },
          coinsEarned: { $sum: '$coinEarned' },
          coinsRedeemed: { $sum: '$coinRedemption.totalAmount' },
          lastVisit: { $max: '$createdAt' },
        },
      },
    ], AGG_OPTIONS);

    // Get merchant intelligence from REZ Mind
    let merchantIntel = null;
    try {
      const response = await axios.get(`${REZ_MIND_URL}/api/analytics/merchant/${storeId}`, { timeout: 3000 });
      merchantIntel = response.data;
    } catch {
      // REZ Mind unavailable, continue without it
    }

    // Calculate health metrics
    const totalCustomers = loyaltyStats.length;
    const avgVisits = totalCustomers > 0
      ? loyaltyStats.reduce((s, c) => s + c.totalVisits, 0) / totalCustomers
      : 0;
    const avgSpend = totalCustomers > 0
      ? loyaltyStats.reduce((s, c) => s + c.totalSpend, 0) / totalCustomers
      : 0;

    // Identify at-risk customers (low visits + low recent activity)
    const atRiskThreshold = new Date(Date.now() - 14 * 86400000);
    const atRiskCustomers = loyaltyStats.filter(c =>
      c.totalVisits < 2 || (c.lastVisit && new Date(c.lastVisit) < atRiskThreshold)
    );

    // Identify high-value customers (high spend + high visits)
    const highValueCustomers = loyaltyStats.filter(c =>
      c.totalSpend > avgSpend * 1.5 && c.totalVisits > avgVisits * 1.5
    );

    res.json({
      success: true,
      data: {
        overview: {
          totalCustomers,
          activeCustomers: loyaltyStats.filter(c => {
            const weekAgo = new Date(Date.now() - 7 * 86400000);
            return c.lastVisit && new Date(c.lastVisit) > weekAgo;
          }).length,
          atRiskCustomers: atRiskCustomers.length,
          highValueCustomers: highValueCustomers.length,
        },
        health: {
          avgVisits: Math.round(avgVisits * 10) / 10,
          avgSpend: Math.round(avgSpend),
          avgOrderValue: Math.round(avgSpend / (avgVisits || 1)),
          retentionRate: totalCustomers > 0
            ? Math.round(((totalCustomers - atRiskCustomers.length) / totalCustomers) * 100)
            : 100,
        },
        recommendations: generateLoyaltyRecommendations(atRiskCustomers.length, highValueCustomers.length, totalCustomers),
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/intelligence/at-risk-customers
 * Get list of at-risk customers with churn indicators
 */
router.get('/at-risk-customers', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    const merchantId = (req as unknown).user?.id;

    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId required' });
      return;
    }

    const storeObjId = await validateAndGetStoreId(storeId, merchantId);
    if (!storeObjId) {
      res.status(403).json({ success: false, message: 'Store not found' });
      return;
    }

    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000);

    const atRiskCustomers = await StorePayment.aggregate([
      { $match: { storeId: storeObjId, status: 'completed' } },
      {
        $group: {
          _id: '$userId',
          totalVisits: { $sum: 1 },
          totalSpend: { $sum: '$billAmount' },
          lastVisit: { $max: '$createdAt' },
          coinsBalance: { $last: '$coinBalance' },
        },
      },
      {
        $match: {
          $or: [
            { totalVisits: { $lt: 3 } },
            { lastVisit: { $lt: fourteenDaysAgo } },
          ],
        },
      },
      { $sort: { lastVisit: 1 } },
      { $limit: 50 },
    ], AGG_OPTIONS);

    // Enrich with REZ Mind data if available
    const enrichedCustomers = await Promise.all(
      atRiskCustomers.map(async (customer) => {
        try {
          const response = await axios.get(`${REZ_MIND_URL}/api/analytics/user/${customer._id}`, { timeout: 2000 });
          return {
            userId: customer._id,
            totalVisits: customer.totalVisits,
            totalSpend: customer.totalSpend,
            lastVisit: customer.lastVisit,
            churnRisk: response.data?.churnRisk || 50,
            satisfactionScore: response.data?.satisfactionScore || 50,
            riskFactors: response.data?.riskFactors || [],
          };
        } catch {
          return {
            userId: customer._id,
            totalVisits: customer.totalVisits,
            totalSpend: customer.totalSpend,
            lastVisit: customer.lastVisit,
            churnRisk: 60,
            satisfactionScore: 50,
            riskFactors: ['Low engagement', 'No recent visits'],
          };
        }
      })
    );

    res.json({
      success: true,
      data: enrichedCustomers,
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/intelligence/vip-customers
 * Get high-value customers with engagement metrics
 */
router.get('/vip-customers', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;
    const merchantId = (req as unknown).user?.id;

    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId required' });
      return;
    }

    const storeObjId = await validateAndGetStoreId(storeId, merchantId);
    if (!storeObjId) {
      res.status(403).json({ success: false, message: 'Store not found' });
      return;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const vipCustomers = await StorePayment.aggregate([
      { $match: { storeId: storeObjId, status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: '$userId',
          totalVisits: { $sum: 1 },
          totalSpend: { $sum: '$billAmount' },
          coinsEarned: { $sum: '$coinEarned' },
          avgOrderValue: { $avg: '$billAmount' },
          lastVisit: { $max: '$createdAt' },
        },
      },
      { $match: { totalSpend: { $gt: 5000 } } },
      { $sort: { totalSpend: -1 } },
      { $limit: 20 },
    ], AGG_OPTIONS);

    res.json({
      success: true,
      data: vipCustomers.map(c => ({
        userId: c._id,
        totalSpend: c.totalSpend,
        totalVisits: c.totalVisits,
        avgOrderValue: Math.round(c.avgOrderValue),
        coinsEarned: c.coinsEarned,
        engagement: calculateEngagementScore(c),
        tier: getCustomerTier(c.totalSpend),
        lastVisit: c.lastVisit,
      })),
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/intelligence/customer/:userId/profile
 * Get complete customer profile for merchant
 */
router.get('/customer/:userId/profile', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { storeId } = req.query;
    const merchantId = (req as unknown).user?.id;

    if (!storeId) {
      res.status(400).json({ success: false, message: 'storeId required' });
      return;
    }

    const storeObjId = await validateAndGetStoreId(storeId, merchantId);
    if (!storeObjId) {
      res.status(403).json({ success: false, message: 'Store not found' });
      return;
    }

    // Get customer activity from this store
    const customerActivity = await StorePayment.aggregate([
      { $match: { storeId: storeObjId, userId } },
      {
        $group: {
          _id: null,
          totalVisits: { $sum: 1 },
          totalSpend: { $sum: '$billAmount' },
          avgOrderValue: { $avg: '$billAmount' },
          coinsEarned: { $sum: '$coinEarned' },
          coinsRedeemed: { $sum: '$coinRedemption.totalAmount' },
          firstVisit: { $min: '$createdAt' },
          lastVisit: { $max: '$createdAt' },
        },
      },
    ], AGG_OPTIONS);

    // Get AI insights from REZ Mind
    let aiInsights = null;
    try {
      const response = await axios.get(`${REZ_MIND_URL}/api/analytics/user/${userId}`, { timeout: 3000 });
      aiInsights = response.data;
    } catch {
      // REZ Mind unavailable
    }

    const activity = customerActivity[0] || {};

    res.json({
      success: true,
      data: {
        userId,
        storeActivity: {
          totalVisits: activity.totalVisits || 0,
          totalSpend: activity.totalSpend || 0,
          avgOrderValue: Math.round(activity.avgOrderValue || 0),
          coinsEarned: activity.coinsEarned || 0,
          coinsRedeemed: activity.coinsRedeemed || 0,
          firstVisit: activity.firstVisit,
          lastVisit: activity.lastVisit,
          customerSince: activity.firstVisit,
        },
        loyaltyTier: getCustomerTier(activity.totalSpend || 0),
        customerHealth: {
          score: calculateHealthScore(activity, aiInsights),
          level: getHealthLevel(activity, aiInsights),
          status: getHealthStatus(activity, aiInsights),
        },
        aiInsights: aiInsights ? {
          satisfactionScore: aiInsights.satisfactionScore,
          churnRisk: aiInsights.churnRisk,
          riskFactors: aiInsights.riskFactors || [],
          preferences: aiInsights.preferredAmenities || [],
        } : null,
        engagement: {
          score: calculateEngagementScore(activity),
          visitsThisMonth: activity.totalVisits || 0,
          spendingTrend: getSpendingTrend(activity),
        },
        recommendations: getCustomerRecommendations(activity, aiInsights),
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateLoyaltyRecommendations(atRiskCount: number, vipCount: number, total: number) : Record<string, unknown>[] {
  const recommendations = [];

  if (atRiskCount > total * 0.3) {
    recommendations.push({
      priority: 'high',
      type: 'retention',
      title: `${atRiskCount} At-Risk Customers`,
      description: 'Send personalized recovery offers to prevent churn',
      action: 'View At-Risk',
      potentialImpact: `Save ~${Math.round(atRiskCount * 0.7)} customers`,
    });
  }

  if (vipCount > 0) {
    recommendations.push({
      priority: 'medium',
      type: 'engagement',
      title: `${vipCount} VIP Customers`,
      description: 'Reward your best customers to maintain loyalty',
      action: 'View VIPs',
      potentialImpact: `Retain ~${vipCount} high-value customers`,
    });
  }

  if (total > 0) {
    recommendations.push({
      priority: 'low',
      type: 'growth',
      title: 'Loyalty Program Growth',
      description: 'Review loyalty settings to increase engagement',
      action: 'Configure Loyalty',
      potentialImpact: 'Increase repeat visits by 15%',
    });
  }

  return recommendations;
}

function calculateEngagementScore(activity): number {
  if (!activity.totalVisits) return 0;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const lastVisit = activity.lastVisit ? new Date(activity.lastVisit) : null;
  const daysSinceVisit = lastVisit
    ? Math.floor((Date.now() - lastVisit.getTime()) / 86400000)
    : 999;

  let score = Math.min(100, activity.totalVisits * 10);
  if (daysSinceVisit > 7) score -= (daysSinceVisit - 7) * 2;
  return Math.max(0, Math.round(score));
}

function getCustomerTier(totalSpend: number): string {
  if (totalSpend >= 50000) return 'diamond';
  if (totalSpend >= 25000) return 'platinum';
  if (totalSpend >= 10000) return 'gold';
  if (totalSpend >= 5000) return 'silver';
  return 'bronze';
}

function calculateHealthScore(activity, aiInsights): number {
  let score = 70;

  if (activity.totalVisits > 5) score += 10;
  if (activity.totalSpend > 10000) score += 10;
  if (aiInsights?.satisfactionScore) {
    score = Math.round((score + aiInsights.satisfactionScore) / 2);
  }
  if (aiInsights?.churnRisk) {
    score -= aiInsights.churnRisk / 2;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getHealthLevel(activity, aiInsights): string {
  const score = calculateHealthScore(activity, aiInsights);
  if (score >= 80) return 'champion';
  if (score >= 60) return 'healthy';
  if (score >= 40) return 'stable';
  return 'at_risk';
}

function getHealthStatus(activity, aiInsights): string {
  const level = getHealthLevel(activity, aiInsights);
  const statuses: Record<string, string> = {
    champion: 'Excellent customer - VIP treatment recommended',
    healthy: 'Good standing - Maintain engagement',
    stable: 'Moderate activity - Consider re-engagement',
    at_risk: 'Low activity - Urgent retention action needed',
  };
  return statuses[level];
}

function getSpendingTrend(activity): 'up' | 'stable' | 'down' {
  // Simplified - in production would compare monthly averages
  if (activity.totalSpend > 5000) return 'up';
  if (activity.totalSpend > 2000) return 'stable';
  return 'down';
}

function getCustomerRecommendations(activity, aiInsights): string[] {
  const recommendations: string[] = [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  if (!activity.lastVisit || new Date(activity.lastVisit) < thirtyDaysAgo) {
    recommendations.push('Send win-back offer');
  }

  if (activity.totalVisits < 3) {
    recommendations.push('Offer first-visit bonus');
  }

  if (aiInsights?.atRisk) {
    recommendations.push('Send personalized check-in');
    recommendations.push('Offer exclusive discount');
  }

  if (activity.totalSpend > 10000) {
    recommendations.push('Invite to VIP program');
  }

  return recommendations;
}

// =====================================================
// MARKET INTELLIGENCE ROUTES (Intelligence Aggregator)
// =====================================================

// Intelligence Aggregator URL
const INTELLIGENCE_AGGREGATOR_URL = process.env.INTELLIGENCE_AGGREGATOR_URL || 'http://localhost:4011';

/**
 * GET /api/v1/merchant/intelligence/market/heatmap/:city
 * Get demand heatmap for a city
 */
router.get('/market/heatmap/:city', async (req: Request, res: Response) => {
  try {
    const { city } = req.params;
    const { industry = 'restaurant' } = req.query;

    const response = await axios.get(`${INTELLIGENCE_AGGREGATOR_URL}/api/v1/heatmap/demand/${encodeURIComponent(city)}`, {
      params: { industry },
      timeout: 5000,
    });

    res.json({
      success: true,
      data: response.data.data
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch heatmap data'
    });
  }
});

/**
 * GET /api/v1/merchant/intelligence/market/neighborhood
 * Analyze neighborhood around merchant's store
 */
router.get('/market/neighborhood', async (req: Request, res: Response) => {
  try {
    const { locality, industry = 'restaurant' } = req.query;

    if (!locality) {
      res.status(400).json({
        success: false,
        message: 'locality query parameter required'
      });
      return;
    }

    const response = await axios.get(`${INTELLIGENCE_AGGREGATOR_URL}/api/v1/heatmap/neighborhood`, {
      params: { locality, industry },
      timeout: 5000,
    });

    res.json({
      success: true,
      data: response.data.data
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: 'Failed to analyze neighborhood'
    });
  }
});

/**
 * GET /api/v1/merchant/intelligence/market/trends/:locality
 * Get demand trends for a locality
 */
router.get('/market/trends/:locality', async (req: Request, res: Response) => {
  try {
    const { locality } = req.params;
    const { industry = 'restaurant', period = '30d' } = req.query;

    const response = await axios.get(`${INTELLIGENCE_AGGREGATOR_URL}/api/v1/trends/demand/${encodeURIComponent(locality)}`, {
      params: { industry, period },
      timeout: 5000,
    });

    res.json({
      success: true,
      data: response.data.data
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trends data'
    });
  }
});

/**
 * GET /api/v1/merchant/intelligence/market/benchmark
 * Get industry benchmarks
 */
router.get('/market/benchmark', async (req: Request, res: Response) => {
  try {
    const { industry = 'restaurant' } = req.query;

    const response = await axios.get(`${INTELLIGENCE_AGGREGATOR_URL}/api/v1/benchmark/industry/${industry}`, {
      timeout: 5000,
    });

    res.json({
      success: true,
      data: response.data.data
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch benchmarks'
    });
  }
});

/**
 * GET /api/v1/merchant/intelligence/market/opportunities
 * Find expansion opportunities
 */
router.get('/market/opportunities', async (req: Request, res: Response) => {
  try {
    const { city, industry = 'restaurant' } = req.query;

    if (!city) {
      res.status(400).json({
        success: false,
        message: 'city query parameter required'
      });
      return;
    }

    const response = await axios.get(`${INTELLIGENCE_AGGREGATOR_URL}/api/v1/heatmap/opportunities`, {
      params: { city, industry },
      timeout: 5000,
    });

    res.json({
      success: true,
      data: response.data.data
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch opportunities'
    });
  }
});

/**
 * GET /api/v1/merchant/intelligence/market/trending
 * Get trending localities
 */
router.get('/market/trending', async (req: Request, res: Response) => {
  try {
    const { city, industry = 'restaurant' } = req.query;

    if (!city) {
      res.status(400).json({
        success: false,
        message: 'city query parameter required'
      });
      return;
    }

    const response = await axios.get(`${INTELLIGENCE_AGGREGATOR_URL}/api/v1/heatmap/trending`, {
      params: { city, industry },
      timeout: 5000,
    });

    res.json({
      success: true,
      data: response.data.data
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending data'
    });
  }
});

/**
 * POST /api/v1/merchant/intelligence/market/opt-in
 * Opt-in to data sharing for aggregated insights
 */
router.post('/market/opt-in', async (req: Request, res: Response) => {
  try {
    const response = await axios.post(
      `${INTELLIGENCE_AGGREGATOR_URL}/internal/consent`,
      {
        merchantId: req.merchantId,
        consent: true
      },
      {
        headers: {
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN,
          'X-Internal-Service': 'merchant-service'
        },
        timeout: 5000
      }
    );

    res.json({
      success: true,
      message: 'Successfully opted into market intelligence program'
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: 'Failed to opt into program'
    });
  }
});

/**
 * POST /api/v1/merchant/intelligence/market/opt-out
 * Opt-out of data sharing
 */
router.post('/market/opt-out', async (req: Request, res: Response) => {
  try {
    const response = await axios.post(
      `${INTELLIGENCE_AGGREGATOR_URL}/internal/consent`,
      {
        merchantId: req.merchantId,
        consent: false
      },
      {
        headers: {
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN,
          'X-Internal-Service': 'merchant-service'
        },
        timeout: 5000
      }
    );

    res.json({
      success: true,
      message: 'Successfully opted out of market intelligence program'
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: 'Failed to opt out of program'
    });
  }
});

export default router;
