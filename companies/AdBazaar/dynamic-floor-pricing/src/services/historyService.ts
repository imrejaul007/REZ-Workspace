import { FloorHistory, IFloorHistory } from '../models';
import { createLogger } from 'utils/logger.js';

const logger = createLogger('HistoryService');

interface HistoryQuery {
  floorId?: string;
  inventoryId?: string;
  reasonCode?: string;
  triggeredBy?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

interface PriceChangeSummary {
  totalChanges: number;
  averageChange: number;
  maxIncrease: number;
  maxDecrease: number;
  mostCommonReason: string;
  changesByTrigger: Record<string, number>;
  changesByDay: Array<{ date: string; count: number; avgChange: number }>;
}

export class HistoryService {
  /**
   * Get floor price history with pagination
   */
  async getHistory(query: HistoryQuery): Promise<{
    history: IFloorHistory[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { floorId, inventoryId, reasonCode, triggeredBy, startDate, endDate, page = 1, limit = 50 } = query;

    const filter: Record<string, unknown> = {};
    if (floorId) filter.floorId = floorId;
    if (inventoryId) filter.inventoryId = inventoryId;
    if (reasonCode) filter.reasonCode = reasonCode;
    if (triggeredBy) filter.triggeredBy = triggeredBy;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) (filter.timestamp as Record<string, Date>).$gte = startDate;
      if (endDate) (filter.timestamp as Record<string, Date>).$lte = endDate;
    }

    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      FloorHistory.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      FloorHistory.countDocuments(filter)
    ]);

    logger.debug('Retrieved history', { total, page, limit });
    return { history, total, page, limit };
  }

  /**
   * Get price change summary for a floor
   */
  async getPriceChangeSummary(floorId: string, days: number = 30): Promise<PriceChangeSummary> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const history = await FloorHistory.find({
      floorId,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 });

    if (history.length === 0) {
      return {
        totalChanges: 0,
        averageChange: 0,
        maxIncrease: 0,
        maxDecrease: 0,
        mostCommonReason: 'N/A',
        changesByTrigger: {},
        changesByDay: []
      };
    }

    const changesByTrigger: Record<string, number> = {};
    const changesByDay: Record<string, { count: number; totalChange: number }> = {};

    let totalChangeSum = 0;
    let maxIncrease = 0;
    let maxDecrease = 0;
    const reasonCounts: Record<string, number> = {};

    history.forEach(h => {
      // Track changes by trigger
      changesByTrigger[h.triggeredBy] = (changesByTrigger[h.triggeredBy] || 0) + 1;

      // Track changes by day
      const dayKey = h.timestamp.toISOString().split('T')[0];
      if (!changesByDay[dayKey]) {
        changesByDay[dayKey] = { count: 0, totalChange: 0 };
      }
      changesByDay[dayKey].count++;
      changesByDay[dayKey].totalChange += h.priceChangePercent;

      // Track max changes
      if (h.priceChangePercent > maxIncrease) maxIncrease = h.priceChangePercent;
      if (h.priceChangePercent < maxDecrease) maxDecrease = h.priceChangePercent;

      // Track reasons
      reasonCounts[h.reasonCode] = (reasonCounts[h.reasonCode] || 0) + 1;

      totalChangeSum += h.priceChangePercent;
    });

    // Find most common reason
    let mostCommonReason = 'N/A';
    let maxCount = 0;
    for (const [reason, count] of Object.entries(reasonCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonReason = reason;
      }
    }

    // Format changes by day
    const changesByDayArray = Object.entries(changesByDay).map(([date, data]) => ({
      date,
      count: data.count,
      avgChange: data.totalChange / data.count
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalChanges: history.length,
      averageChange: totalChangeSum / history.length,
      maxIncrease,
      maxDecrease,
      mostCommonReason,
      changesByTrigger,
      changesByDay: changesByDayArray
    };
  }

  /**
   * Get recent price changes across all floors
   */
  async getRecentChanges(hours: number = 24, limit: number = 100): Promise<IFloorHistory[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return FloorHistory.find({
      timestamp: { $gte: since }
    })
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  /**
   * Compare two time periods for a floor
   */
  async comparePeriods(
    floorId: string,
    currentDays: number = 7,
    previousDays: number = 7
  ): Promise<{
    currentPeriod: { changes: number; avgChange: number };
    previousPeriod: { changes: number; avgChange: number };
    trend: 'increasing' | 'decreasing' | 'stable';
    change: number;
  }> {
    const now = new Date();

    const currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - currentDays);

    const previousStart = new Date(now);
    previousStart.setDate(previousStart.getDate() - currentDays - previousDays);
    const previousEnd = new Date(currentStart);

    const [currentHistory, previousHistory] = await Promise.all([
      FloorHistory.find({
        floorId,
        timestamp: { $gte: currentStart }
      }),
      FloorHistory.find({
        floorId,
        timestamp: { $gte: previousStart, $lt: previousEnd }
      })
    ]);

    const currentAvg = currentHistory.length > 0
      ? currentHistory.reduce((sum, h) => sum + h.priceChangePercent, 0) / currentHistory.length
      : 0;

    const previousAvg = previousHistory.length > 0
      ? previousHistory.reduce((sum, h) => sum + h.priceChangePercent, 0) / previousHistory.length
      : 0;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (currentAvg > previousAvg + 0.5) trend = 'increasing';
    else if (currentAvg < previousAvg - 0.5) trend = 'decreasing';

    return {
      currentPeriod: {
        changes: currentHistory.length,
        avgChange: Math.round(currentAvg * 100) / 100
      },
      previousPeriod: {
        changes: previousHistory.length,
        avgChange: Math.round(previousAvg * 100) / 100
      },
      trend,
      change: Math.round((currentAvg - previousAvg) * 100) / 100
    };
  }

  /**
   * Get price trajectory for a floor
   */
  async getPriceTrajectory(
    floorId: string,
    days: number = 30
  ): Promise<Array<{
    timestamp: Date;
    price: number;
    change: number;
    reason: string;
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const history = await FloorHistory.find({
      floorId,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 });

    // Get initial price (from first history record's previousPrice)
    const trajectory: Array<{
      timestamp: Date;
      price: number;
      change: number;
      reason: string;
    }> = [];

    if (history.length > 0) {
      // Add initial point
      trajectory.push({
        timestamp: history[0].timestamp,
        price: history[0].previousPrice,
        change: 0,
        reason: 'Initial'
      });

      // Add each change
      history.forEach(h => {
        trajectory.push({
          timestamp: h.timestamp,
          price: h.newPrice,
          change: h.priceChangePercent,
          reason: h.reason
        });
      });
    }

    return trajectory;
  }

  /**
   * Get statistics for a floor
   */
  async getFloorStats(floorId: string): Promise<{
    totalChanges: number;
    aiChanges: number;
    manualChanges: number;
    avgTimeBetweenChanges: number;
    mostVolatileDay: string | null;
    stabilityScore: number;
  }> {
    const history = await FloorHistory.find({ floorId }).sort({ timestamp: 1 });

    if (history.length === 0) {
      return {
        totalChanges: 0,
        aiChanges: 0,
        manualChanges: 0,
        avgTimeBetweenChanges: 0,
        mostVolatileDay: null,
        stabilityScore: 100
      };
    }

    let aiChanges = 0;
    let manualChanges = 0;
    let totalTimeBetween = 0;
    const changesByDay: Record<string, number> = {};

    for (let i = 0; i < history.length; i++) {
      if (history[i].triggeredBy === 'ai_optimization') aiChanges++;
      else if (history[i].triggeredBy === 'manual') manualChanges++;

      if (i > 0) {
        const timeDiff = history[i].timestamp.getTime() - history[i - 1].timestamp.getTime();
        totalTimeBetween += timeDiff;
      }

      const day = history[i].timestamp.toISOString().split('T')[0];
      changesByDay[day] = (changesByDay[day] || 0) + 1;
    }

    // Find most volatile day
    let mostVolatileDay: string | null = null;
    let maxChanges = 0;
    for (const [day, count] of Object.entries(changesByDay)) {
      if (count > maxChanges) {
        maxChanges = count;
        mostVolatileDay = day;
      }
    }

    // Calculate stability score (0-100)
    // Based on frequency of changes and volatility
    const avgChangesPerDay = history.length / Object.keys(changesByDay).length;
    const volatility = maxChanges > 1 ? (maxChanges - 1) / avgChangesPerDay : 0;
    const stabilityScore = Math.max(0, Math.min(100, 100 - volatility * 20));

    const avgTimeBetweenChanges = history.length > 1 ? totalTimeBetween / (history.length - 1) : 0;

    return {
      totalChanges: history.length,
      aiChanges,
      manualChanges,
      avgTimeBetweenChanges,
      mostVolatileDay,
      stabilityScore: Math.round(stabilityScore * 10) / 10
    };
  }
}

export const historyService = new HistoryService();