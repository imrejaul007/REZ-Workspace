import { YieldSummary, YieldStrategy, IInventoryBreakdown } from '../models';
import logger from '../utils/logger';
import { setYieldMetrics, trackRevenue, trackImpressions } from '../utils/metrics';

export interface YieldSummaryParams {
  startDate?: Date;
  endDate?: Date;
  inventoryType?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface YieldAnalysisResult {
  current: {
    revenue: number;
    ecpm: number;
    fillRate: number;
    impressions: number;
    requests: number;
  };
  trends: {
    revenue: number;
    ecpm: number;
    fillRate: number;
  };
  breakdown: {
    byInventory: IInventoryBreakdown[];
    byDemand: any[];
  };
  comparison: {
    previous: {
      revenue: number;
      ecpm: number;
      fillRate: number;
    };
    change: {
      revenue: number;
      ecpm: number;
      fillRate: number;
    };
  };
}

class YieldService {
  /**
   * Get yield summary for a date range
   */
  async getYieldSummary(params: YieldSummaryParams = {}): Promise<YieldAnalysisResult> {
    const {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      inventoryType
    } = params;

    logger.info('Fetching yield summary', { startDate, endDate, inventoryType });

    // Get summaries for the date range
    const summaries = await YieldSummary.find({
      date: { $gte: startDate, $lte: endDate },
      ...(inventoryType && { 'inventory.breakdown.inventoryType': inventoryType })
    }).sort({ date: -1 });

    if (summaries.length === 0) {
      // Return mock data if no real data exists
      return this.getMockYieldSummary();
    }

    // Calculate aggregated metrics
    const latest = summaries[0];
    const oldest = summaries[summaries.length - 1];

    const totalRevenue = summaries.reduce((sum, s) => sum + s.revenue.total, 0);
    const totalImpressions = summaries.reduce((sum, s) => sum + s.inventory.total, 0);
    const totalRequests = summaries.reduce((sum, s) => sum + s.requests.total, 0);
    const avgEcpm = totalImpressions > 0 ? (totalRevenue / totalImpressions) * 1000 : 0;
    const avgFillRate = totalRequests > 0 ? (totalImpressions / totalRequests) * 100 : 0;

    // Calculate trends
    const revenueChange = oldest.revenue.total > 0
      ? ((latest.revenue.total - oldest.revenue.total) / oldest.revenue.total) * 100
      : 0;
    const ecpmChange = oldest.ecpm.average > 0
      ? ((latest.ecpm.average - oldest.ecpm.average) / oldest.ecpm.average) * 100
      : 0;
    const fillRateChange = oldest.fillRate.overall > 0
      ? ((latest.fillRate.overall - oldest.fillRate.overall) / oldest.fillRate.overall) * 100
      : 0;

    // Aggregate inventory breakdown
    const inventoryMap = new Map<string, IInventoryBreakdown>();
    summaries.forEach(summary => {
      summary.inventory.breakdown.forEach(item => {
        const existing = inventoryMap.get(item.inventoryType);
        if (existing) {
          existing.impressions += item.impressions;
          existing.revenue += item.revenue;
          existing.requests += item.requests;
        } else {
          inventoryMap.set(item.inventoryType, { ...item.toObject() });
        }
      });
    });

    // Calculate totals for each inventory type
    inventoryMap.forEach(item => {
      item.ecpm = item.impressions > 0 ? (item.revenue / item.impressions) * 1000 : 0;
      item.fillRate = item.requests > 0 ? (item.impressions / item.requests) * 100 : 0;
    });

    const result: YieldAnalysisResult = {
      current: {
        revenue: totalRevenue,
        ecpm: avgEcpm,
        fillRate: avgFillRate,
        impressions: totalImpressions,
        requests: totalRequests
      },
      trends: {
        revenue: revenueChange,
        ecpm: ecpmChange,
        fillRate: fillRateChange
      },
      breakdown: {
        byInventory: Array.from(inventoryMap.values()),
        byDemand: []
      },
      comparison: {
        previous: {
          revenue: oldest.revenue.total,
          ecpm: oldest.ecpm.average,
          fillRate: oldest.fillRate.overall
        },
        change: {
          revenue: revenueChange,
          ecpm: ecpmChange,
          fillRate: fillRateChange
        }
      }
    };

    // Update metrics
    setYieldMetrics('all', { ecpm: avgEcpm, fillRate: avgFillRate });
    trackRevenue('all', 'direct', totalRevenue);
    trackImpressions('all', 'direct', totalImpressions);

    return result;
  }

