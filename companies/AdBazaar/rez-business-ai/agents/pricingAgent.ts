/**
 * REZ Business AI - Pricing Agent
 */

import { BusinessIntelligence, AIAction, ActionType, MerchantConfig, ImpactEstimate } from '../types';

interface PricingDecision {
  productId: string;
  currentPrice: number;
  recommendedPrice: number;
  reason: string;
  confidence: number;
  validUntil: Date;
  triggers: string[];
}

export class PricingAgent {
  async analyzePricing(merchantId: string, config: MerchantConfig, intelligence: BusinessIntelligence): Promise<PricingDecision[]> {
    const decisions: PricingDecision[] = [];
    
    // Weather-based pricing
    if (intelligence.weatherImpact) {
      const weatherAdj = intelligence.weatherImpact.expectedDemandChange;
      if (Math.abs(weatherAdj) > 0.05) {
        decisions.push({
          productId: 'dynamic-product',
          currentPrice: 100,
          recommendedPrice: Math.round(100 * (1 + weatherAdj * 0.1) * 100) / 100,
          reason: `Weather impact: ${intelligence.weatherImpact.condition}`,
          confidence: 0.8,
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
          triggers: ['weather'],
        });
      }
    }
    
    // Event-based pricing
    for (const event of intelligence.eventImpact) {
      decisions.push({
        productId: 'event-special',
        currentPrice: 100,
        recommendedPrice: Math.round(100 * (1 + event.expectedBoost * 0.5) * 100) / 100,
        reason: `Event: ${event.event}`,
        confidence: 0.85,
        validUntil: event.date,
        triggers: ['event'],
      });
    }
    
    return decisions;
  }

  createPricingAction(decision: PricingDecision, merchantId: string, config: MerchantConfig): AIAction {
    return {
      id: `pricing-${Date.now()}`,
      type: 'pricing_adjustment' as ActionType,
      priority: 'medium',
      status: 'pending',
      agent: 'pricing-agent',
      merchantId,
      data: {
        productId: decision.productId,
        currentPrice: decision.currentPrice,
        newPrice: decision.recommendedPrice,
        reason: decision.reason,
      },
      confidence: decision.confidence,
      reasoning: decision.reason,
      estimatedImpact: {
        revenue: decision.recommendedPrice * 1.1,
        customers: 10,
        conversionRate: 0.05,
        roi: 2.0,
        confidence: decision.confidence,
      },
      requiresApproval: config.approvalMode === 'suggestion',
      createdAt: new Date(),
    };
  }
}

export const pricingAgent = new PricingAgent();
