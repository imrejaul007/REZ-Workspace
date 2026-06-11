/**
 * PROPFLOW - Real Estate AI Operating System
 * AI Employee: Lead Agent (LLM-Powered)
 * Handles lead qualification, scoring, nurturing, and prioritization
 * Upgraded from rule-based to LLM-powered qualification
 */

import { Lead, Property, SiteVisit, Deal } from '../models';
import { logger } from '../config/logger';
import { ILead } from '../models';
import { AgentRuntime } from '@hojai/agent-runtime';

// ============================================
// Types
// ============================================

interface LeadQualification {
  lead: ILead;
  score: number;
  tier: 'hot' | 'warm' | 'cold';
  factors: {
    positive: string[];
    negative: string[];
  };
  recommendations: string[];
  nextBestAction: string;
  estimatedValue: { min: number; max: number };
  timeToClose: 'immediate' | 'short' | 'medium' | 'long';
  insights?: string[];
}

interface LeadNurturing {
  leadId: string;
  campaigns: string[];
  suggestedContent: string[];
  followUpSchedule: Date[];
  engagementScore: number;
  personalizedMessages?: string[];
}

interface LeadSegmentation {
  segments: {
    name: string;
    count: number;
    leads: ILead[];
    avgScore: number;
    totalPotentialValue: number;
  }[];
  summary: {
    totalLeads: number;
    hotLeads: number;
    warmLeads: number;
    coldLeads: number;
    avgScore: number;
    totalPotentialValue: number;
  };
}

// ============================================
// Lead Agent (LLM-Powered)
// ============================================

export class LeadAgent {
  private runtime: AgentRuntime;
  private readonly HOT_THRESHOLD = 80;
  private readonly WARM_THRESHOLD = 60;
  private readonly COLD_THRESHOLD = 40;

  constructor() {
    this.runtime = new AgentRuntime();
    logger.info('Lead Agent (LLM) initialized');
  }

  /**
   * LLM-powered lead qualification
   * Replaces tiered scoring with intelligent qualification
   */
  async qualifyLead(leadId: string): Promise<LeadQualification> {
    try {
      const lead = await Lead.findById(leadId);
      if (!lead) {
        throw new Error('Lead not found');
      }

      logger.info('Lead Agent (LLM): Qualifying lead', { leadId, name: lead.name });

      try {
        // Use LLM for intelligent qualification
        const llmQualification = await this.qualifyWithLLM(lead);

        // Update lead with qualification data
        await Lead.findByIdAndUpdate(leadId, {
          score: llmQualification.score,
          scoreTier: llmQualification.tier,
          qualificationFactors: [...llmQualification.factors.positive, ...llmQualification.factors.negative]
        });

        return {
          lead,
          ...llmQualification
        };

      } catch (error) {
        logger.warn('Lead Agent (LLM): LLM qualification failed, using fallback', { error });
        // Fallback to rule-based
        return this.qualifyLeadFallback(lead);
      }

    } catch (error) {
      logger.error('Lead Agent (LLM): Qualification failed', { error, leadId });
      throw error;
    }
  }

  /**
   * LLM-powered qualification engine
   */
  private async qualifyWithLLM(lead: ILead): Promise<Omit<LeadQualification, 'lead'>> {
    const prompt = this.buildQualificationPrompt(lead);

    const response = await this.runtime.runAgent('Lead Qualifier', prompt, {
      leads: [lead],
      custom: { historicalData: await this.getSimilarLeads(lead) }
    });

    return this.parseQualificationResponse(response.content, lead);
  }

