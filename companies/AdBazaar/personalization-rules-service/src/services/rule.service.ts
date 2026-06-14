import { Rule, IRule } from '../models/rule.model';
import { v4 as uuidv4 } from 'uuid';
import logger from 'utils/logger.js';
import { rulesCreated, rulesMatched, rulesExecuted, activeRules } from '../utils/metrics';

export interface CreateRuleInput {
  name: string;
  description?: string;
  priority?: number;
  conditions: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
  conditionLogic?: 'and' | 'or';
  actions: Array<{
    type: string;
    config: Record<string, unknown>;
  }>;
  targetChannels?: string[];
  targetSegments?: string[];
  schedule?: {
    startDate?: string;
    endDate?: string;
    daysOfWeek?: number[];
    timeRanges?: Array<{ start: string; end: string }>;
  };
  limit?: {
    maxUses?: number;
    perUser?: number;
  };
}

export interface UpdateRuleInput {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'archived';
  priority?: number;
  conditions?: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
  conditionLogic?: 'and' | 'or';
  actions?: Array<{
    type: string;
    config: Record<string, unknown>;
  }>;
  targetChannels?: string[];
  targetSegments?: string[];
  schedule?: {
    startDate?: string;
    endDate?: string;
    daysOfWeek?: number[];
    timeRanges?: Array<{ start: string; end: string }>;
  };
  limit?: {
    maxUses?: number;
    perUser?: number;
  };
}

export interface TestRuleInput {
  context: Record<string, unknown>;
}

export class RuleService {
  async create(input: CreateRuleInput, createdBy: string): Promise<IRule> {
    const ruleId = `rule-${uuidv4().slice(0, 8)}`;

    const rule = new Rule({
      ruleId,
      name: input.name,
      description: input.description,
      status: 'active',
      priority: input.priority || 0,
      conditions: input.conditions.map((c, i) => ({
        conditionId: `cond-${i}`,
        field: c.field,
        operator: c.operator,
        value: c.value
      })),
      conditionLogic: input.conditionLogic || 'and',
      actions: input.actions.map((a, i) => ({
        actionId: `act-${i}`,
        type: a.type,
        config: a.config
      })),
      targetChannels: input.targetChannels,
      targetSegments: input.targetSegments,
      schedule: input.schedule ? {
        startDate: input.schedule.startDate ? new Date(input.schedule.startDate) : undefined,
        endDate: input.schedule.endDate ? new Date(input.schedule.endDate) : undefined,
        daysOfWeek: input.schedule.daysOfWeek,
        timeRanges: input.schedule.timeRanges
      } : undefined,
      limit: input.limit ? {
        maxUses: input.limit.maxUses,
        usedCount: 0,
        perUser: input.limit.perUser
      } : undefined,
      createdBy
    });

    await rule.save();
    rulesCreated.inc();
    activeRules.inc();

    logger.info(`Rule created: ${ruleId}`);
    return rule;
  }

  async findById(ruleId: string): Promise<IRule | null> {
    return Rule.findOne({ ruleId });
  }

