/**
 * COD Intelligence Tests
 * Tests for Cash on Delivery risk scoring and fraud detection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface Order {
  id: string;
  customerId: string;
  amount: number;
  pincode: string;
  customerAge: number;
  orderCount: number;
  successRate: number;
  addressType: 'home' | 'office' | 'other';
  paymentMethod: 'cod' | 'prepaid';
  createdAt: Date;
}

interface RiskScore {
  orderId: string;
  score: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  factors: RiskFactor[];
  recommendation: 'approve' | 'review' | 'reject';
}

interface RiskFactor {
  name: string;
  impact: number; // -10 to +10
  description: string;
}

// Risk scoring
function calculateRiskScore(order: Order): RiskScore {
  const factors: RiskFactor[] = [];
  let score = 50; // Start neutral

  // Amount factor
  if (order.amount > 10000) {
    score += 15;
    factors.push({
      name: 'high_value',
      impact: 15,
      description: 'Order value exceeds ₹10,000'
    });
  } else if (order.amount > 5000) {
    score += 5;
    factors.push({
      name: 'medium_value',
      impact: 5,
      description: 'Order value between ₹5,000-10,000'
    });
  } else {
    score -= 5;
    factors.push({
      name: 'low_value',
      impact: -5,
      description: 'Order value under ₹5,000'
    });
  }

  // Customer history factor
  if (order.orderCount === 0) {
    score += 20;
    factors.push({
      name: 'new_customer',
      impact: 20,
      description: 'First-time customer'
    });
  } else if (order.orderCount < 3) {
    score += 10;
    factors.push({
      name: 'new_customer',
      impact: 10,
      description: 'Customer with less than 3 orders'
    });
  } else if (order.successRate > 0.9) {
    score -= 15;
    factors.push({
      name: 'trusted_customer',
      impact: -15,
      description: 'Customer with >90% success rate'
    });
  }

  // Success rate factor
  if (order.successRate < 0.5) {
    score += 25;
    factors.push({
      name: 'low_success_rate',
      impact: 25,
      description: 'COD success rate below 50%'
    });
  } else if (order.successRate < 0.7) {
    score += 10;
    factors.push({
      name: 'medium_success_rate',
      impact: 10,
      description: 'COD success rate 50-70%'
    });
  } else if (order.successRate > 0.85) {
    score -= 10;
    factors.push({
      name: 'high_success_rate',
      impact: -10,
      description: 'COD success rate above 85%'
    });
  }

  // Address type factor
  if (order.addressType === 'office') {
    score -= 10;
    factors.push({
      name: 'office_address',
      impact: -10,
      description: 'Office delivery address'
    });
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine risk level
  let riskLevel: RiskScore['riskLevel'];
  if (score < 30) {
    riskLevel = 'low';
  } else if (score < 60) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  // Determine recommendation
  let recommendation: RiskScore['recommendation'];
  if (score < 25) {
    recommendation = 'approve';
  } else if (score < 50) {
    recommendation = 'review';
  } else {
    recommendation = 'reject';
  }

  return {
    orderId: order.id,
    score,
    riskLevel,
    factors,
    recommendation,
  };
}

// Pincode analysis
interface PincodeRisk {
  pincode: string;
  totalOrders: number;
  codSuccessRate: number;
  avgOrderValue: number;
}

function calculatePincodeRisk(
  pincode: string,
  orders: Order[]
): PincodeRisk {
  const pincodeOrders = orders.filter(o => o.pincode === pincode);

  if (pincodeOrders.length === 0) {
    return {
      pincode,
      totalOrders: 0,
      codSuccessRate: 0.85, // Default assumption
      avgOrderValue: 0,
    };
  }

  const codOrders = pincodeOrders.filter(o => o.paymentMethod === 'cod');
  const successCount = codOrders.filter(o => o.successRate > 0.5).length;

  return {
    pincode,
    totalOrders: pincodeOrders.length,
    codSuccessRate: codOrders.length > 0 ? successCount / codOrders.length : 0,
    avgOrderValue: pincodeOrders.reduce((sum, o) => sum + o.amount, 0) / pincodeOrders.length,
  };
}

// Batch risk calculation
function calculateBatchRisk(orders: Order[]): {
  approved: number;
  review: number;
  rejected: number;
  avgRiskScore: number;
} {
  let approved = 0, review = 0, rejected = 0;
  let totalScore = 0;

  for (const order of orders) {
    const risk = calculateRiskScore(order);
    totalScore += risk.score;

    switch (risk.recommendation) {
      case 'approve': approved++; break;
      case 'review': review++; break;
      case 'reject': rejected++; break;
    }
  }

  return {
    approved,
    review,
    rejected,
    avgRiskScore: orders.length > 0 ? totalScore / orders.length : 0,
  };
}

describe('Risk Score Calculation', () => {
  it('should calculate high risk for new customer with high-value order', () => {
    const order: Order = {
      id: 'order_1',
      customerId: 'cust_1',
      amount: 15000,
      pincode: '560001',
      customerAge: 25,
      orderCount: 0,
      successRate: 0,
      addressType: 'home',
      paymentMethod: 'cod',
      createdAt: new Date(),
    };

    const risk = calculateRiskScore(order);

    expect(risk.riskLevel).toBe('high');
    expect(risk.recommendation).toBe('reject');
    expect(risk.factors.some(f => f.name === 'new_customer')).toBe(true);
    expect(risk.factors.some(f => f.name === 'high_value')).toBe(true);
  });

  it('should calculate low risk for trusted customer', () => {
    const order: Order = {
      id: 'order_2',
      customerId: 'cust_2',
      amount: 2000,
      pincode: '560001',
      customerAge: 30,
      orderCount: 10,
      successRate: 0.95,
      addressType: 'office',
      paymentMethod: 'cod',
      createdAt: new Date(),
    };

    const risk = calculateRiskScore(order);

    expect(risk.riskLevel).toBe('low');
    expect(risk.recommendation).toBe('approve');
  });

  it('should return medium risk for moderate order', () => {
    const order: Order = {
      id: 'order_3',
      customerId: 'cust_3',
      amount: 3000,
      pincode: '560001',
      customerAge: 28,
      orderCount: 2,
      successRate: 0.6,
      addressType: 'home',
      paymentMethod: 'cod',
      createdAt: new Date(),
    };

    const risk = calculateRiskScore(order);

    expect(risk.riskLevel).toBe('medium');
    expect(risk.recommendation).toBe('review');
  });
});

describe('Pincode Risk Analysis', () => {
  const orders: Order[] = [
    { id: '1', customerId: 'c1', amount: 1000, pincode: '560001', customerAge: 25, orderCount: 5, successRate: 0.8, addressType: 'home', paymentMethod: 'cod', createdAt: new Date() },
    { id: '2', customerId: 'c2', amount: 2000, pincode: '560001', customerAge: 30, orderCount: 3, successRate: 0.5, addressType: 'home', paymentMethod: 'cod', createdAt: new Date() },
    { id: '3', customerId: 'c3', amount: 1500, pincode: '560001', customerAge: 28, orderCount: 8, successRate: 0.9, addressType: 'office', paymentMethod: 'cod', createdAt: new Date() },
    { id: '4', customerId: 'c4', amount: 3000, pincode: '560002', customerAge: 35, orderCount: 15, successRate: 0.95, addressType: 'home', paymentMethod: 'cod', createdAt: new Date() },
  ];

  it('should analyze pincode with orders', () => {
    const risk = calculatePincodeRisk('560001', orders);

    expect(risk.totalOrders).toBe(3);
    expect(risk.codSuccessRate).toBeCloseTo(0.67, 1);
    expect(risk.avgOrderValue).toBe(1500);
  });

  it('should return default for unknown pincode', () => {
    const risk = calculatePincodeRisk('999999', orders);

    expect(risk.totalOrders).toBe(0);
    expect(risk.codSuccessRate).toBe(0.85);
  });
});

describe('Batch Risk Calculation', () => {
  const orders: Order[] = [
    { id: '1', customerId: 'c1', amount: 50000, pincode: '560001', customerAge: 25, orderCount: 0, successRate: 0, addressType: 'home', paymentMethod: 'cod', createdAt: new Date() },
    { id: '2', customerId: 'c2', amount: 1000, pincode: '560001', customerAge: 30, orderCount: 20, successRate: 0.95, addressType: 'office', paymentMethod: 'cod', createdAt: new Date() },
    { id: '3', customerId: 'c3', amount: 3000, pincode: '560001', customerAge: 28, orderCount: 5, successRate: 0.7, addressType: 'home', paymentMethod: 'cod', createdAt: new Date() },
  ];

  it('should calculate batch statistics', () => {
    const batch = calculateBatchRisk(orders);

    expect(batch.approved + batch.review + batch.rejected).toBe(3);
    expect(batch.avgRiskScore).toBeGreaterThan(0);
    expect(batch.avgRiskScore).toBeLessThan(100);
  });
});

describe('Risk Factors', () => {
  it('should include impact values', () => {
    const order: Order = {
      id: 'order_1',
      customerId: 'cust_1',
      amount: 20000,
      pincode: '560001',
      customerAge: 25,
      orderCount: 0,
      successRate: 0.3,
      addressType: 'home',
      paymentMethod: 'cod',
      createdAt: new Date(),
    };

    const risk = calculateRiskScore(order);

    risk.factors.forEach(factor => {
      expect(factor.impact).toBeGreaterThanOrEqual(-10);
      expect(factor.impact).toBeLessThanOrEqual(25);
    });
  });
});
