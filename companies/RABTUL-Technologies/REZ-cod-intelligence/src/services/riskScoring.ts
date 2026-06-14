/**
 * COD Intelligence - Risk Scoring Service
 * Real-time order risk assessment
 */

import { CustomerRTO, PincodeRTO, MerchantRTO, OrderRiskScore, FraudPattern } from '../models';

// ============================================
// RISK THRESHOLDS
// ============================================

const THRESHOLDS = {
  customer: {
    low: 20,
    medium: 50,
    high: 75,
    veryHigh: 90,
  },
  pincode: {
    low: 10,
    medium: 25,
    high: 40,
    veryHigh: 60,
  },
  order: {
    low: 20,
    medium: 50,
    high: 75,
    veryHigh: 90,
  },
  total: {
    approve: 30,
    review: 60,
    reject: 85,
  },
};

// ============================================
// CUSTOMER RISK SCORING
// ============================================

async function scoreCustomerRisk(customerId: string, customerPhone: string): Promise<{ score: number; factors: string[] }> {
  let score = 30; // Base score
  const factors: string[] = [];

  const customer = await CustomerRTO.findOne({ $or: [{ customerId }, { customerPhone }] });

  if (customer) {
    // RTO Rate impact (0-40 points)
    if (customer.rtoRate > 0.5) {
      score += 40;
      factors.push(`High RTO rate: ${(customer.rtoRate * 100).toFixed(1)}%`);
    } else if (customer.rtoRate > 0.3) {
      score += 25;
      factors.push(`Medium RTO rate: ${(customer.rtoRate * 100).toFixed(1)}%`);
    } else if (customer.rtoRate < 0.1) {
      score -= 15;
      factors.push(`Low RTO rate: ${(customer.rtoRate * 100).toFixed(1)}%`);
    }

    // Order count (0-15 points)
    if (customer.totalOrders === 0) {
      score += 15;
      factors.push('New customer');
    } else if (customer.totalOrders < 3) {
      score += 8;
      factors.push('Few orders: ' + customer.totalOrders);
    } else if (customer.totalOrders > 10) {
      score -= 10;
      factors.push('Repeat customer: ' + customer.totalOrders + ' orders');
    }

    // High value cancellations (0-20 points)
    score += Math.min(20, customer.highValueCancellations * 10);
    if (customer.highValueCancellations > 0) {
      factors.push(`High-value cancellations: ${customer.highValueCancellations}`);
    }

    // Recent RTO (0-15 points)
    if (customer.lastRTODate) {
      const daysSinceRTO = (Date.now() - customer.lastRTODate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceRTO < 7) {
        score += 15;
        factors.push(`Recent RTO: ${daysSinceRTO.toFixed(0)} days ago`);
      } else if (daysSinceRTO < 30) {
        score += 8;
        factors.push(`RTO in last month`);
      }
    }

    // Phone/address changes (0-10 points)
    score += Math.min(10, (customer.phoneChanges + customer.addressChanges) * 5);
    if (customer.phoneChanges + customer.addressChanges > 0) {
      factors.push(`Contact changes: ${customer.phoneChanges + customer.addressChanges}`);
    }
  } else {
    score += 10;
    factors.push('New customer (no history)');
  }

  return { score: Math.max(0, Math.min(100, score)), factors };
}

// ============================================
// PINCODE RISK SCORING
// ============================================

async function scorePincodeRisk(pincode: string): Promise<{ score: number; factors: string[] }> {
  let score = 20; // Base score
  const factors: string[] = [];

  const pincodeData = await PincodeRTO.findOne({ pincode });

  if (pincodeData) {
    // RTO Rate impact (0-40 points)
    if (pincodeData.rtoRate > THRESHOLDS.pincode.veryHigh / 100) {
      score += 40;
      factors.push(`Very high area RTO: ${(pincodeData.rtoRate * 100).toFixed(1)}%`);
    } else if (pincodeData.rtoRate > THRESHOLDS.pincode.high / 100) {
      score += 25;
      factors.push(`High area RTO: ${(pincodeData.rtoRate * 100).toFixed(1)}%`);
    } else if (pincodeData.rtoRate < THRESHOLDS.pincode.low / 100) {
      score -= 10;
      factors.push(`Low area RTO: ${(pincodeData.rtoRate * 100).toFixed(1)}%`);
    }

    // Volume (0-10 points)
    if (pincodeData.totalOrders > 100) {
      score -= 5;
      factors.push(`High volume area: ${pincodeData.totalOrders} orders`);
    } else if (pincodeData.totalOrders < 10) {
      score += 5;
      factors.push(`Low volume: ${pincodeData.totalOrders} orders`);
    }
  } else {
    score += 10;
    factors.push('Unknown pincode');
  }

  return { score: Math.max(0, Math.min(100, score)), factors };
}

// ============================================
// ORDER RISK SCORING
// ============================================

