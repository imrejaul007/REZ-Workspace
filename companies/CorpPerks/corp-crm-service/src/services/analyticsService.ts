import { Deal, Invoice, Client } from '../models/index.js';
import { ActivityModel } from '../models/Activity.js';
import { getMonthRange, getDaysDifference } from '../utils/index.js';
import {
  RevenueAnalytics,
  PipelineAnalytics,
  ConversionAnalytics,
  ForecastingData,
} from '../types/index.js';
import { analyticsDateRangeSchema } from '../utils/validators.js';

export class AnalyticsService {
  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(tenantId: string, filters: Record<string, unknown> = {}): Promise<RevenueAnalytics> {
    const parsed = analyticsDateRangeSchema.parse(filters);
    const { start, end } = getMonthRange(parsed.months);

    // Get won deals in period
    const wonDeals = await Deal.find({
      tenantId,
      stage: 'won',
      actualClose: { $gte: start, $lte: end },
    }).lean();

    // Calculate total revenue
    const totalRevenue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);
    const totalDeals = wonDeals.length;
    const averageDealSize = totalDeals > 0 ? totalRevenue / totalDeals : 0;

    // Revenue by month
    const revenueByMonthMap = new Map<string, number>();
    wonDeals.forEach((deal) => {
      if (deal.actualClose) {
        const monthKey = deal.actualClose.toISOString().substring(0, 7); // YYYY-MM
        revenueByMonthMap.set(monthKey, (revenueByMonthMap.get(monthKey) || 0) + deal.value);
      }
    });

