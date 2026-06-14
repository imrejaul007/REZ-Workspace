/**
 * REZ Business AI - Risk Engine
 *
 * AI-powered risk assessment and fraud prevention
 */

import { BusinessIntelligence } from '../types';

export interface RiskAssessment {
  actionId: string;
  risks: Risk[];
  overallScore: number; // 0-100, higher is riskier
  recommendation: 'approve' | 'review' | 'reject';
  warnings: string[];
}

export interface Risk {
  type: RiskType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-1
  impact: number; // 0-1
  description: string;
  mitigation?: string;
}

export type RiskType =
  | 'profit_impact'
  | 'fraud'
  | 'cashback_abuse'
  | 'overspend'
  | 'margin_violation'
  | 'inventory_shortage'
  | 'reputation'
  | 'compliance'
  | 'campaign_overlap'
  | 'customer_fatigue';

export interface ActionContext {
  type: 'pricing' | 'campaign' | 'cashback' | 'offer' | 'notification';
  params: Record<string, unknown>;
  merchantId: string;
  businessType: string;
  intelligence: BusinessIntelligence;
}

export class RiskEngine {
  /**
   * Assess risk for an action
   */
  assessRisk(context: ActionContext): RiskAssessment {
    const risks: Risk[] = [];

    // Calculate profit impact risk
    const profitRisk = this.assessProfitImpact(context);
    if (profitRisk) risks.push(profitRisk);

    // Calculate fraud risk
    const fraudRisk = this.assessFraudRisk(context);
    if (fraudRisk) risks.push(fraudRisk);

    // Calculate margin violation risk
    const marginRisk = this.assessMarginRisk(context);
    if (marginRisk) risks.push(marginRisk);

    // Calculate overspend risk
    const overspendRisk = this.assessOverspendRisk(context);
    if (overspendRisk) risks.push(overspendRisk);

    // Calculate customer fatigue risk
    const fatigueRisk = this.assessCustomerFatigue(context);
    if (fatigueRisk) risks.push(fatigueRisk);

    // Calculate campaign overlap risk
    const overlapRisk = this.assessCampaignOverlap(context);
    if (overlapRisk) risks.push(overlapRisk);

    // Calculate inventory risk
    const inventoryRisk = this.assessInventoryRisk(context);
    if (inventoryRisk) risks.push(inventoryRisk);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(risks);

    // Generate recommendation
    const recommendation = this.getRecommendation(overallScore, risks);

    // Collect warnings
    const warnings = risks
      .filter(r => r.severity === 'high' || r.severity === 'critical')
      .map(r => r.description);

    return {
      actionId: `action-${Date.now()}`,
      risks,
      overallScore,
      recommendation,
      warnings,
    };
  }

  /**
   * Assess profit impact risk
   */
  private assessProfitImpact(context: ActionContext): Risk | null {
    const currentMargin = context.intelligence.financialHealth?.profitMargin || 0.3;
    const discount = context.params?.discount || 0;

    if (discount > 40) {
      return {
        type: 'profit_impact',
        severity: 'critical',
        probability: 0.9,
        impact: 0.9,
        description: `High discount (${discount}%) may erode profit margin significantly`,
        mitigation: 'Cap discount at 30% or require approval',
      };
    }

    if (discount > 25 && currentMargin < 0.25) {
      return {
        type: 'profit_impact',
        severity: 'high',
        probability: 0.7,
        impact: 0.8,
        description: 'Discount combined with low margin could lead to losses',
        mitigation: 'Consider lower discount or shorter duration',
      };
    }

    if (discount > 15) {
      return {
        type: 'profit_impact',
        severity: 'medium',
        probability: 0.5,
        impact: 0.5,
        description: 'Moderate discount will reduce profit margins',
        mitigation: 'Monitor campaign ROI closely',
      };
    }

    return null;
  }

  /**
   * Assess fraud risk
   */
  private assessFraudRisk(context: ActionContext): Risk | null {
    const cashback = context.params?.cashback || context.params?.offerValue || 0;

    // High cashback attracts fraud
    if (cashback > 50) {
      return {
        type: 'fraud',
        severity: 'critical',
        probability: 0.6,
        impact: 0.9,
        description: 'High cashback value increases fraud risk',
        mitigation: 'Add redemption limits and user verification',
      };
    }

    // Check for suspicious patterns in competitors
    const competitorOffers = context.intelligence.competitorData?.[0]?.offers || [];
    if (competitorOffers.includes('suspicious')) {
      return {
        type: 'fraud',
        severity: 'high',
        probability: 0.4,
        impact: 0.7,
        description: 'Competitor offering suspicious deals - possible fraud ring nearby',
        mitigation: 'Verify customer identities',
      };
    }

    return null;
  }

  /**
   * Assess margin violation risk
   */
  private assessMarginRisk(context: ActionContext): Risk | null {
    const currentMargin = context.intelligence.financialHealth?.profitMargin || 0.3;
    const discount = context.params?.discount || 0;

    const projectedMargin = currentMargin * (1 - discount / 100);

    if (projectedMargin < 0.1) {
      return {
        type: 'margin_violation',
        severity: 'critical',
        probability: 0.95,
        impact: 0.95,
        description: `Projected margin (${(projectedMargin * 100).toFixed(0)}%) below minimum threshold`,
        mitigation: 'Do not proceed - margin violation',
      };
    }

    if (projectedMargin < 0.15) {
      return {
        type: 'margin_violation',
        severity: 'high',
        probability: 0.8,
        impact: 0.8,
        description: `Projected margin (${(projectedMargin * 100).toFixed(0)}%) below recommended minimum`,
        mitigation: 'Review and adjust discount',
      };
    }

    return null;
  }

