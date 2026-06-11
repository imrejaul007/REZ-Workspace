/**
 * Cross-Sell Service
 * Identifies and manages cross-sell opportunities across all industries
 */

import { v4 as uuidv4 } from 'uuid';
import { hojaiCore, IndustryType } from '../../connectors/hojai-core';
import { customer360Service } from '../customer-360-service/index';
import { unifiedLeadService } from '../unified-lead-service/index';

export interface CrossSellOpportunity {
  id: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  fromIndustry: IndustryType;
  toIndustry: IndustryType;
  opportunityScore: number;
  status: 'identified' | 'contacted' | 'converted' | 'declined' | 'ignored';
  reason: string;
  suggestedOffer?: string;
  potentialValue: number;
  createdAt: Date;
  updatedAt: Date;
  contactAttempts: number;
  lastContactedAt?: Date;
  notes: string;
}

export interface CrossSellRule {
  id: string;
  fromIndustry: IndustryType;
  toIndustry: IndustryType;
  triggerConditions: TriggerCondition[];
  suggestedOffer: string;
  minimumScore: number;
  active: boolean;
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface CrossSellAnalysis {
  totalOpportunities: number;
  byIndustryPair: Record<string, number>;
  totalPotentialValue: number;
  averageScore: number;
  conversionRate: number;
  topOpportunities: CrossSellOpportunity[];
}

// Industry relationship map - defines natural cross-sell paths
const INDUSTRY_RELATIONSHIPS: Record<IndustryType, IndustryType[]> = {
  waitron: ['staybot', 'tripmind', 'glamai'],      // Restaurant -> Hotel, Travel, Beauty
  shopflow: ['glamai', 'fitmind', 'neighborai'],    // Retail -> Beauty, Fitness, Community
  staybot: ['waitron', 'tripmind', 'glamai', 'fitmind'], // Hotel -> Restaurant, Travel, Beauty, Fitness
  carecode: ['fitmind', 'teammind', 'neighborai'],  // Healthcare -> Fitness, Team, Community
  glamai: ['shopflow', 'fitmind', 'staybot'],       // Salon -> Retail, Fitness, Hotel
  fitmind: ['glamai', 'carecode', 'staybot'],       // Fitness -> Beauty, Healthcare, Hotel
  teammind: ['carecode', 'neighborai', 'prodflow'], // Team -> Healthcare, Community, Production
  ledgerai: ['franchiseiq', 'prodflow', 'fleetiq'], // Accounting -> Franchise, Production, Fleet
  fleetiq: ['ledgerai', 'prodflow', 'franchiseiq'], // Fleet -> Accounting, Production, Franchise
  propflow: ['staybot', 'neighborai', 'franchiseiq'], // Property -> Hotel, Community, Franchise
  neighborai: ['propflow', 'teammind', 'learniq'],  // Community -> Property, Team, Learning
  learniq: ['teammind', 'fitmind', 'neighborai'],    // Learning -> Team, Fitness, Community
  tripmind: ['staybot', 'waitron', 'glamai'],       // Travel -> Hotel, Restaurant, Beauty
  franchiseiq: ['ledgerai', 'propflow', 'fleetiq'], // Franchise -> Accounting, Property, Fleet
  prodflow: ['ledgerai', 'fleetiq', 'franchiseiq']  // Production -> Accounting, Fleet, Franchise
};

class CrossSellService {
  private opportunities: Map<string, CrossSellOpportunity> = new Map();
  private rules: Map<string, CrossSellRule> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default cross-sell rules based on industry relationships
   */
  private initializeDefaultRules(): void {
    for (const [fromIndustry, toIndustries] of Object.entries(INDUSTRY_RELATIONSHIPS)) {
      for (const toIndustry of toIndustries) {
        const ruleId = `${fromIndustry}-to-${toIndustry}`;
        this.rules.set(ruleId, {
          id: ruleId,
          fromIndustry: fromIndustry as IndustryType,
          toIndustry: toIndustry as IndustryType,
          triggerConditions: [
            { field: 'transactionCount', operator: 'greater_than', value: 2 },
            { field: 'totalSpent', operator: 'greater_than', value: 100 }
          ],
          suggestedOffer: this.generateOffer(fromIndustry as IndustryType, toIndustry as IndustryType),
          minimumScore: 50,
          active: true
        });
      }
    }
  }

  /**
   * Generate a suggested offer based on industry pair
   */
  private generateOffer(from: IndustryType, to: IndustryType): string {
    const offers: Record<string, string> = {
      'waitron-staybot': 'Book a table at our restaurant and get 20% off your hotel stay',
      'waitron-tripmind': 'Explore our travel packages and enjoy a complimentary dining experience',
      'waitron-glamai': 'Get pampered at our salon with a free appetizer at our restaurant',
      'shopflow-glamai': 'Purchase beauty products and get a styling session free',
      'shopflow-fitmind': 'Buy fitness gear and get a complimentary gym session',
      'staybot-waitron': 'Enjoy fine dining with a complimentary room upgrade',
      'staybot-glamai': 'Relax at our spa with a complimentary hotel night',
      'glamai-shopflow': 'Get a new look and shop our exclusive beauty collection',
      'glamai-fitmind': 'Complete your wellness routine with fitness and beauty packages',
      'fitmind-glamai': 'Look your best while getting fit with our combined packages',
      'tripmind-staybot': 'Book your dream vacation and get exclusive hotel deals',
      'ledgerai-franchiseiq': 'Grow your franchise with integrated accounting solutions',
      'fleetiq-ledgerai': 'Optimize your fleet costs with smart accounting'
    };

    const key = `${from}-${to}`;
    return offers[key] || `Special offer: Try our ${to} services today!`;
  }

