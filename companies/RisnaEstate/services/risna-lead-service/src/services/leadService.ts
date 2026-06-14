import axios from 'axios';
import { Lead, ILead, LeadStatus, LeadSegment } from '../models/Lead';
import { logger } from '../config/logger';
import { redis } from '../config/redis';

export interface CreateLeadInput {
  name: string;
  email?: string;
  phone: string;
  whatsapp?: string;
  source: string;
  segment?: string;
  preferences?: {
    propertyTypes?: string[];
    budget?: { min?: number; max?: number; currency: string };
    timeline?: string;
    purpose?: string;
  };
  interestedPropertyIds?: string[];
  sourceDetails?: {
    campaignId?: string;
    adId?: string;
    referralCode?: string;
    partnerId?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
}

export interface LeadFilters {
  segment?: LeadSegment;
  status?: LeadStatus;
  source?: string;
  brokerId?: string;
  assignedBrokerId?: string;
  minScore?: number;
  maxScore?: number;
  city?: string;
}

export interface LeadSearchOptions extends LeadFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export class LeadService {
  /**
   * Create a new lead
   */
  async create(input: CreateLeadInput): Promise<ILead> {
    const lead = new Lead({
      ...input,
      qualification: {
        status: LeadStatus.NEW
      },
      aiScore: {
        overall: 50,
        intent: 50,
        budgetMatch: 50,
        timeline: 50,
        engagement: 50,
        calculatedAt: new Date(),
        modelVersion: '1.0.0'
      }
    });
    await lead.save();
    logger.info('Lead created', { leadId: lead._id, source: lead.source });

    // Trigger async AI scoring
    this.triggerAIScoring(lead._id.toString()).catch(err => {
      logger.error('Failed to trigger AI scoring', { leadId: lead._id, error: err.message });
    });

    return lead;
  }

  /**
   * Get lead by ID
   */
  async getById(id: string): Promise<ILead | null> {
    return Lead.findOne({ _id: id, deletedAt: null });
  }

  /**
   * Find lead by phone
   */
  async getByPhone(phone: string): Promise<ILead | null> {
    return Lead.findOne({ phone, deletedAt: null });
  }