  /**
   * Assess overspend risk
   */
  private assessOverspendRisk(context: ActionContext): Risk | null {
    const budget = context.params?.budget || 0;
    const cashFlow = context.intelligence.financialHealth?.cashFlow || 0;

    if (budget > cashFlow * 0.5) {
      return {
        type: 'overspend',
        severity: 'high',
        probability: 0.7,
        impact: 0.8,
        description: `Budget (₹${budget}) exceeds 50% of available cash flow`,
        mitigation: 'Reduce budget or stage spending',
      };
    }

    if (budget > cashFlow) {
      return {
        type: 'overspend',
        severity: 'critical',
        probability: 0.9,
        impact: 0.95,
        description: 'Campaign budget exceeds available cash flow',
        mitigation: 'Do not proceed - insufficient funds',
      };
    }

    return null;
  }

  /**
   * Assess customer fatigue risk
   */
  private assessCustomerFatigue(context: ActionContext): Risk | null {
    const recentCampaigns = context.intelligence.demandSignals?.filter(
      s => s.type === 'campaign_fatigue'
    ).length || 0;

    if (recentCampaigns > 3) {
      return {
        type: 'customer_fatigue',
        severity: 'high',
        probability: 0.8,
        impact: 0.6,
        description: 'Customers may be fatigued from recent campaigns',
        mitigation: 'Wait 3-5 days before next campaign',
      };
    }

    if (recentCampaigns > 1) {
      return {
        type: 'customer_fatigue',
        severity: 'medium',
        probability: 0.5,
        impact: 0.4,
        description: 'Recent campaigns may reduce engagement',
        mitigation: 'Consider different messaging or channels',
      };
    }

    return null;
  }

  /**
   * Assess campaign overlap risk
   */
  private assessCampaignOverlap(context: ActionContext): Risk | null {
    const currentOffers = context.intelligence.demandSignals?.filter(
      s => s.type === 'active_offer'
    ).length || 0;

    if (currentOffers > 2) {
      return {
        type: 'campaign_overlap',
        severity: 'medium',
        probability: 0.6,
        impact: 0.5,
        description: 'Multiple active campaigns may confuse customers',
        mitigation: 'Consolidate campaigns or stagger timings',
      };
    }

    return null;
  }

  /**
   * Assess inventory risk
   */
  private assessInventoryRisk(context: ActionContext): Risk | null {
    // Check for inventory shortage based on demand
    const demandSpike = context.intelligence.demandSignals?.find(
      s => s.type === 'demand_spike'
    );

    if (demandSpike && demandSpike.strength > 0.5) {
      return {
        type: 'inventory_shortage',
        severity: 'high',
        probability: 0.7,
        impact: 0.7,
        description: 'High demand spike expected - inventory may run out',
        mitigation: 'Pre-stock inventory before campaign launch',
      };
    }

    return null;
  }

  /**
   * Calculate overall risk score
   */
  private calculateOverallScore(risks: Risk[]): number {
    if (risks.length === 0) return 10; // Low risk

    // Weighted score based on severity
    const severityWeights = {
      low: 1,
      medium: 3,
      high: 6,
      critical: 10,
    };

    let totalScore = 0;
    let maxSeverity = 'low' as string;

    for (const risk of risks) {
      const score = severityWeights[risk.severity] * risk.probability * risk.impact;
      totalScore += score;

      if (severityWeights[risk.severity] > severityWeights[maxSeverity as keyof typeof severityWeights]) {
        maxSeverity = risk.severity;
      }
    }

    // Cap at 100
    const score = Math.min(Math.round(totalScore), 100);

    // Boost based on max severity
    if (maxSeverity === 'critical') return Math.max(score, 80);
    if (maxSeverity === 'high') return Math.max(score, 50);

    return score;
  }

  /**
   * Get recommendation based on score and risks
   */
  private getRecommendation(
    score: number,
    risks: Risk[]
  ): 'approve' | 'review' | 'reject' {
    // Critical risks = reject
    if (risks.some(r => r.severity === 'critical')) {
      return 'reject';
    }

    // High score = review
    if (score > 50) {
      return 'review';
    }

    // Medium score = review
    if (score > 25) {
      return 'review';
    }

    // Low score = approve
    return 'approve';
  }

  /**
   * Pre-flight check before execution
   */
  preFlightCheck(context: ActionContext): {
    passed: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check financial health
    if (context.intelligence.financialHealth?.healthScore < 30) {
      issues.push('Business health score is low - focus on stabilization first');
    }

    // Check cash flow
    if (context.intelligence.financialHealth?.cashFlow < 0) {
      issues.push('Negative cash flow - do not launch campaigns');
    }

    // Check margin
    if (context.intelligence.financialHealth?.profitMargin < 0.1) {
      issues.push('Profit margin critically low');
    }

    // Warnings
    if (context.intelligence.demandSignals.length === 0) {
      warnings.push('Limited demand data available - results may vary');
    }

    if (context.intelligence.competitorData.length === 0) {
      warnings.push('No competitor data - recommend manual review');
    }

    return {
      passed: issues.length === 0,
      issues,
      warnings,
    };
  }
}

export const riskEngine = new RiskEngine();
