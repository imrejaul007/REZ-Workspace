/**
 * Customer Intelligence AI Agent
 * Provides unified customer view and insights across all industries
 */

import { v4 as uuidv4 } from 'uuid';
import { hojaiCore, IndustryType } from '../../connectors/hojai-core';
import { customer360Service } from '../../services/customer-360-service';
import { unifiedLeadService } from '../../services/unified-lead-service';
import { crossSellService } from '../../services/cross-sell-service';
import { revenueConsolidationService } from '../../services/revenue-consolidation-service';

export interface Customer360Profile {
  customer: any;
  overview: {
    totalValue: number;
    industryCount: number;
    engagementScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    lifetimeStage: 'new' | 'growing' | 'stable' | 'at-risk' | 'churned';
  };
  interactions: {
    totalInteractions: number;
    lastInteraction: Date | null;
    preferredChannel: string;
    averageResponseRate: number;
  };
  crossIndustry: {
    industries: IndustryType[];
    favoriteIndustry: IndustryType;
    spendingDistribution: Record<IndustryType, number>;
  };
  recommendations: string[];
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria;
  customers: string[];
  metrics: {
    count: number;
    totalValue: number;
    avgValue: number;
    avgInteractions: number;
  };
}

export interface SegmentCriteria {
  minValue?: number;
  maxValue?: number;
  industries?: IndustryType[];
  riskLevel?: Customer360Profile['overview']['riskLevel'];
  lifetimeStage?: Customer360Profile['overview']['lifetimeStage'];
}

export interface CustomerJourney {
  customerId: string;
  stages: JourneyStage[];
  totalValue: number;
  conversionPath: string[];
  insights: string[];
}

export interface JourneyStage {
  timestamp: Date;
  industry: IndustryType;
  action: string;
  value: number;
  nextAction?: string;
}

class CustomerIntelligenceAgent {
  private agentName = 'Customer Intelligence';
  private agentId = 'customer-intel-001';
  private segments: Map<string, CustomerSegment> = new Map();