  /**
   * Build qualification prompt for LLM
   */
  private buildQualificationPrompt(lead: ILead): string {
    const leadStr = JSON.stringify({
      id: lead._id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      budget: lead.budget,
      requirements: lead.requirements,
      status: lead.status,
      score: lead.score,
      visitCount: lead.visitCount,
      propertyInterests: lead.propertyInterests?.length || 0,
      lastContact: lead.lastContact,
      nextFollowUp: lead.nextFollowUp,
      notes: lead.notes,
      createdAt: lead.createdAt
    }, null, 2);

    return `You are an expert real estate lead qualification specialist.

Analyze this lead and determine their purchase readiness:

LEAD DATA:
${leadStr}

Consider:
1. Budget clarity and range
2. Source quality (referrals are best)
3. Engagement level
4. Requirements clarity
5. Timeline indicators
6. Contact information
7. Previous interactions
8. Decision-making indicators

Provide:
- Lead score (0-100)
- Tier classification (hot/warm/cold)
- Positive factors
- Negative factors
- Recommendations
- Next best action
- Estimated deal value range
- Expected time to close
- Key insights

Return as JSON:
{
  "score": 85,
  "tier": "hot",
  "factors": {
    "positive": ["Clear budget", "Referral source"],
    "negative": ["No property visits yet"]
  },
  "recommendations": ["Schedule site visit", "Send property matches"],
  "nextBestAction": "Schedule immediate site visit",
  "estimatedValue": { "min": 5000000, "max": 6000000 },
  "timeToClose": "short",
  "insights": ["High-value prospect with clear requirements"]
}`;
  }

