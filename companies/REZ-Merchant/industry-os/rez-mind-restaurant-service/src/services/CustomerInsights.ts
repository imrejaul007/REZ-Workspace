import { differenceInDays, differenceInHours } from 'date-fns';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  joinDate: Date;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: Date;
  favoriteItems: string[];
  dietaryPreferences: string[];
  orderFrequency: number; // orders per month
}

export interface ChurnPrediction {
  customerId: string;
  churnRisk: 'low' | 'medium' | 'high' | 'critical';
  churnProbability: number;
  daysUntilChurn: number | null;
  factors: ChurnFactor[];
  retentionRecommendations: RetentionRecommendation[];
}

export interface ChurnFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface RetentionRecommendation {
  type: 'discount' | 'personalized_offer' | 'loyalty_bonus' | 'reengagement' | 'win_back';
  title: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  expectedUplift: number; // percentage
}

export interface CustomerSegment {
  segment: string;
  count: number;
  percentage: number;
  avgOrderValue: number;
  avgOrderFrequency: number;
  characteristics: string[];
}

export interface CustomerLifetimeValue {
  customerId: string;
  currentLTV: number;
  predictedLTV3Month: number;
  predictedLTV6Month: number;
  predictedLTV12Month: number;
  confidence: number;
  factors: { name: string; impact: number }[];
}

export interface CustomerBehaviorInsights {
  preferredVisitTime: { hour: number; dayOfWeek: number }[];
  averageOrderSize: number;
  categoryPreferences: Map<string, number>;
  priceSensitivity: 'low' | 'medium' | 'high';
  orderType: 'dine-in' | 'delivery' | 'takeaway' | 'mixed';
  responsivenessToPromotions: number; // 0-100
}

export interface SegmentAnalysis {
  segments: CustomerSegment[];
  insights: {
    mostValuableSegment: string;
    fastestGrowingSegment: string;
    atRiskSegment: string;
    acquisitionSource: string;
  };
}

export class CustomerInsightsService {
  private customers: Map<string, Customer>;
  private churnModelWeights: ChurnModelWeights;

  constructor() {
    this.customers = new Map();
    this.churnModelWeights = {
      daysSinceLastOrder: { weight: 0.25, threshold: 30 },
      orderFrequency: { weight: 0.2, threshold: 2 },
      averageOrderValue: { weight: 0.15, threshold: 0.8 },
      totalOrders: { weight: 0.1, threshold: 5 },
      engagement: { weight: 0.15, threshold: 0.5 },
      promotionalResponse: { weight: 0.15, threshold: 0.3 },
    };
  }

  /**
   * Load customer data
   */
  loadCustomers(customers: Customer[]): void {
    this.customers.clear();
    for (const customer of customers) {
      this.customers.set(customer.id, customer);
    }
  }

  /**
   * Predict churn risk for a customer
   */
  predictChurn(customerId: string): ChurnPrediction {
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    const daysSinceLastOrder = differenceInDays(new Date(), customer.lastOrderDate);
    const churnProbability = this.calculateChurnProbability(customer, daysSinceLastOrder);
    const churnRisk = this.getChurnRiskLevel(churnProbability);
    const daysUntilChurn = this.estimateDaysUntilChurn(daysSinceLastOrder, churnProbability);
    const factors = this.analyzeChurnFactors(customer, daysSinceLastOrder);
    const retentionRecommendations = this.generateRetentionRecommendations(
      customer,
      churnRisk,
      churnProbability
    );

    return {
      customerId,
      churnRisk,
      churnProbability: Math.round(churnProbability * 100) / 100,
      daysUntilChurn,
      factors,
      retentionRecommendations,
    };
  }

  /**
   * Calculate churn probability based on customer behavior
   */
  private calculateChurnProbability(customer: Customer, daysSinceLastOrder: number): number {
    let probability = 0;

    // Days since last order factor
    const daysScore = Math.min(daysSinceLastOrder / this.churnModelWeights.daysSinceLastOrder.threshold, 2);
    probability += daysScore * this.churnModelWeights.daysSinceLastOrder.weight * 100;

    // Order frequency factor
    const frequencyScore = customer.orderFrequency < this.churnModelWeights.orderFrequency.threshold ? 1 : 0;
    probability += frequencyScore * this.churnModelWeights.orderFrequency.weight * 100;

    // Average order value decline factor
    const avgSpend = customer.totalSpent / Math.max(customer.totalOrders, 1);
    const expectedSpend = customer.averageOrderValue * 0.8;
    const valueDecline = avgSpend < expectedSpend ? 1 : 0;
    probability += valueDecline * this.churnModelWeights.averageOrderValue.weight * 100;

    // Total orders factor (new customers more likely to churn)
    const newCustomerPenalty = customer.totalOrders < this.churnModelWeights.totalOrders.threshold ? 1 : 0;
    probability += newCustomerPenalty * this.churnModelWeights.totalOrders.weight * 100;

    // Engagement factor (based on communication responsiveness)
    const engagementScore = customer.orderFrequency > 0 ? Math.min(customer.orderFrequency / 4, 1) : 0;
    probability += (1 - engagementScore) * this.churnModelWeights.engagement.weight * 100;

    return Math.min(Math.max(probability, 0), 100);
  }

