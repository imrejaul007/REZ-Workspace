/**
 * Universal Lead Manager AI Agent
 * Manages and routes leads across all 15 Industry AI products
 */

import { v4 as uuidv4 } from 'uuid';
import { hojaiCore, IndustryType } from '../../connectors/hojai-core';
import { unifiedLeadService, Lead, LeadFilter } from '../../services/unified-lead-service';
import { customer360Service } from '../../services/customer-360-service';
import { crossSellService } from '../../services/cross-sell-service';

export interface LeadAssignment {
  leadId: string;
  assignedTo: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  assignedAt: Date;
}

export interface LeadNurtureAction {
  id: string;
  leadId: string;
  action: 'email' | 'call' | 'sms' | 'whatsapp' | 'assignment';
  scheduledFor: Date;
  status: 'pending' | 'completed' | 'cancelled';
  content?: string;
}

export interface LeadCampaign {
  id: string;
  name: string;
  industries: IndustryType[];
  targetCount: number;
  currentCount: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: Date;
  leads: string[];
}

export interface LeadScoreExplanation {
  leadId: string;
  score: number;
  factors: {
    name: string;
    impact: number;
    description: string;
  }[];
  recommendations: string[];
}

class UniversalLeadManagerAgent {
  private agentName = 'Universal Lead Manager';
  private agentId = 'lead-manager-001';
  private nurtureActions: Map<string, LeadNurtureAction> = new Map();
  private campaigns: Map<string, LeadCampaign> = new Map();

  /**
   * Process incoming lead from any industry
   */
  async processIncomingLead(leadData: {
    name: string;
    email?: string;
    phone?: string;
    source: IndustryType;
    sourceProductId?: string;
    metadata?: Record<string, any>;
  }): Promise<{ lead: Lead; assignment?: LeadAssignment; actions: LeadNurtureAction[] }> {
    console.log(`[${this.agentName}] Processing incoming lead from ${leadData.source}`);

    // Create lead
    const lead = await unifiedLeadService.addLead({
      name: leadData.name,
      email: leadData.email || '',
      phone: leadData.phone || '',
      source: leadData.source,
      sourceProductId: leadData.sourceProductId,
      score: 0, // Will be calculated
      status: 'new',
      industry: leadData.source,
      crossIndustries: [],
      notes: '',
      conversionProbability: 0.5,
      tags: [leadData.source],
      metadata: leadData.metadata || {}
    });

    // Calculate score
    const scoredLead = await unifiedLeadService.updateLead(lead.id, {
      score: unifiedLeadService.calculateScore(lead)
    });

    // Check for cross-industry matches
    const crossIndustries = await this.identifyCrossIndustryPotential(leadData);
    if (crossIndustries.length > 0) {
      await unifiedLeadService.updateLead(lead.id, { crossIndustries });
    }

    // Assign lead
    const assignment = await this.assignLead(lead.id);

    // Generate nurture actions
    const actions = await this.generateNurtureActions(lead);

    return {
      lead: scoredLead || lead,
      assignment: assignment || undefined,
      actions
    };
  }

  /**
   * Identify cross-industry potential for a lead
   */
  private async identifyCrossIndustryPotential(leadData: any): Promise<IndustryType[]> {
    const potential: IndustryType[] = [];

    // Check if lead email/phone matches existing customers in other industries
    if (leadData.email) {
      const customer = await customer360Service.getCustomerByEmail(leadData.email);
      if (customer) {
        // Add industries where customer is NOT active
        for (const industry of Object.keys(hojaiCore.getAllProducts()) as IndustryType[]) {
          if (!customer.industries.includes(industry)) {
            potential.push(industry);
          }
        }
      }
    }

    return potential.slice(0, 3); // Limit to top 3
  }

  /**
   * Assign lead to appropriate employee/queue
   */
  async assignLead(leadId: string): Promise<LeadAssignment | null> {
    const lead = await unifiedLeadService.getLead(leadId);
    if (!lead) return null;

    // Determine assignment based on score and industry
    let assignedTo: string;
    let reason: string;
    let priority: 'high' | 'medium' | 'low';

    if (lead.score >= 70) {
      assignedTo = 'enterprise-sales';
      reason = 'High score lead - priority handling required';
      priority = 'high';
    } else if (lead.score >= 40) {
      assignedTo = 'standard-queue';
      reason = 'Medium score lead - standard processing';
      priority = 'medium';
    } else {
      assignedTo = ' nurture-queue';
      reason = 'Low score lead - nurture campaign recommended';
      priority = 'low';
    }

    await unifiedLeadService.updateLead(leadId, { assignedTo });

    return {
      leadId,
      assignedTo,
      reason,
      priority,
      assignedAt: new Date()
    };
  }