async function scoreOrderRisk(
  amount: number,
  items: unknown[],
  customerId: string
): Promise<{ score: number; factors: string[] }> {
  let score = 30; // Base score
  const factors: string[] = [];

  // High value order (0-25 points)
  if (amount > 5000) {
    score += 15;
    factors.push(`High value: ₹${amount}`);
  }
  if (amount > 10000) {
    score += 10;
    factors.push(`Very high value: ₹${amount}`);
  }

  // Item count (0-10 points)
  if (items && items.length > 5) {
    score += 10;
    factors.push(`Many items: ${items.length}`);
  }

  // High-risk categories (0-15 points)
  const highRiskCategories = ['electronics', 'jewelry', 'gaming', 'fashion-luxury'];
  const hasHighRisk = items?.some(item =>
    highRiskCategories.some(cat => item.category?.toLowerCase().includes(cat))
  );
  if (hasHighRisk) {
    score += 15;
    factors.push('High-risk category items');
  }

  // New customer + high value (0-15 points)
  if (customerId) {
    const customer = await CustomerRTO.findOne({ customerId });
    if (customer && customer.totalOrders === 0 && amount > 2000) {
      score += 15;
      factors.push('New customer + high value');
    }
  }

  return { score: Math.max(0, Math.min(100, score)), factors };
}

// ============================================
// FRAUD PATTERN CHECKING
// ============================================

async function checkFraudPatterns(data: {
  customerPhone?: string;
  customerId?: string;
  pincode?: string;
  email?: string;
}): Promise<{ score: number; patterns: string[] }> {
  let score = 0;
  const patterns: string[] = [];

  // Check phone patterns
  if (data.customerPhone) {
    const phonePatterns = await FraudPattern.find({
      patternType: 'phone',
      active: true,
    });

    for (const pattern of phonePatterns) {
      if (new RegExp(pattern.pattern).test(data.customerPhone)) {
        score += pattern.severity * 3;
        patterns.push(pattern.description || `Phone pattern: ${pattern.pattern}`);
        if (pattern.autoBlock) {
          return { score: 100, patterns };
        }
      }
    }
  }

  return { score: Math.min(100, score), patterns };
}

// ============================================
// MAIN SCORING FUNCTION
// ============================================

export interface ScoreOrderInput {
  orderId: string;
  customerId?: string;
  customerPhone: string;
  customerEmail?: string;
  amount: number;
  items?: unknown[];
  pincode?: string;
  merchantId?: string;
  courier?: string;
}

export interface ScoreOrderOutput {
  orderId: string;
  totalScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  decision: 'approve' | 'review' | 'reject' | 'prepay';
  breakdown: {
    customerScore: number;
    pincodeScore: number;
    orderScore: number;
    fraudScore: number;
  };
  factors: string[];
  recommendations: {
    action: string;
    reason: string;
    confidence: number;
  }[];
}

export async function scoreOrder(input: ScoreOrderInput): Promise<ScoreOrderOutput> {
  // Parallel scoring
  const [customerRisk, pincodeRisk, orderRisk, fraudCheck] = await Promise.all([
    scoreCustomerRisk(input.customerId || '', input.customerPhone),
    scorePincodeRisk(input.pincode || ''),
    scoreOrderRisk(input.amount, input.items || [], input.customerId || ''),
    checkFraudPatterns({
      customerPhone: input.customerPhone,
      customerId: input.customerId,
      pincode: input.pincode,
      email: input.customerEmail,
    }),
  ]);

  // Weighted average
  const weights = {
    customer: 0.35,
    pincode: 0.25,
    order: 0.25,
    fraud: 0.15,
  };

  const totalScore = Math.round(
    customerRisk.score * weights.customer +
    pincodeRisk.score * weights.pincode +
    orderRisk.score * weights.order +
    fraudCheck.score * weights.fraud
  );

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  if (totalScore < THRESHOLDS.total.approve) {
    riskLevel = 'low';
  } else if (totalScore < THRESHOLDS.total.review) {
    riskLevel = 'medium';
  } else if (totalScore < THRESHOLDS.total.reject) {
    riskLevel = 'high';
  } else {
    riskLevel = 'very_high';
  }

  // Determine decision
  let decision: 'approve' | 'review' | 'reject' | 'prepay';
  if (totalScore < THRESHOLDS.total.approve) {
    decision = 'approve';
  } else if (totalScore < THRESHOLDS.total.review) {
    decision = 'review';
  } else if (totalScore < 90) {
    decision = 'prepay';
  } else {
    decision = 'reject';
  }

  // Build recommendations
  const recommendations: unknown[] = [];
  const allFactors = [...customerRisk.factors, ...pincodeRisk.factors, ...orderRisk.factors, ...fraudCheck.patterns];

  if (decision === 'reject') {
    recommendations.push({
      action: 'BLOCK_COD',
      reason: 'High fraud risk detected',
      confidence: 0.95,
    });
  } else if (decision === 'prepay') {
    recommendations.push({
      action: 'REQUEST_PREPAID',
      reason: 'COD risk above threshold',
      confidence: 0.85,
    });
  } else if (decision === 'review') {
    recommendations.push({
      action: 'MANUAL_REVIEW',
      reason: 'Multiple risk factors present',
      confidence: 0.7,
    });
  } else {
    recommendations.push({
      action: 'APPROVE_COD',
      reason: 'Low risk order',
      confidence: 0.9,
    });
  }

  // Add specific recommendations based on factors
  if (pincodeRisk.score > 30) {
    recommendations.push({
      action: 'VERIFY_ADDRESS',
      reason: 'High-risk delivery area',
      confidence: 0.8,
    });
  }

  if (customerRisk.score > 40) {
    recommendations.push({
      action: 'VERIFY_CUSTOMER',
      reason: 'Customer has RTO history',
      confidence: 0.75,
    });
  }

  if (orderRisk.score > 50) {
    recommendations.push({
      action: 'HIGH_VALUE_INSURANCE',
      reason: 'High-value order',
      confidence: 0.9,
    });
  }

  // Save score
  await OrderRiskScore.findOneAndUpdate(
    { orderId: input.orderId },
    {
      orderId: input.orderId,
      customerId: input.customerId,
      customerPhone: input.customerPhone,
      amount: input.amount,
      items: input.items,
      pincode: input.pincode,
      merchantId: input.merchantId,
      courier: input.courier,
      customerRisk: customerRisk.score,
      pincodeRisk: pincodeRisk.score,
      orderRisk: orderRisk.score,
      totalRiskScore: totalScore,
      recommendations,
      decision,
      checkedAt: new Date(),
    },
    { upsert: true }
  );

  return {
    orderId: input.orderId,
    totalScore,
    riskLevel,
    decision,
    breakdown: {
      customerScore: customerRisk.score,
      pincodeScore: pincodeRisk.score,
      orderScore: orderRisk.score,
      fraudScore: fraudCheck.score,
    },
    factors: allFactors,
    recommendations,
  };
}

