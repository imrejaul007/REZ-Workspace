import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';

// RidZa integration
const RIDZA_URL = process.env.RIDZA_URL || 'http://localhost:4900';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-token';

/**
 * Revenue metrics for a period
 */
export interface RevenueMetrics {
  totalRevenue: number;
  avgDailyRevenue: number;
  transactionCount: number;
  avgOrderValue: number;
  peakHour: number;
  peakDay: string;
  growthRate: number; // Month-over-month growth
}

/**
 * Merchant financial profile for credit assessment
 */
export interface MerchantFinancialProfile {
  merchantId: string;
  restaurantId: string;
  businessName: string;
  period: { start: Date; end: Date };
  metrics: RevenueMetrics;
  riskIndicators: {
    revenueVolatility: number; // 0-100
    weekendVsWeekday: number; // Ratio
    seasonalPattern: string;
    customerRetention: number; // 0-100
    avgOrderFrequency: number; // Days between orders
  };
  creditScore: number; // 300-850
  creditTier: 'poor' | 'fair' | 'good' | 'very-good' | 'excellent';
  maxLoanAmount: number;
  recommendedInterestRate: number;
  factors: {
    positive: string[];
    negative: string[];
  };
}

/**
 * Loan recommendation
 */
export interface LoanRecommendation {
  merchantId: string;
  recommendedAmount: number;
  maxAmount: number;
  minAmount: number;
  purpose: string;
  tenorMonths: number;
  interestRate: number;
  emi: number;
  processingFee: number;
  eligibilityScore: number; // 0-100
  reasons: string[];
}

/**
 * Merchant Loans Connector Service
 *
 * Connects POS data to RidZa merchant loans for credit scoring:
 * - Generate financial profiles from order data
 * - Calculate credit scores based on revenue patterns
 * - Provide loan recommendations
 * - Export financial reports
 */
