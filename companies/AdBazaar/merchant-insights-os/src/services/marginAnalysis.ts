import { RevenueRecord, Merchant } from '../models/index.js';
import type { MarginAnalysis } from '../types/index.js';
import logger from '../config/logger.js';
import { subDays, format } from 'date-fns';

export class MarginAnalysisService {
  /**
   * Get comprehensive margin analysis for a merchant
   */
  async getMarginAnalysis(
    merchantId: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<MarginAnalysis> {
    const days = this.getDaysForPeriod(period);
    const startDate = subDays(new Date(), days);
    const endDate = new Date();

    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      throw new Error(`Merchant not found: ${merchantId}`);
    }

    // Get revenue records with cost data
    const records = await RevenueRecord.find({
      merchantId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    // Calculate totals
    const totalRevenue = records.reduce((sum, r) => sum + r.revenue, 0);
    const totalCogs = records.reduce((sum, r) => sum + (r.costs?.cogs || 0), 0);
    const totalMarketing = records.reduce((sum, r) => sum + (r.costs?.marketing || 0), 0);
    const totalOperations = records.reduce((sum, r) => sum + (r.costs?.operations || 0), 0);
    const totalOther = records.reduce((sum, r) => sum + (r.costs?.other || 0), 0);

    const totalCosts = totalCogs + totalMarketing + totalOperations + totalOther;
    const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCogs) / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;

    // Determine margin trend
    const marginTrend = this.determineMarginTrend(records);

    // Identify margin opportunities
    const marginOpportunities = this.identifyOpportunities(grossMargin, netMargin, totalRevenue);

    return {
      merchantId,
      period: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd'),
      },
      grossMargin,
      netMargin,
      marginTrend,
      costBreakdown: {
        cogs: totalCogs,
        marketing: totalMarketing,
        operations: totalOperations,
        other: totalOther,
      },
      marginOpportunities,
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

  private determineMarginTrend(
    records: InstanceType<typeof RevenueRecord>[]
  ): 'improving' | 'declining' | 'stable' {
    if (records.length < 2) return 'stable';

    const halfPoint = Math.floor(records.length / 2);
    const firstHalf = records.slice(0, halfPoint);
    const secondHalf = records.slice(halfPoint);

    const firstHalfMargin = firstHalf.reduce((sum, r) => {
      const revenue = r.revenue;
      const costs = (r.costs?.cogs || 0) + (r.costs?.marketing || 0) +
                   (r.costs?.operations || 0) + (r.costs?.other || 0);
      return sum + (revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0);
    }, 0) / firstHalf.length;

    const secondHalfMargin = secondHalf.reduce((sum, r) => {
      const revenue = r.revenue;
      const costs = (r.costs?.cogs || 0) + (r.costs?.marketing || 0) +
                   (r.costs?.operations || 0) + (r.costs?.other || 0);
      return sum + (revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0);
    }, 0) / secondHalf.length;

    const changePercent = secondHalfMargin - firstHalfMargin;

    if (changePercent > 2) return 'improving';
    if (changePercent < -2) return 'declining';
    return 'stable';
  }

  private identifyOpportunities(
    grossMargin: number,
    netMargin: number,
    totalRevenue: number
  ): { category: string; potentialSavings: number; action: string }[] {
    const opportunities: { category: string; potentialSavings: number; action: string }[] = [];

    // COGS optimization
    if (grossMargin < 30) {
      opportunities.push({
        category: 'COGS',
        potentialSavings: totalRevenue * 0.05,
        action: 'Consider negotiating with suppliers or optimizing inventory management to reduce cost of goods sold.',
      });
    }

    // Marketing efficiency
    if (netMargin < grossMargin * 0.3) {
      opportunities.push({
        category: 'Marketing',
        potentialSavings: totalRevenue * 0.03,
        action: 'Review marketing spend efficiency. Consider focusing on higher-converting channels.',
      });
    }

    // Operations optimization
    if (netMargin < 10) {
      opportunities.push({
        category: 'Operations',
        potentialSavings: totalRevenue * 0.02,
        action: 'Review operational costs. Automate repetitive tasks to reduce labor costs.',
      });
    }

    // Premium pricing opportunity
    if (grossMargin > 50 && netMargin < 20) {
      opportunities.push({
        category: 'Pricing',
        potentialSavings: totalRevenue * 0.05,
        action: 'You have strong gross margins but low net margins. Consider premium positioning or reducing operational costs.',
      });
    }

    return opportunities;
  }
}

export default new MarginAnalysisService();