  /**
   * Get churn risk level category
   */
  private getChurnRiskLevel(probability: number): 'low' | 'medium' | 'high' | 'critical' {
    if (probability >= 80) return 'critical';
    if (probability >= 60) return 'high';
    if (probability >= 40) return 'medium';
    return 'low';
  }

  /**
   * Estimate days until expected churn
   */
  private estimateDaysUntilChurn(daysSinceLastOrder: number, churnProbability: number): number | null {
    if (churnProbability < 30) return null;
    if (churnProbability >= 80) return Math.max(0, daysSinceLastOrder - 14);
    if (churnProbability >= 60) return Math.max(7, 30 - daysSinceLastOrder);
    return Math.max(14, 60 - daysSinceLastOrder);
  }

  /**
   * Analyze factors contributing to churn risk
   */
  private analyzeChurnFactors(customer: Customer, daysSinceLastOrder: number): ChurnFactor[] {
    const factors: ChurnFactor[] = [];

    // Recency factor
    if (daysSinceLastOrder > 14) {
      factors.push({
        name: 'Recent inactivity',
        impact: 'negative',
        weight: 0.3,
        description: `${daysSinceLastOrder} days since last order`,
      });
    } else {
      factors.push({
        name: 'Recent activity',
        impact: 'positive',
        weight: 0.2,
        description: 'Active in the last 14 days',
      });
    }

    // Order frequency
    if (customer.orderFrequency < 2) {
      factors.push({
        name: 'Low visit frequency',
        impact: 'negative',
        weight: 0.2,
        description: `Only ${customer.orderFrequency} orders per month`,
      });
    } else {
      factors.push({
        name: 'Consistent visits',
        impact: 'positive',
        weight: 0.15,
        description: `${customer.orderFrequency} orders per month`,
      });
    }

    // Order value
    const avgOrderValue = customer.totalSpent / Math.max(customer.totalOrders, 1);
    if (avgOrderValue > customer.averageOrderValue * 1.2) {
      factors.push({
        name: 'High value customer',
        impact: 'positive',
        weight: 0.2,
        description: 'Above average spending per order',
      });
    }

    // Customer tenure
    const customerAge = differenceInDays(new Date(), customer.joinDate);
    if (customerAge > 90) {
      factors.push({
        name: 'Long-term customer',
        impact: 'positive',
        weight: 0.15,
        description: `${Math.round(customerAge / 30)} months as customer`,
      });
    } else if (customerAge < 30) {
      factors.push({
        name: 'New customer',
        impact: 'negative',
        weight: 0.15,
        description: 'Less than 1 month as customer',
      });
    }

    // Favorites engagement
    if (customer.favoriteItems.length > 0) {
      factors.push({
        name: 'Established preferences',
        impact: 'positive',
        weight: 0.1,
        description: `${customer.favoriteItems.length} favorite items`,
      });
    }

    return factors;
  }

