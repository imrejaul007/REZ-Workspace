import { v4 as uuidv4 } from 'uuid';
import { FeatureFlag, IFeatureFlag, Rule, IRule, Evaluation, IEvaluation } from '../models';
import { createServiceLogger } from 'utils/logger.js';

const logger = createServiceLogger('FeatureFlagService');

export class FeatureFlagService {
  async createFlag(data: Partial<IFeatureFlag>): Promise<IFeatureFlag> {
    const flagId = `flag_${uuidv4()}`;
    const flag = new FeatureFlag({ ...data, flagId });
    await flag.save();
    logger.info('Feature flag created', { flagId, key: data.key });
    return flag;
  }

  async getFlagById(flagId: string): Promise<IFeatureFlag | null> {
    return FeatureFlag.findOne({ flagId });
  }

  async getFlagByKey(key: string, companyId: string): Promise<IFeatureFlag | null> {
    return FeatureFlag.findOne({ key, companyId });
  }

  async updateFlag(flagId: string, data: Partial<IFeatureFlag>): Promise<IFeatureFlag | null> {
    const flag = await FeatureFlag.findOneAndUpdate({ flagId }, data, { new: true });
    if (flag) logger.info('Feature flag updated', { flagId });
    return flag;
  }

  async enableFlag(flagId: string): Promise<IFeatureFlag | null> {
    const flag = await FeatureFlag.findOneAndUpdate({ flagId }, { status: 'active' }, { new: true });
    if (flag) logger.info('Feature flag enabled', { flagId });
    return flag;
  }

  async disableFlag(flagId: string): Promise<IFeatureFlag | null> {
    const flag = await FeatureFlag.findOneAndUpdate({ flagId }, { status: 'inactive' }, { new: true });
    if (flag) logger.info('Feature flag disabled', { flagId });
    return flag;
  }

  async getAllFlags(companyId: string, status?: string): Promise<IFeatureFlag[]> {
    const query: Record<string, unknown> = { companyId };
    if (status) query['status'] = status;
    return FeatureFlag.find(query).sort({ createdAt: -1 });
  }

  async createRule(flagId: string, data: Partial<IRule>): Promise<IRule> {
    const ruleId = `rule_${uuidv4()}`;
    const rule = new Rule({ ...data, flagId, ruleId });
    await rule.save();
    logger.info('Rule created', { ruleId, flagId });
    return rule;
  }

  async getRulesByFlag(flagId: string): Promise<IRule[]> {
    return Rule.find({ flagId }).sort({ priority: 1 });
  }

  async deleteRule(ruleId: string): Promise<boolean> {
    const result = await Rule.deleteOne({ ruleId });
    return result.deletedCount > 0;
  }

  async evaluateFlag(flagKey: string, userId: string, companyId: string, attributes?: Record<string, unknown>): Promise<{
    result: boolean;
    flag: IFeatureFlag | null;
    reason: string;
    matchedRule?: IRule;
  }> {
    const flag = await this.getFlagByKey(flagKey, companyId);
    if (!flag) return { result: false, flag: null, reason: 'Flag not found' };

    if (flag.status !== 'active') return { result: flag.defaultValue, flag, reason: 'Flag inactive' };
    if (flag.enabledForAll) return { result: true, flag, reason: 'Enabled for all' };

    // Check excluded users
    if (flag.excludeUsers.includes(userId)) {
      return { result: false, flag, reason: 'User excluded' };
    }

    // Check target users
    if (flag.targetUsers.length > 0 && flag.targetUsers.includes(userId)) {
      return { result: true, flag, reason: 'User in target list' };
    }

    // Check rules
    const rules = await this.getRulesByFlag(flag.flagId);
    for (const rule of rules) {
      if (!rule.isActive) continue;
      if (await this.evaluateRule(rule, userId, attributes)) {
        return { result: rule.value, flag, reason: `Rule: ${rule.name}`, matchedRule: rule };
      }
    }

    // Check percentage rollout
    if (flag.rolloutPercentage > 0) {
      const hash = this.hashUserId(userId);
      if (hash < flag.rolloutPercentage) {
        return { result: true, flag, reason: 'Within rollout percentage' };
      }
    }

    return { result: flag.defaultValue, flag, reason: 'Default value' };
  }

  private async evaluateRule(rule: IRule, userId: string, attributes?: Record<string, unknown>): Promise<boolean> {
    if (rule.type === 'user_id') {
      return rule.conditions.some(c => c.value === userId);
    }
    if (rule.type === 'percentage') {
      const hash = this.hashUserId(userId + rule.ruleId);
      return hash < (rule.conditions[0]?.value as number || 0);
    }
    if (rule.type === 'attribute' && attributes) {
      return rule.conditions.every(c => {
        const attrValue = attributes[c.attribute || ''];
        switch (c.operator) {
          case 'eq': return attrValue === c.value;
          case 'ne': return attrValue !== c.value;
          case 'gt': return attrValue > c.value;
          case 'lt': return attrValue < c.value;
          case 'contains': return String(attrValue).includes(String(c.value));
          default: return false;
        }
      });
    }
    return false;
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % 100;
  }

  async logEvaluation(flagKey: string, userId: string, companyId: string, result: boolean, reason: string, flagId?: string): Promise<IEvaluation> {
    const evaluationId = `eval_${uuidv4()}`;
    const evaluation = new Evaluation({
      evaluationId,
      flagId: flagId || '',
      flagKey,
      userId,
      companyId,
      result,
      reason,
      rolloutPercentage: 0
    });
    await evaluation.save();
    return evaluation;
  }

  async getEvaluationStats(flagId: string): Promise<{ total: number; true: number; false: number }> {
    const evaluations = await Evaluation.find({ flagId });
    return {
      total: evaluations.length,
      true: evaluations.filter(e => e.result).length,
      false: evaluations.filter(e => !e.result).length
    };
  }
}

export const featureFlagService = new FeatureFlagService();