import { Constraint, IAutonomousCampaign } from '../models';
import { campaignMetrics } from '../utils/metrics';
import logger from '../utils/logger';
import { z } from 'zod';

export const ConstraintInputSchema = z.object({
  type: z.enum(['budget', 'bid', 'audience', 'placement', 'frequency', 'content', 'geographic', 'temporal', 'custom']),
  key: z.string().min(1),
  value: z.any(),
  hardLimit: z.boolean().default(false),
  description: z.string().optional(),
  warningThreshold: z.number().min(0).max(100).optional(),
  criticalThreshold: z.number().min(0).max(100).optional()
});

export type ConstraintInput = z.infer<typeof ConstraintInputSchema>;

export interface ConstraintViolation {
  constraintId: string;
  constraintKey: string;
  constraintType: string;
  currentValue: any;
  limitValue: any;
  severity: 'warning' | 'critical';
  message: string;
}

export class ConstraintService {
  /**
   * Add constraint to campaign
   */
  async addConstraint(campaignId: string, input: ConstraintInput): Promise<Constraint> {
    logger.info('Adding constraint to campaign', { campaignId, key: input.key });

    // Verify campaign exists
    const campaign = await import('../models').then(m => m.AutonomousCampaign.findById(campaignId));
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Check for existing constraint with same key
    const existing = await Constraint.findOne({ campaignId, key: input.key });
    if (existing) {
      throw new Error(`Constraint with key '${input.key}' already exists`);
    }

    const constraint = new Constraint({
      campaignId,
      ...input,
      active: true
    });

    await constraint.save();

    logger.info('Constraint added', { constraintId: constraint._id, key: input.key });
    return constraint;
  }

  /**
   * Get constraints for a campaign
   */
  async getConstraints(campaignId: string, activeOnly: boolean = true): Promise<Constraint[]> {
    const query: Record<string, any> = { campaignId };
    if (activeOnly) query.active = true;

    return Constraint.find(query).sort({ type: 1, key: 1 });
  }

  /**
   * Update constraint
   */
  async updateConstraint(
    constraintId: string,
    updates: Partial<ConstraintInput>
  ): Promise<Constraint | null> {
    return Constraint.findByIdAndUpdate(
      constraintId,
      updates,
      { new: true }
    );
  }

  /**
   * Remove constraint
   */
  async removeConstraint(constraintId: string): Promise<boolean> {
    const result = await Constraint.findByIdAndDelete(constraintId);
    return !!result;
  }

  /**
   * Validate action against constraints
   */
  async validateAction(
    campaignId: string,
    action: { type: string; target: string; proposedValue: any }
  ): Promise<{ valid: boolean; violations: ConstraintViolation[] }> {
    const constraints = await this.getConstraints(campaignId, true);
    const violations: ConstraintViolation[] = [];

    for (const constraint of constraints) {
      const violation = this.checkConstraint(constraint, action);
      if (violation) {
        violations.push(violation);
        campaignMetrics.constraintViolations.inc({ constraint_type: constraint.type });
      }
    }

    return {
      valid: violations.filter(v => v.severity === 'critical').length === 0,
      violations
    };
  }

