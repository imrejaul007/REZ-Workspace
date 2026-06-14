import { Decision, AutonomousCampaign } from '../models';
import { campaignMetrics } from '../utils/metrics';
import logger from '../utils/logger';
import { z } from 'zod';
import axios from 'axios';

export const RecommendationSchema = z.object({
  decisionId: z.string(),
  summary: z.string(),
  impact: z.object({
    expectedChange: z.number(),
    riskLevel: z.enum(['low', 'medium', 'high']),
    confidence: z.number()
  }),
  alternatives: z.array(z.string()).optional(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  createdAt: z.date()
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

export interface ApprovalRequest {
  decisionId: string;
  campaignId: string;
  campaignName: string;
  advertiserId: string;
  type: string;
  action: {
    type: string;
    target: string;
    currentValue: any;
    proposedValue: any;
    priority: string;
  };
  reasoning: {
    analysis: string;
    data: Record<string, any>;
    confidence: number;
  };
  impact: {
    expectedChange: number;
    riskLevel: string;
    estimatedTimeToImpact: string;
  };
  createdAt: Date;
  expiresAt: Date;
}

export class HumanInLoopService {
  private approvalTimeout: number;
  private notificationWebhook: string | null;

  constructor() {
    this.approvalTimeout = 24 * 60 * 60 * 1000; // 24 hours
    this.notificationWebhook = process.env.NOTIFICATION_WEBHOOK || null;
  }

  /**
   * Get recommendations requiring human approval
   */
  async getRecommendations(campaignId?: string): Promise<Recommendation[]> {
    const query: Record<string, any> = {
      approved: false,
      executed: false
    };

    if (campaignId) query.campaignId = campaignId;

    const decisions = await Decision.find(query)
      .populate('campaignId', 'name advertiserId')
      .sort({ createdAt: -1 });

    return decisions.map(decision => ({
      decisionId: decision._id.toString(),
      summary: this.generateSummary(decision),
      impact: {
        expectedChange: decision.impact.expectedChange,
        riskLevel: decision.impact.riskLevel,
        confidence: decision.reasoning.confidence
      },
      alternatives: decision.reasoning.alternatives,
      urgency: this.determineUrgency(decision),
      createdAt: decision.createdAt
    }));
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(decision: Decision): string {
    const typeLabels: Record<string, string> = {
      budget_reallocation: 'Budget Reallocation',
      bid_adjustment: 'Bid Adjustment',
      audience_expansion: 'Audience Expansion',
      audience_restriction: 'Audience Restriction',
      creative_rotation: 'Creative Rotation',
      placement_optimization: 'Placement Optimization',
      keyword_bidding: 'Keyword Bidding',
      frequency_capping: 'Frequency Capping',
      ad_format_switch: 'Ad Format Switch',
      campaign_pause: 'Campaign Pause',
      campaign_resume: 'Campaign Resume',
      targeting_adjustment: 'Targeting Adjustment',
      schedule_optimization: 'Schedule Optimization'
    };

    const type = typeLabels[decision.type] || decision.type;
    const target = decision.action.target;
    const from = this.formatValue(decision.action.currentValue);
    const to = this.formatValue(decision.action.proposedValue);

    return `${type} for ${target}: Change from ${from} to ${to} (${decision.impact.riskLevel} risk)`;
  }

  /**
   * Format value for display
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) return 'current';
    if (typeof value === 'number') {
      if (value > 1000) return `₹${value.toLocaleString()}`;
      return value.toString();
    }
    if (Array.isArray(value)) return `${value.length} items`;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  /**
   * Determine urgency level
   */
  private determineUrgency(decision: Decision): 'low' | 'medium' | 'high' | 'critical' {
    if (decision.action.priority === 'critical') return 'critical';
    if (decision.action.priority === 'high') return 'high';
    if (decision.impact.riskLevel === 'high') return 'high';

    // Check if decision is expired
    const age = Date.now() - decision.createdAt.getTime();
    if (age > this.approvalTimeout) return 'high';

    return 'medium';
  }

  /**
   * Approve a recommendation
   */
  async approveRecommendation(
    decisionId: string,
    approvedBy: string,
    notes?: string
  ): Promise<{ success: boolean; decision: Decision | null; error?: string }> {
    logger.info('Approving recommendation', { decisionId, approvedBy });

    const decision = await Decision.findById(decisionId);
    if (!decision) {
      return { success: false, decision: null, error: 'Decision not found' };
    }

    if (decision.approved) {
      return { success: false, decision: null, error: 'Decision already approved' };
    }

    decision.approved = true;
    decision.approvedBy = approvedBy;
    decision.approvedAt = new Date();
    if (notes) {
      decision.results = { actualChange: 0, success: true, notes };
    }

    await decision.save();

    campaignMetrics.humanApprovalsGiven.inc({ approved: 'true' });

    logger.info('Recommendation approved', { decisionId });

    return { success: true, decision };
  }

  /**
   * Reject a recommendation
   */
  async rejectRecommendation(
    decisionId: string,
    rejectedBy: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    logger.info('Rejecting recommendation', { decisionId, rejectedBy, reason });

    const decision = await Decision.findById(decisionId);
    if (!decision) {
      return { success: false, error: 'Decision not found' };
    }

    decision.approved = false;
    decision.approvedBy = rejectedBy;
    decision.approvedAt = new Date();
    decision.executed = true;
    decision.executedAt = new Date();
    decision.results = {
      actualChange: 0,
      success: false,
      notes: `Rejected: ${reason}`
    };

    await decision.save();

    campaignMetrics.humanApprovalsGiven.inc({ approved: 'false' });

    logger.info('Recommendation rejected', { decisionId });

    return { success: true };
  }

  /**
   * Get pending approval count
   */
  async getPendingCount(campaignId?: string): Promise<{
    total: number;
    byPriority: Record<string, number>;
    byCampaign: Record<string, number>;
  }> {
    const query: Record<string, any> = {
      approved: false,
      executed: false
    };

    if (campaignId) query.campaignId = campaignId;

    const decisions = await Decision.find(query);

    const byPriority: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    const byCampaign: Record<string, number> = {};

    for (const decision of decisions) {
      byPriority[decision.action.priority]++;
      const cid = decision.campaignId.toString();
      byCampaign[cid] = (byCampaign[cid] || 0) + 1;
    }

    return {
      total: decisions.length,
      byPriority,
      byCampaign
    };
  }

  /**
   * Send notification for pending approvals
   */
  async notifyPendingApprovals(): Promise<void> {
    const pending = await this.getPendingCount();

    if (pending.total === 0) return;

    // Group by advertiser
    const campaigns = await AutonomousCampaign.find({
      _id: { $in: Object.keys(pending.byCampaign).map(id => id) }
    });

    const byAdvertiser: Record<string, number> = {};
    for (const campaign of campaigns) {
      byAdvertiser[campaign.advertiserId] = (byAdvertiser[campaign.advertiserId] || 0) +
        (pending.byCampaign[campaign._id.toString()] || 0);
    }

    logger.info('Pending approvals notification', {
      total: pending.total,
      byAdvertiser
    });

    // Send webhook if configured
    if (this.notificationWebhook) {
      try {
        await axios.post(this.notificationWebhook, {
          type: 'pending_approvals',
          total: pending.total,
          byAdvertiser,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Failed to send notification', { error });
      }
    }
  }

  /**
   * Get approval history
   */
  async getApprovalHistory(
    campaignId?: string,
    options: { limit?: number; startDate?: Date; endDate?: Date } = {}
  ): Promise<Decision[]> {
    const query: Record<string, any> = {
      approvedAt: { $exists: true }
    };

    if (campaignId) query.campaignId = campaignId;
    if (options.startDate || options.endDate) {
      query.approvedAt = {};
      if (options.startDate) query.approvedAt.$gte = options.startDate;
      if (options.endDate) query.approvedAt.$lte = options.endDate;
    }

    return Decision.find(query)
      .populate('campaignId', 'name advertiserId')
      .sort({ approvedAt: -1 })
      .limit(options.limit || 100);
  }

  /**
   * Get approval statistics
   */
  async getApprovalStats(startDate?: Date, endDate?: Date): Promise<{
    totalApproved: number;
    totalRejected: number;
    approvalRate: number;
    averageResponseTime: number;
    byType: Record<string, { approved: number; rejected: number }>;
  }> {
    const query: Record<string, any> = {
      approvedAt: { $exists: true }
    };

    if (startDate || endDate) {
      query.approvedAt = {};
      if (startDate) query.approvedAt.$gte = startDate;
      if (endDate) query.approvedAt.$lte = endDate;
    }

    const decisions = await Decision.find(query);

    let approved = 0;
    let rejected = 0;
    let totalResponseTime = 0;
    const byType: Record<string, { approved: number; rejected: number }> = {};

    for (const decision of decisions) {
      const isApproved = decision.approved;
      const responseTime = decision.approvedAt!.getTime() - decision.createdAt.getTime();

      if (isApproved) approved++;
      else rejected++;

      totalResponseTime += responseTime;

      if (!byType[decision.type]) {
        byType[decision.type] = { approved: 0, rejected: 0 };
      }
      byType[decision.type][isApproved ? 'approved' : 'rejected']++;
    }

    return {
      totalApproved: approved,
      totalRejected: rejected,
      approvalRate: approved + rejected > 0 ? approved / (approved + rejected) : 0,
      averageResponseTime: approved + rejected > 0 ? totalResponseTime / (approved + rejected) : 0,
      byType
    };
  }
}

export const humanInLoopService = new HumanInLoopService();
export default humanInLoopService;