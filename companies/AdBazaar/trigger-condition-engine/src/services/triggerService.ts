import { Trigger, ITrigger, ICondition, IAction } from '../models';
import { createChildLogger } from '../utils/logger';
import { triggersCreatedTotal, activeTriggersGauge, triggersFiredTotal } from '../utils/metrics';

const logger = createChildLogger('TriggerService');

export interface CreateTriggerInput {
  userId: string;
  name: string;
  description?: string;
  type: 'scheduled' | 'event' | 'webhook' | 'manual' | 'data_change' | 'threshold';
  source: string;
  config?: {
    schedule?: string;
    eventType?: string;
    webhookPath?: string;
    dataPath?: string;
    threshold?: number;
    thresholdOperator?: string;
    comparisonValue?: unknown;
  };
  conditions?: ICondition[];
  conditionLogic?: 'and' | 'or';
  actions?: IAction[];
  throttle?: {
    enabled: boolean;
    maxFires: number;
    windowMs: number;
  };
}

export class TriggerService {
  async create(input: CreateTriggerInput): Promise<ITrigger> {
    logger.info('Creating trigger', { userId: input.userId, name: input.name });

    const trigger = new Trigger({
      userId: input.userId,
      name: input.name,
      description: input.description,
      type: input.type,
      source: input.source,
      config: input.config || {},
      conditions: input.conditions || [],
      conditionLogic: input.conditionLogic || 'and',
      actions: input.actions || [],
      throttle: input.throttle,
      status: 'active',
      isTemplate: false
    });

    await trigger.save();
    triggersCreatedTotal.inc();
    activeTriggersGauge.inc();

    logger.info('Trigger created', { triggerId: trigger._id });
    return trigger;
  }

  async findById(id: string): Promise<ITrigger | null> {
    return Trigger.findById(id);
  }

  async findByUser(userId: string, options?: { status?: string; type?: string }): Promise<ITrigger[]> {
    const query: Record<string, unknown> = { userId };
    if (options?.status) query.status = options.status;
    if (options?.type) query.type = options.type;

    return Trigger.find(query).sort({ createdAt: -1 });
  }

  async findActive(): Promise<ITrigger[]> {
    return Trigger.find({ status: 'active' });
  }

  async update(id: string, input: Partial<CreateTriggerInput>): Promise<ITrigger | null> {
    return Trigger.findByIdAndUpdate(id, input, { new: true });
  }

  async updateStatus(id: string, status: 'active' | 'paused' | 'disabled'): Promise<ITrigger | null> {
    const trigger = await Trigger.findById(id);
    if (!trigger) return null;

    const wasActive = trigger.status === 'active';
    const willBeActive = status === 'active';

    const updated = await Trigger.findByIdAndUpdate(id, { status }, { new: true });

    if (updated) {
      if (wasActive && !willBeActive) {
        activeTriggersGauge.dec();
      } else if (!wasActive && willBeActive) {
        activeTriggersGauge.inc();
      }
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const trigger = await Trigger.findById(id);
    if (trigger && trigger.status === 'active') {
      activeTriggersGauge.dec();
    }
    const result = await Trigger.findByIdAndDelete(id);
    return !!result;
  }

  async recordFiring(id: string, success: boolean, error?: string): Promise<void> {
    const trigger = await Trigger.findById(id);
    if (!trigger) return;

    const updateData: Record<string, unknown> = {
      fireCount: trigger.fireCount + 1,
      lastFiredAt: new Date()
    };

    if (!success) {
      updateData.errorCount = trigger.errorCount + 1;
      updateData.lastError = error;
    }

    await Trigger.findByIdAndUpdate(id, updateData);
    triggersFiredTotal.inc({ status: success ? 'success' : 'failed' });
  }

  async checkThrottle(id: string): Promise<boolean> {
    const trigger = await Trigger.findById(id);
    if (!trigger || !trigger.throttle?.enabled) return true;

    const now = Date.now();
    const windowStart = now - trigger.throttle.windowMs;

    // In production, track fire count with timestamp in Redis
    // For now, allow if under limit
    return trigger.fireCount < trigger.throttle.maxFires;
  }

  async getTriggerStats(userId: string): Promise<{
    total: number;
    active: number;
    paused: number;
    totalFires: number;
    totalErrors: number;
  }> {
    const triggers = await Trigger.find({ userId });
    return {
      total: triggers.length,
      active: triggers.filter(t => t.status === 'active').length,
      paused: triggers.filter(t => t.status === 'paused').length,
      totalFires: triggers.reduce((sum, t) => sum + t.fireCount, 0),
      totalErrors: triggers.reduce((sum, t) => sum + t.errorCount, 0)
    };
  }

  async duplicateTrigger(id: string, userId: string): Promise<ITrigger> {
    const original = await Trigger.findById(id);
    if (!original) throw new Error('Trigger not found');

    const duplicate = new Trigger({
      userId,
      name: `${original.name} (Copy)`,
      description: original.description,
      type: original.type,
      source: original.source,
      config: original.config,
      conditions: original.conditions,
      conditionLogic: original.conditionLogic,
      actions: original.actions,
      throttle: original.throttle,
      status: 'paused', // Start paused when duplicated
      isTemplate: false
    });

    await duplicate.save();
    return duplicate;
  }
}

export const triggerService = new TriggerService();