  /**
   * Get inventory yield analysis
   */
  async getInventoryAnalysis(inventoryType?: string): Promise<any> {
    logger.info('Analyzing inventory yield', { inventoryType });

    const strategies = await YieldStrategy.findActive();

    // Aggregate by inventory type
    const analysis: Record<string, any> = {};

    if (inventoryType) {
      const strategiesForType = strategies.filter(s =>
        s.inventoryTypes.includes(inventoryType)
      );
      analysis[inventoryType] = this.analyzeInventoryStrategies(inventoryType, strategiesForType);
    } else {
      // Get all unique inventory types from strategies
      const inventoryTypes = new Set<string>();
      strategies.forEach(s => s.inventoryTypes.forEach(t => inventoryTypes.add(t)));

      inventoryTypes.forEach(type => {
        const strategiesForType = strategies.filter(s => s.inventoryTypes.includes(type));
        analysis[type] = this.analyzeInventoryStrategies(type, strategiesForType);
      });
    }

    return {
      timestamp: new Date().toISOString(),
      inventoryTypes: Object.keys(analysis),
      analysis
    };
  }

  private analyzeInventoryStrategies(inventoryType: string, strategies: any[]) {
    const totalImpressions = strategies.reduce((sum, s) => sum + s.performance.impressions, 0);
    const totalRevenue = strategies.reduce((sum, s) => sum + s.performance.revenue, 0);
    const avgEcpm = totalImpressions > 0 ? (totalRevenue / totalImpressions) * 1000 : 0;
    const avgFillRate = strategies.length > 0
      ? strategies.reduce((sum, s) => sum + s.performance.fillRate, 0) / strategies.length
      : 0;

    return {
      totalStrategies: strategies.length,
      activeStrategies: strategies.filter(s => s.status === 'active').length,
      totalImpressions,
      totalRevenue,
      avgEcpm,
      avgFillRate,
      strategies: strategies.map(s => ({
        id: s._id,
        name: s.name,
        type: s.type,
        priority: s.priority,
        ecpm: s.performance.ecpm,
        fillRate: s.performance.fillRate,
        status: s.status
      }))
    };
  }

  /**
   * Get mock yield summary for demo purposes
   */
  private getMockYieldSummary(): YieldAnalysisResult {
    return {
      current: {
        revenue: 125000,
        ecpm: 4.5,
        fillRate: 72,
        impressions: 27777778,
        requests: 38580247
      },
      trends: {
        revenue: 8.5,
        ecpm: 3.2,
        fillRate: -1.5
      },
      breakdown: {
        byInventory: [
          {
            inventoryType: 'display',
            impressions: 15000000,
            revenue: 67500,
            ecpm: 4.5,
            fillRate: 75,
            requests: 20000000
          },
          {
            inventoryType: 'video',
            impressions: 8000000,
            revenue: 48000,
            ecpm: 6.0,
            fillRate: 70,
            requests: 11428571
          },
          {
            inventoryType: 'native',
            impressions: 4777778,
            revenue: 9500,
            ecpm: 1.99,
            fillRate: 68,
            requests: 7024676
          }
        ],
        byDemand: []
      },
      comparison: {
        previous: {
          revenue: 115000,
          ecpm: 4.36,
          fillRate: 73.1
        },
        change: {
          revenue: 8.7,
          ecpm: 3.2,
          fillRate: -1.5
        }
      }
    };
  }
}

export const yieldService = new YieldService();