import { OutcomeTrackingEvent, BusinessGoal } from '../models/index.js';
import { OutcomeType, OutcomeStatus, OutcomeTrackingEvent as OutcomeTrackingEventType } from '../types/index.js';
import { trackingLogger } from 'utils/logger.js';
import { outcomeEventTotal, outcomeProgress, outcomeValue, startTimer, dbOperationDuration } from '../utils/metrics.js';

// Generate unique IDs
const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Outcome Tracking Service
 * Monitors and tracks progress towards business goals
 */
export class OutcomeTrackingService {
  /**
   * Track an outcome event
   */
  async trackEvent(
    businessId: string,
    outcomeType: OutcomeType,
    value: number,
    source: string,
    options?: {
      goalId?: string;
      timestamp?: Date;
      metadata?: Record<string, any>;
    }
  ): Promise<OutcomeTrackingEventType> {
    const endTimer = startTimer();
    const eventId = generateId('evt');

    trackingLogger.info('Tracking outcome event', { businessId, outcomeType, value, source });

    try {
      // Get previous value for the business/outcome combination
      const previousEvent = await OutcomeTrackingEvent.findOne({
        businessId,
        outcomeType,
      })
        .sort({ timestamp: -1 })
        .lean();

      const previousValue = previousEvent?.value;
      const change = previousValue !== undefined ? value - previousValue : undefined;
      const changePercent = previousValue && previousValue !== 0
        ? ((value - previousValue) / previousValue) * 100
        : undefined;

      // Create tracking event
      const event = await OutcomeTrackingEvent.create({
        eventId,
        businessId,
        goalId: options?.goalId,
        outcomeType,
        value,
        previousValue,
        change,
        changePercent,
        timestamp: options?.timestamp || new Date(),
        source,
        metadata: options?.metadata,
      });

      // Update associated goal if provided
      if (options?.goalId) {
        await this.updateGoalProgress(options.goalId, value);
      }

      // Update metrics
      outcomeEventTotal.inc({ outcome_type: outcomeType, source });
      outcomeValue.set({ business_id: businessId, outcome_type: outcomeType }, value);

      const duration = endTimer();
      dbOperationDuration.observe({ operation: 'insert', collection: 'outcome_tracking_events' }, duration);

      trackingLogger.info('Outcome event tracked', {
        eventId,
        businessId,
        outcomeType,
        value,
        change,
        changePercent,
        duration,
      });

      return {
        eventId,
        businessId,
        goalId: options?.goalId,
        outcomeType,
        value,
        previousValue,
        change,
        changePercent,
        timestamp: event.timestamp,
        source,
        metadata: options?.metadata,
      };
    } catch (error) {
      trackingLogger.error('Failed to track outcome event', error, { businessId, outcomeType });
      throw error;
    }
  }

  /**
   * Update goal progress based on tracked value
   */
  private async updateGoalProgress(goalId: string, newValue: number): Promise<void> {
    const goal = await BusinessGoal.findOne({ goalId });
    if (!goal) return;

    // Update current value
    goal.currentValue = newValue;

    // Calculate progress percentage
    const progress = goal.targetValue > 0 ? (newValue / goal.targetValue) * 100 : 0;

    // Update outcome progress metric
    outcomeProgress.set(
      { business_id: goal.businessId, goal_id: goalId, outcome_type: goal.type },
      progress
    );

    // Check if goal is achieved
    if (newValue >= goal.targetValue) {
      goal.status = OutcomeStatus.ACHIEVED;
      trackingLogger.info('Goal achieved', { goalId, targetValue: goal.targetValue, currentValue: newValue });
    }
    // Check if goal is at risk (less than 50% progress with less than 30% time remaining)
    else {
      const totalDuration = goal.targetDate.getTime() - goal.startDate.getTime();
      const elapsed = Date.now() - goal.startDate.getTime();
      const timeRemainingPercent = (totalDuration - elapsed) / totalDuration;

      if (progress < 50 && timeRemainingPercent < 0.3) {
        goal.status = OutcomeStatus.AT_RISK;
        trackingLogger.warn('Goal at risk', { goalId, progress, timeRemainingPercent });
      }
    }

    await goal.save();
  }