@Injectable()
export class MerchantLoansService {
  private readonly logger = new Logger(MerchantLoansService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // FINANCIAL PROFILE GENERATION
  // ==========================================

  /**
   * Generate financial profile from POS data
   */
  async generateFinancialProfile(
    restaurantId: string,
    period: { start: Date; end: Date } = {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
      end: new Date(),
    }
  ): Promise<MerchantFinancialProfile> {
    this.logger.log(`Generating financial profile for restaurant ${restaurantId}`);

    // Get all orders in the period
    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: period.start, lte: period.end },
        paymentStatus: 'COMPLETED',
      },
      orderBy: { createdAt: 'asc' },
    });

    if (orders.length === 0) {
      throw new BadRequestException('No completed orders found for this period');
    }

    // Calculate basic metrics
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const dayCount = Math.max(1, Math.ceil((period.end.getTime() - period.start.getTime()) / (24 * 60 * 60 * 1000)));

    // Revenue by day
    const revenueByDay = new Map<string, number>();
    orders.forEach(order => {
      const day = order.createdAt.toISOString().split('T')[0];
      revenueByDay.set(day, (revenueByDay.get(day) || 0) + order.totalAmount);
    });

    // Peak hour analysis
    const hourCounts = new Map<number, number>();
    orders.forEach(order => {
      const hour = order.createdAt.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + order.totalAmount);
    });
    const peakHour = Array.from(hourCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 12;

    // Day of week analysis
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayTotals = new Map<string, number>();
    orders.forEach(order => {
      const day = dayNames[order.createdAt.getDay()];
      dayTotals.set(day, (dayTotals.get(day) || 0) + order.totalAmount);
    });
    const peakDay = Array.from(dayTotals.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Saturday';

    // Calculate growth rate (compare first half vs second half)
    const midpoint = orders.length / 2;
    const firstHalf = orders.slice(0, Math.floor(midpoint));
    const secondHalf = orders.slice(Math.floor(midpoint));
    const firstHalfRevenue = firstHalf.reduce((s, o) => s + o.totalAmount, 0);
    const secondHalfRevenue = secondHalf.reduce((s, o) => s + o.totalAmount, 0);
    const growthRate = firstHalfRevenue > 0 ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 : 0;

    // Revenue volatility (coefficient of variation)
    const revenues = Array.from(revenueByDay.values());
    const avgDailyRevenue = revenues.reduce((s, r) => s + r, 0) / revenues.length;
    const variance = revenues.reduce((s, r) => s + Math.pow(r - avgDailyRevenue, 2), 0) / revenues.length;
    const stdDev = Math.sqrt(variance);
    const revenueVolatility = avgDailyRevenue > 0 ? (stdDev / avgDailyRevenue) * 100 : 0;

    // Weekend vs weekday ratio
    const weekendRevenue = (dayTotals.get('Saturday') || 0) + (dayTotals.get('Sunday') || 0);
    const weekdayRevenue = totalRevenue - weekendRevenue;
    const weekendCount = (dayTotals.has('Saturday') ? 1 : 0) + (dayTotals.has('Sunday') ? 1 : 0);
    const weekdayCount = dayNames.length - weekendCount;
    const avgWeekendDay = weekendCount > 0 ? weekendRevenue / weekendCount : 0;
    const avgWeekday = weekdayCount > 0 ? weekdayRevenue / weekdayCount : 0;
    const weekendVsWeekday = avgWeekday > 0 ? avgWeekendDay / avgWeekday : 1;

    // Customer retention (simplified - orders per unique customer)
    const uniqueCustomers = new Set(orders.map(o => o.customerId).filter(Boolean));
    const customerRetention = uniqueCustomers.size > 0 ? (orders.length / uniqueCustomers.size) : 0;

    // Build metrics
    const metrics: RevenueMetrics = {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgDailyRevenue: Math.round(avgDailyRevenue * 100) / 100,
      transactionCount: orders.length,
      avgOrderValue: orders.length > 0 ? Math.round((totalRevenue / orders.length) * 100) / 100 : 0,
      peakHour,
      peakDay,
      growthRate: Math.round(growthRate * 100) / 100,
    };

    // Calculate credit score
    const creditScore = this.calculateCreditScore(metrics, {
      revenueVolatility,
      weekendVsWeekday,
      customerRetention,
    });

    const creditTier = this.getCreditTier(creditScore);
    const maxLoanAmount = this.calculateMaxLoanAmount(metrics, creditTier);
    const recommendedInterestRate = this.getRecommendedInterestRate(creditTier);

    return {
      merchantId: restaurantId,
      restaurantId,
      businessName: restaurantId, // Would fetch from restaurant table
      period,
      metrics,
      riskIndicators: {
        revenueVolatility: Math.round(revenueVolatility),
        weekendVsWeekday: Math.round(weekendVsWeekday * 100) / 100,
        seasonalPattern: this.identifySeasonalPattern(dayTotals),
        customerRetention: Math.round(customerRetention * 10) / 10,
        avgOrderFrequency: Math.round((dayCount / Math.max(1, orders.length)) * 10) / 10,
      },
      creditScore,
      creditTier,
      maxLoanAmount,
      recommendedInterestRate,
      factors: this.generateScoreFactors(metrics, creditScore),
    };
  }

  // ==========================================
  // CREDIT SCORE CALCULATION
  // ==========================================

  /**
   * Calculate credit score (300-850)
   */
  private calculateCreditScore(
    metrics: RevenueMetrics,
    riskIndicators: {
      revenueVolatility: number;
      weekendVsWeekday: number;
      customerRetention: number;
    }
  ): number {
    // Base score from revenue consistency
    let score = 500;

    // Payment behavior (assume all completed = good)
    score += 50;

    // Revenue growth
    if (metrics.growthRate > 20) score += 100;
    else if (metrics.growthRate > 10) score += 75;
    else if (metrics.growthRate > 0) score += 50;
    else if (metrics.growthRate > -10) score += 25;
    else score -= 25;

    // Transaction volume
    if (metrics.transactionCount > 500) score += 75;
    else if (metrics.transactionCount > 200) score += 50;
    else if (metrics.transactionCount > 100) score += 25;

    // Revenue volatility (lower is better)
    if (riskIndicators.revenueVolatility < 20) score += 75;
    else if (riskIndicators.revenueVolatility < 40) score += 50;
    else if (riskIndicators.revenueVolatility < 60) score += 25;
    else score -= 25;

    // Weekend vs weekday (stable across days is better)
    if (riskIndicators.weekendVsWeekday > 0.8 && riskIndicators.weekendVsWeekday < 1.2) score += 50;
    else if (riskIndicators.weekendVsWeekday > 0.6 && riskIndicators.weekendVsWeekday < 1.4) score += 25;

    // Customer retention
    if (riskIndicators.customerRetention < 3) score += 50;
    else if (riskIndicators.customerRetention < 5) score += 25;

    // Clamp between 300-850
    return Math.max(300, Math.min(850, score));
  }

  /**
   * Get credit tier from score
   */
  private getCreditTier(score: number): MerchantFinancialProfile['creditTier'] {
    if (score >= 750) return 'excellent';
    if (score >= 700) return 'very-good';
    if (score >= 650) return 'good';
    if (score >= 550) return 'fair';
    return 'poor';
  }

  /**
   * Calculate maximum loan amount
   */
  private calculateMaxLoanAmount(metrics: RevenueMetrics, tier: MerchantFinancialProfile['creditTier']): number {
    // Base on 3 months average revenue
    const baseAmount = metrics.avgDailyRevenue * 90;

    // Multipliers by tier
    const multipliers: Record<string, number> = {
      excellent: 5,
      'very-good': 4,
      good: 3,
      fair: 2,
      poor: 1,
    };

    return Math.round(baseAmount * (multipliers[tier] || 1));
  }

  /**
   * Get recommended interest rate based on tier
   */
  private getRecommendedInterestRate(tier: MerchantFinancialProfile['creditTier']): number {
    const rates: Record<string, number> = {
      excellent: 12,
      'very-good': 15,
      good: 18,
      fair: 22,
      poor: 28,
    };
    return rates[tier] || 24;
  }

  /**
   * Identify seasonal pattern
   */
  private identifySeasonalPattern(dayTotals: Map<string, number>): string {
    const total = Array.from(dayTotals.values()).reduce((s, v) => s + v, 0);
    const avg = total / dayTotals.size;

    const aboveAvg = Array.from(dayTotals.values()).filter(v => v > avg).length;
    const ratio = aboveAvg / dayTotals.size;

    if (ratio > 0.7) return 'Consistent';
    if (ratio > 0.4) return 'Moderate Seasonality';
    return 'High Seasonality';
  }

  /**
   * Generate factors affecting score
   */
  private generateScoreFactors(metrics: RevenueMetrics, score: number): { positive: string[]; negative: string[] } {
    const positive: string[] = [];
    const negative: string[] = [];

    if (metrics.growthRate > 10) positive.push(`Strong growth: ${metrics.growthRate.toFixed(1)}% MoM`);
    if (metrics.growthRate < 0) negative.push(`Declining revenue: ${metrics.growthRate.toFixed(1)}% MoM`);
    if (metrics.transactionCount > 200) positive.push(`High transaction volume: ${metrics.transactionCount} orders`);
    if (metrics.avgOrderValue > 500) positive.push(`Strong average order value: ₹${metrics.avgOrderValue}`);
    if (score >= 700) positive.push('Excellent credit history');
    if (score < 600) negative.push('Limited credit history');

    return { positive, negative };
  }

  // ==========================================
  // LOAN RECOMMENDATIONS
  // ==========================================

  /**
   * Get loan recommendation for a merchant
   */
  async getLoanRecommendation(
    restaurantId: string,
    requestedAmount?: number,
    purpose?: string
  ): Promise<LoanRecommendation> {
    const profile = await this.generateFinancialProfile(restaurantId);

    const recommendedAmount = Math.min(
      profile.maxLoanAmount,
      requestedAmount || Math.round(profile.maxLoanAmount * 0.5)
    );

    const minAmount = Math.round(profile.maxLoanAmount * 0.1);
    const tenorMonths = this.getRecommendedTenor(profile.creditTier, recommendedAmount);
    const emi = this.calculateEMI(recommendedAmount, profile.recommendedInterestRate, tenorMonths);
    const processingFee = Math.round(recommendedAmount * 0.01); // 1%

    const eligibilityScore = this.calculateEligibilityScore(profile);

    const reasons: string[] = [];
    if (profile.creditTier === 'excellent' || profile.creditTier === 'very-good') {
      reasons.push('Strong revenue consistency');
      reasons.push('Healthy growth trajectory');
    }
    reasons.push(`Credit score: ${profile.creditScore}`);
    reasons.push(`Monthly revenue: ₹${profile.metrics.avgDailyRevenue * 30}`);

    return {
      merchantId: restaurantId,
      recommendedAmount,
      maxAmount: profile.maxLoanAmount,
      minAmount,
      purpose: purpose || 'Working Capital',
      tenorMonths,
      interestRate: profile.recommendedInterestRate,
      emi: Math.round(emi),
      processingFee,
      eligibilityScore,
      reasons,
    };
  }

  /**
   * Get recommended loan tenor
   */
  private getRecommendedTenor(tier: MerchantFinancialProfile['creditTier'], amount: number): number {
    const baseTenor = amount > 500000 ? 18 : 12;
    const multipliers: Record<string, number> = {
      excellent: 1.5,
      'very-good': 1.25,
      good: 1,
      fair: 0.75,
      poor: 0.5,
    };
    return Math.round(baseTenor * (multipliers[tier] || 1));
  }

  /**
   * Calculate EMI
   */
  private calculateEMI(principal: number, annualRate: number, months: number): number {
    const monthlyRate = annualRate / 12 / 100;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  }

  /**
   * Calculate eligibility score
   */
  private calculateEligibilityScore(profile: MerchantFinancialProfile): number {
    let score = 50; // Base

    // Credit score contribution
    score += (profile.creditScore - 300) / 11; // Normalize to 0-50

    // Revenue stability
    if (profile.riskIndicators.revenueVolatility < 30) score += 15;
    else if (profile.riskIndicators.revenueVolatility < 50) score += 10;
    else score += 5;

    // Growth trend
    if (profile.metrics.growthRate > 15) score += 15;
    else if (profile.metrics.growthRate > 5) score += 10;
    else if (profile.metrics.growthRate > 0) score += 5;

    return Math.round(Math.min(100, score));
  }

  // ==========================================
  // RIDZA INTEGRATION
  // ==========================================

  /**
   * Submit loan application to RidZa
   */
  async submitLoanApplication(
    restaurantId: string,
    application: {
      requestedAmount: number;
      purpose: string;
      tenorMonths: number;
    }
  ): Promise<{ success: boolean; applicationId?: string; message: string }> {
    const profile = await this.generateFinancialProfile(restaurantId);
    const recommendation = await this.getLoanRecommendation(restaurantId, application.requestedAmount);

    try {
      const response = await axios.post(
        `${RIDZA_URL}/api/v1/loans/merchant-apply`,
        {
          merchantId: restaurantId,
          requestedAmount: application.requestedAmount,
          purpose: application.purpose,
          tenorMonths: application.tenorMonths,
          creditScore: profile.creditScore,
          financialProfile: profile,
          eligibilityScore: recommendation.eligibilityScore,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
          timeout: 30000,
        }
      );

      if (response.data.success) {
        return {
          success: true,
          applicationId: response.data.applicationId,
          message: 'Loan application submitted successfully',
        };
      }

      return {
        success: false,
        message: response.data.message || 'Application submission failed',
      };
    } catch (error) {
      this.logger.error(`Failed to submit loan application: ${error}`);
      return {
        success: false,
        message: 'Unable to connect to RidZa service',
      };
    }
  }

  // ==========================================
  // REPORTING
  // ==========================================

  /**
   * Export financial report
   */
  async exportFinancialReport(
    restaurantId: string,
    format: 'json' | 'pdf' = 'json'
  ): Promise<{ data: unknown; format: string }> {
    const profile = await this.generateFinancialProfile(restaurantId);

    if (format === 'json') {
      return {
        data: profile,
        format: 'json',
      };
    }

    // For PDF, return structured data that can be formatted
    return {
      data: {
        merchantId: profile.merchantId,
        businessName: profile.businessName,
        reportDate: new Date().toISOString(),
        period: {
          start: profile.period.start.toISOString(),
          end: profile.period.end.toISOString(),
        },
        summary: {
          creditScore: profile.creditScore,
          creditTier: profile.creditTier,
          totalRevenue: profile.metrics.totalRevenue,
          transactionCount: profile.metrics.transactionCount,
          avgOrderValue: profile.metrics.avgOrderValue,
        },
        riskAssessment: profile.riskIndicators,
        loanRecommendation: await this.getLoanRecommendation(restaurantId),
      },
      format: 'pdf',
    };
  }
}