  /**
   * Parse LLM qualification response
   */
  private parseQualificationResponse(content: string, lead: ILead): Omit<LeadQualification, 'lead'> {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from LLM response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        score: parsed.score || 50,
        tier: parsed.tier || this.determineTier(parsed.score || 50),
        factors: parsed.factors || { positive: [], negative: [] },
        recommendations: parsed.recommendations || [],
        nextBestAction: parsed.nextBestAction || 'Follow up with lead',
        estimatedValue: parsed.estimatedValue || this.estimateLeadValue(lead),
        timeToClose: parsed.timeToClose || 'medium',
        insights: parsed.insights || []
      };

    } catch (error) {
      logger.error('Lead Agent (LLM): Failed to parse qualification response', { error });
      return this.qualifyLeadFallbackSync(lead);
    }
  }

  /**
   * Fallback qualification (sync)
   */
  private qualifyLeadFallback(lead: ILead): LeadQualification {
    const qualification = this.qualifyLeadFallbackSync(lead);

    return {
      lead,
      ...qualification
    };
  }

  /**
   * Fallback qualification logic (sync)
   */
  private qualifyLeadFallbackSync(lead: ILead): Omit<LeadQualification, 'lead'> {
    const { score, factors } = this.calculateQualificationScore(lead);
    const tier = this.determineTier(score);
    const recommendations = this.generateRecommendations(lead, score, tier);
    const nextBestAction = this.determineNextBestAction(lead, score, tier);
    const estimatedValue = this.estimateLeadValue(lead);
    const timeToClose = this.estimateTimeToClose(lead, score);

    return {
      score,
      tier,
      factors,
      recommendations,
      nextBestAction,
      estimatedValue,
      timeToClose,
      insights: []
    };
  }

  /**
   * Calculate qualification score (fallback)
   */
  private calculateQualificationScore(lead: ILead): { score: number; factors: { positive: string[]; negative: string[] } } {
    let score = 0;
    const positive: string[] = [];
    const negative: string[] = [];

    // Budget Score (0-30 points)
    const budgetScore = this.evaluateBudget(lead.budget, positive, negative);
    score += budgetScore.score;
    positive.push(...budgetScore.positive);
    negative.push(...budgetScore.negative);

    // Source Score (0-20 points)
    const sourceScore = this.evaluateSource(lead.source, positive, negative);
    score += sourceScore.score;
    positive.push(...sourceScore.positive);
    negative.push(...sourceScore.negative);

    // Engagement Score (0-20 points)
    const engagementScore = this.evaluateEngagement(lead, positive, negative);
    score += engagementScore.score;
    positive.push(...engagementScore.positive);
    negative.push(...engagementScore.negative);

    // Requirements Clarity Score (0-15 points)
    const requirementsScore = this.evaluateRequirements(lead, positive, negative);
    score += requirementsScore.score;
    positive.push(...requirementsScore.positive);
    negative.push(...requirementsScore.negative);

    // Activity Score (0-15 points)
    const activityScore = this.evaluateActivity(lead, positive, negative);
    score += activityScore.score;
    positive.push(...activityScore.positive);
    negative.push(...activityScore.negative);

    // Normalize
    const normalizedScore = Math.min(100, Math.max(0, score));

    return {
      score: normalizedScore,
      factors: {
        positive: [...new Set(positive)],
        negative: [...new Set(negative)]
      }
    };
  }

  /**
   * Get similar leads for context
   */
  private async getSimilarLeads(lead: ILead): Promise<ILead[]> {
    const similarLeads = await Lead.find({
      _id: { $ne: lead._id },
      source: lead.source,
      'budget.max': { $gte: lead.budget.min * 0.8, $lte: lead.budget.max * 1.2 }
    })
    .sort({ score: -1 })
    .limit(10)
    .lean();

    return similarLeads;
  }

  /**
   * Evaluate budget
   */
  private evaluateBudget(budget: { min: number; max: number }, positive: string[], negative: string[]): { score: number; positive: string[]; negative: string[] } {
    const score: string[] = [];
    const pos: string[] = [];
    const neg: string[] = [];

    if (budget.max >= 10000000) {
      score.push(25, 5);
      pos.push('High budget: INR ' + this.formatCurrency(budget.max) + ' - Premium segment');
    } else if (budget.max >= 5000000) {
      score.push(20);
      pos.push('Mid-high budget: INR ' + this.formatCurrency(budget.max) + ' - Upper mid segment');
    } else if (budget.max >= 2000000) {
      score.push(15);
      pos.push('Mid budget: INR ' + this.formatCurrency(budget.max) + ' - Mid segment');
    } else {
      score.push(8);
      neg.push('Lower budget: INR ' + this.formatCurrency(budget.max) + ' - Budget segment');
    }

    const rangePercent = ((budget.max - budget.min) / budget.max) * 100;
    if (rangePercent <= 20) {
      score.push(5);
      pos.push('Narrow budget range - specific requirements');
    } else if (rangePercent <= 40) {
      score.push(3);
      pos.push('Moderate budget flexibility');
    } else {
      neg.push('Wide budget range - less defined requirements');
    }

    return {
      score: score.reduce((a, b) => a + b, 0),
      positive: pos,
      negative: neg
    };
  }

  /**
   * Evaluate lead source
   */
  private evaluateSource(source: string, positive: string[], negative: string[]): { score: number; positive: string[]; negative: string[] } {
    const scores: Record<string, { score: number; factor: string }> = {
      referral: { score: 18, factor: 'Referral - highest trust level' },
      walkin: { score: 15, factor: 'Walk-in - high intent shown' },
      website: { score: 12, factor: 'Website inquiry - proactive interest' },
      phone: { score: 10, factor: 'Phone inquiry - direct contact' },
      agent: { score: 10, factor: 'Agent referred - professional context' },
      social: { score: 8, factor: 'Social media - discovered brand' },
      advertisement: { score: 6, factor: 'Advertisement - marketing influenced' }
    };

    const sourceData = scores[source.toLowerCase()] || { score: 5, factor: 'Unknown source' };
    return {
      score: sourceData.score,
      positive: [sourceData.factor],
      negative: []
    };
  }

  /**
   * Evaluate engagement
   */
  private evaluateEngagement(lead: ILead, positive: string[], negative: string[]): { score: number; positive: string[]; negative: string[] } {
    let score = 0;
    const pos: string[] = [];
    const neg: string[] = [];

    if (lead.email) {
      score += 5;
      pos.push('Has email address - multiple contact channels');
    } else {
      neg.push('No email - limited communication options');
    }

    if (lead.propertyInterests?.length) {
      score += Math.min(10, lead.propertyInterests.length * 3);
      pos.push(`Interested in ${lead.propertyInterests.length} properties`);
    }

    if (lead.visitCount > 0) {
      score += Math.min(5, lead.visitCount);
      pos.push(`Has visited ${lead.visitCount} properties - serious buyer`);
    }

    return { score, positive: pos, negative: neg };
  }

  /**
   * Evaluate requirements
   */
  private evaluateRequirements(lead: ILead, positive: string[], negative: string[]): { score: number; positive: string[]; negative: string[] } {
    let score = 0;
    const pos: string[] = [];
    const neg: string[] = [];

    if (!lead.requirements) {
      neg.push('No specific requirements provided');
      return { score: 0, positive: pos, negative: neg };
    }

    const req = lead.requirements;

    if (req.type) {
      score += 5;
      pos.push(`Looking for ${req.type}`);
    }

    if (req.location) {
      score += 5;
      pos.push(`Location preference: ${req.location}`);
    }

    if (req.bedrooms) {
      score += 5;
      pos.push(`Want ${req.bedrooms} bedroom(s)`);
    }

    return { score, positive: pos, negative: neg };
  }

  /**
   * Evaluate activity
   */
  private evaluateActivity(lead: ILead, positive: string[], negative: string[]): { score: number; positive: string[]; negative: string[] } {
    let score = 0;
    const pos: string[] = [];
    const neg: string[] = [];

    if (lead.lastContact) {
      const daysSinceContact = (Date.now() - new Date(lead.lastContact).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceContact <= 1) {
        score += 10;
        pos.push('Contacted within last 24 hours - hot lead');
      } else if (daysSinceContact <= 7) {
        score += 7;
        pos.push('Contacted within last week');
      } else if (daysSinceContact <= 14) {
        score += 4;
      } else if (daysSinceContact <= 30) {
        score += 2;
      } else {
        neg.push('Not contacted in over 30 days');
      }
    }

    if (lead.nextFollowUp) {
      const daysToFollowUp = (new Date(lead.nextFollowUp).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysToFollowUp <= 1) {
        score += 5;
        pos.push('Follow-up scheduled for tomorrow');
      }
    }

    const statusOrder = ['new', 'contacted', 'qualified', 'visiting', 'negotiating', 'closed-won'];
    const statusIndex = statusOrder.indexOf(lead.status.toLowerCase());
    if (statusIndex >= 3) {
      score += 5;
      pos.push('Advanced through pipeline stages');
    }

    return { score, positive: pos, negative: neg };
  }

  /**
   * Determine tier
   */
  private determineTier(score: number): 'hot' | 'warm' | 'cold' {
    if (score >= this.HOT_THRESHOLD) return 'hot';
    if (score >= this.WARM_THRESHOLD) return 'warm';
    return 'cold';
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(lead: ILead, score: number, tier: 'hot' | 'warm' | 'cold'): string[] {
    const recommendations: string[] = [];

    if (tier === 'hot') {
      recommendations.push('Priority follow-up within 2 hours');
      recommendations.push('Schedule site visit immediately');
      recommendations.push('Prepare personalized property tour');
      recommendations.push('Involve senior agent for closing');
    } else if (tier === 'warm') {
      recommendations.push('Follow-up within 24 hours');
      recommendations.push('Share 3-5 matching property listings');
      recommendations.push('Schedule discovery call to understand requirements');
      recommendations.push('Send market insights for their preferred area');
    } else {
      recommendations.push('Nurture sequence with weekly updates');
      recommendations.push('Share market trends and new listings');
      recommendations.push('Invite to property events and webinars');
      recommendations.push('Re-engage after 2 weeks if no response');
    }

    if (lead.source === 'referral') {
      recommendations.push('Leverage referral relationship - notify referrer of progress');
    } else if (lead.source === 'walkin') {
      recommendations.push('Capture WhatsApp number for quick updates');
    }

    return recommendations;
  }

  /**
   * Determine next best action
   */
  private determineNextBestAction(lead: ILead, score: number, tier: 'hot' | 'warm' | 'cold'): string {
    if (tier === 'hot') {
      return 'Schedule immediate site visit and prepare offer documents';
    }

    if (tier === 'warm') {
      if (lead.visitCount === 0) {
        return 'Arrange first site visit at earliest convenience';
      }
      return 'Follow up after visit to gather feedback and address concerns';
    }

    if (lead.propertyInterests?.length > 0) {
      return 'Share detailed information about properties of interest';
    }

    return 'Schedule discovery call to better understand requirements';
  }

  /**
   * Estimate lead value
   */
  private estimateLeadValue(lead: ILead): { min: number; max: number } {
    const avgBudget = (lead.budget.min + lead.budget.max) / 2;
    const conversionProbabilities = { hot: 0.7, warm: 0.3, cold: 0.1 };
    const tier = this.determineTier(lead.score);

    return {
      min: Math.round(avgBudget * (conversionProbabilities[tier] - 0.1)),
      max: Math.round(avgBudget * (conversionProbabilities[tier] + 0.1))
    };
  }

  /**
   * Estimate time to close
   */
  private estimateTimeToClose(lead: ILead, score: number): 'immediate' | 'short' | 'medium' | 'long' {
    if (score >= 90 && lead.visitCount >= 2) return 'immediate';
    if (score >= 75) return 'short';
    if (score >= 50) return 'medium';
    return 'long';
  }

  /**
   * Bulk qualify leads (LLM-powered)
   */
  async bulkQualify(leadIds: string[]): Promise<LeadQualification[]> {
    const results: LeadQualification[] = [];

    // Get all leads
    const leads = await Lead.find({ _id: { $in: leadIds } }).lean();

    try {
      // Use LLM for batch qualification
      const response = await this.runtime.runAgent('Lead Qualifier', `
        Qualify these ${leads.length} leads and return scores:

        ${JSON.stringify(leads.map(l => ({
          id: l._id,
          name: l.name,
          source: l.source,
          budget: l.budget,
          visitCount: l.visitCount,
          status: l.status
        })), null, 2)}

        Return as JSON array with scores:
        [
          { "id": "...", "score": 85, "tier": "hot" },
          ...
        ]
      `);

      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const llmScores = JSON.parse(jsonMatch[0]);
        const scoreMap = new Map(llmScores.map((s: any) => [s.id.toString(), s]));

        for (const lead of leads) {
          const llmScore = scoreMap.get(lead._id.toString());
          if (llmScore) {
            await Lead.findByIdAndUpdate(lead._id, {
              score: llmScore.score,
              scoreTier: llmScore.tier
            });

            results.push({
              lead: lead as unknown as ILead,
              score: llmScore.score,
              tier: llmScore.tier,
              factors: { positive: [], negative: [] },
              recommendations: [],
              nextBestAction: '',
              estimatedValue: this.estimateLeadValue(lead as unknown as ILead),
              timeToClose: 'medium'
            });
          }
        }
      }
    } catch (error) {
      logger.warn('Lead Agent: LLM bulk qualification failed, using fallback', { error });

      // Fallback to individual qualification
      for (const leadId of leadIds) {
        try {
          const result = await this.qualifyLead(leadId);
          results.push(result);
        } catch (err) {
          logger.error('Lead Agent: Bulk qualification failed for lead', { leadId, error: err });
        }
      }
    }

    return results;
  }

  /**
   * Segment leads (LLM-enhanced)
   */
  async segmentLeads(): Promise<LeadSegmentation> {
    const leads = await Lead.find({ status: { $nin: ['closed-won', 'closed-lost'] } });

    const segments = {
      hot: leads.filter(l => l.scoreTier === 'hot'),
      warm: leads.filter(l => l.scoreTier === 'warm'),
      cold: leads.filter(l => l.scoreTier === 'cold')
    };

    const calculateSegmentData = (segmentLeads: ILead[]) => ({
      name: segmentLeads.length > 0 ?
        (segmentLeads[0].scoreTier === 'hot' ? 'Hot Leads' :
         segmentLeads[0].scoreTier === 'warm' ? 'Warm Leads' : 'Cold Leads') : '',
      count: segmentLeads.length,
      leads: segmentLeads,
      avgScore: segmentLeads.length > 0 ?
        Math.round(segmentLeads.reduce((sum, l) => sum + l.score, 0) / segmentLeads.length) : 0,
      totalPotentialValue: segmentLeads.reduce((sum, l) =>
        sum + (l.budget.min + l.budget.max) / 2, 0)
    });

    const segmentData = [
      calculateSegmentData(segments.hot),
      calculateSegmentData(segments.warm),
      calculateSegmentData(segments.cold)
    ];

    // Get LLM insights on segments
    try {
      const response = await this.runtime.runAgent('Lead Qualifier', `
        Analyze these lead segments:

        ${JSON.stringify({
          hot: segments.hot.length,
          warm: segments.warm.length,
          cold: segments.cold.length,
          avgScore: leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length) : 0
        })}

        Provide segment-specific recommendations.

        Return as JSON:
        {
          "hotRecommendations": ["..."],
          "warmRecommendations": ["..."],
          "coldRecommendations": ["..."]
        }
      `);

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        // Could enhance segment data with LLM recommendations
      }
    } catch (error) {
      logger.warn('Lead Agent: LLM segmentation insights failed', { error });
    }

    return {
      segments: segmentData,
      summary: {
        totalLeads: leads.length,
        hotLeads: segments.hot.length,
        warmLeads: segments.warm.length,
        coldLeads: segments.cold.length,
        avgScore: leads.length > 0 ?
          Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length) : 0,
        totalPotentialValue: leads.reduce((sum, l) =>
          sum + (l.budget.min + l.budget.max) / 2, 0)
      }
    };
  }

  /**
   * Get nurturing recommendations (LLM-enhanced)
   */
  async getNurturingRecommendations(leadId: string): Promise<LeadNurturing> {
    const lead = await Lead.findById(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    // Get base nurturing
    const baseNurturing = this.getBaseNurturing(lead);

    // Enhance with LLM
    try {
      const response = await this.runtime.runAgent('CRM Assistant', `
        Generate personalized nurturing strategy for this lead:

        ${JSON.stringify({
          name: lead.name,
          tier: lead.scoreTier,
          budget: lead.budget,
          requirements: lead.requirements,
          visitCount: lead.visitCount,
          lastContact: lead.lastContact
        }, null, 2)}

        Provide:
        1. Personalized message templates
        2. Optimal follow-up times
        3. Content recommendations

        Return as JSON:
        {
          "personalizedMessages": ["msg1", "msg2"],
          "followUpTimes": ["time1", "time2"]
        }
      `);

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const llmData = JSON.parse(jsonMatch[0]);
        return {
          ...baseNurturing,
          personalizedMessages: llmData.personalizedMessages || []
        };
      }
    } catch (error) {
      logger.warn('Lead Agent: LLM nurturing failed', { error });
    }

    return baseNurturing;
  }

  /**
   * Get base nurturing recommendations
   */
  private getBaseNurturing(lead: ILead): LeadNurturing {
    const campaigns: string[] = [];
    const suggestedContent: string[] = [];
    const followUpSchedule: Date[] = [];

    if (lead.scoreTier === 'hot') {
      campaigns.push('VIP Property Preview', 'Exclusive Site Visit Invitation');
      suggestedContent.push('Premium property video tour', 'Investment analysis report');
      followUpSchedule.push(new Date(Date.now() + 2 * 60 * 60 * 1000));
      followUpSchedule.push(new Date(Date.now() + 24 * 60 * 60 * 1000));
    } else if (lead.scoreTier === 'warm') {
      campaigns.push('Weekly Property Digest', 'Market Insights Newsletter');
      suggestedContent.push('Matching property listings', 'Neighborhood guides', 'Price trend analysis');
      followUpSchedule.push(new Date(Date.now() + 24 * 60 * 60 * 1000));
      followUpSchedule.push(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
      followUpSchedule.push(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    } else {
      campaigns.push('Monthly Newsletter', 'Event Invitations');
      suggestedContent.push('Market updates', 'Success stories', 'Festival offers');
      followUpSchedule.push(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      followUpSchedule.push(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
    }

    let engagementScore = 50;
    if (lead.propertyInterests?.length) engagementScore += 10;
    if (lead.visitCount > 0) engagementScore += 15;
    if (lead.lastContact) {
      const daysSince = (Date.now() - new Date(lead.lastContact).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince <= 7) engagementScore += 15;
      else if (daysSince <= 14) engagementScore += 10;
      else engagementScore -= 10;
    }

    return {
      leadId: lead._id.toString(),
      campaigns,
      suggestedContent,
      followUpSchedule,
      engagementScore: Math.min(100, engagementScore)
    };
  }

  /**
   * Get leads for follow-up
   */
  async getLeadsForFollowUp(): Promise<ILead[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return Lead.find({
      $or: [
        { nextFollowUp: { $gte: today, $lt: tomorrow } },
        { lastContact: { $exists: true, $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      ],
      status: { $nin: ['closed-won', 'closed-lost'] }
    }).sort({ score: -1 });
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number): string {
    if (amount >= 10000000) {
      return (amount / 10000000).toFixed(1) + ' Cr';
    } else if (amount >= 100000) {
      return (amount / 100000).toFixed(1) + ' L';
    }
    return amount.toLocaleString('en-IN');
  }
}

export default new LeadAgent();