  /**
   * Identify cross-sell opportunities for a customer
   */
  async identifyOpportunitiesForCustomer(customerId: string): Promise<CrossSellOpportunity[]> {
    const customer = await customer360Service.getCustomer(customerId);
    if (!customer || customer.industries.length === 0) return [];

    const opportunities: CrossSellOpportunity[] = [];

    for (const currentIndustry of customer.industries) {
      const relatedIndustries = INDUSTRY_RELATIONSHIPS[currentIndustry] || [];

      for (const targetIndustry of relatedIndustries) {
        // Skip if customer already has this industry
        if (customer.industries.includes(targetIndustry)) continue;

        const score = this.calculateOpportunityScore(customer, currentIndustry, targetIndustry);

        if (score >= 50) {
          const opportunity: CrossSellOpportunity = {
            id: uuidv4(),
            customerId: customer.id,
            customerEmail: customer.email,
            customerName: customer.name,
            fromIndustry: currentIndustry,
            toIndustry: targetIndustry,
            opportunityScore: score,
            status: 'identified',
            reason: this.generateReason(currentIndustry, targetIndustry, customer),
            suggestedOffer: this.rules.get(`${currentIndustry}-${targetIndustry}`)?.suggestedOffer,
            potentialValue: this.estimateValue(customer, targetIndustry),
            createdAt: new Date(),
            updatedAt: new Date(),
            contactAttempts: 0,
            notes: ''
          };

          this.opportunities.set(opportunity.id, opportunity);
          opportunities.push(opportunity);
        }
      }
    }

    return opportunities;
  }

  /**
   * Calculate opportunity score for a customer
   */
  private calculateOpportunityScore(
    customer: any,
    fromIndustry: IndustryType,
    toIndustry: IndustryType
  ): number {
    let score = 30; // Base score

    // Profile completeness bonus
    if (customer.email) score += 10;
    if (customer.phone) score += 10;
    if (customer.totalLifetimeValue > 500) score += 15;

    // Transaction frequency bonus
    const profile = customer.industryProfiles?.[fromIndustry];
    if (profile) {
      if (profile.transactionCount > 5) score += 15;
      if (profile.averageOrderValue > 100) score += 10;
    }

    // Multi-industry experience (customer appreciates integrated services)
    if (customer.industries.length > 1) score += 10;

    // Industry relationship strength
    const relationships = INDUSTRY_RELATIONSHIPS[fromIndustry];
    const position = relationships?.indexOf(toIndustry);
    if (position !== undefined && position >= 0) {
      score += (relationships.length - position) * 3;
    }

    return Math.min(100, score);
  }

  /**
   * Generate reason for the opportunity
   */
  private generateReason(
    fromIndustry: IndustryType,
    toIndustry: IndustryType,
    customer: any
  ): string {
    const fromProduct = hojaiCore.getProduct(fromIndustry);
    const toProduct = hojaiCore.getProduct(toIndustry);

    return `Customer uses ${fromProduct?.name || fromIndustry} and may benefit from ${toProduct?.name || toIndustry}`;
  }

  /**
   * Estimate potential value of the opportunity
   */
  private estimateValue(customer: any, targetIndustry: IndustryType): number {
    const profile = customer.industryProfiles?.[Object.keys(customer.industryProfiles)[0]];
    const baseValue = profile?.totalSpent || 100;
    return baseValue * 1.5; // Assume 50% upside potential
  }

  /**
   * Identify opportunities for all customers
   */
  async identifyAllOpportunities(): Promise<number> {
    const customers = await customer360Service.getAllCustomers();
    let count = 0;

    for (const customer of customers) {
      const opportunities = await this.identifyOpportunitiesForCustomer(customer.id);
      count += opportunities.length;
    }

    console.log(`[CrossSell] Identified ${count} opportunities`);
    return count;
  }

  /**
   * Get opportunity by ID
   */
  async getOpportunity(id: string): Promise<CrossSellOpportunity | undefined> {
    return this.opportunities.get(id);
  }

