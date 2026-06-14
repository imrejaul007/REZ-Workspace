import { v4 as uuidv4 } from 'uuid';
import {
  BudgetAllocation,
  PacingStatus,
  Forecast,
  BudgetStrategy,
  PacingMode,
  AllocationStatus,
  BudgetRecommendation,
  PerformanceData,
  CreateAllocationInput,
  UpdateAllocationInput,
  RecordSpendingInput
} from '../types';
import logger from '../utils/logger';

class BudgetService {
  private allocations: Map<string, BudgetAllocation> = new Map();
  private pacingStatuses: Map<string, PacingStatus> = new Map();
  private forecasts: Map<string, Forecast> = new Map();
  private campaignAllocations: Map<string, Set<string>> = new Map();

  // Allocation Management
  createAllocation(input: CreateAllocationInput): BudgetAllocation {
    const id = uuidv4();
    const now = new Date();

    const allocation: BudgetAllocation = {
      id,
      campaignId: input.campaignId,
      adGroupId: input.adGroupId,
      strategy: input.strategy,
      pacingMode: input.pacingMode ?? PacingMode.STANDARD,
      totalBudget: input.totalBudget,
      dailyBudget: input.dailyBudget,
      spentAmount: 0,
      allocatedAmount: 0,
      remainingAmount: input.totalBudget,
      status: AllocationStatus.ACTIVE,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      performance: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        ctr: 0,
        cvr: 0,
        roas: 0,
        cpa: 0,
        cpm: 0
      },
      weights: input.weights ?? {},
      createdAt: now,
      updatedAt: now
    };

    this.allocations.set(id, allocation);

    const campaignKey = input.campaignId;
    const allocationIds = this.campaignAllocations.get(campaignKey) || new Set();
    allocationIds.add(id);
    this.campaignAllocations.set(campaignKey, allocationIds);

    // Initialize pacing status
    this.updatePacingStatus(id);