  async update(ruleId: string, input: UpdateRuleInput): Promise<IRule | null> {
    const updateData: Record<string, unknown> = {};

    if (input.name) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.status) updateData.status = input.status;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.conditionLogic) updateData.conditionLogic = input.conditionLogic;
    if (input.targetChannels) updateData.targetChannels = input.targetChannels;
    if (input.targetSegments) updateData.targetSegments = input.targetSegments;

    if (input.conditions) {
      updateData.conditions = input.conditions.map((c, i) => ({
        conditionId: `cond-${i}`,
        field: c.field,
        operator: c.operator,
        value: c.value
      }));
    }

    if (input.actions) {
      updateData.actions = input.actions.map((a, i) => ({
        actionId: `act-${i}`,
        type: a.type,
        config: a.config
      }));
    }

    if (input.schedule) {
      updateData.schedule = {
        startDate: input.schedule.startDate ? new Date(input.schedule.startDate) : undefined,
        endDate: input.schedule.endDate ? new Date(input.schedule.endDate) : undefined,
        daysOfWeek: input.schedule.daysOfWeek,
        timeRanges: input.schedule.timeRanges
      };
    }

    if (input.limit) {
      updateData['limit.maxUses'] = input.limit.maxUses;
      updateData['limit.perUser'] = input.limit.perUser;
    }

    const rule = await Rule.findOneAndUpdate(
      { ruleId },
      { $set: updateData },
      { new: true }
    );

    if (rule) logger.info(`Rule updated: ${ruleId}`);
    return rule;
  }

  async list(filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ rules: IRule[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters?.status) query.status = filters.status;

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [rules, total] = await Promise.all([
      Rule.find(query).sort({ priority: -1, createdAt: -1 }).skip(skip).limit(limit),
      Rule.countDocuments(query)
    ]);

    return { rules, total };
  }

  async evaluate(context: Record<string, unknown>): Promise<{
    matched: IRule[];
    actions: Array<{ ruleId: string; action: unknown }>;
  }> {
    const rules = await Rule.find({
      status: 'active',
      $or: [
        { 'schedule.startDate': { $exists: false } },
        { 'schedule.startDate': { $lte: new Date() } }
      ],
      $or: [
        { 'schedule.endDate': { $exists: false } },
        { 'schedule.endDate': { $gte: new Date() } }
      ]
    }).sort({ priority: -1 });

    const matched: IRule[] = [];
    const actions: Array<{ ruleId: string; action: unknown }> = [];

    for (const rule of rules) {
      // Check if rule applies to this channel
      if (rule.targetChannels?.length && context.channel && !rule.targetChannels.includes(context.channel as string)) {
        continue;
      }

      // Check limit
      if (rule.limit?.maxUses && rule.limit.usedCount >= rule.limit.maxUses) {
        continue;
      }

      const isMatch = this.evaluateConditions(rule, context);
      rulesMatched.inc({ rule_id: rule.ruleId });

      if (isMatch) {
        matched.push(rule);

        for (const action of rule.actions) {
          actions.push({ ruleId: rule.ruleId, action });
          rulesExecuted.inc({ rule_id: rule.ruleId, result: 'matched' });
        }

        // Increment usage
        if (rule.limit) {
          await Rule.updateOne({ ruleId: rule.ruleId }, { $inc: { 'limit.usedCount': 1 } });
        }
      }
    }

    return { matched, actions };
  }

  private evaluateConditions(rule: IRule, context: Record<string, unknown>): boolean {
    const results = rule.conditions.map(condition => {
      const contextValue = this.getNestedValue(context, condition.field);
      return this.evaluateCondition(condition.operator, contextValue, condition.value);
    });

    if (rule.conditionLogic === 'or') {
      return results.some(r => r);
    }
    return results.every(r => r);
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  private evaluateCondition(operator: string, contextValue: unknown, ruleValue: unknown): boolean {
    switch (operator) {
      case 'equals':
        return contextValue === ruleValue;
      case 'not_equals':
        return contextValue !== ruleValue;
      case 'contains':
        return Array.isArray(contextValue) ? contextValue.includes(ruleValue) : String(contextValue).includes(String(ruleValue));
      case 'not_contains':
        return !String(contextValue).includes(String(ruleValue));
      case 'greater_than':
        return Number(contextValue) > Number(ruleValue);
      case 'less_than':
        return Number(contextValue) < Number(ruleValue);
      case 'in':
        return Array.isArray(ruleValue) && ruleValue.includes(contextValue);
      case 'not_in':
        return Array.isArray(ruleValue) && !ruleValue.includes(contextValue);
      case 'exists':
        return contextValue !== undefined && contextValue !== null;
      case 'not_exists':
        return contextValue === undefined || contextValue === null;
      case 'between':
        if (Array.isArray(ruleValue) && ruleValue.length === 2) {
          const num = Number(contextValue);
          return num >= Number(ruleValue[0]) && num <= Number(ruleValue[1]);
        }
        return false;
      default:
        return false;
    }
  }

  async testRule(ruleId: string, context: Record<string, unknown>): Promise<{
    matches: boolean;
    evaluatedConditions: Array<{ condition: unknown; result: boolean }>;
    actions: unknown[];
  }> {
    const rule = await this.findById(ruleId);
    if (!rule) throw new Error('Rule not found');

    const evaluatedConditions = rule.conditions.map(condition => {
      const contextValue = this.getNestedValue(context, condition.field);
      const result = this.evaluateCondition(condition.operator, contextValue, condition.value);
      return { condition, result };
    });

    const matches = rule.conditionLogic === 'or'
      ? evaluatedConditions.some(c => c.result)
      : evaluatedConditions.every(c => c.result);

    return {
      matches,
      evaluatedConditions,
      actions: matches ? rule.actions : []
    };
  }

  async delete(ruleId: string): Promise<boolean> {
    const result = await Rule.findOneAndUpdate(
      { ruleId },
      { $set: { status: 'archived' } }
    );

    if (result) {
      activeRules.dec();
      logger.info(`Rule archived: ${ruleId}`);
      return true;
    }
    return false;
  }
}

export const ruleService = new RuleService();