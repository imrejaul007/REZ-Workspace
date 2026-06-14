import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ChurnAgent } from '../../services/churnAgent';
import { LTVCalculator, LTTSegment } from '../../services/ltvCalculator';
import { Order } from '../../models/Order';
import { Store } from '../../models/Store';
import { merchantAuth } from '../../middleware/auth';

const router = Router();
router.use(merchantAuth);

interface CustomerSegment {
  id: string;
  userId: string;
  segments: {
    churnRisk: 'low' | 'medium' | 'high' | 'critical' | null;
    ltvSegment: LTTSegment | null;
  };
  metrics: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    orderFrequency: number;
    daysSinceLastOrder: number;
    firstOrderDate: Date | null;
    lastOrderDate: Date | null;
  };
  churnProbability: number;
  ltv: number;
  computedAt: Date;
}

/**
 * GET /merchant/analytics/customer-segments
 * Get comprehensive customer segments combining churn and LTV analysis
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const lookbackDays = parseInt(req.query.lookbackDays as string) || 180;

    // Get merchant's stores
    const stores = await Store.find({ merchantId: new mongoose.Types.ObjectId(merchantId) })
      .select('_id')
      .lean();
    const storeIds = stores.map((s) => s._id);

    if (storeIds.length === 0) {
      res.json({
        success: true,
        data: {
          segments: [],
          summary: {
            totalCustomers: 0,
            byChurnRisk: { critical: 0, high: 0, medium: 0, low: 0 },
            byLTVSegment: { VIP: 0, High: 0, Medium: 0, Low: 0 },
          },
        },
      });
      return;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);

    // Aggregate all customer data
    const customerData = await Order.aggregate([
      {
        $match: {
          store: { $in: storeIds },
          'payment.status': 'paid',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totals.total' },
          firstOrderDate: { $min: '$createdAt' },
          lastOrderDate: { $max: '$createdAt' },
        },
      },
    ]);

    // Get churn and LTV analyses
    const churnAnalysis = await ChurnAgent.analyzeChurn(merchantId, { lookbackDays });
    const ltvAnalysis = await LTVCalculator.analyzeLTV(merchantId, { lookbackDays });

    // Create lookup maps
    const churnMap = new Map(churnAnalysis.atRiskCustomers.map((c) => [c.userId, c]));
    const churnedMap = new Map(churnAnalysis.churnedCustomers.map((c) => [c.userId, c]));
    const ltvMap = new Map(ltvAnalysis.customers.map((c) => [c.userId, c]));

    // Build segments
    const segments: CustomerSegment[] = customerData.map((customer) => {
      const userId = customer._id.toString();
      const churnPred = churnMap.get(userId) || churnedMap.get(userId);
      const ltvMetrics = ltvMap.get(userId);
      const now = new Date();

      const daysSinceLastOrder = customer.lastOrderDate
        ? Math.floor((now.getTime() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const orderFrequency =
        customer.totalOrders > 0 && customer.firstOrderDate
          ? customer.totalOrders /
            (Math.max(
              1,
              Math.floor((now.getTime() - new Date(customer.firstOrderDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
            ))
          : 0;

      return {
        id: userId,
        userId,
        segments: {
          churnRisk: churnPred?.churnRisk || null,
          ltvSegment: ltvMetrics?.ltvSegment || null,
        },
        metrics: {
          totalOrders: customer.totalOrders,
          totalSpent: customer.totalSpent,
          averageOrderValue: customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0,
          orderFrequency: Math.round(orderFrequency * 100) / 100,
          daysSinceLastOrder,
          firstOrderDate: customer.firstOrderDate,
          lastOrderDate: customer.lastOrderDate,
        },
        churnProbability: churnPred?.churnProbability || 0,
        ltv: ltvMetrics?.ltv || 0,
        computedAt: now,
      };
    });

    // Build summary
    const summary = {
      totalCustomers: segments.length,
      byChurnRisk: {
        critical: segments.filter((s) => s.segments.churnRisk === 'critical').length,
        high: segments.filter((s) => s.segments.churnRisk === 'high').length,
        medium: segments.filter((s) => s.segments.churnRisk === 'medium').length,
        low: segments.filter((s) => s.segments.churnRisk === 'low').length,
      },
      byLTVSegment: {
        VIP: segments.filter((s) => s.segments.ltvSegment === 'VIP').length,
        High: segments.filter((s) => s.segments.ltvSegment === 'High').length,
        Medium: segments.filter((s) => s.segments.ltvSegment === 'Medium').length,
        Low: segments.filter((s) => s.segments.ltvSegment === 'Low').length,
      },
    };

    res.json({
      success: true,
      data: {
        segments,
        summary,
        analyzedAt: new Date(),
      },
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /merchant/analytics/customer-segments/summary
 * Get segment summary for dashboard
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;

    // Get both analyses
    const churnAnalysis = await ChurnAgent.analyzeChurn(merchantId);
    const ltvAnalysis = await LTVCalculator.analyzeLTV(merchantId);

    res.json({
      success: true,
      data: {
        churnSummary: {
          totalCustomers: churnAnalysis.totalCustomers,
          churnRate: churnAnalysis.summary.churnRate,
          averageChurnProbability: churnAnalysis.summary.averageChurnProbability,
          criticalCount: churnAnalysis.summary.criticalCount,
          highRiskCount: churnAnalysis.summary.highRiskCount,
          mediumRiskCount: churnAnalysis.summary.mediumRiskCount,
          lowRiskCount: churnAnalysis.summary.lowRiskCount,
        },
        ltvSummary: {
          totalLTV: ltvAnalysis.summary.totalLTV,
          averageLTV: ltvAnalysis.summary.averageLTV,
          medianLTV: ltvAnalysis.summary.medianLTV,
          vipCount: ltvAnalysis.segmentDistribution.vip,
          highCount: ltvAnalysis.segmentDistribution.high,
          mediumCount: ltvAnalysis.segmentDistribution.medium,
          lowCount: ltvAnalysis.segmentDistribution.low,
          vipPercentage: ltvAnalysis.summary.vipPercentage,
        },
        segmentDistribution: {
          vip: ltvAnalysis.segmentDistribution.vip,
          high: ltvAnalysis.segmentDistribution.high,
          medium: ltvAnalysis.segmentDistribution.medium,
          low: ltvAnalysis.segmentDistribution.low,
        },
        analyzedAt: new Date(),
      },
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /merchant/analytics/customer-segments/matrix
 * Get customers grouped by churn risk and LTV segment matrix
 */