  /**
   * Generate retention recommendations
   */
  private generateRetentionRecommendations(
    customer: Customer,
    churnRisk: 'low' | 'medium' | 'high' | 'critical',
    churnProbability: number
  ): RetentionRecommendation[] {
    const recommendations: RetentionRecommendation[] = [];

    if (churnRisk === 'critical' || churnRisk === 'high') {
      recommendations.push({
        type: 'win_back',
        title: 'Win-back offer',
        description: `Send exclusive win-back offer: 25% off next order + free delivery`,
        urgency: 'high',
        expectedUplift: 40,
      });

      recommendations.push({
        type: 'personalized_offer',
        title: 'Favorite items promotion',
        description: `Offer 30% off on ${customer.favoriteItems.slice(0, 2).join(' and ')}`,
        urgency: 'high',
        expectedUplift: 35,
      });
    }

    if (churnRisk === 'medium' || churnRisk === 'high') {
      recommendations.push({
        type: 'loyalty_bonus',
        title: 'Loyalty points bonus',
        description: 'Double points on next 3 orders',
        urgency: 'medium',
        expectedUplift: 20,
      });

      recommendations.push({
        type: 'reengagement',
        title: 'Personal check-in',
        description: 'Send personalized message asking about experience',
        urgency: 'medium',
        expectedUplift: 15,
      });
    }

    if (customer.orderFrequency > 0 && customer.orderFrequency < 4) {
      recommendations.push({
        type: 'discount',
        title: 'Frequency booster',
        description: '15% off when ordering 2+ times this month',
        urgency: 'low',
        expectedUplift: 25,
      });
    }

    if (customer.favoriteItems.length > 0) {
      recommendations.push({
        type: 'personalized_offer',
        title: 'New menu introduction',
        description: `Tell them about new items similar to their favorites`,
        urgency: 'low',
        expectedUplift: 10,
      });
    }

    return recommendations.slice(0, 3);
  }