  /**
   * Get outcome events for a business
   */
  async getEvents(
    businessId: string,
    options?: {
      outcomeType?: OutcomeType;
      goalId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<OutcomeTrackingEventType[]> {
    const query: Record<string, any> = { businessId };

    if (options?.outcomeType) {
      query.outcomeType = options.outcomeType;
    }
    if (options?.goalId) {
      query.goalId = options.goalId;
    }
    if (options?.startDate || options?.endDate) {
      query.timestamp = {};
      if (options.startDate) {
        query.timestamp.$gte = options.startDate;
      }
      if (options.endDate) {
        query.timestamp.$lte = options.endDate;
      }
    }

    const events = await OutcomeTrackingEvent.find(query)
      .sort({ timestamp: options?.sortOrder === 'asc' ? 1 : -1 })
      .limit(options?.limit || 100)
      .lean();

    return events.map(e => ({
      eventId: e.eventId,
      businessId: e.businessId,
      goalId: e.goalId,
      outcomeType: e.outcomeType as OutcomeType,
      value: e.value,
      previousValue: e.previousValue,
      change: e.change,
      changePercent: e.changePercent,
      timestamp: e.timestamp,
      source: e.source,
      metadata: e.metadata,
    }));
  }

  /**
   * Get current status for a business outcome
   */
  async getStatus(
    businessId: string,
    outcomeType: OutcomeType
  ): Promise<{
    currentValue: number;
    lastUpdated: Date;
    trend: 'up' | 'down' | 'stable';
    change24h: number;
    change7d: number;
    change30d: number;
  }> {
    // Get latest event
    const latestEvent = await OutcomeTrackingEvent.findOne({
      businessId,
      outcomeType,
    })
      .sort({ timestamp: -1 })
      .lean();

    if (!latestEvent) {
      return {
        currentValue: 0,
        lastUpdated: new Date(),
        trend: 'stable',
        change24h: 0,
        change7d: 0,
        change30d: 0,
      };
    }

    // Get events for different time periods
    const now = new Date();
    const [event24h, event7d, event30d] = await Promise.all([
      OutcomeTrackingEvent.findOne({
        businessId,
        outcomeType,
        timestamp: { $lte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      }).sort({ timestamp: -1 }).lean(),
      OutcomeTrackingEvent.findOne({
        businessId,
        outcomeType,
        timestamp: { $lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      }).sort({ timestamp: -1 }).lean(),
      OutcomeTrackingEvent.findOne({
        businessId,
        outcomeType,
        timestamp: { $lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      }).sort({ timestamp: -1 }).lean(),
    ]);

    const change24h = event24h ? latestEvent.value - event24h.value : 0;
    const change7d = event7d ? latestEvent.value - event7d.value : 0;
    const change30d = event30d ? latestEvent.value - event30d.value : 0;

    // Determine trend based on recent changes
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (change24h > 0 || change7d > 0) trend = 'up';
    else if (change24h < 0 || change7d < 0) trend = 'down';

    return {
      currentValue: latestEvent.value,
      lastUpdated: latestEvent.timestamp,
      trend,
      change24h,
      change7d,
      change30d,
    };
  }

  /**
   * Get aggregated metrics for a time period
   */
  async getAggregatedMetrics(
    businessId: string,
    outcomeType: OutcomeType,
    period: 'day' | 'week' | 'month',
    count: number = 12
  ): Promise<Array<{
    period: string;
    startDate: Date;
    endDate: Date;
    startValue: number;
    endValue: number;
    change: number;
    changePercent: number;
  }>> {
    const now = new Date();
    const periods: Array<{
      period: string;
      startDate: Date;
      endDate: Date;
    }> = [];

    // Generate period boundaries
    for (let i = count - 1; i >= 0; i--) {
      let startDate: Date;
      let endDate: Date;
      let periodLabel: string;

      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
          periodLabel = startDate.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
          startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
          endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          periodLabel = `Week ${count - i}`;
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
          periodLabel = startDate.toLocaleString('default', { month: 'short', year: '2-digit' });
          break;
      }

      periods.push({ period: periodLabel, startDate, endDate });
    }

    // Get events for all periods
    const events = await OutcomeTrackingEvent.find({
      businessId,
      outcomeType,
      timestamp: {
        $gte: periods[0].startDate,
        $lte: now,
      },
    })
      .sort({ timestamp: 1 })
      .lean();

    // Aggregate by period
    const results = periods.map(p => {
      const periodEvents = events.filter(
        e => e.timestamp >= p.startDate && e.timestamp < p.endDate
      );

      const startValue = periodEvents[0]?.value || 0;
      const endValue = periodEvents[periodEvents.length - 1]?.value || startValue;
      const change = endValue - startValue;
      const changePercent = startValue !== 0 ? (change / startValue) * 100 : 0;

      return {
        period: p.period,
        startDate: p.startDate,
        endDate: p.endDate,
        startValue,
        endValue,
        change,
        changePercent,
      };
    });

    return results;
  }

  /**
   * Create or update a business goal
   */
  async upsertGoal(
    businessId: string,
    type: OutcomeType,
    targetValue: number,
    targetDate: Date,
    options?: {
      startValue?: number;
      startDate?: Date;
      metadata?: Record<string, any>;
    }
  ): Promise<string> {
    const goalId = generateId('goal');

    // Check if active goal exists
    const existingGoal = await BusinessGoal.findOne({
      businessId,
      type,
      status: OutcomeStatus.ACTIVE,
    });

    if (existingGoal) {
      // Update existing goal
      existingGoal.targetValue = targetValue;
      existingGoal.targetDate = targetDate;
      if (options?.metadata) {
        existingGoal.metadata = { ...existingGoal.metadata, ...options.metadata };
      }
      await existingGoal.save();

      trackingLogger.info('Goal updated', { goalId: existingGoal.goalId, businessId, type });
      return existingGoal.goalId;
    }

    // Create new goal
    const goal = await BusinessGoal.create({
      goalId,
      businessId,
      type,
      targetValue,
      currentValue: options?.startValue || 0,
      startDate: options?.startDate || new Date(),
      targetDate,
      status: OutcomeStatus.ACTIVE,
      metadata: options?.metadata,
    });

    trackingLogger.info('Goal created', { goalId, businessId, type, targetValue });

    return goalId;
  }

  /**
   * Get active goals for a business
   */
  async getActiveGoals(businessId: string): Promise<Array<{
    goalId: string;
    type: OutcomeType;
    targetValue: number;
    currentValue: number;
    progress: number;
    targetDate: Date;
    daysRemaining: number;
    status: OutcomeStatus;
  }>> {
    const goals = await BusinessGoal.find({
      businessId,
      status: { $in: [OutcomeStatus.ACTIVE, OutcomeStatus.AT_RISK] },
    }).lean();

    return goals.map(g => {
      const progress = g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0;
      const daysRemaining = Math.ceil(
        (g.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      return {
        goalId: g.goalId,
        type: g.type as OutcomeType,
        targetValue: g.targetValue,
        currentValue: g.currentValue,
        progress,
        targetDate: g.targetDate,
        daysRemaining: Math.max(0, daysRemaining),
        status: g.status as OutcomeStatus,
      };
    });
  }

  /**
   * Pause a goal
   */
  async pauseGoal(goalId: string): Promise<void> {
    await BusinessGoal.findOneAndUpdate(
      { goalId },
      { status: OutcomeStatus.PAUSED }
    );
    trackingLogger.info('Goal paused', { goalId });
  }

  /**
   * Resume a paused goal
   */
  async resumeGoal(goalId: string): Promise<void> {
    await BusinessGoal.findOneAndUpdate(
      { goalId },
      { status: OutcomeStatus.ACTIVE }
    );
    trackingLogger.info('Goal resumed', { goalId });
  }
}

// Export singleton instance
export const outcomeTrackingService = new OutcomeTrackingService();
export default outcomeTrackingService;