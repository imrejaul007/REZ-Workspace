import mongoose, { Types } from 'mongoose';
import { Order } from '../models/Order';
import { Store } from '../models/Store';
import { CustomerMeta } from '../models/CustomerMeta';

export interface RFMScore {
  userId: string;
  recency: number;       // Days since last order (lower is better)
  frequency: number;      // Total number of orders (higher is better)
  monetary: number;       // Total amount spent (higher is better)
  recencyScore: number;    // 1-5 score
  frequencyScore: number; // 1-5 score
  monetaryScore: number;   // 1-5 score
  totalScore: number;     // Combined RFM score (3-15)
}

export interface ChurnPrediction {
  userId: string;
  churnProbability: number;        // 0-100%
  churnRisk: 'low' | 'medium' | 'high' | 'critical';
  daysSinceLastOrder: number;
  lastOrderDate: Date | null;
  predictedChurnDate: Date | null;
  rfmScore: RFMScore;
  reasons: string[];
  recommendedActions: string[];
}

export interface ChurnAlert {
  userId: string;
  merchantId: string;
  alertType: 'at_risk' | 'churned' | 'reactivation';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  churnProbability: number;
  daysSinceLastOrder: number;
  createdAt: Date;
}

export interface ChurnAnalysisResult {
  merchantId: string;
  analyzedAt: Date;
  totalCustomers: number;
  atRiskCustomers: ChurnPrediction[];
  churnedCustomers: ChurnPrediction[];
  healthyCustomers: ChurnPrediction[];
  summary: {
    churnRate: number;
    averageChurnProbability: number;
    criticalCount: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
  };
  alerts: ChurnAlert[];
}

const DEFAULT_CHURN_THRESHOLDS = {
  criticalDays: 90,
  highRiskDays: 60,
  mediumRiskDays: 30,
  lowRiskDays: 14,
};

const LIFESPAN_DAYS = 365; // Assumed customer lifespan for prediction

export class ChurnAgent {
  /**
   * Calculate RFM (Recency, Frequency, Monetary) scores for all customers
   */
  static async calculateRFMScores(
    merchantId: string,
    storeIds: Types.ObjectId[],
    lookbackDays: number = 180
  ): Promise<RFMScore[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);