  /**
   * Get all opportunities with optional filtering
   */
  async getOpportunities(filter?: {
    status?: CrossSellOpportunity['status'];
    fromIndustry?: IndustryType;
    toIndustry?: IndustryType;
    minScore?: number;
    customerId?: string;
  }): Promise<CrossSellOpportunity[]> {
    let opportunities = Array.from(this.opportunities.values());

    if (filter) {
      if (filter.status) {
        opportunities = opportunities.filter(o => o.status === filter.status);
      }
      if (filter.fromIndustry) {
        opportunities = opportunities.filter(o => o.fromIndustry === filter.fromIndustry);
      }
      if (filter.toIndustry) {
        opportunities = opportunities.filter(o => o.toIndustry === filter.toIndustry);
      }
      if (filter.minScore) {
        opportunities = opportunities.filter(o => o.opportunityScore >= filter.minScore!);
      }
      if (filter.customerId) {
        opportunities = opportunities.filter(o => o.customerId === filter.customerId);
      }
    }

    return opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  /**
   * Update opportunity status
   */
  async updateOpportunity(id: string, updates: Partial<CrossSellOpportunity>): Promise<CrossSellOpportunity | undefined> {
    const opportunity = this.opportunities.get(id);
    if (!opportunity) return undefined;

    const updated: CrossSellOpportunity = {
      ...opportunity,
      ...updates,
      id: opportunity.id,
      customerId: opportunity.customerId,
      createdAt: opportunity.createdAt,
      updatedAt: new Date()
    };

    this.opportunities.set(id, updated);
    return updated;
  }

  /**
   * Mark opportunity as contacted
   */
  async markContacted(id: string): Promise<CrossSellOpportunity | undefined> {
    const opportunity = this.opportunities.get(id);
    if (!opportunity) return undefined;

    return this.updateOpportunity(id, {
      status: 'contacted',
      contactAttempts: opportunity.contactAttempts + 1,
      lastContactedAt: new Date()
    });
  }

  /**
   * Mark opportunity as converted
   */
  async markConverted(id: string): Promise<CrossSellOpportunity | undefined> {
    return this.updateOpportunity(id, { status: 'converted' });
  }

  /**
   * Mark opportunity as declined
   */
  async markDeclined(id: string, reason?: string): Promise<CrossSellOpportunity | undefined> {
    return this.updateOpportunity(id, {
      status: 'declined',
      notes: reason || ''
    });
  }

  /**
   * Get analysis of cross-sell opportunities
   */
  async getAnalysis(): Promise<CrossSellAnalysis> {
    const opportunities = await this.getOpportunities();

    const byIndustryPair: Record<string, number> = {};
    let totalPotentialValue = 0;
    let totalScore = 0;
    let converted = 0;

    for (const opp of opportunities) {
      const pair = `${opp.fromIndustry}-${opp.toIndustry}`;
      byIndustryPair[pair] = (byIndustryPair[pair] || 0) + 1;
      totalPotentialValue += opp.potentialValue;
      totalScore += opp.opportunityScore;
      if (opp.status === 'converted') converted++;
    }

    const topOpportunities = opportunities.slice(0, 10);

    return {
      totalOpportunities: opportunities.length,
      byIndustryPair,
      totalPotentialValue,
      averageScore: opportunities.length > 0 ? totalScore / opportunities.length : 0,
      conversionRate: opportunities.length > 0 ? converted / opportunities.length : 0,
      topOpportunities
    };
  }

  /**
   * Get recommendations for cross-sell campaigns
   */
  async getCampaignRecommendations(): Promise<Array<{
    fromIndustry: IndustryType;
    toIndustry: IndustryType;
    opportunityCount: number;
    totalPotential: number;
    recommendedAction: string;
  }>> {
    const analysis = await this.getAnalysis();
    const recommendations: Array<{
      fromIndustry: IndustryType;
      toIndustry: IndustryType;
      opportunityCount: number;
      totalPotential: number;
      recommendedAction: string;
    }> = [];

    for (const [pair, count] of Object.entries(analysis.byIndustryPair)) {
      const [from, to] = pair.split('-');
      const pairOpps = await this.getOpportunities({
        fromIndustry: from as IndustryType,
        toIndustry: to as IndustryType,
        minScore: 70
      });

      const totalPotential = pairOpps.reduce((sum, o) => sum + o.potentialValue, 0);

      if (pairOpps.length > 0) {
        recommendations.push({
          fromIndustry: from as IndustryType,
          toIndustry: to as IndustryType,
          opportunityCount: pairOpps.length,
          totalPotential,
          recommendedAction: `Launch targeted campaign for ${pairOpps.length} high-value customers`
        });
      }
    }

    return recommendations.sort((a, b) => b.totalPotential - a.totalPotential);
  }

  /**
   * Get customer opportunities
   */
  async getCustomerOpportunities(customerId: string): Promise<CrossSellOpportunity[]> {
    return this.getOpportunities({ customerId });
  }

  /**
   * Get rules
   */
  getRules(): CrossSellRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Update rule
   */
  updateRule(id: string, updates: Partial<CrossSellRule>): void {
    const rule = this.rules.get(id);
    if (rule) {
      this.rules.set(id, { ...rule, ...updates });
    }
  }

  /**
   * Delete opportunity
   */
  async deleteOpportunity(id: string): Promise<boolean> {
    return this.opportunities.delete(id);
  }
}

export const crossSellService = new CrossSellService();