router.get('/matrix', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;

    // Get both analyses
    const churnAnalysis = await ChurnAgent.analyzeChurn(merchantId);
    const ltvAnalysis = await LTVCalculator.analyzeLTV(merchantId);

    // Build matrix
    const matrix: Record<string, Record<string, number>> = {
      critical: { VIP: 0, High: 0, Medium: 0, Low: 0 },
      high: { VIP: 0, High: 0, Medium: 0, Low: 0 },
      medium: { VIP: 0, High: 0, Medium: 0, Low: 0 },
      low: { VIP: 0, High: 0, Medium: 0, Low: 0 },
    };

    // Create lookup maps
    const churnMap = new Map<string, string>();
    for (const c of churnAnalysis.atRiskCustomers) churnMap.set(c.userId, c.churnRisk);
    for (const c of churnAnalysis.churnedCustomers) churnMap.set(c.userId, c.churnRisk);
    const ltvMap = new Map<string, string>();
    for (const c of ltvAnalysis.customers) ltvMap.set(c.userId, c.ltvSegment);

    // Build combined list
    const allUsers = new Set([...churnMap.keys(), ...ltvMap.keys()]);

    for (const userId of allUsers) {
      const churnRisk = (churnMap.get(userId as string) || 'low') as keyof typeof matrix;
      const ltvSegment = (ltvMap.get(userId as string) || 'Low') as string;
      if (matrix[churnRisk] && matrix[churnRisk][ltvSegment] !== undefined) {
        matrix[churnRisk][ltvSegment]++;
      }
    }

    res.json({
      success: true,
      data: {
        matrix,
        totals: {
          byChurnRisk: {
            critical: Object.values(matrix.critical).reduce((a, b) => a + b, 0),
            high: Object.values(matrix.high).reduce((a, b) => a + b, 0),
            medium: Object.values(matrix.medium).reduce((a, b) => a + b, 0),
            low: Object.values(matrix.low).reduce((a, b) => a + b, 0),
          },
          byLTVSegment: {
            VIP: matrix.critical.VIP + matrix.high.VIP + matrix.medium.VIP + matrix.low.VIP,
            High: matrix.critical.High + matrix.high.High + matrix.medium.High + matrix.low.High,
            Medium: matrix.critical.Medium + matrix.high.Medium + matrix.medium.Medium + matrix.low.Medium,
            Low: matrix.critical.Low + matrix.high.Low + matrix.medium.Low + matrix.low.Low,
          },
        },
        analyzedAt: new Date(),
      },
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /merchant/analytics/customer-segments/actionable
 * Get actionable insights for each segment combination
 */
router.get('/actionable', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const lookbackDays = parseInt(req.query.lookbackDays as string) || 180;

    // Get analyses
    const churnAnalysis = await ChurnAgent.analyzeChurn(merchantId, { lookbackDays });
    const ltvAnalysis = await LTVCalculator.analyzeLTV(merchantId, { lookbackDays });

    // Create lookup maps
    const churnMap = new Map<string, { churnRisk: string }>();
    for (const c of churnAnalysis.atRiskCustomers) churnMap.set(c.userId, c);
    for (const c of churnAnalysis.churnedCustomers) churnMap.set(c.userId, c);
    const ltvMap = new Map<string, { ltvSegment: string }>();
    for (const c of ltvAnalysis.customers) ltvMap.set(c.userId, c);

    // Define actionable segments
    const actionableSegments = [
      {
        id: 'vip_healthy',
        name: 'VIP - Healthy',
        description: 'High-value customers with low churn risk',
        churnRisk: ['low'],
        ltvSegment: ['VIP'],
        priority: 1,
        actions: ['Retain with exclusive benefits', 'Upsell premium offerings', 'Request referrals'],
      },
      {
        id: 'high_healthy',
        name: 'High Value - Healthy',
        description: 'Good customers with low churn risk, potential VIPs',
        churnRisk: ['low'],
        ltvSegment: ['High'],
        priority: 2,
        actions: ['Nurture with loyalty programs', 'Introduce VIP tier benefits', 'Cross-sell'],
      },
      {
        id: 'vip_at_risk',
        name: 'VIP - At Risk',
        description: 'High-value customers showing churn signals - URGENT',
        churnRisk: ['medium', 'high'],
        ltvSegment: ['VIP'],
        priority: 1,
        actions: ['Personal outreach', 'Exclusive retention offers', 'Address complaints'],
      },
      {
        id: 'high_at_risk',
        name: 'High Value - At Risk',
        description: 'Valuable customers at risk of churning',
        churnRisk: ['medium', 'high'],
        ltvSegment: ['High'],
        priority: 2,
        actions: ['Re-engagement campaigns', 'Discounted offers', 'Feedback collection'],
      },
      {
        id: 'medium_healthy',
        name: 'Medium Value - Healthy',
        description: 'Growing customers with good engagement',
        churnRisk: ['low'],
        ltvSegment: ['Medium'],
        priority: 3,
        actions: ['Encourage frequent purchases', 'Introduce loyalty rewards', 'Personalized offers'],
      },
      {
        id: 'medium_at_risk',
        name: 'Medium Value - At Risk',
        description: 'At-risk medium-value customers',
        churnRisk: ['medium', 'high'],
        ltvSegment: ['Medium'],
        priority: 3,
        actions: ['Reactivation campaigns', 'Special discounts', 'New product announcements'],
      },
      {
        id: 'churned_vip',
        name: 'Churned VIP',
        description: 'Former high-value customers - Win back priority',
        churnRisk: ['critical'],
        ltvSegment: ['VIP', 'High'],
        priority: 1,
        actions: ['Win-back campaigns', 'Significant incentives', 'Personal phone calls'],
      },
      {
        id: 'low_new',
        name: 'Low Value - New',
        description: 'New or one-time customers',
        churnRisk: ['low', 'medium', 'high', 'critical'],
        ltvSegment: ['Low'],
        priority: 4,
        actions: ['Welcome sequences', 'First-purchase incentives', 'Onboarding flows'],
      },
    ];

    // Calculate counts for each segment
    const allUsers = new Set([...churnMap.keys(), ...ltvMap.keys()]);
    const segmentCounts = actionableSegments.map((seg) => {
      const count = Array.from(allUsers).filter((userId) => {
        const churn = churnMap.get(userId as string);
        const ltv = ltvMap.get(userId as string);
        return (
          seg.churnRisk.includes(churn?.churnRisk || 'low') &&
          seg.ltvSegment.includes(ltv?.ltvSegment || 'Low')
        );
      }).length;

      return {
        ...seg,
        customerCount: count,
      };
    });

    res.json({
      success: true,
      data: {
        segments: segmentCounts.sort((a, b) => a.priority - b.priority),
        totalCustomers: allUsers.size,
        analyzedAt: new Date(),
      },
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
