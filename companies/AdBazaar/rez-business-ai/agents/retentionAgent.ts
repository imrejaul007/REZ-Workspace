/**
 * REZ Business AI - Retention Agent
 */

import { BusinessIntelligence, AIAction, ActionType, MerchantConfig } from '../types';

export class RetentionAgent {
  async analyzeRetention(merchantId: string, config: MerchantConfig, intelligence: BusinessIntelligence): Promise<unknown[]> {
    const campaigns = [];
    
    for (const insight of intelligence.customerInsights) {
      if (insight.churnRisk === 'high') {
        campaigns.push({
          type: 'winback',
          segment: insight.segment,
          offer: { type: 'cashback', value: 20, expiryHours: 48 },
          channels: ['whatsapp', 'push'],
          urgency: 'high',
        });
      }
    }
    
    return campaigns;
  }

  createRetentionAction(campaign, merchantId: string, config: MerchantConfig): AIAction {
    return {
      id: `retention-${Date.now()}`,
      type: 'customer_reengagement' as ActionType,
      priority: campaign.urgency === 'high' ? 'high' : 'medium',
      status: 'pending',
      agent: 'retention-agent',
      merchantId,
      data: campaign,
      confidence: 0.85,
      reasoning: `Win-back campaign for ${campaign.segment}`,
      estimatedImpact: { revenue: 3000, customers: 30, conversionRate: 0.15, roi: 3.0, confidence: 0.85 },
      requiresApproval: config.approvalMode === 'suggestion',
      createdAt: new Date(),
    };
  }
}

export const retentionAgent = new RetentionAgent();
