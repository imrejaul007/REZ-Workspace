import { z } from 'zod';
import { logger } from '../utils/logger';

export interface Customer {
  customerId: string;
  name: string;
  email: string;
  phone?: string;
  firstVisit: string;
  lastVisit: string;
  totalVisits: number;
  totalSpent: number;
  preferredStylistId?: string;
  preferredServices: string[];
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface ChurnPrediction {
  customerId: string;
  churnRisk: 'high' | 'medium' | 'low';
  churnProbability: number;
  reasons: string[];
  recommendedActions: string[];
  predictedInactiveDate?: string;
}

export interface CustomerLifetimeValue {
  customerId: string;
  currentValue: number;
  predictedValue: number;
  monthsUntilChurn: number;
  recommendedEngagementLevel: 'minimal' | 'standard' | 'high' | 'vip';
}

export interface StylistMetrics {
  stylistId: string;
  name: string;
  period: string;
  metrics: {
    totalServices: number;
    totalRevenue: number;
    avgServiceValue: number;
    avgCustomerRating: number;
    utilizationRate: number;
    repeatCustomerRate: number;
    avgServiceTime: number;
    topServices: string[];
  };
  trends: {
    revenueChange: number;
    ratingChange: number;
    customerChange: number;
  };
  recommendations: string[];
}

export interface SeasonalTrend {
  month: string;
  totalRevenue: number;
  totalCustomers: number;
  topServices: string[];
  avgTransactionValue: number;
  yearOverYearChange: number;
}

const CustomerSchema = z.object({
  customerId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  firstVisit: z.string(),
  lastVisit: z.string(),
  totalVisits: z.number().int().positive(),
  totalSpent: z.number().positive(),
  preferredStylistId: z.string().optional(),
  preferredServices: z.array(z.string()),
  loyaltyTier: z.enum(['bronze', 'silver', 'gold', 'platinum']).optional(),
});

export class CustomerInsights {
  private customers: Map<string, Customer> = new Map();
  private visitHistory: Map<string, string[]> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    const sampleCustomers: Customer[] = [
      {
        customerId: 'cust-001',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '+1-555-0101',
        firstVisit: '2024-01-15',
        lastVisit: '2024-05-01',
        totalVisits: 12,
        totalSpent: 1250,
        preferredStylistId: 'stylist-001',
        preferredServices: ['haircut', 'coloring', 'blowout'],
        loyaltyTier: 'gold',
      },
      {
        customerId: 'cust-002',
        name: 'Emily Chen',
        email: 'emily@example.com',
        firstVisit: '2024-02-20',
        lastVisit: '2024-04-15',
        totalVisits: 4,
        totalSpent: 320,
        preferredStylistId: 'stylist-002',
        preferredServices: ['manicure', 'pedicure'],
        loyaltyTier: 'silver',
      },
      {
        customerId: 'cust-003',
        name: 'Michael Brown',
        email: 'michael@example.com',
        firstVisit: '2024-03-10',
        lastVisit: '2024-03-15',
        totalVisits: 2,
        totalSpent: 90,
        preferredServices: ['haircut'],
        loyaltyTier: 'bronze',
      },
      {
        customerId: 'cust-004',
        name: 'Jessica Martinez',
        email: 'jessica@example.com',
        firstVisit: '2023-06-01',
        lastVisit: '2024-05-05',
        totalVisits: 24,
        totalSpent: 3200,
        preferredStylistId: 'stylist-001',
        preferredServices: ['balayage', 'keratin', 'treatment'],
        loyaltyTier: 'platinum',
      },
    ];

    for (const customer of sampleCustomers) {
      this.customers.set(customer.customerId, customer);
      // Generate visit history
      this.generateVisitHistory(customer.customerId, customer.firstVisit, customer.lastVisit);
    }
  }

  private generateVisitHistory(customerId: string, firstVisit: string, lastVisit: string): void {
    const visits: string[] = [];
    let currentDate = new Date(firstVisit);
    const endDate = new Date(lastVisit);

    while (currentDate <= endDate) {
      visits.push(currentDate.toISOString());
      // Add random days between visits (15-45 days)
      currentDate = new Date(currentDate.getTime() + (15 + Math.random() * 30) * 24 * 60 * 60 * 1000);
    }

    this.visitHistory.set(customerId, visits);
  }