    // Aggregate customer order data
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
          lastOrderDate: { $max: '$createdAt' },
        },
      },
    ]);

    if (customerData.length === 0) {
      return [];
    }

    // Calculate percentiles for scoring
    const orderCounts = customerData.map((c) => c.totalOrders);
    const spentAmounts = customerData.map((c) => c.totalSpent);
    const now = new Date();

    // Calculate recency for each customer
    const rfmScores: RFMScore[] = customerData.map((customer) => {
      const daysSinceLastOrder = customer.lastOrderDate
        ? Math.floor((now.getTime() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
        : LIFESPAN_DAYS;

      return {
        userId: customer._id.toString(),
        recency: daysSinceLastOrder,
        frequency: customer.totalOrders,
        monetary: customer.totalSpent,
        recencyScore: 0,
        frequencyScore: 0,
        monetaryScore: 0,
        totalScore: 0,
      };
    });

    // Calculate scores using quintiles
    this.assignScores(rfmScores, 'recency', true);  // Lower is better
    this.assignScores(rfmScores, 'frequency', false); // Higher is better
    this.assignScores(rfmScores, 'monetary', false); // Higher is better

    return rfmScores;
  }

  /**
   * Assign quintile-based scores (1-5) to RFM values
   */
  private static assignScores(
    scores: RFMScore[],
    field: 'recency' | 'frequency' | 'monetary',
    inverse: boolean
  ): void {
    const values = scores.map((s) => s[field]);
    const sorted = [...values].sort((a, b) => a - b);

    const quintiles = [
      { min: 0, max: this.percentile(sorted, 20), score: inverse ? 5 : 1 },
      { min: this.percentile(sorted, 20), max: this.percentile(sorted, 40), score: inverse ? 4 : 2 },
      { min: this.percentile(sorted, 40), max: this.percentile(sorted, 60), score: 3 },
      { min: this.percentile(sorted, 60), max: this.percentile(sorted, 80), score: inverse ? 2 : 4 },
      { min: this.percentile(sorted, 80), max: Infinity, score: inverse ? 1 : 5 },
    ];

    scores.forEach((s) => {
      const value = s[field];
      const quintile = quintiles.find((q) => value >= q.min && value < q.max);
      const scoreField = `${field}Score` as keyof RFMScore;
      (s as unknown)[scoreField] = quintile ? quintile.score : 3;
    });

    scores.forEach((s) => {
      s.totalScore = s.recencyScore + s.frequencyScore + s.monetaryScore;
    });
  }

  /**
   * Calculate percentile value
   */
  private static percentile(sortedArr: number[], p: number): number {
    if (sortedArr.length === 0) return 0;
    const index = (p / 100) * (sortedArr.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sortedArr[lower];
    return sortedArr[lower] + (sortedArr[upper] - sortedArr[lower]) * (index - lower);
  }

  /**
   * Predict churn probability based on RFM scores and recency
   */
  static predictChurnProbability(rfmScore: RFMScore): number {
    // Base probability from RFM total score (15 = best, 3 = worst)
    const rfmBaseProbability = ((15 - rfmScore.totalScore) / 15) * 50;

    // Recency penalty (exponential for very old customers)
    const recencyPenalty = Math.min(50, (rfmScore.recency / 90) * 50);

    // Combine scores
    const baseProbability = rfmBaseProbability + recencyPenalty;

    // Apply sigmoid function for smooth 0-100 range
    const probability = 100 / (1 + Math.exp(-0.1 * (baseProbability - 50)));

    return Math.round(Math.max(0, Math.min(100, probability)));
  }

  /**
   * Determine churn risk level based on probability
   */
  static determineChurnRisk(probability: number): 'low' | 'medium' | 'high' | 'critical' {
    if (probability >= 80) return 'critical';
    if (probability >= 60) return 'high';
    if (probability >= 40) return 'medium';
    return 'low';
  }

  /**
   * Predict churn date based on current behavior
   */
  static predictChurnDate(
    lastOrderDate: Date | null,
    churnProbability: number
  ): Date | null {
    if (!lastOrderDate || churnProbability < 50) return null;

    // Estimate days until churn based on probability
    const maxDays = 90;
    const estimatedDaysUntilChurn = Math.round(
      maxDays - (churnProbability / 100) * maxDays
    );

    const churnDate = new Date(lastOrderDate);
    churnDate.setDate(churnDate.getDate() + estimatedDaysUntilChurn);

    return churnDate;
  }

  /**
   * Generate reasons for churn risk
   */
  static generateChurnReasons(rfmScore: RFMScore): string[] {
    const reasons: string[] = [];

    if (rfmScore.recency > 60) {
      reasons.push(`No order in ${rfmScore.recency} days`);
    }
    if (rfmScore.frequencyScore <= 2) {
      reasons.push('Low order frequency');
    }
    if (rfmScore.monetaryScore <= 2) {
      reasons.push('Below average spending');
    }
    if (rfmScore.totalScore <= 6) {
      reasons.push('Declining engagement across all metrics');
    }

    return reasons.length > 0 ? reasons : ['Monitor for potential decline'];
  }

  /**
   * Generate recommended actions based on churn risk
   */
  static generateRecommendedActions(
    churnRisk: string,
    rfmScore: RFMScore
  ): string[] {
    const actions: string[] = [];

    switch (churnRisk) {
      case 'critical':
        actions.push('Send win-back offer with significant discount');
        actions.push('Personal outreach via phone or SMS');
        actions.push('Consider exclusive deals to reactivate');
        break;
      case 'high':
        actions.push('Send personalized re-engagement email');
        actions.push('Offer loyalty points or cashback');
        actions.push('Highlight new products/services');
        break;
      case 'medium':
        actions.push('Send targeted promotions');
        actions.push('Invite to exclusive events');
        actions.push('Highlight recent reviews from similar customers');
        break;
      case 'low':
        actions.push('Continue regular engagement');
        actions.push('Encourage referrals with rewards');
        break;
    }

    return actions;
  }

  /**
   * Analyze all customers for a merchant and predict churn
   */
  static async analyzeChurn(
    merchantId: string,
    options?: {
      lookbackDays?: number;
      minDaysSinceLastOrder?: number;
    }
  ): Promise<ChurnAnalysisResult> {
    const lookbackDays = options?.lookbackDays || 180;
    const minDaysSinceLastOrder = options?.minDaysSinceLastOrder || 14;

    // Get merchant's stores
    const stores = await Store.find({ merchantId: new mongoose.Types.ObjectId(merchantId) })
      .select('_id')
      .lean();
    const storeIds = stores.map((s) => s._id);

    if (storeIds.length === 0) {
      return {
        merchantId,
        analyzedAt: new Date(),
        totalCustomers: 0,
        atRiskCustomers: [],
        churnedCustomers: [],
        healthyCustomers: [],
        summary: {
          churnRate: 0,
          averageChurnProbability: 0,
          criticalCount: 0,
          highRiskCount: 0,
          mediumRiskCount: 0,
          lowRiskCount: 0,
        },
        alerts: [],
      };
    }

    // Calculate RFM scores
    const rfmScores = await this.calculateRFMScores(merchantId, storeIds, lookbackDays);

    // Generate predictions
    const now = new Date();
    const atRiskCustomers: ChurnPrediction[] = [];
    const churnedCustomers: ChurnPrediction[] = [];
    const healthyCustomers: ChurnPrediction[] = [];

    for (const rfmScore of rfmScores) {
      if (rfmScore.recency < minDaysSinceLastOrder) {
        // Active customer - healthy
        healthyCustomers.push(this.createPrediction(rfmScore, now));
      } else if (rfmScore.recency >= DEFAULT_CHURN_THRESHOLDS.criticalDays) {
        // Likely churned
        churnedCustomers.push(this.createPrediction(rfmScore, now));
      } else {
        // At risk
        atRiskCustomers.push(this.createPrediction(rfmScore, now));
      }
    }

    // Generate alerts
    const alerts = this.generateAlerts(merchantId, [...atRiskCustomers, ...churnedCustomers]);

    // Calculate summary
    const allPredictions = [...atRiskCustomers, ...churnedCustomers, ...healthyCustomers];
    const summary = {
      churnRate: allPredictions.length > 0
        ? (churnedCustomers.length / allPredictions.length) * 100
        : 0,
      averageChurnProbability: allPredictions.length > 0
        ? allPredictions.reduce((sum, p) => sum + p.churnProbability, 0) / allPredictions.length
        : 0,
      criticalCount: churnedCustomers.length,
      highRiskCount: atRiskCustomers.filter((p) => p.churnRisk === 'high').length,
      mediumRiskCount: atRiskCustomers.filter((p) => p.churnRisk === 'medium').length,
      lowRiskCount: atRiskCustomers.filter((p) => p.churnRisk === 'low').length,
    };

    return {
      merchantId,
      analyzedAt: new Date(),
      totalCustomers: allPredictions.length,
      atRiskCustomers,
      churnedCustomers,
      healthyCustomers,
      summary,
      alerts,
    };
  }

  /**
   * Create a ChurnPrediction object from RFM score
   */
  private static createPrediction(rfmScore: RFMScore, now: Date): ChurnPrediction {
    const churnProbability = this.predictChurnProbability(rfmScore);
    const churnRisk = this.determineChurnRisk(churnProbability);
    const lastOrderDate = rfmScore.recency > 0
      ? new Date(now.getTime() - rfmScore.recency * 24 * 60 * 60 * 1000)
      : null;

    return {
      userId: rfmScore.userId,
      churnProbability,
      churnRisk,
      daysSinceLastOrder: rfmScore.recency,
      lastOrderDate,
      predictedChurnDate: this.predictChurnDate(lastOrderDate, churnProbability),
      rfmScore,
      reasons: this.generateChurnReasons(rfmScore),
      recommendedActions: this.generateRecommendedActions(churnRisk, rfmScore),
    };
  }

  /**
   * Generate alerts for high-risk customers
   */
  private static generateAlerts(
    merchantId: string,
    predictions: ChurnPrediction[]
  ): ChurnAlert[] {
    const alerts: ChurnAlert[] = [];

    for (const prediction of predictions) {
      if (prediction.churnRisk === 'critical') {
        alerts.push({
          userId: prediction.userId,
          merchantId,
          alertType: 'churned',
          severity: 'critical',
          message: `Customer has not ordered in ${prediction.daysSinceLastOrder} days - high risk of churn`,
          churnProbability: prediction.churnProbability,
          daysSinceLastOrder: prediction.daysSinceLastOrder,
          createdAt: new Date(),
        });
      } else if (prediction.churnRisk === 'high') {
        alerts.push({
          userId: prediction.userId,
          merchantId,
          alertType: 'at_risk',
          severity: 'warning',
          message: `Customer at risk - ${prediction.daysSinceLastOrder} days since last order`,
          churnProbability: prediction.churnProbability,
          daysSinceLastOrder: prediction.daysSinceLastOrder,
          createdAt: new Date(),
        });
      }
    }

    return alerts;
  }

  /**
   * Get churn prediction for a specific customer
   */
  static async getCustomerChurnPrediction(
    merchantId: string,
    userId: string
  ): Promise<ChurnPrediction | null> {
    const stores = await Store.find({ merchantId: new mongoose.Types.ObjectId(merchantId) })
      .select('_id')
      .lean();
    const storeIds = stores.map((s) => s._id);

    if (storeIds.length === 0) return null;

    // Get customer order data
    const customerData = await Order.aggregate([
      {
        $match: {
          store: { $in: storeIds },
          user: userId,
          'payment.status': 'paid',
        },
      },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totals.total' },
          lastOrderDate: { $max: '$createdAt' },
        },
      },
    ]);

    if (customerData.length === 0) {
      // Customer has no orders - consider them as potentially churned
      return {
        userId,
        churnProbability: 100,
        churnRisk: 'critical',
        daysSinceLastOrder: LIFESPAN_DAYS,
        lastOrderDate: null,
        predictedChurnDate: new Date(),
        rfmScore: {
          userId,
          recency: LIFESPAN_DAYS,
          frequency: 0,
          monetary: 0,
          recencyScore: 1,
          frequencyScore: 1,
          monetaryScore: 1,
          totalScore: 3,
        },
        reasons: ['No order history found'],
        recommendedActions: ['Send welcome offer to re-engage'],
      };
    }

    const customer = customerData[0];
    const now = new Date();
    const daysSinceLastOrder = customer.lastOrderDate
      ? Math.floor((now.getTime() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
      : LIFESPAN_DAYS;

    const rfmScore: RFMScore = {
      userId,
      recency: daysSinceLastOrder,
      frequency: customer.totalOrders,
      monetary: customer.totalSpent,
      recencyScore: 0,
      frequencyScore: 0,
      monetaryScore: 0,
      totalScore: 0,
    };

    // Get RFM scores from broader analysis for scoring context
    const allRfmScores = await this.calculateRFMScores(merchantId, storeIds, 180);
    const targetCustomer = allRfmScores.find((s) => s.userId === userId);

    if (targetCustomer) {
      return this.createPrediction(targetCustomer, now);
    }

    // Fallback scoring if customer not in recent analysis
    this.assignScores([rfmScore], 'recency', true);
    this.assignScores([rfmScore], 'frequency', false);
    this.assignScores([rfmScore], 'monetary', false);

    return this.createPrediction(rfmScore, now);
  }

  /**
   * Get customers by churn risk level
   */
  static async getCustomersByRiskLevel(
    merchantId: string,
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<ChurnPrediction[]> {
    const analysis = await this.analyzeChurn(merchantId);

    switch (riskLevel) {
      case 'critical':
        return analysis.churnedCustomers.filter((c) => c.churnRisk === 'critical');
      case 'high':
        return analysis.atRiskCustomers.filter((c) => c.churnRisk === 'high');
      case 'medium':
        return analysis.atRiskCustomers.filter((c) => c.churnRisk === 'medium');
      case 'low':
        return analysis.atRiskCustomers.filter((c) => c.churnRisk === 'low');
      default:
        return [];
    }
  }
}

export default ChurnAgent;
