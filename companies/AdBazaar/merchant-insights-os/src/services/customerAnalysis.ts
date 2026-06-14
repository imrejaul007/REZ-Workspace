import { Customer, Merchant } from '../models/index.js';
import type { CustomerCohortAnalysis, CustomerSegment } from '../types/index.js';
import logger from '../config/logger.js';
import { subDays, format, startOfWeek, differenceInWeeks } from 'date-fns';

export class CustomerAnalysisService {
  /**
   * Get comprehensive customer cohort analysis
   */
  async getCustomerCohortAnalysis(
    merchantId: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<CustomerCohortAnalysis> {
    const days = this.getDaysForPeriod(period);
    const startDate = subDays(new Date(), days);

    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      throw new Error(`Merchant not found: ${merchantId}`);
    }

    // Get all customers
    const customers = await Customer.find({ merchantId });

    // Calculate totals
    const totalCustomers = customers.length;
    const newCustomers = customers.filter(c =>
      c.firstPurchase >= startDate
    ).length;
    const returningCustomers = totalCustomers - newCustomers;

    // Retention rate
    const retentionRate = totalCustomers > 0
      ? (returningCustomers / totalCustomers) * 100
      : 0;

    // Get segments
    const segments = this.getCustomerSegments(customers);

    // RFM Analysis
    const rfmAnalysis = this.calculateRFMAnalysis(customers);

    // Cohort retention
    const cohortRetention = this.calculateCohortRetention(customers, startDate);

    return {
      merchantId,
      period: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd'),
      },
      totalCustomers,
      newCustomers,
      returningCustomers,
      retentionRate,
      segments,
      rfmAnalysis,
      cohortRetention,
    };
  }

  private getDaysForPeriod(period: string): number {
    switch (period) {
      case 'week': return 7;
      case 'month': return 30;
      case 'quarter': return 90;
      case 'year': return 365;
      default: return 30;
    }
  }

  private getCustomerSegments(
    customers: InstanceType<typeof Customer>[]
  ): CustomerSegment[] {
    const segments: CustomerSegment[] = [];

    // VIP/Customers
    const vipCustomers = customers.filter(c =>
      c.rfmScores.monetary >= 4 && c.rfmScores.frequency >= 3
    );
    if (vipCustomers.length > 0) {
      segments.push({
        segmentId: 'vip',
        name: 'VIP Customers',
        count: vipCustomers.length,
        averageOrderValue: this.avg(vipCustomers.map(c => c.averageOrderValue)),
        purchaseFrequency: this.avg(vipCustomers.map(c => c.totalOrders)),
        churnRisk: 'low',
        lifetimeValue: this.avg(vipCustomers.map(c => c.totalSpent)),
      });
    }

    // Loyal Customers
    const loyalCustomers = customers.filter(c =>
      c.rfmScores.frequency >= 3 && c.rfmScores.recency >= 3
    );
    if (loyalCustomers.length > 0) {
      segments.push({
        segmentId: 'loyal',
        name: 'Loyal Customers',
        count: loyalCustomers.length,
        averageOrderValue: this.avg(loyalCustomers.map(c => c.averageOrderValue)),
        purchaseFrequency: this.avg(loyalCustomers.map(c => c.totalOrders)),
        churnRisk: 'low',
        lifetimeValue: this.avg(loyalCustomers.map(c => c.totalSpent)),
      });
    }

    // At-Risk Customers
    const atRiskCustomers = customers.filter(c =>
      c.churnRisk === 'medium' || (c.rfmScores.recency <= 2 && c.rfmScores.frequency >= 2)
    );
    if (atRiskCustomers.length > 0) {
      segments.push({
        segmentId: 'at-risk',
        name: 'At-Risk Customers',
        count: atRiskCustomers.length,
        averageOrderValue: this.avg(atRiskCustomers.map(c => c.averageOrderValue)),
        purchaseFrequency: this.avg(atRiskCustomers.map(c => c.totalOrders)),
        churnRisk: 'medium',
        lifetimeValue: this.avg(atRiskCustomers.map(c => c.totalSpent)),
      });
    }

    // High-Value Churned
    const churnedHighValue = customers.filter(c =>
      c.churnRisk === 'high' && c.totalSpent > 10000
    );
    if (churnedHighValue.length > 0) {
      segments.push({
        segmentId: 'churned-hv',
        name: 'Churned High-Value',
        count: churnedHighValue.length,
        averageOrderValue: this.avg(churnedHighValue.map(c => c.averageOrderValue)),
        purchaseFrequency: this.avg(churnedHighValue.map(c => c.totalOrders)),
        churnRisk: 'high',
        lifetimeValue: this.avg(churnedHighValue.map(c => c.totalSpent)),
      });
    }

    // New Customers
    const newSegment = customers.filter(c => c.segment === 'new');
    if (newSegment.length > 0) {
      segments.push({
        segmentId: 'new',
        name: 'New Customers',
        count: newSegment.length,
        averageOrderValue: this.avg(newSegment.map(c => c.averageOrderValue)),
        purchaseFrequency: this.avg(newSegment.map(c => c.totalOrders)),
        churnRisk: 'low',
        lifetimeValue: this.avg(newSegment.map(c => c.totalSpent)),
      });
    }

    // Occasional Buyers
    const occasional = customers.filter(c =>
      c.rfmScores.frequency <= 2 && c.rfmScores.monetary >= 3
    );
    if (occasional.length > 0) {
      segments.push({
        segmentId: 'occasional',
        name: 'Occasional Buyers',
        count: occasional.length,
        averageOrderValue: this.avg(occasional.map(c => c.averageOrderValue)),
        purchaseFrequency: this.avg(occasional.map(c => c.totalOrders)),
        churnRisk: 'medium',
        lifetimeValue: this.avg(occasional.map(c => c.totalSpent)),
      });
    }

    return segments;
  }

  private calculateRFMAnalysis(
    customers: InstanceType<typeof Customer>[]
  ): { recency: { low: number; medium: number; high: number }; frequency: { low: number; medium: number; high: number }; monetary: { low: number; medium: number; high: number } } {
    const avgRecency = this.avg(customers.map(c => c.rfmScores.recency));
    const avgFrequency = this.avg(customers.map(c => c.rfmScores.frequency));
    const avgMonetary = this.avg(customers.map(c => c.rfmScores.monetary));

    return {
      recency: {
        low: Math.round(avgRecency * 0.6),
        medium: Math.round(avgRecency),
        high: Math.round(avgRecency * 1.4),
      },
      frequency: {
        low: Math.round(avgFrequency * 0.6),
        medium: Math.round(avgFrequency),
        high: Math.round(avgFrequency * 1.4),
      },
      monetary: {
        low: Math.round(avgMonetary * 0.6),
        medium: Math.round(avgMonetary),
        high: Math.round(avgMonetary * 1.4),
      },
    };
  }

  private calculateCohortRetention(
    customers: InstanceType<typeof Customer>[],
    startDate: Date
  ): { cohort: string; weeks: number[]; retentionRates: number[] }[] {
    // Group customers by cohort (week they first purchased)
    const cohorts = new Map<string, InstanceType<typeof Customer>[]>();

    for (const customer of customers) {
      const weekStart = format(startOfWeek(customer.firstPurchase), 'yyyy-MM-dd');
      const existing = cohorts.get(weekStart) || [];
      existing.push(customer);
      cohorts.set(weekStart, existing);
    }

    // Calculate retention for each cohort
    const cohortResults: { cohort: string; weeks: number[]; retentionRates: number[] }[] = [];

    for (const [cohort, cohortCustomers] of cohorts) {
      if (cohortCustomers.length < 5) continue; // Skip small cohorts

      const weeks: number[] = [];
      const retentionRates: number[] = [];
      const initialCount = cohortCustomers.length;

      // Calculate retention for each week up to 12 weeks
      for (let week = 0; week <= 12; week++) {
        weeks.push(week);

        // Count customers who purchased in this week
        const activeCount = cohortCustomers.filter(c => {
          const weeksDiff = differenceInWeeks(new Date(), c.firstPurchase);
          return weeksDiff >= week && c.totalOrders > week;
        }).length;

        retentionRates.push(initialCount > 0 ? (activeCount / initialCount) * 100 : 0);
      }

      cohortResults.push({
        cohort,
        weeks,
        retentionRates,
      });
    }

    // Sort by cohort date and limit to most recent 6
    return cohortResults
      .sort((a, b) => b.cohort.localeCompare(a.cohort))
      .slice(0, 6);
  }

  private avg(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }
}

export default new CustomerAnalysisService();