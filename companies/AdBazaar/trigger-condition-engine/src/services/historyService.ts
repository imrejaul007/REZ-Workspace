import { History, IHistory } from '../models';
import { createChildLogger } from '../utils/logger';

const logger = createChildLogger('HistoryService');

export class HistoryService {
  async create(data: {
    triggerId: string;
    userId: string;
    triggerType: string;
    eventData?: Record<string, unknown>;
    conditionsEvaluated?: { condition: string; result: boolean; actualValue?: unknown }[];
    actionsExecuted?: {
      actionType: string;
      actionName: string;
      status: 'success' | 'failed' | 'skipped';
      result?: Record<string, unknown>;
      error?: string;
      duration: number;
    }[];
    startedAt?: Date;
    status?: 'success' | 'failed' | 'skipped' | 'partial';
    error?: string;
    metadata?: Record<string, unknown>;
  }): Promise<IHistory> {
    logger.info('Creating history entry', { triggerId: data.triggerId });

    const history = new History({
      triggerId: data.triggerId,
      userId: data.userId,
      triggerType: data.triggerType,
      eventData: data.eventData || {},
      conditionsEvaluated: data.conditionsEvaluated || [],
      actionsExecuted: data.actionsExecuted || [],
      startedAt: data.startedAt || new Date(),
      status: data.status || 'success',
      error: data.error,
      metadata: data.metadata
    });

    await history.save();
    return history;
  }

  async complete(id: string, output?: {
    actionsExecuted?: IHistory['actionsExecuted'];
    status?: 'success' | 'failed' | 'partial';
    error?: string;
  }): Promise<IHistory | null> {
    const history = await History.findById(id);
    if (!history) return null;

    const completedAt = new Date();
    const duration = completedAt.getTime() - new Date(history.startedAt).getTime();

    const updateData: Record<string, unknown> = {
      completedAt,
      duration
    };

    if (output?.actionsExecuted) {
      updateData.actionsExecuted = output.actionsExecuted;
    }

    if (output?.status) {
      updateData.status = output.status;
    }

    if (output?.error) {
      updateData.error = output.error;
    }

    return History.findByIdAndUpdate(id, updateData, { new: true });
  }

  async findById(id: string): Promise<IHistory | null> {
    return History.findById(id).populate('triggerId');
  }

  async findByTrigger(triggerId: string, options?: { limit?: number; status?: string }): Promise<IHistory[]> {
    const query: Record<string, unknown> = { triggerId };
    if (options?.status) query.status = options.status;

    return History.find(query)
      .sort({ createdAt: -1 })
      .limit(options?.limit || 50);
  }

  async findByUser(userId: string, options?: { limit?: number; startDate?: Date; endDate?: Date }): Promise<IHistory[]> {
    const query: Record<string, unknown> = { userId };
    if (options?.startDate || options?.endDate) {
      query.createdAt = {};
      if (options.startDate) (query.createdAt as Record<string, Date>).$gte = options.startDate;
      if (options.endDate) (query.createdAt as Record<string, Date>).$lte = options.endDate;
    }

    return History.find(query)
      .populate('triggerId')
      .sort({ createdAt: -1 })
      .limit(options?.limit || 50);
  }

  async getHistoryStats(triggerId: string): Promise<{
    total: number;
    success: number;
    failed: number;
    skipped: number;
    partial: number;
    avgDuration: number;
    lastRun?: Date;
  }> {
    const history = await History.find({ triggerId });

    if (history.length === 0) {
      return { total: 0, success: 0, failed: 0, skipped: 0, partial: 0, avgDuration: 0 };
    }

    const counts = history.reduce(
      (acc, h) => {
        acc[h.status] = (acc[h.status] || 0) + 1;
        if (h.duration) acc.durationSum += h.duration;
        return acc;
      },
      { success: 0, failed: 0, skipped: 0, partial: 0, durationSum: 0 } as Record<string, number>
    );

    return {
      total: history.length,
      success: counts.success,
      failed: counts.failed,
      skipped: counts.skipped,
      partial: counts.partial,
      avgDuration: history.length > 0 ? counts.durationSum / history.length : 0,
      lastRun: history[0]?.createdAt
    };
  }

  async deleteOld(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await History.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    return result.deletedCount || 0;
  }
}

export const historyService = new HistoryService();