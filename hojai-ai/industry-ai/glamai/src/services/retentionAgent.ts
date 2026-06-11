/**
 * GLAMAI - Retention Agent Service
 * Salon AI Operating System
 *
 * AI Employee: Handles churn prediction, re-engagement campaigns, and loyalty upgrades.
 */

import { Customer, Appointment, Service } from '../models';
import { AI_EMPLOYEES, LOYALTY } from '../config';
import { RetentionAnalysis, RetentionRecommendation, RiskLevel, CustomerProfile } from '../types';
import { logger } from '../middleware/logger';

/**
 * Retention Agent Service Class
 */
export class RetentionAgentService {
  /**
   * Analyze customer retention risk
   */
  async analyzeRetentionRisk(customerId: string): Promise<{
    customer: CustomerProfile;
    analysis: RetentionAnalysis;
    recommendations: RetentionRecommendation[];
  }> {
    logger.info('Retention Agent: Analyzing customer', { customerId });

    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const analysis = this.performRetentionAnalysis(customer);
    const recommendations = this.generateRecommendations(analysis, customer);

    logger.info('Retention Agent: Analysis complete', {
      customerId,
      riskLevel: analysis.riskLevel,
      riskScore: analysis.riskScore,
    });

    const customerProfile: CustomerProfile = {
      id: customer._id.toString(),
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      loyaltyTier: customer.loyaltyTier,
      totalSpent: customer.totalSpent,
      visits: customer.visits,
      lastVisit: customer.lastVisit,
      preferences: customer.preferences,
    };

    return {
      customer: customerProfile,
      analysis,
      recommendations,
    };
  }