  /**
   * Get comprehensive customer profile
   */
  async getCustomerProfile(customerId: string): Promise<Customer360Profile | null> {
    console.log(`[${this.agentName}] Analyzing customer ${customerId}...`);

    const customer = await customer360Service.getCustomer(customerId);
    if (!customer) return null;

    // Calculate engagement score
    const engagementScore = this.calculateEngagementScore(customer);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(customer);

    // Determine lifetime stage
    const lifetimeStage = this.determineLifetimeStage(customer);

    // Find favorite industry
    let favoriteIndustry: IndustryType = customer.industries[0];
    let maxSpent = 0;

    for (const [industry, profile] of Object.entries(customer.industryProfiles)) {
      if (profile.totalSpent > maxSpent) {
        maxSpent = profile.totalSpent;
        favoriteIndustry = industry as IndustryType;
      }
    }

    // Calculate spending distribution
    const spendingDistribution: Record<string, number> = {};
    const totalSpent = customer.totalLifetimeValue;

    for (const [industry, profile] of Object.entries(customer.industryProfiles)) {
      spendingDistribution[industry] = totalSpent > 0 ? (profile.totalSpent / totalSpent) * 100 : 0;
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(customer, engagementScore, riskLevel);

    return {
      customer,
      overview: {
        totalValue: customer.totalLifetimeValue,
        industryCount: customer.industries.length,
        engagementScore,
        riskLevel,
        lifetimeStage
      },
      interactions: {
        totalInteractions: customer.communicationHistory.length,
        lastInteraction: customer.lastInteraction,
        preferredChannel: customer.preferences.preferredContactMethod,
        averageResponseRate: this.calculateResponseRate(customer)
      },
      crossIndustry: {
        industries: customer.industries,
        favoriteIndustry,
        spendingDistribution: spendingDistribution as Record<IndustryType, number>
      },
      recommendations
    };
  }

  /**
   * Calculate customer engagement score
   */
  private calculateEngagementScore(customer: any): number {
    let score = 0;

    // Recent activity (0-40 points)
    const daysSinceLastInteraction = customer.lastInteraction
      ? Math.floor((Date.now() - customer.lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceLastInteraction <= 7) score += 40;
    else if (daysSinceLastInteraction <= 30) score += 25;
    else if (daysSinceLastInteraction <= 90) score += 10;

    // Interaction frequency (0-30 points)
    const interactionsPerMonth = customer.communicationHistory.length /
      Math.max(1, (Date.now() - customer.firstInteraction.getTime()) / (1000 * 60 * 60 * 24 * 30));

    if (interactionsPerMonth >= 5) score += 30;
    else if (interactionsPerMonth >= 2) score += 20;
    else if (interactionsPerMonth >= 1) score += 10;

    // Multi-industry engagement (0-20 points)
    score += Math.min(20, customer.industries.length * 7);

    // Communication preference setup (0-10 points)
    if (customer.preferences.preferredContactMethod) score += 5;
    if (customer.preferences.marketingOptIn) score += 5;

    return Math.min(100, score);
  }

  /**
   * Determine customer risk level
   */
  private determineRiskLevel(customer: any): 'low' | 'medium' | 'high' {
    const daysSinceLastInteraction = customer.lastInteraction
      ? Math.floor((Date.now() - customer.lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const recentTransactions = customer.totalTransactions * 0.5;
    const expectedTransactions = (Date.now() - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 7);

    // High risk conditions
    if (daysSinceLastInteraction > 90) return 'high';
    if (customer.totalLifetimeValue > 10000 && daysSinceLastInteraction > 30) return 'high';

    // Medium risk conditions
    if (daysSinceLastInteraction > 60) return 'medium';
    if (recentTransactions < expectedTransactions * 0.5) return 'medium';

    return 'low';
  }

  /**
   * Determine customer lifetime stage
   */
  private determineLifetimeStage(customer: any): Customer360Profile['overview']['lifetimeStage'] {
    const daysSinceFirst = Math.floor(
      (Date.now() - customer.firstInteraction.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceFirst <= 30) return 'new';
    if (customer.industries.length >= 3) return 'growing';
    if (customer.totalLifetimeValue > 5000 && daysSinceFirst > 90) return 'stable';
    if (customer.lastInteraction &&
      (Date.now() - customer.lastInteraction.getTime()) > 60 * 24 * 60 * 60 * 1000) {
      return 'at-risk';
    }
    if (daysSinceFirst > 180 && customer.totalTransactions < 3) return 'churned';

    return 'stable';
  }

  /**
   * Calculate response rate
   */
  private calculateResponseRate(customer: any): number {
    const communications = customer.communicationHistory.filter(
      (c: any) => c.direction === 'outbound'
    );

    if (communications.length === 0) return 0;

    const responses = communications.filter(
      (c: any) => customer.communicationHistory.some(
        (r: any) => r.direction === 'inbound' &&
          Math.abs(r.timestamp.getTime() - c.timestamp.getTime()) < 24 * 60 * 60 * 1000
      )
    ).length;

    return responses / communications.length;
  }

  /**
   * Generate recommendations based on customer profile
   */
  private generateRecommendations(
    customer: any,
    engagementScore: number,
    riskLevel: 'low' | 'medium' | 'high'
  ): string[] {
    const recommendations: string[] = [];

    // Engagement-based
    if (engagementScore < 30) {
      recommendations.push('Re-engage customer with special offer');
    } else if (engagementScore > 70) {
      recommendations.push('Consider asking for referral or review');
    }

    // Risk-based
    if (riskLevel === 'high') {
      recommendations.push('Immediate outreach required - customer at risk');
      recommendations.push('Offer exclusive discount to retain customer');
    } else if (riskLevel === 'medium') {
      recommendations.push('Schedule check-in call within next 7 days');
    }

    // Cross-industry opportunities
    const otherIndustries = Object.keys(hojaiCore.getAllProducts()).filter(
      i => !customer.industries.includes(i as IndustryType)
    );

    if (customer.industries.length === 1 && customer.totalLifetimeValue > 1000) {
      recommendations.push(`Cross-sell opportunity: Introduce to ${otherIndustries[0]}`);
    }

    // High-value customer retention
    if (customer.totalLifetimeValue > 5000) {
      recommendations.push('VIP treatment: Personal outreach from account manager');
    }

    return recommendations;
  }

  /**
   * Create customer segment
   */
  async createSegment(data: {
    name: string;
    description: string;
    criteria: SegmentCriteria;
  }): Promise<CustomerSegment> {
    const customers = await this.getCustomersMatchingCriteria(data.criteria);

    const segment: CustomerSegment = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      criteria: data.criteria,
      customers: customers.map(c => c.id),
      metrics: this.calculateSegmentMetrics(customers)
    };

    this.segments.set(segment.id, segment);
    return segment;
  }

  /**
   * Get customers matching criteria
   */
  private async getCustomersMatchingCriteria(criteria: SegmentCriteria): Promise<any[]> {
    const allCustomers = await customer360Service.getAllCustomers();

    return allCustomers.filter(c => {
      if (criteria.minValue !== undefined && c.totalLifetimeValue < criteria.minValue) return false;
      if (criteria.maxValue !== undefined && c.totalLifetimeValue > criteria.maxValue) return false;
      if (criteria.industries && criteria.industries.length > 0) {
        const hasMatch = criteria.industries.some(i => c.industries.includes(i));
        if (!hasMatch) return false;
      }

      const profile = this.getCustomerProfileSync(c);
      if (criteria.riskLevel && profile?.riskLevel !== criteria.riskLevel) return false;
      if (criteria.lifetimeStage && profile?.lifetimeStage !== criteria.lifetimeStage) return false;

      return true;
    });
  }

  /**
   * Get customer profile synchronously
   */
  private getCustomerProfileSync(customer: any): Customer360Profile['overview'] | null {
    return {
      totalValue: customer.totalLifetimeValue,
      industryCount: customer.industries.length,
      engagementScore: 50,
      riskLevel: 'low',
      lifetimeStage: 'stable'
    };
  }

  /**
   * Calculate segment metrics
   */
  private calculateSegmentMetrics(customers: any[]): CustomerSegment['metrics'] {
    const totalValue = customers.reduce((sum, c) => sum + c.totalLifetimeValue, 0);
    const totalInteractions = customers.reduce((sum, c) => sum + c.communicationHistory.length, 0);

    return {
      count: customers.length,
      totalValue,
      avgValue: customers.length > 0 ? totalValue / customers.length : 0,
      avgInteractions: customers.length > 0 ? totalInteractions / customers.length : 0
    };
  }

  /**
   * Get customer journey
   */
  async getCustomerJourney(customerId: string): Promise<CustomerJourney | null> {
    const customer = await customer360Service.getCustomer(customerId);
    if (!customer) return null;

    const stages: JourneyStage[] = [];
    const industries = customer.industries;

    // Build journey from industry profiles
    for (const industry of industries) {
      const profile = customer.industryProfiles[industry];
      if (profile) {
        stages.push({
          timestamp: profile.lastTransaction,
          industry,
          action: `First ${industry} transaction`,
          value: profile.totalSpent
        });
      }
    }

    // Add communications to journey
    for (const comm of customer.communicationHistory) {
      stages.push({
        timestamp: comm.timestamp,
        industry: comm.industry || 'waitron' as IndustryType,
        action: `Communication via ${comm.channel}`,
        value: 0
      });
    }

    // Sort by timestamp
    stages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Calculate conversion path
    const conversionPath = stages
      .filter(s => s.industry)
      .map(s => s.industry);

    // Generate insights
    const insights: string[] = [];
    if (stages.length > 5) {
      insights.push('Highly engaged customer with extensive journey');
    }
    if (new Set(conversionPath).size > 3) {
      insights.push('Multi-industry customer - strong loyalty candidate');
    }

    return {
      customerId,
      stages,
      totalValue: customer.totalLifetimeValue,
      conversionPath,
      insights
    };
  }

  /**
   * Identify lookalike customers
   */
  async findLookalikes(customerId: string, limit: number = 5): Promise<any[]> {
    const targetCustomer = await customer360Service.getCustomer(customerId);
    if (!targetCustomer) return [];

    const allCustomers = await customer360Service.getAllCustomers();
    const similarities: Array<{ customer: any; score: number }> = [];

    for (const customer of allCustomers) {
      if (customer.id === customerId) continue;

      let similarityScore = 0;

      // Industry overlap
      const industryOverlap = customer.industries.filter(
        i => targetCustomer.industries.includes(i)
      ).length;
      similarityScore += industryOverlap * 20;

      // Value similarity
      const valueDiff = Math.abs(customer.totalLifetimeValue - targetCustomer.totalLifetimeValue);
      const maxValue = Math.max(targetCustomer.totalLifetimeValue, 1);
      if (valueDiff < maxValue * 0.2) similarityScore += 30;
      else if (valueDiff < maxValue * 0.5) similarityScore += 15;

      // Engagement similarity
      if (customer.communicationHistory.length > 0 && targetCustomer.communicationHistory.length > 0) {
        const ratio = customer.communicationHistory.length / targetCustomer.communicationHistory.length;
        if (ratio > 0.8 && ratio < 1.2) similarityScore += 20;
      }

      if (similarityScore > 30) {
        similarities.push({ customer, score: similarityScore });
      }
    }

    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.customer);
  }

  /**
   * Predict customer churn risk
   */
  async predictChurnRisk(customerId: string): Promise<{
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    factors: string[];
    retentionActions: string[];
  }> {
    const profile = await this.getCustomerProfile(customerId);
    if (!profile) {
      return {
        riskScore: 0,
        riskLevel: 'low',
        factors: ['No data available'],
        retentionActions: []
      };
    }

    let riskScore = 0;
    const factors: string[] = [];

    // Low engagement
    if (profile.overview.engagementScore < 40) {
      riskScore += 30;
      factors.push('Low engagement score');
    }

    // High value but at risk
    if (profile.overview.totalValue > 3000 && profile.overview.riskLevel !== 'low') {
      riskScore += 25;
      factors.push('High-value customer at risk');
    }

    // Long time since interaction
    if (profile.interactions.lastInteraction) {
      const daysSince = Math.floor(
        (Date.now() - profile.interactions.lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince > 60) {
        riskScore += 25;
        factors.push(`No interaction for ${daysSince} days`);
      }
    }

    // Single industry
    if (profile.crossIndustry.industries.length === 1) {
      riskScore += 15;
      factors.push('Single industry engagement - higher churn risk');
    }

    const riskLevel: 'low' | 'medium' | 'high' =
      riskScore >= 60 ? 'high' :
        riskScore >= 30 ? 'medium' : 'low';

    const retentionActions: string[] = [];
    if (riskLevel !== 'low') {
      retentionActions.push('Send personalized re-engagement email');
      retentionActions.push('Offer exclusive discount or upgrade');
      if (riskLevel === 'high') {
        retentionActions.push('Schedule immediate personal call');
        retentionActions.push('Consider account manager outreach');
      }
    }

    return { riskScore, riskLevel, factors, retentionActions };
  }

  /**
   * Generate personalized outreach
   */
  async generateOutreach(customerId: string, channel: 'email' | 'sms' | 'whatsapp'): Promise<{
    subject?: string;
    message: string;
    recommendedTime: Date;
    expectedResponseRate: number;
  }> {
    const profile = await this.getCustomerProfile(customerId);
    if (!profile) {
      return {
        message: 'Unable to generate outreach - customer not found',
        recommendedTime: new Date(),
        expectedResponseRate: 0
      };
    }

    let message = '';
    const subject = `Your ${profile.crossIndustry.favoriteIndustry} Benefits`;

    // Personalized message based on customer state
    if (profile.overview.riskLevel === 'high') {
      message = `Hi ${profile.customer.name}, we miss you! Here's an exclusive offer just for you:`;
    } else if (profile.overview.engagementScore > 70) {
      message = `Hi ${profile.customer.name}, thank you for being a valued customer! Check out what's new:`;
    } else {
      message = `Hi ${profile.customer.name}, we have something special for you:`;
    }

    // Add cross-sell opportunity if available
    if (profile.crossIndustry.industries.length < 3) {
      const otherIndustry = Object.keys(hojaiCore.getAllProducts())
        .find(i => !profile.crossIndustry.industries.includes(i as IndustryType));
      if (otherIndustry) {
        message += ` We've also added new features in our ${otherIndustry} service that you might love!`;
      }
    }

    // Determine best time to send
    const recommendedTime = this.calculateBestSendTime(profile);

    // Estimate response rate
    let expectedResponseRate = 0.2;
    if (profile.interactions.preferredChannel === channel) expectedResponseRate += 0.1;
    if (profile.customer.preferences.marketingOptIn) expectedResponseRate += 0.1;
    if (profile.overview.riskLevel === 'high') expectedResponseRate += 0.15;

    return {
      subject,
      message,
      recommendedTime,
      expectedResponseRate: Math.min(0.8, expectedResponseRate)
    };
  }

  /**
   * Calculate best time to send outreach
   */
  private calculateBestSendTime(profile: Customer360Profile): Date {
    const now = new Date();
    const preferredChannel = profile.interactions.preferredChannel;

    // Set to next morning 10 AM
    const bestTime = new Date(now);
    bestTime.setDate(bestTime.getDate() + 1);
    bestTime.setHours(10, 0, 0, 0);

    // Adjust based on channel
    if (preferredChannel === 'sms') {
      bestTime.setHours(9, 0, 0, 0);
    } else if (preferredChannel === 'email') {
      bestTime.setHours(10, 0, 0, 0);
    } else if (preferredChannel === 'whatsapp') {
      bestTime.setHours(11, 0, 0, 0);
    }

    return bestTime;
  }

  /**
   * Get all segments
   */
  async getSegments(): Promise<CustomerSegment[]> {
    return Array.from(this.segments.values());
  }

  /**
   * Update segment
   */
  async updateSegment(segmentId: string, updates: Partial<CustomerSegment>): Promise<CustomerSegment | null> {
    const segment = this.segments.get(segmentId);
    if (!segment) return null;

    const updated = { ...segment, ...updates };
    if (updates.criteria) {
      const customers = await this.getCustomersMatchingCriteria(updates.criteria);
      updated.customers = customers.map(c => c.id);
      updated.metrics = this.calculateSegmentMetrics(customers);
    }

    this.segments.set(segmentId, updated);
    return updated;
  }

  /**
   * Get agent status
   */
  getStatus(): { agentId: string; name: string; ready: boolean; totalCustomers: number; segments: number } {
    return {
      agentId: this.agentId,
      name: this.agentName,
      ready: true,
      totalCustomers: 0, // Would sync with customer service
      segments: this.segments.size
    };
  }
}

export const customerIntelligence = new CustomerIntelligenceAgent();