  /**
   * Check single constraint
   */
  private checkConstraint(
    constraint: Constraint,
    action: { type: string; target: string; proposedValue: any }
  ): ConstraintViolation | null {
    // Check if constraint applies to this action
    const appliesTo = this.getConstraintAppliesTo(constraint.type);
    if (!appliesTo.some(t => action.target.includes(t))) {
      return null;
    }

    let isViolated = false;
    let severity: 'warning' | 'critical' = 'warning';

    switch (constraint.type) {
      case 'budget':
        if (action.proposedValue > constraint.value) {
          isViolated = true;
          severity = constraint.hardLimit ? 'critical' : 'warning';
        }
        break;

      case 'bid':
        if (constraint.key === 'minBid' && action.proposedValue < constraint.value) {
          isViolated = true;
        } else if (constraint.key === 'maxBid' && action.proposedValue > constraint.value) {
          isViolated = true;
          severity = constraint.hardLimit ? 'critical' : 'warning';
        }
        break;

      case 'frequency':
        if (action.proposedValue > constraint.value) {
          isViolated = true;
        }
        break;

      case 'audience':
        if (Array.isArray(action.proposedValue)) {
          const excluded = constraint.value as string[];
          const hasOverlap = action.proposedValue.some(v => excluded.includes(v));
          if (hasOverlap) isViolated = true;
        }
        break;

      case 'placement':
        if (Array.isArray(action.proposedValue)) {
          const excluded = constraint.value as string[];
          const hasOverlap = action.proposedValue.some(v => excluded.includes(v));
          if (hasOverlap) isViolated = true;
        }
        break;
    }

    if (isViolated) {
      return {
        constraintId: constraint._id.toString(),
        constraintKey: constraint.key,
        constraintType: constraint.type,
        currentValue: action.proposedValue,
        limitValue: constraint.value,
        severity,
        message: `${constraint.type} constraint violated: ${constraint.key} ${constraint.description || ''}`
      };
    }

    return null;
  }

  /**
   * Get target types for constraint type
   */
  private getConstraintAppliesTo(constraintType: string): string[] {
    const mapping: Record<string, string[]> = {
      budget: ['budget', 'spend', 'daily'],
      bid: ['bid', 'cpc', 'cpa'],
      audience: ['audience', 'target', 'segment'],
      placement: ['placement', 'placement'],
      frequency: ['frequency', 'impression'],
      content: ['creative', 'ad', 'content'],
      geographic: ['location', 'geo', 'region'],
      temporal: ['schedule', 'time', 'daypart'],
      custom: ['*']
    };

    return mapping[constraintType] || [];
  }

  /**
   * Check all constraints for a campaign
   */
  async checkAllConstraints(campaignId: string): Promise<ConstraintViolation[]> {
    const constraints = await this.getConstraints(campaignId, true);
    const violations: ConstraintViolation[] = [];

    for (const constraint of constraints) {
      // For checking all constraints, we need current campaign state
      // This would typically come from the campaign service
      // For now, return constraints that might be violated based on threshold
      if (constraint.warningThreshold || constraint.criticalThreshold) {
        violations.push({
          constraintId: constraint._id.toString(),
          constraintKey: constraint.key,
          constraintType: constraint.type,
          currentValue: null,
          limitValue: constraint.value,
          severity: constraint.criticalThreshold ? 'critical' : 'warning',
          message: `Constraint check needed: ${constraint.key}`
        });
      }
    }

    return violations;
  }

  /**
   * Get constraint statistics
   */
  async getConstraintStats(campaignId?: string): Promise<{
    totalConstraints: number;
    byType: Record<string, number>;
    hardLimits: number;
  }> {
    const match: Record<string, any> = { active: true };
    if (campaignId) match.campaignId = campaignId;

    const stats = await Constraint.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalConstraints: { $sum: 1 },
          hardLimits: { $sum: { $cond: ['$hardLimit', 1, 0] } },
          byType: { $push: '$type' }
        }
      }
    ]);

    if (!stats.length) {
      return { totalConstraints: 0, byType: {}, hardLimits: 0 };
    }

    const byType: Record<string, number> = {};
    for (const type of stats[0].byType) {
      byType[type] = (byType[type] || 0) + 1;
    }

    return {
      totalConstraints: stats[0].totalConstraints,
      byType,
      hardLimits: stats[0].hardLimits
    };
  }

  /**
   * Bulk add constraints
   */
  async bulkAddConstraints(
    campaignId: string,
    constraints: ConstraintInput[]
  ): Promise<Constraint[]> {
    const created: Constraint[] = [];

    for (const input of constraints) {
      try {
        const constraint = await this.addConstraint(campaignId, input);
        created.push(constraint);
      } catch (error) {
        logger.warn('Failed to add constraint in bulk', {
          campaignId,
          key: input.key,
          error
        });
      }
    }

    return created;
  }
}

export const constraintService = new ConstraintService();
export default constraintService;