  /**
   * Generate nurture actions for a lead
   */
  private async generateNurtureActions(lead: Lead): Promise<LeadNurtureAction[]> {
    const actions: LeadNurtureAction[] = [];

    if (lead.score >= 70) {
      // High score - immediate follow-up
      actions.push({
        id: uuidv4(),
        leadId: lead.id,
        action: 'call',
        scheduledFor: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
        status: 'pending',
        content: 'High priority follow-up call'
      });
    }

    if (lead.crossIndustries.length > 0) {
      // Cross-industry lead - special handling
      actions.push({
        id: uuidv4(),
        leadId: lead.id,
        action: 'email',
        scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours from now
        status: 'pending',
        content: 'Cross-industry opportunity email'
      });
    }

    // Default welcome email
    actions.push({
      id: uuidv4(),
      leadId: lead.id,
      action: 'email',
      scheduledFor: new Date(Date.now() + 1000 * 60 * 5), // 5 minutes from now
      status: 'pending',
      content: 'Welcome to HOJAI - your AI-powered business partner'
    });

    // Store actions
    for (const action of actions) {
      this.nurtureActions.set(action.id, action);
    }

    return actions;
  }

  /**
   * Score and explain lead score
   */
  async explainLeadScore(leadId: string): Promise<LeadScoreExplanation | null> {
    const lead = await unifiedLeadService.getLead(leadId);
    if (!lead) return null;

    const factors: LeadScoreExplanation['factors'] = [];

    // Base score
    factors.push({
      name: 'Base Score',
      impact: 50,
      description: 'Starting score for all new leads'
    });

    // Email presence
    if (lead.email) {
      factors.push({
        name: 'Email Provided',
        impact: 10,
        description: 'Lead provided email address'
      });
    }

    // Phone presence
    if (lead.phone) {
      factors.push({
        name: 'Phone Provided',
        impact: 10,
        description: 'Lead provided phone number'
      });
    }

    // Complete name
    if (lead.name.includes(' ')) {
      factors.push({
        name: 'Full Name',
        impact: 10,
        description: 'Lead provided complete name'
      });
    }

    // Cross-industry potential
    if (lead.crossIndustries.length > 0) {
      factors.push({
        name: 'Cross-Industry Potential',
        impact: 15 * Math.min(lead.crossIndustries.length, 3),
        description: `Potential interest in ${lead.crossIndustries.length} additional industries`
      });
    }

    const recommendations: string[] = [];
    if (lead.score < 50) {
      recommendations.push('Consider adding more contact information');
    }
    if (lead.crossIndustries.length === 0) {
      recommendations.push('Explore cross-industry upselling opportunities');
    }

    return {
      leadId,
      score: lead.score,
      factors,
      recommendations
    };
  }

  /**
   * Get leads by priority
   */
  async getLeadsByPriority(): Promise<{
    high: Lead[];
    medium: Lead[];
    low: Lead[];
  }> {
    const allLeads = await unifiedLeadService.getLeads();
    const activeLeads = allLeads.filter(l => l.status !== 'converted' && l.status !== 'lost');

    return {
      high: activeLeads.filter(l => l.score >= 70),
      medium: activeLeads.filter(l => l.score >= 40 && l.score < 70),
      low: activeLeads.filter(l => l.score < 40)
    };
  }

  /**
   * Create lead campaign
   */
  async createCampaign(data: {
    name: string;
    industries: IndustryType[];
    filter?: LeadFilter;
  }): Promise<LeadCampaign> {
    const leads = await unifiedLeadService.getLeads(data.filter);

    const campaign: LeadCampaign = {
      id: uuidv4(),
      name: data.name,
      industries: data.industries,
      targetCount: leads.length,
      currentCount: 0,
      status: 'draft',
      createdAt: new Date(),
      leads: leads.map(l => l.id)
    };

    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  /**
   * Execute campaign
   */
  async executeCampaign(campaignId: string): Promise<{ sent: number; failed: number }> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      return { sent: 0, failed: 0 };
    }

    campaign.status = 'active';

    let sent = 0;
    let failed = 0;

    for (const leadId of campaign.leads) {
      // Simulate sending
      const success = Math.random() > 0.1;
      if (success) sent++;
      else failed++;

      campaign.currentCount = sent;
    }