  /**
   * Perform retention analysis on a customer
   */
  private performRetentionAnalysis(customer: any): RetentionAnalysis {
    const now = new Date();
    const lastVisit = customer.lastVisit ? new Date(customer.lastVisit) : null;
    const daysSinceVisit = lastVisit
      ? Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    let riskLevel: RiskLevel = 'low';
    let riskScore = 0;

    // Days since last visit (40% weight)
    if (daysSinceVisit > 90) {
      riskScore += 40;
      riskLevel = 'critical';
    } else if (daysSinceVisit > 60) {
      riskScore += 30;
      riskLevel = 'high';
    } else if (daysSinceVisit > 30) {
      riskScore += 20;
      riskLevel = 'medium';
    } else if (daysSinceVisit > 14) {
      riskScore += 10;
    }

    // Visit frequency (20% weight)
    if (customer.visits < 2) {
      riskScore += 15;
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // Total spent (20% weight)
    if (customer.totalSpent < 500) {
      riskScore += 10;
    } else if (customer.totalSpent > 5000) {
      riskScore -= 10; // Reduce risk for high spenders
    }

    // Loyalty tier (20% weight)
    if (customer.loyaltyTier === 'bronze') {
      riskScore += 10;
    }

    // Normalize risk score
    riskScore = Math.min(Math.max(riskScore, 0), 100);

    // Calculate churn probability (same as risk score for simplicity)
    const churnProbability = riskScore;

    // Engagement score (inverse of risk)
    const engagementScore = Math.max(100 - riskScore, 0);

    return {
      riskLevel,
      riskScore,
      daysSinceVisit,
      engagementScore,
      churnProbability,
    };
  }

  /**
   * Generate retention recommendations based on analysis
   */
  private generateRecommendations(
    analysis: RetentionAnalysis,
    customer: any
  ): RetentionRecommendation[] {
    const recommendations: RetentionRecommendation[] = [];

    if (analysis.riskLevel === 'critical') {
      recommendations.push({
        action: 'immediate_reengagement',
        priority: 'urgent',
        expectedImpact: 'high',
        aiMessage: `We haven't seen you in ${analysis.daysSinceVisit} days! Here's an exclusive offer to bring you back: 30% off your next service. Your loyalty matters to us!`,
      });
      recommendations.push({
        action: 'personal_outreach',
        priority: 'high',
        expectedImpact: 'medium',
        aiMessage: 'Recommendation: Personal call from salon manager to reconnect and understand any concerns.',
      });
      recommendations.push({
        action: 'free_addon',
        priority: 'medium',
        expectedImpact: 'medium',
        aiMessage: 'Offer a free add-on service (e.g., free nail polish touch-up) on their next visit.',
      });
    } else if (analysis.riskLevel === 'high') {
      recommendations.push({
        action: 'winback_campaign',
        priority: 'high',
        expectedImpact: 'high',
        aiMessage: `It's been ${analysis.daysSinceVisit} days! Enjoy 25% off to refresh your look. Limited time offer!`,
      });
      recommendations.push({
        action: 'personalized_offer',
        priority: 'medium',
        expectedImpact: 'medium',
        aiMessage: 'Based on your preferences, we recommend trying our new massage service with a special discount!',
      });
    } else if (analysis.riskLevel === 'medium') {
      const nextTier = this.getNextTier(customer.loyaltyTier);
      if (nextTier) {
        recommendations.push({
          action: 'loyalty_upgrade',
          priority: 'medium',
          expectedImpact: 'medium',
          aiMessage: `You're almost at ${nextTier} tier! Book 2 more visits to unlock exclusive benefits!`,
        });
      }
      recommendations.push({
        action: 'new_service_announcement',
        priority: 'low',
        expectedImpact: 'low',
        aiMessage: 'Check out our new Spa treatments - perfect for your next relaxation session!',
      });
    } else {
      recommendations.push({
        action: 'referral_program',
        priority: 'low',
        expectedImpact: 'medium',
        aiMessage: 'Love our services? Refer a friend and both of you get 15% off!',
      });
      recommendations.push({
        action: 'engagement_promo',
        priority: 'low',
        expectedImpact: 'low',
        aiMessage: 'Book your next appointment in advance and get a complimentary nail polish change!',
      });
    }

    return recommendations;
  }

  /**
   * Get next loyalty tier
   */
  private getNextTier(currentTier: string): string | null {
    const tiers = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = tiers.indexOf(currentTier);
    if (currentIndex < tiers.length - 1) {
      return LOYALTY.TIERS[tiers[currentIndex + 1] as keyof typeof LOYALTY.TIERS].name;
    }
    return null;
  }

  /**
   * Get all at-risk customers
   */
  async getAtRiskCustomers(): Promise<any[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get customers who haven't visited in 30+ days
    const atRiskCustomers = await Customer.find({
      $or: [
        { lastVisit: { $lt: thirtyDaysAgo } },
        { lastVisit: null },
      ],
    }).sort({ lastVisit: 1 });

    // Add risk scores to each customer
    return atRiskCustomers.map(customer => ({
      ...customer.toObject(),
      analysis: this.performRetentionAnalysis(customer),
    }));
  }

  /**
   * Get customers eligible for loyalty upgrade
   */
  async getEligibleForUpgrade(): Promise<any[]> {
    const customers = await Customer.find({}).sort({ totalSpent: -1 });

    return customers.filter(customer => {
      const tier = customer.loyaltyTier;
      const spent = customer.totalSpent;

      // Check if customer qualifies for next tier
      if (tier === 'bronze' && spent >= 2000) return true;
      if (tier === 'silver' && spent >= 5000) return true;
      if (tier === 'gold' && spent >= 10000) return true;

      return false;
    });
  }

  /**
   * Batch analyze multiple customers
   */
  async batchAnalyze(customerIds: string[]): Promise<any[]> {
    const results = await Promise.all(
      customerIds.map(async id => {
        try {
          const result = await this.analyzeRetentionRisk(id);
          return { customerId: id, ...result, error: null };
        } catch (error: any) {
          return { customerId: id, error: error.message };
        }
      })
    );

    return results;
  }

  /**
   * Get retention statistics
   */
  async getRetentionStats(): Promise<{
    totalCustomers: number;
    atRiskCount: number;
    healthyCount: number;
    churnRate: number;
    averageEngagement: number;
  }> {
    const totalCustomers = await Customer.countDocuments();
    const atRiskCustomers = await this.getAtRiskCustomers();
    const atRiskCount = atRiskCustomers.length;
    const healthyCount = totalCustomers - atRiskCount;

    // Calculate average engagement score
    const allCustomers = await Customer.find({});
    let totalEngagement = 0;
    for (const customer of allCustomers) {
      const analysis = this.performRetentionAnalysis(customer);
      totalEngagement += analysis.engagementScore;
    }
    const averageEngagement = totalCustomers > 0 ? totalEngagement / totalCustomers : 0;

    return {
      totalCustomers,
      atRiskCount,
      healthyCount,
      churnRate: totalCustomers > 0 ? (atRiskCount / totalCustomers) * 100 : 0,
      averageEngagement: Math.round(averageEngagement),
    };
  }

  /**
   * Send re-engagement campaign to at-risk customers
   */
  async sendReEngagementCampaign(): Promise<{
    sentCount: number;
    campaignId: string;
  }> {
    const atRiskCustomers = await this.getAtRiskCustomers();
    const criticalCustomers = atRiskCustomers.filter(c => c.analysis.riskLevel === 'critical');

    logger.info('Retention Agent: Sending re-engagement campaign', {
      totalAtRisk: atRiskCustomers.length,
      critical: criticalCustomers.length,
    });

    // In production, this would integrate with notification service
    return {
      sentCount: criticalCustomers.length,
      campaignId: `reengagement_${Date.now()}`,
    };
  }
}

export default new RetentionAgentService();