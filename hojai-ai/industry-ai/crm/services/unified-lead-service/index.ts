/**
 * Unified Lead Service
 * Captures and manages leads from all 15 Industry AI products
 */

import { v4 as uuidv4 } from 'uuid';
import { hojaiCore, IndustryType } from '../../connectors/hojai-core';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: IndustryType;
  sourceProductId?: string;
  score: number;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  industry: IndustryType;
  crossIndustries: IndustryType[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  lastContactedAt?: Date;
  conversionProbability: number;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface LeadFilter {
  source?: IndustryType;
  status?: Lead['status'];
  minScore?: number;
  maxScore?: number;
  assignedTo?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface LeadAggregation {
  totalLeads: number;
  byIndustry: Record<IndustryType, number>;
  byStatus: Record<string, number>;
  averageScore: number;
  conversionRate: number;
}

class UnifiedLeadService {
  private leads: Map<string, Lead> = new Map();

  /**
   * Add a lead from any industry
   */
  async addLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    const now = new Date();
    const lead: Lead = {
      ...leadData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };

    this.leads.set(lead.id, lead);
    console.log(`[LeadService] Added lead ${lead.id} from ${lead.industry}`);

    return lead;
  }

  /**
   * Import leads from a specific industry
   */
  async importFromIndustry(industry: IndustryType): Promise<number> {
    const industryLeads = await hojaiCore.getLeadsFromIndustry(industry);
    let imported = 0;

    for (const leadData of industryLeads) {
      const lead = await this.addLead({
        ...leadData,
        source: industry,
        industry: industry,
        status: 'new',
        score: this.calculateScore(leadData),
        crossIndustries: [],
        notes: '',
        conversionProbability: 0.5,
        tags: []
      });
      imported++;
    }

    console.log(`[LeadService] Imported ${imported} leads from ${industry}`);
    return imported;
  }

  /**
   * Import leads from all industries
   */
  async importFromAllIndustries(): Promise<Record<IndustryType, number>> {
    const results: Record<string, number> = {};

    for (const industry of Object.keys(hojaiCore.getAllProducts()).map(k => k as IndustryType)) {
      results[industry] = await this.importFromIndustry(industry);
    }

    return results as Record<IndustryType, number>;
  }

  /**
   * Get lead by ID
   */
  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  /**
   * Get all leads with optional filtering
   */
  async getLeads(filter?: LeadFilter): Promise<Lead[]> {
    let leads = Array.from(this.leads.values());

    if (filter) {
      if (filter.source) {
        leads = leads.filter(l => l.source === filter.source);
      }
      if (filter.status) {
        leads = leads.filter(l => l.status === filter.status);
      }
      if (filter.minScore !== undefined) {
        leads = leads.filter(l => l.score >= filter.minScore!);
      }
      if (filter.maxScore !== undefined) {
        leads = leads.filter(l => l.score <= filter.maxScore!);
      }
      if (filter.assignedTo) {
        leads = leads.filter(l => l.assignedTo === filter.assignedTo);
      }
      if (filter.dateFrom) {
        leads = leads.filter(l => l.createdAt >= filter.dateFrom!);
      }
      if (filter.dateTo) {
        leads = leads.filter(l => l.createdAt <= filter.dateTo!);
      }
    }

    return leads.sort((a, b) => b.score - a.score);
  }

  /**
   * Update a lead
   */
  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (!lead) return undefined;

    const updated: Lead = {
      ...lead,
      ...updates,
      id: lead.id,
      createdAt: lead.createdAt,
      updatedAt: new Date()
    };

    this.leads.set(id, updated);
    return updated;
  }

  /**
   * Delete a lead
   */
  async deleteLead(id: string): Promise<boolean> {
    return this.leads.delete(id);
  }

  /**
   * Assign lead to an employee
   */
  async assignLead(leadId: string, employeeId: string): Promise<Lead | undefined> {
    return this.updateLead(leadId, { assignedTo: employeeId });
  }

  /**
   * Calculate lead score based on various factors
   */
  calculateScore(leadData: Partial<Lead>): number {
    let score = 50; // Base score

    // Check for email
    if (leadData.email) score += 10;

    // Check for phone
    if (leadData.phone) score += 10;

    // Check for complete name
    if (leadData.name && leadData.name.includes(' ')) score += 10;

    // Check for cross-industry interest
    if (leadData.crossIndustries && leadData.crossIndustries.length > 0) {
      score += 15 * Math.min(leadData.crossIndustries.length, 3);
    }

    // Industry-specific bonuses (simulated)
    if (leadData.industry) {
      score += 5;
    }

    return Math.min(100, score);
  }

  /**
   * Get lead aggregation statistics
   */
  async getAggregation(filter?: LeadFilter): Promise<LeadAggregation> {
    const leads = await this.getLeads(filter);

    const byIndustry: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalScore = 0;
    let converted = 0;

    for (const lead of leads) {
      byIndustry[lead.industry] = (byIndustry[lead.industry] || 0) + 1;
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
      totalScore += lead.score;
      if (lead.status === 'converted') converted++;
    }

    return {
      totalLeads: leads.length,
      byIndustry: byIndustry as Record<IndustryType, number>,
      byStatus,
      averageScore: leads.length > 0 ? totalScore / leads.length : 0,
      conversionRate: leads.length > 0 ? converted / leads.length : 0
    };
  }

  /**
   * Re-score all leads
   */
  async rescoreAllLeads(): Promise<number> {
    let rescored = 0;

    for (const [id, lead] of this.leads) {
      const newScore = this.calculateScore(lead);
      await this.updateLead(id, { score: newScore });
      rescored++;
    }

    console.log(`[LeadService] Re-scored ${rescored} leads`);
    return rescored;
  }

  /**
   * Get top leads by score
   */
  async getTopLeads(limit: number = 10): Promise<Lead[]> {
    const leads = await this.getLeads();
    return leads
      .filter(l => l.status !== 'converted' && l.status !== 'lost')
      .slice(0, limit);
  }

  /**
   * Get leads for a specific customer across industries
   */
  async getLeadsByEmail(email: string): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(l => l.email === email);
  }
}

export const unifiedLeadService = new UnifiedLeadService();