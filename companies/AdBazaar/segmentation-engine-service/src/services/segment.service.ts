import { Segment, ISegment } from '../models/segment.model';
import { Member } from '../models/member.model';
import { v4 as uuidv4 } from 'uuid';
import logger from 'utils/logger.js';
import { segmentsCreated, segmentEvaluations, activeSegments, memberCount } from '../utils/metrics';

export interface CreateSegmentInput {
  name: string;
  description?: string;
  type?: 'dynamic' | 'static' | 'hybrid';
  criteria: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
  criteriaLogic?: 'and' | 'or';
  refreshInterval?: number;
  tags?: string[];
}

export interface UpdateSegmentInput {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'archived';
  criteria?: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
  criteriaLogic?: 'and' | 'or';
  refreshInterval?: number;
  tags?: string[];
}

export interface EvaluateUserInput {
  userId: string;
  profile: Record<string, unknown>;
}

export class SegmentService {
  async create(input: CreateSegmentInput, createdBy: string): Promise<ISegment> {
    const segmentId = `seg-${uuidv4().slice(0, 8)}`;

    const segment = new Segment({
      segmentId,
      name: input.name,
      description: input.description,
      type: input.type || 'dynamic',
      criteria: input.criteria.map((c, i) => ({
        criteriaId: `crit-${i}`,
        field: c.field,
        operator: c.operator,
        value: c.value
      })),
      criteriaLogic: input.criteriaLogic || 'and',
      refreshInterval: input.refreshInterval,
      tags: input.tags,
      createdBy
    });

    await segment.save();
    segmentsCreated.inc();
    activeSegments.inc();

    logger.info(`Segment created: ${segmentId}`);
    return segment;
  }

  async findById(segmentId: string): Promise<ISegment | null> {
    return Segment.findOne({ segmentId });
  }

  async update(segmentId: string, input: UpdateSegmentInput): Promise<ISegment | null> {
    const updateData: Record<string, unknown> = {};

    if (input.name) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.status) updateData.status = input.status;
    if (input.criteriaLogic) updateData.criteriaLogic = input.criteriaLogic;
    if (input.refreshInterval !== undefined) updateData.refreshInterval = input.refreshInterval;
    if (input.tags) updateData.tags = input.tags;

    if (input.criteria) {
      updateData.criteria = input.criteria.map((c, i) => ({
        criteriaId: `crit-${i}`,
        field: c.field,
        operator: c.operator,
        value: c.value
      }));
    }

    const segment = await Segment.findOneAndUpdate(
      { segmentId },
      { $set: updateData },
      { new: true }
    );

    if (segment) logger.info(`Segment updated: ${segmentId}`);
    return segment;
  }

  async list(filters?: {
    status?: string;
    type?: string;
    tags?: string[];
    page?: number;
    limit?: number;
  }): Promise<{ segments: ISegment[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters?.status) query.status = filters.status;
    if (filters?.type) query.type = filters.type;
    if (filters?.tags) query.tags = { $in: filters.tags };

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [segments, total] = await Promise.all([
      Segment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Segment.countDocuments(query)
    ]);

    return { segments, total };
  }

  async evaluateUser(input: EvaluateUserInput): Promise<{
    matchingSegments: ISegment[];
    nonMatchingSegments: ISegment[];
  }> {
    const activeSegments = await Segment.find({ status: 'active' });

    const matching: ISegment[] = [];
    const nonMatching: ISegment[] = [];

    for (const segment of activeSegments) {
      const isMatch = this.evaluateCriteria(segment, input.profile);
      segmentEvaluations.inc({ segment_id: segment.segmentId });

      if (isMatch) {
        matching.push(segment);
      } else {
        nonMatching.push(segment);
      }
    }

    return { matchingSegments: matching, nonMatchingSegments: nonMatching };
  }

  private evaluateCriteria(segment: ISegment, profile: Record<string, unknown>): boolean {
    const results = segment.criteria.map(criteria => {
      const profileValue = this.getNestedValue(profile, criteria.field);
      return this.evaluateCondition(criteria.operator, profileValue, criteria.value);
    });

    if (segment.criteriaLogic === 'or') {
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
      case 'equals': return contextValue === ruleValue;
      case 'not_equals': return contextValue !== ruleValue;
      case 'contains':
        return Array.isArray(contextValue) ? contextValue.includes(ruleValue) : String(contextValue).includes(String(ruleValue));
      case 'not_contains': return !String(contextValue).includes(String(ruleValue));
      case 'greater_than': return Number(contextValue) > Number(ruleValue);
      case 'less_than': return Number(contextValue) < Number(ruleValue);
      case 'in': return Array.isArray(ruleValue) && ruleValue.includes(contextValue);
      case 'not_in': return Array.isArray(ruleValue) && !ruleValue.includes(contextValue);
      case 'exists': return contextValue !== undefined && contextValue !== null;
      case 'not_exists': return contextValue === undefined || contextValue === null;
      case 'between':
        if (Array.isArray(ruleValue) && ruleValue.length === 2) {
          const num = Number(contextValue);
          return num >= Number(ruleValue[0]) && num <= Number(ruleValue[1]);
        }
        return false;
      case 'starts_with': return String(contextValue).startsWith(String(ruleValue));
      case 'ends_with': return String(contextValue).endsWith(String(ruleValue));
      default: return false;
    }
  }

  async getMembers(segmentId: string, page = 1, limit = 50): Promise<{ members: unknown[]; total: number }> {
    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      Member.find({ segmentId, status: 'active' }).skip(skip).limit(limit),
      Member.countDocuments({ segmentId, status: 'active' })
    ]);

    return { members, total };
  }

  async addMember(segmentId: string, userId: string, profile?: Record<string, unknown>): Promise<unknown> {
    const memberId = `mem-${uuidv4().slice(0, 8)}`;

    const member = new Member({
      memberId,
      segmentId,
      userId,
      profile: profile || {},
      status: 'active'
    });

    await member.save();

    // Update segment member count
    await Segment.updateOne({ segmentId }, { $inc: { memberCount: 1 } });
    memberCount.inc({ segment_id: segmentId });

    return member;
  }

  async removeMember(segmentId: string, userId: string): Promise<boolean> {
    const result = await Member.findOneAndUpdate(
      { segmentId, userId, status: 'active' },
      { $set: { status: 'removed', removedAt: new Date() } }
    );

    if (result) {
      await Segment.updateOne({ segmentId }, { $inc: { memberCount: -1 } });
      memberCount.dec({ segment_id: segmentId });
      return true;
    }
    return false;
  }

  async delete(segmentId: string): Promise<boolean> {
    const result = await Segment.findOneAndUpdate(
      { segmentId },
      { $set: { status: 'archived' } }
    );

    if (result) {
      activeSegments.dec();
      logger.info(`Segment archived: ${segmentId}`);
      return true;
    }
    return false;
  }
}

export const segmentService = new SegmentService();