    logger.info(`Budget allocation created: ${id}, campaign: ${input.campaignId}, strategy: ${input.strategy}`);
    return allocation;
  }

  getAllocation(id: string): BudgetAllocation | undefined {
    return this.allocations.get(id);
  }

  getAllocationForCampaign(campaignId: string): BudgetAllocation | undefined {
    let found: BudgetAllocation | undefined;
    this.allocations.forEach(allocation => {
      if (allocation.campaignId === campaignId && allocation.status === AllocationStatus.ACTIVE) {
        found = allocation;
      }
    });
    return found;
  }

  getAllocations(filters?: {
    campaignId?: string;
    status?: AllocationStatus;
    strategy?: BudgetStrategy;
  }): BudgetAllocation[] {
    const results: BudgetAllocation[] = [];

    this.allocations.forEach(allocation => {
      if (filters?.campaignId && allocation.campaignId !== filters.campaignId) return;
      if (filters?.status && allocation.status !== filters.status) return;
      if (filters?.strategy && allocation.strategy !== filters.strategy) return;
      results.push(allocation);
    });

    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  updateAllocation(id: string, input: UpdateAllocationInput): BudgetAllocation | undefined {
    const allocation = this.allocations.get(id);
    if (!allocation) return undefined;

    const previousBudget = allocation.totalBudget;
    const updated: BudgetAllocation = {
      ...allocation,
      totalBudget: input.totalBudget ?? allocation.totalBudget,
      dailyBudget: input.dailyBudget ?? allocation.dailyBudget,
      strategy: input.strategy ?? allocation.strategy,
      pacingMode: input.pacingMode ?? allocation.pacingMode,
      status: input.status ?? allocation.status,
      weights: input.weights ?? allocation.weights,
      remainingAmount: (input.totalBudget ?? allocation.totalBudget) - allocation.spentAmount,
      updatedAt: new Date()
    };

    this.allocations.set(id, updated);

    if (input.totalBudget && input.totalBudget !== previousBudget) {
      this.updatePacingStatus(id);
    }

    logger.info(`Budget allocation updated: ${id}`);
    return updated;
  }

  deleteAllocation(id: string): boolean {
    const allocation = this.allocations.get(id);
    if (!allocation) return false;

    const allocationIds = this.campaignAllocations.get(allocation.campaignId);
    if (allocationIds) {
      allocationIds.delete(id);
    }

    return this.allocations.delete(id);
  }

  // Spending Recording
  recordSpending(input: RecordSpendingInput): BudgetAllocation | undefined {
    const allocation = this.allocations.get(input.allocationId);
    if (!allocation) return undefined;

    allocation.spentAmount += input.amount;
    allocation.remainingAmount = allocation.totalBudget - allocation.spentAmount;

    if (input.impressions !== undefined) {
      allocation.performance.impressions += input.impressions;
    }
    if (input.clicks !== undefined) {
      allocation.performance.clicks += input.clicks;
    }
    if (input.conversions !== undefined) {
      allocation.performance.conversions += input.conversions;
    }
    if (input.revenue !== undefined) {
      allocation.performance.revenue += input.revenue;
    }

    // Update calculated metrics
    this.updatePerformanceMetrics(allocation);

    allocation.updatedAt = new Date();
    this.allocations.set(input.allocationId, allocation);

    // Update pacing
    this.updatePacingStatus(input.allocationId);

    return allocation;
  }

  private updatePerformanceMetrics(allocation: BudgetAllocation): void {
    const { impressions, clicks, conversions, revenue, spentAmount } = allocation.performance;

    // CTR
    allocation.performance.ctr = impressions > 0 ? clicks / impressions : 0;

    // CVR
    allocation.performance.cvr = clicks > 0 ? conversions / clicks : 0;

    // CPM
    allocation.performance.cpm = impressions > 0 ? (spentAmount / impressions) * 1000 : 0;

    // CPA
    allocation.performance.cpa = conversions > 0 ? spentAmount / conversions : 0;

    // ROAS
    allocation.performance.roas = spentAmount > 0 ? revenue / spentAmount : 0;
  }

  // Pacing Management
  private updatePacingStatus(allocationId: string): PacingStatus {
    const allocation = this.allocations.get(allocationId);
    if (!allocation) throw new Error('Allocation not found');

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Calculate time elapsed in day (as percentage)
    const msElapsed = now.getTime() - startOfDay.getTime();
    const msInDay = 24 * 60 * 60 * 1000;
    const dayProgress = msElapsed / msInDay;

    // Calculate expected spend
    const dailyBudget = allocation.dailyBudget ?? allocation.totalBudget / 30;
    const expectedSpend = dailyBudget * dayProgress;
    const actualSpend = allocation.spentAmount % dailyBudget || allocation.spentAmount;

    // Calculate pace ratio
    const paceRatio = expectedSpend > 0 ? actualSpend / expectedSpend : 1;
    const isOnTrack = paceRatio >= 0.9 && paceRatio <= 1.1;

    // Calculate recommended change
    let recommendedChange = 0;
    if (paceRatio < 0.8) {
      // Behind pace - reduce budget
      recommendedChange = -Math.round((1 - paceRatio) * 100);
    } else if (paceRatio > 1.2) {
      // Ahead of pace - could increase or decrease
      recommendedChange = Math.round((paceRatio - 1) * 50);
    }

    let pacing = this.pacingStatuses.get(allocationId) || {
      id: uuidv4(),
      allocationId,
      targetPace: dailyBudget,
      actualPace: actualSpend,
      expectedSpendByEndOfDay: dailyBudget,
      actualSpendByEndOfDay: actualSpend,
      paceRatio: 1,
      isOnTrack: true,
      recommendedBudgetChange: 0,
      updatedAt: now
    };

    pacing.targetPace = dailyBudget;
    pacing.actualPace = actualSpend;
    pacing.expectedSpendByEndOfDay = dailyBudget;
    pacing.actualSpendByEndOfDay = actualSpend;
    pacing.paceRatio = paceRatio;
    pacing.isOnTrack = isOnTrack;
    pacing.recommendedBudgetChange = recommendedChange;
    pacing.updatedAt = now;

    this.pacingStatuses.set(allocationId, pacing);

    return pacing;
  }

  getPacingStatus(allocationId: string): PacingStatus | undefined {
    return this.pacingStatuses.get(allocationId);
  }

  // Budget Optimization
  optimizeBudget(allocationId: string): BudgetRecommendation {
    const allocation = this.allocations.get(allocationId);
    if (!allocation) throw new Error('Allocation not found');

    const performance = allocation.performance;
    const currentBudget = allocation.totalBudget;

    // Calculate efficiency metrics
    const roas = performance.revenue / (performance.spentAmount || 1);
    const ctr = performance.impressions > 0 ? performance.clicks / performance.impressions : 0;
    const cvr = performance.clicks > 0 ? performance.conversions / performance.clicks : 0;

    let recommendedBudget = currentBudget;
    let reason = '';
    let confidence = 0.5;

    switch (allocation.strategy) {
      case BudgetStrategy.PERFORMANCE_BASED:
        // Increase budget if ROAS is good, decrease if poor
        if (roas > 3) {
          recommendedBudget = currentBudget * 1.3;
          reason = 'Strong ROAS detected - scaling budget for growth';
          confidence = 0.85;
        } else if (roas < 1) {
          recommendedBudget = currentBudget * 0.7;
          reason = 'Below target ROAS - reducing budget to optimize spend';
          confidence = 0.8;
        } else {
          reason = 'Performance within acceptable range - maintaining budget';
          confidence = 0.6;
        }
        break;

      case BudgetStrategy.ROAS_OPTIMIZED:
        const targetRoas = 4; // Example target
        if (roas > targetRoas * 1.2) {
          recommendedBudget = currentBudget * 1.5;
          reason = `ROAS (${roas.toFixed(2)}) significantly exceeds target (${targetRoas}) - aggressive scaling`;
          confidence = 0.9;
        } else if (roas < targetRoas * 0.7) {
          recommendedBudget = currentBudget * 0.6;
          reason = `ROAS (${roas.toFixed(2)}) below target (${targetRoas}) - reducing spend`;
          confidence = 0.85;
        } else {
          recommendedBudget = currentBudget * 1.1;
          reason = 'Near target ROAS - moderate scaling';
          confidence = 0.75;
        }
        break;

      case BudgetStrategy.CONVERSION_FOCUSED:
        const cpa = performance.conversions > 0 ? performance.spentAmount / performance.conversions : Infinity;
        const targetCpa = 50; // Example target
        if (cpa < targetCpa * 0.8) {
          recommendedBudget = currentBudget * 1.4;
          reason = `CPA ($${cpa.toFixed(2)}) below target ($${targetCpa}) - increasing budget`;
          confidence = 0.8;
        } else if (cpa > targetCpa * 1.5) {
          recommendedBudget = currentBudget * 0.5;
          reason = `CPA ($${cpa.toFixed(2)}) significantly above target - reducing budget`;
          confidence = 0.75;
        } else {
          reason = 'CPA within acceptable range';
          confidence = 0.65;
        }
        break;

      case BudgetStrategy.REACH_MAXIMIZER:
        // Maximize impressions within budget
        const cpm = performance.impressions > 0 ? (performance.spentAmount / performance.impressions) * 1000 : Infinity;
        const targetCpm = 10; // Example target
        if (cpm < targetCpm) {
          recommendedBudget = currentBudget * 1.2;
          reason = 'Efficient CPM - increasing reach';
          confidence = 0.7;
        } else {
          reason = 'CPM at market rates';
          confidence = 0.6;
        }
        break;

      default:
        reason = 'Evenly distributed strategy - no optimization applied';
        confidence = 0.5;
    }

    const changePercentage = ((recommendedBudget - currentBudget) / currentBudget) * 100;

    // Calculate expected impact
    const budgetChangeRatio = recommendedBudget / currentBudget;
    const expectedImpact = {
      impressions: Math.round(performance.impressions * budgetChangeRatio),
      conversions: Math.round(performance.conversions * budgetChangeRatio),
      roas: roas // Simplified - would use predictive model
    };

    allocation.lastOptimizedAt = new Date();
    this.allocations.set(allocationId, allocation);

    logger.info(`Budget optimization for ${allocationId}: ${currentBudget} -> ${recommendedBudget} (${changePercentage.toFixed(1)}%)`);

    return {
      campaignId: allocation.campaignId,
      currentBudget,
      recommendedBudget,
      changePercentage,
      reason,
      expectedImpact,
      confidence
    };
  }

  // Cross-campaign budget allocation
  allocateBudgetAcrossCampaigns(
    campaignIds: string[],
    totalBudget: number,
    strategy: BudgetStrategy
  ): Record<string, number> {
    const allocations: Record<string, number> = {};

    if (campaignIds.length === 0) return allocations;

    switch (strategy) {
      case BudgetStrategy.EVENLY_DISTRIBUTED:
        const perCampaign = totalBudget / campaignIds.length;
        campaignIds.forEach(id => allocations[id] = perCampaign);
        break;

      case BudgetStrategy.PERFORMANCE_BASED: {
        // Get performance data for each campaign
        const performances: Array<{ id: string; score: number }> = [];

        campaignIds.forEach(id => {
          const allocation = this.getAllocationForCampaign(id);
          if (allocation) {
            // Score based on ROAS and conversion rate
            const roas = allocation.performance.revenue / (allocation.performance.spentAmount || 1);
            const cvr = allocation.performance.clicks > 0
              ? allocation.performance.conversions / allocation.performance.clicks
              : 0;
            const score = roas * (cvr + 0.1);
            performances.push({ id, score });
          } else {
            performances.push({ id, score: 0 });
          }
        });

        const totalScore = performances.reduce((sum, p) => sum + p.score, 0);
        if (totalScore > 0) {
          performances.forEach(p => {
            allocations[p.id] = (p.score / totalScore) * totalBudget;
          });
        } else {
          const equalShare = totalBudget / campaignIds.length;
          campaignIds.forEach(id => allocations[id] = equalShare);
        }
        break;
      }

      case BudgetStrategy.ROAS_OPTIMIZED: {
        // Prioritize campaigns with best ROAS
        const campaignsWithRoas: Array<{ id: string; roas: number }> = [];

        campaignIds.forEach(id => {
          const allocation = this.getAllocationForCampaign(id);
          const roas = allocation
            ? allocation.performance.revenue / (allocation.performance.spentAmount || 1)
            : 0;
          campaignsWithRoas.push({ id, roas });
        });

        // Sort by ROAS descending
        campaignsWithRoas.sort((a, b) => b.roas - a.roas);

        // Allocate more to higher ROAS campaigns
        const weights = campaignsWithRoas.map((c, i) => Math.pow(0.8, i) + 0.2);
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        campaignsWithRoas.forEach((c, i) => {
          allocations[c.id] = (weights[i] / totalWeight) * totalBudget;
        });
        break;
      }

      default:
        const defaultShare = totalBudget / campaignIds.length;
        campaignIds.forEach(id => allocations[id] = defaultShare);
    }

    logger.info(`Budget allocated across ${campaignIds.length} campaigns using ${strategy} strategy`);

    return allocations;
  }

  // Forecasting
  generateForecast(allocationId: string, targetDate: Date): Forecast {
    const allocation = this.allocations.get(allocationId);
    if (!allocation) throw new Error('Allocation not found');

    const now = new Date();
    const daysElapsed = Math.max(1, (now.getTime() - allocation.startDate.getTime()) / (24 * 60 * 60 * 1000));
    const daysRemaining = Math.max(0, (targetDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    // Calculate daily rates
    const dailySpend = allocation.spentAmount / daysElapsed;
    const dailyImpressions = allocation.performance.impressions / daysElapsed;
    const dailyClicks = allocation.performance.clicks / daysElapsed;
    const dailyConversions = allocation.performance.conversions / daysElapsed;
    const dailyRevenue = allocation.performance.revenue / daysElapsed;

    // Predict remaining spend
    const predictedSpend = allocation.spentAmount + (dailySpend * daysRemaining);
    const predictedImpressions = allocation.performance.impressions + Math.round(dailyImpressions * daysRemaining);
    const predictedClicks = allocation.performance.clicks + Math.round(dailyClicks * daysRemaining);
    const predictedConversions = allocation.performance.conversions + Math.round(dailyConversions * daysRemaining);
    const predictedRevenue = allocation.performance.revenue + (dailyRevenue * daysRemaining);

    // Confidence decreases with forecast horizon
    const confidence = Math.max(0.5, 1 - (daysRemaining / 30) * 0.3);

    const forecast: Forecast = {
      id: uuidv4(),
      allocationId,
      targetDate,
      predictedSpend,
      predictedImpressions,
      predictedClicks,
      predictedConversions,
      predictedRevenue,
      confidence,
      model: 'linear_regression',
      createdAt: now
    };

    this.forecasts.set(forecast.id, forecast);

    return forecast;
  }

  getForecasts(allocationId?: string): Forecast[] {
    const results: Forecast[] = [];
    this.forecasts.forEach(forecast => {
      if (allocationId && forecast.allocationId !== allocationId) return;
      results.push(forecast);
    });
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Statistics
  getStats(): {
    totalAllocations: number;
    activeAllocations: number;
    totalBudget: number;
    totalSpent: number;
    avgRoas: number;
    onTrackCount: number;
    offTrackCount: number;
  } {
    let totalAllocations = 0;
    let activeAllocations = 0;
    let totalBudget = 0;
    let totalSpent = 0;
    let totalRevenue = 0;
    let onTrackCount = 0;
    let offTrackCount = 0;

    this.allocations.forEach(allocation => {
      totalAllocations++;
      if (allocation.status === AllocationStatus.ACTIVE) {
        activeAllocations++;
        totalBudget += allocation.totalBudget;
        totalSpent += allocation.spentAmount;
        totalRevenue += allocation.performance.revenue;

        const pacing = this.pacingStatuses.get(allocation.id);
        if (pacing) {
          if (pacing.isOnTrack) onTrackCount++;
          else offTrackCount++;
        }
      }
    });

    const avgRoas = totalSpent > 0 ? totalRevenue / totalSpent : 0;

    return {
      totalAllocations,
      activeAllocations,
      totalBudget,
      totalSpent,
      avgRoas,
      onTrackCount,
      offTrackCount
    };
  }
}

export default new BudgetService();