// ============================================
// UPDATE CUSTOMER STATS
// ============================================

export async function updateCustomerStats(customerId: string, outcome: string) {
  const isRTO = outcome === 'rto';
  const isRefund = outcome === 'refunded';

  await CustomerRTO.findOneAndUpdate(
    { customerId },
    {
      $inc: {
        totalOrders: 1,
        codOrders: 1,
        deliveredOrders: isRTO || isRefund ? 0 : 1,
        rtoOrders: isRTO ? 1 : 0,
        refundedOrders: isRefund ? 1 : 0,
      },
      $set: {
        lastOrderDate: new Date(),
        lastRTODate: isRTO ? new Date() : undefined,
      },
      $setOnInsert: {
        customerId,
        customerPhone: '',
      },
    },
    { upsert: true }
  );

  // Recalculate rates
  const customer = await CustomerRTO.findOne({ customerId });
  if (customer) {
    customer.rtoRate = customer.totalOrders > 0
      ? customer.rtoOrders / customer.totalOrders
      : 0;
    customer.refundRate = customer.totalOrders > 0
      ? customer.refundedOrders / customer.totalOrders
      : 0;

    // Update risk level
    if (customer.rtoRate > 0.5) {
      customer.riskLevel = 'very_high';
      customer.riskScore = 80;
    } else if (customer.rtoRate > 0.3) {
      customer.riskLevel = 'high';
      customer.riskScore = 65;
    } else if (customer.rtoRate > 0.1) {
      customer.riskLevel = 'medium';
      customer.riskScore = 45;
    } else {
      customer.riskLevel = 'low';
      customer.riskScore = 25;
    }

    await customer.save();
  }
}

// ============================================
// UPDATE PINCODE STATS
// ============================================

export async function updatePincodeStats(pincode: string, outcome: string, courier?: string) {
  const isRTO = outcome === 'rto';
  const isRefund = outcome === 'refunded';

  await PincodeRTO.findOneAndUpdate(
    { pincode },
    {
      $inc: {
        totalOrders: 1,
        deliveredOrders: isRTO || isRefund ? 0 : 1,
        rtoOrders: isRTO ? 1 : 0,
        refundedOrders: isRefund ? 1 : 0,
      },
      $setOnInsert: { pincode },
    },
    { upsert: true }
  );

  // Recalculate rates
  const data = await PincodeRTO.findOne({ pincode });
  if (data) {
    data.rtoRate = data.totalOrders > 0 ? data.rtoOrders / data.totalOrders : 0;
    data.refundRate = data.totalOrders > 0 ? data.refundedOrders / data.totalOrders : 0;

    // Update courier performance
    if (courier) {
      const courierPerf = data.courierPerformance.find(c => c.courier === courier);
      if (courierPerf) {
        courierPerf.orders += 1;
        if (isRTO) courierPerf.rtoRate = (courierPerf.rtoRate * (courierPerf.orders - 1) + 1) / courierPerf.orders;
      } else {
        data.courierPerformance.push({
          courier,
          orders: 1,
          rtoRate: isRTO ? 1 : 0,
        });
      }
    }

    await data.save();
  }
}