    const revenueByMonth = Array.from(revenueByMonthMap.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Revenue by client
    const revenueByClientMap = new Map<string, { name: string; revenue: number }>();
    await Promise.all(
      wonDeals.map(async (deal) => {
        const client = await Client.findOne({ tenantId, clientId: deal.clientId }).select('companyName').lean();
        const clientName = client?.companyName || deal.clientId;
        const current = revenueByClientMap.get(deal.clientId) || { name: clientName, revenue: 0 };
        revenueByClientMap.set(deal.clientId, {
          name: current.name,
          revenue: current.revenue + deal.value,
        });
      })
    );

    const revenueByClient = Array.from(revenueByClientMap.entries())
      .map(([clientId, data]) => ({ clientId, clientName: data.name, revenue: data.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Revenue by stage (for reference)
    const stageRevenueMap = new Map<string, number>();
    const allDeals = await Deal.find({
      tenantId,
      createdAt: { $gte: start, $lte: end },
    }).lean();
    allDeals.forEach((deal) => {
      stageRevenueMap.set(deal.stage, (stageRevenueMap.get(deal.stage) || 0) + deal.value);
    });

    const revenueByStage = Array.from(stageRevenueMap.entries())
      .map(([stage, revenue]) => ({ stage, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      revenueByMonth,
      revenueByClient,
      revenueByStage,
      averageDealSize,
      totalDeals,
    };
  }

  /**
   * Get pipeline analytics
   */
  async getPipelineAnalytics(tenantId: string): Promise<PipelineAnalytics> {
    const activeDeals = await Deal.find({
      tenantId,
      stage: { $nin: ['won', 'lost'] },
    }).lean();

    // Value by stage
    const stageDataMap = new Map<string, { value: number; count: number }>();
    const stageProbabilities: Record<string, number> = {
      lead: 10,
      qualified: 25,
      proposal: 50,
      negotiation: 75,
    };

    activeDeals.forEach((deal) => {
      const current = stageDataMap.get(deal.stage) || { value: 0, count: 0 };
      stageDataMap.set(deal.stage, {
        value: current.value + deal.value,
        count: current.count + 1,
      });
    });

    const valueByStage = Array.from(stageDataMap.entries())
      .map(([stage, data]) => ({
        stage,
        value: data.value,
        count: data.count,
      }))
      .sort((a, b) => {
        const order = ['lead', 'qualified', 'proposal', 'negotiation'];
        return order.indexOf(a.stage) - order.indexOf(b.stage);
      });

    // Calculate totals
    const totalValue = activeDeals.reduce((sum, deal) => sum + deal.value, 0);

    // Weighted value using stage probabilities
    const weightedValue = activeDeals.reduce((sum, deal) => {
      const probability = stageProbabilities[deal.stage] || 0;
      return sum + deal.value * (probability / 100);
    }, 0);

    // Deals at risk (closing date passed)
    const now = new Date();
    const dealsAtRisk = activeDeals.filter((deal) => deal.expectedClose < now).length;

    // Projected revenue (only from won deals in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentWonDeals = await Deal.find({
      tenantId,
      stage: 'won',
      actualClose: { $gte: thirtyDaysAgo },
    }).lean();
    const projectedRevenue = recentWonDeals.reduce((sum, deal) => sum + deal.value, 0);

    return {
      totalValue,
      valueByStage,
      weightedValue,
      dealsAtRisk,
      projectedRevenue,
    };
  }

  /**
   * Get conversion analytics
   */
  async getConversionAnalytics(tenantId: string, filters: Record<string, unknown> = {}): Promise<ConversionAnalytics> {
    const parsed = analyticsDateRangeSchema.parse(filters);
    const { start, end } = getMonthRange(parsed.months);

    const allDeals = await Deal.find({
      tenantId,
      createdAt: { $gte: start, $lte: end },
    }).lean();

    // Stage conversion rates
    const stageOrder = ['lead', 'qualified', 'proposal', 'negotiation'];
    const stageCounts = new Map<string, number>();
    const stageConversions = new Map<string, number>();

    // Count deals at each stage
    allDeals.forEach((deal) => {
      stageCounts.set(deal.stage, (stageCounts.get(deal.stage) || 0) + 1);
    });

    // Calculate conversion rates between stages
    const stageConversionRates: { fromStage: string; toStage: string; rate: number }[] = [];
    for (let i = 0; i < stageOrder.length - 1; i++) {
      const fromStage = stageOrder[i];
      const toStage = stageOrder[i + 1];

      const fromCount = allDeals.filter(
        (d) => d.stage === fromStage || d.stage === 'won' || (d.stage === 'lost' && stageOrder.indexOf(fromStage) < 4)
      ).length;
      const toCount = allDeals.filter((d) => d.stage === toStage || d.stage === 'won').length;

      const rate = fromCount > 0 ? Math.round((toCount / fromCount) * 100) : 0;
      stageConversionRates.push({ fromStage, toStage, rate });
    }

    // Calculate average time to close
    const closedDeals = allDeals.filter((d) => d.actualClose);
    let totalDays = 0;
    let closedCount = 0;

    closedDeals.forEach((deal) => {
      if (deal.actualClose) {
        totalDays += getDaysDifference(deal.createdAt, deal.actualClose);
        closedCount++;
      }
    });

    const avgTimeToClose = closedCount > 0 ? Math.round(totalDays / closedCount) : 0;

    // Win and loss rates
    const wonDeals = allDeals.filter((d) => d.stage === 'won').length;
    const lostDeals = allDeals.filter((d) => d.stage === 'lost').length;
    const totalClosed = wonDeals + lostDeals;

    return {
      totalLeads: allDeals.length,
      conversionRate: allDeals.length > 0 ? Math.round((wonDeals / allDeals.length) * 100) : 0,
      avgTimeToClose,
      stageConversionRates,
      winRate: totalClosed > 0 ? Math.round((wonDeals / totalClosed) * 100) : 0,
      lossRate: totalClosed > 0 ? Math.round((lostDeals / totalClosed) * 100) : 0,
    };
  }

  /**
   * Get revenue forecasting
   */
  async getForecasting(tenantId: string): Promise<ForecastingData> {
    const activeDeals = await Deal.find({
      tenantId,
      stage: { $nin: ['won', 'lost'] },
    }).lean();

    // Calculate weighted pipeline
    const stageProbabilities: Record<string, number> = {
      lead: 10,
      qualified: 25,
      proposal: 50,
      negotiation: 75,
    };

    let weightedPipeline = 0;
    const riskFactors: string[] = [];

    activeDeals.forEach((deal) => {
      const probability = stageProbabilities[deal.stage] || 0;
      weightedPipeline += deal.value * (probability / 100);

      // Identify risk factors
      if (deal.expectedClose < new Date()) {
        riskFactors.push(`${deal.title} is past expected close date`);
      }
      if (deal.stage === 'negotiation' && deal.value > 100000) {
        riskFactors.push(`${deal.title} is high-value deal in negotiation`);
      }
    });

    // Quarterly forecast
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const currentYear = now.getFullYear();

    const quarterlyForecast = [];
    for (let q = 0; q < 4; q++) {
      const quarter = ((currentQuarter + q - 1) % 4) + 1;
      const year = currentYear + Math.floor((currentQuarter + q - 1) / 4);

      // Calculate projected revenue for this quarter
      const dealsClosingThisQuarter = activeDeals.filter((deal) => {
        const closeDate = new Date(deal.expectedClose);
        const dealQuarter = Math.floor(closeDate.getMonth() / 3) + 1;
        return closeDate.getFullYear() === year && dealQuarter === quarter;
      });

      const predicted = dealsClosingThisQuarter.reduce((sum, deal) => {
        const probability = stageProbabilities[deal.stage] || 0;
        return sum + deal.value * (probability / 100);
      }, 0);

      // Get actual for past quarters
      const actualDeals = await Deal.find({
        tenantId,
        stage: 'won',
        actualClose: {
          $gte: new Date(`${year}-${(quarter - 1) * 3 + 1}-01`),
          $lt: new Date(`${year}-${quarter * 3 + 1}-01`),
        },
      }).lean();

      const actual = actualDeals.reduce((sum, deal) => sum + deal.value, 0);

      quarterlyForecast.push({
        quarter: `Q${quarter} ${year}`,
        predicted: Math.round(predicted),
        actual: q === 0 ? undefined : actual || undefined,
      });
    }

    // Calculate confidence based on data quality
    const confidence = Math.min(95, 50 + activeDeals.length * 2);

    return {
      predictedRevenue: Math.round(weightedPipeline),
      confidence,
      quarterlyForecast,
      riskFactors,
    };
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(tenantId: string): Promise<Record<string, unknown>> {
    const [
      clientCount,
      activeDealsCount,
      openInvoicesCount,
      recentActivities,
      pipelineData,
      revenueData,
    ] = await Promise.all([
      Client.countDocuments({ tenantId, status: { $in: ['prospect', 'active'] } }),
      Deal.countDocuments({ tenantId, stage: { $nin: ['won', 'lost'] } }),
      Invoice.countDocuments({ tenantId, status: { $in: ['sent', 'overdue'] } }),
      ActivityModel.find({ tenantId })
        .sort({ date: -1 })
        .limit(10)
        .lean(),
      this.getPipelineAnalytics(tenantId),
      this.getRevenueAnalytics(tenantId, { months: 1 }),
    ]);

    return {
      clientCount,
      activeDealsCount,
      openInvoicesCount,
      recentActivities,
      pipeline: pipelineData,
      monthlyRevenue: revenueData.totalRevenue,
      monthlyDeals: revenueData.totalDeals,
    };
  }
}

export const analyticsService = new AnalyticsService();