  /**
   * Update lead
   */
  async update(id: string, updates: Partial<CreateLeadInput>): Promise<ILead | null> {
    const lead = await Lead.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: updates },
      { new: true }
    );
    if (lead) {
      logger.info('Lead updated', { leadId: id });
    }
    return lead;
  }

  /**
   * Delete lead (soft delete)
   */
  async delete(id: string): Promise<boolean> {
    const result = await Lead.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } }
    );
    if (result) {
      logger.info('Lead soft deleted', { leadId: id });
      return true;
    }
    return false;
  }

  /**
   * Search leads with filters
   */
  async search(options: LeadSearchOptions): Promise<{ leads: ILead[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      segment,
      status,
      source,
      brokerId,
      assignedBrokerId,
      minScore,
      maxScore,
      search
    } = options;

    const query: Record<string, any> = { deletedAt: null };

    if (segment) query.segment = segment;
    if (status) query['qualification.status'] = status;
    if (source) query.source = source;
    if (brokerId || assignedBrokerId) query.assignedBrokerId = brokerId || assignedBrokerId;

    if (minScore || maxScore) {
      query['aiScore.overall'] = {};
      if (minScore) query['aiScore.overall'].$gte = minScore;
      if (maxScore) query['aiScore.overall'].$lte = maxScore;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [leads, total] = await Promise.all([
      Lead.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Lead.countDocuments(query)
    ]);

    return { leads: leads as ILead[], total };
  }

  /**
   * Get hot leads (score > 80)
   */
  async getHotLeads(limit = 50): Promise<ILead[]> {
    return Lead.find({
      'qualification.status': { $nin: [LeadStatus.CONVERTED, LeadStatus.LOST] },
      'aiScore.overall': { $gte: 80 },
      deletedAt: null
    })
      .sort({ 'aiScore.overall': -1, createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get leads by segment
   */
  async getBySegment(segment: LeadSegment, limit = 50): Promise<ILead[]> {
    return Lead.find({
      segment,
      deletedAt: null
    })
      .sort({ 'aiScore.overall': -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Score lead with AI
   */
  async scoreLead(id: string): Promise<ILead | null> {
    const lead = await Lead.findById(id);
    if (!lead) return null;

    try {
      // Try to get signals from REZ Intelligence
      const signals = await this.getSignals(lead.phone);
      const nriScore = await this.calculateNRIScore(lead);
      const hniScore = await this.calculateHNIScore(lead);
      const intentScore = await this.calculateIntentScore(lead, signals);
      const budgetMatch = await this.calculateBudgetMatch(lead);
      const timeline = await this.calculateTimelineScore(lead);

      const overall = Math.round(
        intentScore * 0.35 +
        budgetMatch * 0.25 +
        timeline * 0.15 +
        nriScore * 0.15 +
        hniScore * 0.10
      );

      const updatedLead = await Lead.findByIdAndUpdate(
        id,
        {
          $set: {
            aiScore: {
              overall,
              intent: intentScore,
              budgetMatch,
              timeline,
              engagement: signals?.engagementScore || 50,
              calculatedAt: new Date(),
              modelVersion: '1.0.0'
            }
          }
        },
        { new: true }
      );

      logger.info('Lead scored', { leadId: id, overall, intentScore, budgetMatch, nriScore, hniScore });
      return updatedLead;
    } catch (err) {
      logger.error('Failed to score lead', { leadId: id, error: err });
      return lead;
    }
  }

  /**
   * Assign lead to broker
   */
  async assignToBroker(leadId: string, brokerId: string): Promise<ILead | null> {
    const lead = await Lead.findOneAndUpdate(
      { _id: leadId, deletedAt: null },
      {
        $set: {
          assignedBrokerId: brokerId,
          'qualification.status': LeadStatus.CONTACTED
        }
      },
      { new: true }
    );
    if (lead) {
      logger.info('Lead assigned to broker', { leadId, brokerId });
    }
    return lead;
  }

  /**
   * Mark lead as qualified
   */
  async qualify(leadId: string, status: LeadStatus, reason?: string): Promise<ILead | null> {
    const lead = await Lead.findOneAndUpdate(
      { _id: leadId, deletedAt: null },
      {
        $set: {
          'qualification.status': status,
          'qualification.qualifiedAt': new Date(),
          'qualification.reason': reason
        }
      },
      { new: true }
    );
    if (lead) {
      logger.info('Lead qualified', { leadId, status, reason });
    }
    return lead;
  }

  /**
   * Add interaction to lead
   */
  async addInteraction(
    leadId: string,
    interaction: {
      type: 'call' | 'whatsapp' | 'email' | 'site_visit' | 'inquiry';
      direction: 'inbound' | 'outbound';
      agentId?: string;
      notes?: string;
      outcome?: string;
      duration?: number;
      recordingUrl?: string;
    }
  ): Promise<ILead | null> {
    const lead = await Lead.findByIdAndUpdate(
      leadId,
      {
        $push: {
          interactions: {
            ...interaction,
            createdAt: new Date()
          }
        },
        $set: {
          lastInteraction: new Date()
        }
      },
      { new: true }
    );
    if (lead) {
      logger.info('Interaction added', { leadId, type: interaction.type });
    }
    return lead;
  }

  /**
   * Get lead timeline
   */
  async getTimeline(leadId: string): Promise<any[]> {
    const lead = await Lead.findById(leadId).select('interactions siteVisits createdAt');
    if (!lead) return [];

    const timeline: any[] = [];

    // Add interactions
    if (lead.interactions) {
      lead.interactions.forEach(i => {
        timeline.push({
          type: i.type,
          direction: i.direction,
          date: i.createdAt,
          notes: i.notes,
          outcome: i.outcome
        });
      });
    }

    // Sort by date
    timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

    return timeline;
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(brokerId?: string): Promise<{
    total: number;
    hot: number;
    warm: number;
    cold: number;
    converted: number;
    avgScore: number;
  }> {
    const match: Record<string, any> = { deletedAt: null };
    if (brokerId) match.assignedBrokerId = brokerId;

    const stats = await Lead.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          hot: {
            $sum: { $cond: [{ $eq: ['$qualification.status', 'hot'] }, 1, 0] }
          },
          warm: {
            $sum: { $cond: [{ $eq: ['$qualification.status', 'warm'] }, 1, 0] }
          },
          cold: {
            $sum: { $cond: [{ $eq: ['$qualification.status', 'cold'] }, 1, 0] }
          },
          converted: {
            $sum: { $cond: [{ $eq: ['$qualification.status', 'converted'] }, 1, 0] }
          },
          avgScore: { $avg: '$aiScore.overall' }
        }
      }
    ]);

    if (stats.length === 0) {
      return { total: 0, hot: 0, warm: 0, cold: 0, converted: 0, avgScore: 0 };
    }

    return {
      total: stats[0].total,
      hot: stats[0].hot,
      warm: stats[0].warm,
      cold: stats[0].cold,
      converted: stats[0].converted,
      avgScore: Math.round(stats[0].avgScore || 0)
    };
  }

  // Private helper methods

  private async triggerAIScoring(leadId: string): Promise<void> {
    // Debounce: only score once per hour per lead
    const cacheKey = `lead:score:${leadId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return;

    await redis.set(cacheKey, '1', 'EX', 3600); // 1 hour
    await this.scoreLead(leadId);
  }

  private async getSignals(phone: string): Promise<any | null> {
    try {
      const signalUrl = process.env.REZ_SIGNAL_AGGREGATOR_URL;
      if (!signalUrl) return null;

      const response = await axios.get(`${signalUrl}/api/signals/user/${phone}`, {
        timeout: 2000,
        headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN }
      });
      return response.data;
    } catch {
      return null;
    }
  }

  private async calculateNRIScore(lead: ILead): Promise<number> {
    let score = 0;

    // NRI profile present
    if (lead.nriProfile?.isNRI) score += 30;

    // NRI country of residence (UAE, UK, US, etc.)
    const nriCountries = ['AE', 'US', 'UK', 'CA', 'AU', 'SG'];
    if (lead.nriProfile?.countryOfResidence && nriCountries.includes(lead.nriProfile.countryOfResidence)) {
      score += 20;
    }

    // Golden Visa eligible indicators
    if (lead.nriProfile?.visaType?.includes('golden') || lead.nriProfile?.visaType?.includes('investor')) {
      score += 25;
    }

    // Overseas assets
    if (lead.nriProfile?.overseasAssets) score += 15;

    // Repatriation needed (investment intent)
    if (lead.nriProfile?.repatriationNeeded) score += 10;

    return Math.min(100, score);
  }

  private async calculateHNIScore(lead: ILead): Promise<number> {
    let score = 0;

    if (lead.hniProfile?.isHNI) score += 30;

    // Income levels
    if (lead.hniProfile?.annualIncome) {
      if (lead.hniProfile.annualIncome >= 10000000) score += 30; // 1Cr+
      else if (lead.hniProfile.annualIncome >= 5000000) score += 20; // 50L+
      else if (lead.hniProfile.annualIncome >= 2000000) score += 10; // 20L+
    }

    // Net worth
    if (lead.hniProfile?.netWorth) {
      if (lead.hniProfile.netWorth >= 100000000) score += 25; // 10Cr+
      else if (lead.hniProfile.netWorth >= 50000000) score += 15; // 5Cr+
    }

    // Investment experience
    if (lead.hniProfile?.investmentExperience === 'extensive') score += 15;
    else if (lead.hniProfile?.investmentExperience === 'moderate') score += 10;

    return Math.min(100, score);
  }

  private async calculateIntentScore(lead: ILead, signals: any): Promise<number> {
    let score = 50; // Base score

    // From behavioral signals
    if (signals?.intentScore) {
      score = (score + signals.intentScore) / 2;
    }

    // From preferences
    if (lead.preferences?.purpose === 'invest') score += 20;
    else if (lead.preferences?.purpose === 'buy') score += 10;

    // From segment
    if (lead.segment === LeadSegment.INVESTOR) score += 15;
    else if (lead.segment === LeadSegment.HNI) score += 10;

    // From timeline
    if (lead.preferences?.timeline === 'immediate') score += 15;
    else if (lead.preferences?.timeline === '1-3months') score += 10;

    return Math.min(100, Math.max(0, score));
  }

  private async calculateBudgetMatch(lead: ILead): Promise<number> {
    if (!lead.preferences?.budget) return 50;

    let score = 50;
    const budget = lead.preferences.budget;
    const avgBudget = ((budget.min || 0) + (budget.max || 0)) / 2;

    // Higher budgets = higher scores (for seller/broker perspective)
    if (avgBudget >= 50000000) score += 30; // 5Cr+
    else if (avgBudget >= 20000000) score += 20; // 2Cr+
    else if (avgBudget >= 10000000) score += 15; // 1Cr+
    else if (avgBudget >= 5000000) score += 10; // 50L+
    else if (avgBudget >= 1000000) score += 5; // 10L+

    return Math.min(100, Math.max(0, score));
  }

  private async calculateTimelineScore(lead: ILead): Promise<number> {
    if (!lead.preferences?.timeline) return 50;

    const timeline = lead.preferences.timeline;
    switch (timeline) {
      case 'immediate': return 100;
      case '1-3months': return 80;
      case '3-6months': return 60;
      case '6-12months': return 40;
      case 'exploring': return 20;
      default: return 50;
    }
  }
}

export const leadService = new LeadService();