  /**
   * Predict customer churn risk
   */
  async predictChurn(customerId: string): Promise<ChurnPrediction> {
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    const daysSinceLastVisit = Math.floor(
      (Date.now() - new Date(customer.lastVisit).getTime()) / (1000 * 60 * 60 * 24)
    );

    const avgDaysBetweenVisits = this.calculateAvgDaysBetweenVisits(customerId);
    const expectedDaysSinceVisit = avgDaysBetweenVisits * 1.5;

    const reasons: string[] = [];
    let churnProbability = 0.3; // Base probability

    // Days since last visit
    if (daysSinceLastVisit > expectedDaysSinceVisit) {
      churnProbability += 0.2;
      reasons.push(`No visit in ${daysSinceLastVisit} days (expected: ${Math.round(expectedDaysSinceVisit)})`);
    }

    // Declining visit frequency
    const recentFrequency = this.getRecentVisitFrequency(customerId);
    if (recentFrequency < 0.5) {
      churnProbability += 0.15;
      reasons.push('Declining visit frequency');
    }

    // Low loyalty tier
    if (customer.loyaltyTier === 'bronze' || !customer.loyaltyTier) {
      churnProbability += 0.1;
      reasons.push('Low loyalty engagement');
    }

    // Recent negative feedback (simulated)
    if (customer.totalVisits < 3) {
      churnProbability += 0.1;
      reasons.push('Early-stage customer, higher churn risk');
    }

    // High value customers less likely to churn
    if (customer.loyaltyTier === 'platinum' || customer.loyaltyTier === 'gold') {
      churnProbability *= 0.6;
    }

    churnProbability = Math.min(0.95, Math.max(0.05, churnProbability));

    let churnRisk: 'high' | 'medium' | 'low';
    if (churnProbability >= 0.6) {
      churnRisk = 'high';
    } else if (churnProbability >= 0.3) {
      churnRisk = 'medium';
    } else {
      churnRisk = 'low';
    }

    const recommendedActions = this.getChurnPreventionActions(churnRisk, customer);

    return {
      customerId,
      churnRisk,
      churnProbability: Math.round(churnProbability * 100) / 100,
      reasons,
      recommendedActions,
      predictedInactiveDate:
        churnRisk === 'high'
          ? new Date(Date.now() + daysSinceLastVisit * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
    };
  }

  /**
   * Calculate average days between visits
   */
  private calculateAvgDaysBetweenVisits(customerId: string): number {
    const visits = this.visitHistory.get(customerId) || [];
    if (visits.length < 2) return 30; // Default

    let totalDays = 0;
    for (let i = 1; i < visits.length; i++) {
      const days = (new Date(visits[i]).getTime() - new Date(visits[i - 1]).getTime()) / (1000 * 60 * 60 * 24);
      totalDays += days;
    }

    return totalDays / (visits.length - 1);
  }

  /**
   * Get recent visit frequency compared to historical
   */
  private getRecentVisitFrequency(customerId: string): number {
    const visits = this.visitHistory.get(customerId) || [];
    if (visits.length < 4) return 1;

    const recentVisits = visits.slice(-2);
    const olderVisits = visits.slice(0, -2);

    if (olderVisits.length < 2) return 1;

    const recentInterval =
      (new Date(recentVisits[1]).getTime() - new Date(recentVisits[0]).getTime()) /
      (1000 * 60 * 60 * 24);

    const olderInterval =
      (new Date(olderVisits[1]).getTime() - new Date(olderVisits[0]).getTime()) /
      (1000 * 60 * 60 * 24);

    return olderInterval / recentInterval;
  }

  /**
   * Get churn prevention actions based on risk level
   */
  private getChurnPreventionActions(risk: 'high' | 'medium' | 'low', customer: Customer): string[] {
    const actions: string[] = [];

    switch (risk) {
      case 'high':
        actions.push('Send personalized re-engagement offer (15% off)');
        actions.push('Schedule a follow-up call');
        actions.push('Offer free add-on service on next visit');
        actions.push('Request feedback on previous experience');
        break;
      case 'medium':
        actions.push('Send birthday/anniversary promotion');
        actions.push('Highlight new services they might like');
        actions.push('Offer loyalty points bonus');
        break;
      case 'low':
        actions.push('Continue regular communication');
        actions.push('Suggest seasonal services');
        actions.push('Consider VIP upgrade');
        break;
    }

    // Personalized based on customer preferences
    if (customer.preferredServices.includes('coloring')) {
      actions.push('Share new color trend inspiration');
    }

    return actions;
  }

  /**
   * Calculate customer lifetime value
   */
  async calculateLTV(customerId: string): Promise<CustomerLifetimeValue> {
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    const churnPrediction = await this.predictChurn(customerId);
    const avgVisitValue = customer.totalSpent / customer.totalVisits;
    const visitsPerMonth = this.calculateVisitsPerMonth(customerId);

    const predictedFutureVisits = visitsPerMonth * churnPrediction.churnProbability * 12;
    const predictedValue = predictedFutureVisits * avgVisitValue;

    let recommendedEngagementLevel: CustomerLifetimeValue['recommendedEngagementLevel'];
    if (customer.totalSpent > 2000 || customer.loyaltyTier === 'platinum') {
      recommendedEngagementLevel = 'vip';
    } else if (customer.totalSpent > 500 || customer.loyaltyTier === 'gold') {
      recommendedEngagementLevel = 'high';
    } else if (customer.totalSpent > 100 || customer.loyaltyTier === 'silver') {
      recommendedEngagementLevel = 'standard';
    } else {
      recommendedEngagementLevel = 'minimal';
    }

    return {
      customerId,
      currentValue: customer.totalSpent,
      predictedValue: Math.round(predictedValue * 100) / 100,
      monthsUntilChurn: churnPrediction.churnRisk === 'high' ? 2 : churnPrediction.churnRisk === 'medium' ? 4 : 12,
      recommendedEngagementLevel,
    };
  }

  /**
   * Calculate visits per month for a customer
   */
  private calculateVisitsPerMonth(customerId: string): number {
    const customer = this.customers.get(customerId);
    if (!customer) return 0;

    const firstVisit = new Date(customer.firstVisit);
    const lastVisit = new Date(customer.lastVisit);
    const months = Math.max(
      1,
      (lastVisit.getTime() - firstVisit.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    return customer.totalVisits / months;
  }

  /**
   * Get stylist productivity analytics
   */
  async getStylistProductivity(stylistId: string, period: string = '30d'): Promise<StylistMetrics> {
    // Simulate stylist metrics
    const stylists = ['stylist-001', 'stylist-002', 'stylist-003'];
    const names: Record<string, string> = {
      'stylist-001': 'Maria Garcia',
      'stylist-002': 'David Kim',
      'stylist-003': 'Lisa Thompson',
    };

    const baseMetrics = {
      'stylist-001': { services: 120, revenue: 4800, rating: 4.8, utilization: 0.85 },
      'stylist-002': { services: 95, revenue: 3600, rating: 4.6, utilization: 0.78 },
      'stylist-003': { services: 80, revenue: 2800, rating: 4.5, utilization: 0.72 },
    };

    const metrics = baseMetrics[stylistId as keyof typeof baseMetrics] || baseMetrics['stylist-001'];

    return {
      stylistId,
      name: names[stylistId as keyof typeof names] || 'Unknown',
      period,
      metrics: {
        totalServices: metrics.services,
        totalRevenue: metrics.revenue,
        avgServiceValue: Math.round((metrics.revenue / metrics.services) * 100) / 100,
        avgCustomerRating: metrics.rating,
        utilizationRate: metrics.utilization,
        repeatCustomerRate: 0.65,
        avgServiceTime: 45,
        topServices: ['Haircut', 'Coloring', 'Blowout'],
      },
      trends: {
        revenueChange: Math.round((Math.random() * 20 - 5) * 100) / 100,
        ratingChange: Math.round((Math.random() * 0.4 - 0.1) * 100) / 100,
        customerChange: Math.round((Math.random() * 15 - 3) * 100) / 100,
      },
      recommendations: this.getStylistRecommendations(stylistId, metrics),
    };
  }

  /**
   * Get recommendations for stylist improvement
   */
  private getStylistRecommendations(stylistId: string, metrics: { services: number; revenue: number; rating: number; utilization: number }): string[] {
    const recommendations: string[] = [];

    if (metrics.utilization < 0.75) {
      recommendations.push('Consider marketing to increase bookings during slow hours');
    }

    if (metrics.rating < 4.5) {
      recommendations.push('Focus on customer experience - consider additional training');
    }

    if (metrics.services > 100) {
      recommendations.push('High volume - consider premium service upsells');
    }

    const avgValue = metrics.revenue / metrics.services;
    if (avgValue < 35) {
      recommendations.push('Work on upselling add-on services to increase ticket size');
    }

    return recommendations;
  }

  /**
   * Analyze seasonal trends
   */
  async getSeasonalTrends(year?: number): Promise<SeasonalTrend[]> {
    const targetYear = year || new Date().getFullYear();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    // Simulate seasonal data with realistic patterns
    const seasonalData: Record<string, { revenue: number; customers: number; topServices: string[] }> = {
      January: { revenue: 8500, customers: 68, topServices: ['haircut', 'treatment'] },
      February: { revenue: 9200, customers: 72, topServices: ['haircut', 'coloring'] },
      March: { revenue: 11200, customers: 85, topServices: ['coloring', 'haircut'] },
      April: { revenue: 12800, customers: 92, topServices: ['balayage', 'styling'] },
      May: { revenue: 14500, customers: 105, topServices: ['balayage', 'wedding'] },
      June: { revenue: 15200, customers: 110, topServices: ['coloring', 'styling'] },
      July: { revenue: 13800, customers: 98, topServices: ['haircut', 'treatment'] },
      August: { revenue: 12100, customers: 88, topServices: ['haircut', 'facial'] },
      September: { revenue: 10500, customers: 78, topServices: ['treatment', 'coloring'] },
      October: { revenue: 9800, customers: 75, topServices: ['treatment', 'massage'] },
      November: { revenue: 11200, customers: 82, topServices: ['holiday', 'gift'] },
      December: { revenue: 16500, customers: 120, topServices: ['holiday', 'styling'] },
    };

    const trends: SeasonalTrend[] = [];
    let prevRevenue = 0;

    for (let i = 0; i < 12; i++) {
      const monthName = months[i];
      const data = seasonalData[monthName];

      const yearOverYearChange = prevRevenue > 0
        ? ((data.revenue - prevRevenue) / prevRevenue) * 100
        : 0;

      trends.push({
        month: `${monthName} ${targetYear}`,
        totalRevenue: data.revenue,
        totalCustomers: data.customers,
        topServices: data.topServices,
        avgTransactionValue: Math.round((data.revenue / data.customers) * 100) / 100,
        yearOverYearChange: Math.round(yearOverYearChange * 100) / 100,
      });

      prevRevenue = data.revenue;
    }

    return trends;
  }

  /**
   * Get all customers at risk of churn
   */
  async getChurnRiskCustomers(): Promise<ChurnPrediction[]> {
    const predictions: ChurnPrediction[] = [];

    for (const customerId of this.customers.keys()) {
      const prediction = await this.predictChurn(customerId);
      if (prediction.churnRisk !== 'low') {
        predictions.push(prediction);
      }
    }

    // Sort by churn probability
    predictions.sort((a, b) => b.churnProbability - a.churnProbability);

    return predictions;
  }

  /**
   * Add or update customer
   */
  async upsertCustomer(customer: Customer): Promise<void> {
    const validated = CustomerSchema.parse(customer);
    this.customers.set(validated.customerId, validated);
    logger.info(`Updated customer ${validated.customerId}`);
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<Customer | null> {
    return this.customers.get(customerId) || null;
  }
}