  /**
   * Calculate customer lifetime value
   */
  calculateLTV(customerId: string): CustomerLifetimeValue {
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    const avgOrderValue = customer.totalSpent / Math.max(customer.totalOrders, 1);
    const monthlyValue = avgOrderValue * customer.orderFrequency;
    const churnRisk = this.predictChurn(customerId).churnProbability / 100;

    // Retention probability
    const retentionRate = Math.max(0.5, 1 - churnRisk);

    // Calculate LTV for different time horizons
    const discountRate = 0.1; // 10% annual discount rate

    const calculatePresentValue = (months: number, monthlyVal: number): number => {
      let pv = 0;
      for (let i = 1; i <= months; i++) {
        pv += monthlyVal * Math.pow(retentionRate, i) / Math.pow(1 + discountRate / 12, i);
      }
      return pv;
    };

    const currentLTV = customer.totalSpent;
    const ltv3Month = calculatePresentValue(3, monthlyValue) + currentLTV;
    const ltv6Month = calculatePresentValue(6, monthlyValue) + currentLTV;
    const ltv12Month = calculatePresentValue(12, monthlyValue) + currentLTV;

    const confidence = Math.min(0.9, 0.5 + (customer.totalOrders / 20) * 0.4);

    return {
      customerId,
      currentLTV: Math.round(currentLTV * 100) / 100,
      predictedLTV3Month: Math.round(ltv3Month * 100) / 100,
      predictedLTV6Month: Math.round(ltv6Month * 100) / 100,
      predictedLTV12Month: Math.round(ltv12Month * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      factors: [
        { name: 'Order frequency', impact: monthlyValue / currentLTV },
        { name: 'Average order value', impact: avgOrderValue / 500 },
        { name: 'Churn risk', impact: -churnRisk * 0.5 },
      ],
    };
  }

  /**
   * Segment customers and analyze
   */
  analyzeSegments(): SegmentAnalysis {
    const segments = this.analyzeCustomerSegments();
    const insights = this.generateSegmentInsights(segments);

    return { segments, insights };
  }

  /**
   * Create customer segments
   */
  private analyzeCustomerSegments(): CustomerSegment[] {
    const segmentMap = new Map<string, Customer[]>();

    for (const customer of this.customers.values()) {
      const segment = this.classifyCustomer(customer);
      if (!segmentMap.has(segment)) {
        segmentMap.set(segment, []);
      }
      segmentMap.get(segment)!.push(customer);
    }

    const totalCustomers = this.customers.size;
    const segments: CustomerSegment[] = [];

    for (const [segmentName, customers] of segmentMap) {
      const avgOrderValue =
        customers.reduce((sum, c) => sum + c.totalSpent / Math.max(c.totalOrders, 1), 0) /
        customers.length;
      const avgFrequency =
        customers.reduce((sum, c) => sum + c.orderFrequency, 0) / customers.length;

      segments.push({
        segment: segmentName,
        count: customers.length,
        percentage: Math.round((customers.length / totalCustomers) * 100),
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        avgOrderFrequency: Math.round(avgFrequency * 100) / 100,
        characteristics: this.getSegmentCharacteristics(segmentName),
      });
    }

    return segments.sort((a, b) => b.count - a.count);
  }

  /**
   * Classify customer into segment
   */
  private classifyCustomer(customer: Customer): string {
    const avgOrderValue = customer.totalSpent / Math.max(customer.totalOrders, 1);
    const churn = this.predictChurn(customer.id).churnProbability;

    if (avgOrderValue > 800 && customer.orderFrequency >= 4) return 'VIP Champions';
    if (avgOrderValue > 500 && customer.orderFrequency >= 2) return 'Loyal Customers';
    if (customer.totalOrders >= 3 && churn < 30) return 'Regulars';
    if (churn >= 60) return 'At Risk';
    if (customer.totalOrders <= 1) return 'Newcomers';
    if (avgOrderValue < 300 && customer.orderFrequency <= 1) return 'Occasional Visitors';
    return 'Casual Diners';
  }

  /**
   * Get characteristics for segment
   */
  private getSegmentCharacteristics(segment: string): string[] {
    const characteristicsMap: Record<string, string[]> = {
      'VIP Champions': ['High spend', 'Frequent visits', 'Brand advocates', 'Premium menu preference'],
      'Loyal Customers': ['Consistent orders', 'Good value', 'Reliable revenue', 'Moderate promotion sensitivity'],
      'Regulars': ['Weekly visits', 'Predictable behavior', 'Loyalty program members', 'Word of mouth referrals'],
      'At Risk': ['Declining visits', 'Low engagement', 'Needs reactivation', 'Price sensitive'],
      'Newcomers': ['Trial phase', 'Building habits', 'First-time experience critical', 'Potential to convert'],
      'Occasional Visitors': ['Special occasion diners', 'Event-driven visits', 'Email/SMS responsive', 'Seasonal patterns'],
      'Casual Diners': ['Spontaneous visits', 'Budget conscious', 'Impulse decisions', 'Social dining'],
    };
    return characteristicsMap[segment] || ['General customer'];
  }

  /**
   * Generate insights from segments
   */
  private generateSegmentInsights(segments: CustomerSegment[]): {
    mostValuableSegment: string;
    fastestGrowingSegment: string;
    atRiskSegment: string;
    acquisitionSource: string;
  } {
    let mostValuable = segments[0];
    let atRisk = segments.find((s) => s.segment === 'At Risk') || segments[segments.length - 1];

    for (const segment of segments) {
      if (segment.avgOrderValue > mostValuable.avgOrderValue) {
        mostValuable = segment;
      }
    }

    return {
      mostValuableSegment: mostValuable.segment,
      fastestGrowingSegment: 'VIP Champions', // Would need trend data
      atRiskSegment: atRisk.segment,
      acquisitionSource: 'Online ordering app',
    };
  }

  /**
   * Get behavior insights for a customer
   */
  getBehaviorInsights(customerId: string): CustomerBehaviorInsights {
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    const avgOrderValue = customer.totalSpent / Math.max(customer.totalOrders, 1);

    return {
      preferredVisitTime: [{ hour: 19, dayOfWeek: 6 }], // Would need actual order history
      averageOrderSize: Math.round(avgOrderValue * 100) / 100,
      categoryPreferences: new Map([
        ['mains', 0.5],
        ['beverages', 0.3],
        ['desserts', 0.2],
      ]),
      priceSensitivity: avgOrderValue > 600 ? 'low' : avgOrderValue > 400 ? 'medium' : 'high',
      orderType: 'delivery',
      responsivenessToPromotions: Math.min(100, customer.orderFrequency * 25),
    };
  }

  /**
   * Batch predict churn for multiple customers
   */
  predictBatchChurn(customerIds: string[]): ChurnPrediction[] {
    return customerIds
      .map((id) => {
        try {
          return this.predictChurn(id);
        } catch {
          return null;
        }
      })
      .filter((p): p is ChurnPrediction => p !== null);
  }

  /**
   * Get customers by churn risk level
   */
  getAtRiskCustomers(threshold: 'high' | 'critical' = 'high'): Customer[] {
    const atRisk: Customer[] = [];
    for (const customer of this.customers.values()) {
      const prediction = this.predictChurn(customer.id);
      if (
        (threshold === 'critical' && prediction.churnRisk === 'critical') ||
        (threshold === 'high' && (prediction.churnRisk === 'high' || prediction.churnRisk === 'critical'))
      ) {
        atRisk.push(customer);
      }
    }
    return atRisk;
  }
}

interface ChurnModelWeights {
  daysSinceLastOrder: { weight: number; threshold: number };
  orderFrequency: { weight: number; threshold: number };
  averageOrderValue: { weight: number; threshold: number };
  totalOrders: { weight: number; threshold: number };
  engagement: { weight: number; threshold: number };
  promotionalResponse: { weight: number; threshold: number };
}

export const customerInsightsService = new CustomerInsightsService();
