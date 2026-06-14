import { Condition, ICondition } from '../models';
import { createChildLogger } from '../utils/logger';
import { conditionsEvaluatedTotal } from '../utils/metrics';

const logger = createChildLogger('ConditionService');

export type Operator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'regex'
  | 'in'
  | 'not_in'
  | 'between'
  | 'exists'
  | 'not_exists';

export interface ConditionCheck {
  field: string;
  operator: Operator;
  value: unknown;
  value2?: unknown;
}

export class ConditionService {
  async create(input: {
    userId: string;
    name: string;
    description?: string;
    field: string;
    operator: Operator;
    value: unknown;
    value2?: unknown;
    dataType?: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  }): Promise<ICondition> {
    const condition = new Condition({
      userId: input.userId,
      name: input.name,
      description: input.description,
      field: input.field,
      operator: input.operator,
      value: input.value,
      value2: input.value2,
      dataType: input.dataType || 'string',
      isActive: true
    });

    await condition.save();
    return condition;
  }

  async findById(id: string): Promise<ICondition | null> {
    return Condition.findById(id);
  }

  async findByUser(userId: string, options?: { isActive?: boolean }): Promise<ICondition[]> {
    const query: Record<string, unknown> = { userId };
    if (options?.isActive !== undefined) {
      query.isActive = options.isActive;
    }

    return Condition.find(query).sort({ createdAt: -1 });
  }

  async update(id: string, input: Partial<{
    name: string;
    description: string;
    field: string;
    operator: Operator;
    value: unknown;
    value2: unknown;
    dataType: string;
 }>): Promise<ICondition | null> {
    return Condition.findByIdAndUpdate(id, input, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await Condition.findByIdAndDelete(id);
    return !!result;
  }

  evaluateCondition(condition: ConditionCheck, data: Record<string, unknown>): boolean {
    const fieldValue = this.getFieldValue(data, condition.field);

    switch (condition.operator) {
      case 'eq':
        return fieldValue === condition.value;
      case 'neq':
        return fieldValue !== condition.value;
      case 'gt':
        return typeof fieldValue === 'number' && typeof condition.value === 'number' && fieldValue > condition.value;
      case 'gte':
        return typeof fieldValue === 'number' && typeof condition.value === 'number' && fieldValue >= condition.value;
      case 'lt':
        return typeof fieldValue === 'number' && typeof condition.value === 'number' && fieldValue < condition.value;
      case 'lte':
        return typeof fieldValue === 'number' && typeof condition.value === 'number' && fieldValue <= condition.value;
      case 'contains':
        return typeof fieldValue === 'string' && typeof condition.value === 'string' && fieldValue.includes(condition.value);
      case 'not_contains':
        return typeof fieldValue === 'string' && typeof condition.value === 'string' && !fieldValue.includes(condition.value);
      case 'starts_with':
        return typeof fieldValue === 'string' && typeof condition.value === 'string' && fieldValue.startsWith(condition.value);
      case 'ends_with':
        return typeof fieldValue === 'string' && typeof condition.value === 'string' && fieldValue.endsWith(condition.value);
      case 'regex':
        try {
          const regex = new RegExp(condition.value as string);
          return typeof fieldValue === 'string' && regex.test(fieldValue);
        } catch {
          return false;
        }
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case 'between':
        return (
          typeof fieldValue === 'number' &&
          typeof condition.value === 'number' &&
          typeof condition.value2 === 'number' &&
          fieldValue >= condition.value &&
          fieldValue <= condition.value2
        );
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null;
      default:
        return false;
    }
  }

  evaluateConditions(
    conditions: ConditionCheck[],
    data: Record<string, unknown>,
    logic: 'and' | 'or' = 'and'
  ): { passed: boolean; results: { condition: string; result: boolean; actualValue?: unknown }[] } {
    const results = conditions.map(cond => {
      const actualValue = this.getFieldValue(data, cond.field);
      const result = this.evaluateCondition(cond, data);
      conditionsEvaluatedTotal.inc({ result: result ? 'true' : 'false' });
      return {
        condition: `${cond.field} ${cond.operator} ${cond.value}`,
        result,
        actualValue
      };
    });

    const passed = logic === 'and'
      ? results.every(r => r.result)
      : results.some(r => r.result);

    return { passed, results };
  }

  private getFieldValue(data: Record<string, unknown>, field: string): unknown {
    const parts = field.split('.');
    let value: unknown = data;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }
}

export const conditionService = new ConditionService();