    campaign.status = 'completed';

    console.log(`[${this.agentName}] Campaign ${campaign.name}: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  /**
   * Get campaign performance
   */
  async getCampaignPerformance(campaignId: string): Promise<{
    campaign: LeadCampaign;
    conversionRate: number;
    revenue: number;
  } | null> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return null;

    const campaignLeads = await Promise.all(
      campaign.leads.map(id => unifiedLeadService.getLead(id))
    );

    const converted = campaignLeads.filter(l => l?.status === 'converted').length;
    const totalSpent = campaignLeads.reduce((sum, l) => sum + (l?.conversionProbability || 0) * 100, 0);

    return {
      campaign,
      conversionRate: campaign.currentCount > 0 ? converted / campaign.currentCount : 0,
      revenue: totalSpent
    };
  }

  /**
   * Get nurture actions for lead
   */
  async getNurtureActions(leadId: string): Promise<LeadNurtureAction[]> {
    return Array.from(this.nurtureActions.values()).filter(a => a.leadId === leadId);
  }

  /**
   * Execute nurture action
   */
  async executeNurtureAction(actionId: string): Promise<boolean> {
    const action = this.nurtureActions.get(actionId);
    if (!action) return false;

    action.status = 'completed';
    this.nurtureActions.set(actionId, action);

    // If it was a call action, update lead's last contacted time
    if (action.action === 'call') {
      await unifiedLeadService.updateLead(action.leadId, { lastContactedAt: new Date() });
    }

    return true;
  }

  /**
   * Get lead statistics
   */
  async getLeadStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byIndustry: Record<string, number>;
    topSources: Array<{ industry: IndustryType; count: number }>;
    conversionFunnel: { identified: number; qualified: number; converted: number };
  }> {
    const aggregation = await unifiedLeadService.getAggregation();
    const leads = await unifiedLeadService.getLeads();

    const byStatus: Record<string, number> = {};
    const byIndustry: Record<string, number> = {};
    const topSources: Array<{ industry: IndustryType; count: number }> = [];

    for (const lead of leads) {
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
      byIndustry[lead.source] = (byIndustry[lead.source] || 0) + 1;
    }

    // Sort and limit top sources
    const sortedSources = Object.entries(byIndustry)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([industry, count]) => ({ industry: industry as IndustryType, count }));

    return {
      total: aggregation.totalLeads,
      byStatus,
      byIndustry,
      topSources: sortedSources,
      conversionFunnel: {
        identified: aggregation.totalLeads,
        qualified: leads.filter(l => l.status === 'qualified' || l.status === 'converted').length,
        converted: leads.filter(l => l.status === 'converted').length
      }
    };
  }

  /**
   * Auto-route lead based on criteria
   */
  async routeLead(leadId: string, routeCriteria: {
    highScoreThreshold?: number;
    targetIndustry?: IndustryType;
    preferredEmployee?: string;
  }): Promise<{ routed: boolean; route: string; reason: string }> {
    const lead = await unifiedLeadService.getLead(leadId);
    if (!lead) {
      return { routed: false, route: '', reason: 'Lead not found' };
    }

    const threshold = routeCriteria.highScoreThreshold || 70;

    if (lead.score >= threshold) {
      await unifiedLeadService.updateLead(leadId, { assignedTo: 'enterprise-sales' });
      return {
        routed: true,
        route: 'enterprise-sales',
        reason: `High score (${lead.score}) exceeded threshold (${threshold})`
      };
    }

    if (routeCriteria.targetIndustry) {
      // Push to specific industry
      const success = await hojaiCore.pushLeadToIndustry(lead, routeCriteria.targetIndustry);
      return {
        routed: success,
        route: routeCriteria.targetIndustry,
        reason: `Targeted routing to ${routeCriteria.targetIndustry}`
      };
    }

    await unifiedLeadService.updateLead(leadId, { assignedTo: 'standard-queue' });
    return {
      routed: true,
      route: 'standard-queue',
      reason: 'Standard routing based on score and availability'
    };
  }

  /**
   * Get agent status
   */
  getStatus(): { agentId: string; name: string; ready: boolean; activeCampaigns: number } {
    return {
      agentId: this.agentId,
      name: this.agentName,
      ready: true,
      activeCampaigns: Array.from(this.campaigns.values()).filter(c => c.status === 'active').length
    };
  }
}

export const universalLeadManager = new UniversalLeadManagerAgent();