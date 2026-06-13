import express from 'express';
import { crmSkills, skillDescriptions } from './skills/crm.skills';
import { CRMTools, crmTools } from './tools/crm.tools';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface AgentRequest {
  message: string;
  context?: {
    shopperId?: string;
    storeId?: string;
    productId?: string;
    campaignId?: string;
  };
}

export interface AgentResponse {
  message: string;
  actions?: string[];
  data?: any;
  confidence: number;
}

export class CRMAgent {
  private tools: CRMTools;
  private conversationHistory: AgentMessage[] = [];

  constructor() {
    this.tools = new CRMTools();
  }

  async processMessage(request: AgentRequest): Promise<AgentResponse> {
    const { message, context } = request;
    logger.info(`Processing message: ${message}`);

    this.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    const intent = this.identifyIntent(message);
    let response: AgentResponse;

    switch (intent) {
      case 'customer_profile':
        response = await this.handleCustomerProfile(message, context);
        break;
      case 'loyalty':
        response = await this.handleLoyalty(message, context);
        break;
      case 'segmentation':
        response = await this.handleSegmentation(message);
        break;
      case 'campaign':
        response = await this.handleCampaign(message, context);
        break;
      case 'abandoned_cart':
        response = await this.handleAbandonedCart(message, context);
        break;
      case 'churn':
        response = await this.handleChurn(message, context);
        break;
      case 'metrics':
        response = await this.handleMetrics(message);
        break;
      default:
        response = await this.handleGeneralQuery(message);
    }

    this.conversationHistory.push({
      role: 'assistant',
      content: response.message,
      timestamp: new Date().toISOString(),
    });

    return response;
  }

  private identifyIntent(message: string): string {
    const lower = message.toLowerCase();

    if (lower.includes('customer') && (lower.includes('profile') || lower.includes('info') || lower.includes('about'))) {
      return 'customer_profile';
    }
    if (lower.includes('loyalty') || lower.includes('points') || lower.includes('tier') || lower.includes('reward')) {
      return 'loyalty';
    }
    if (lower.includes('segment') || lower.includes('group') || lower.includes('target')) {
      return 'segmentation';
    }
    if (lower.includes('campaign') || lower.includes('email') || lower.includes('marketing')) {
      return 'campaign';
    }
    if (lower.includes('abandon') || lower.includes('cart') || lower.includes('recovery')) {
      return 'abandoned_cart';
    }
    if (lower.includes('churn') || lower.includes('at risk') || lower.includes('win-back')) {
      return 'churn';
    }
    if (lower.includes('metric') || lower.includes('kpi') || lower.includes('report')) {
      return 'metrics';
    }
    return 'general';
  }

  private async handleCustomerProfile(message: string, context?: any): Promise<AgentResponse> {
    if (context?.shopperId) {
      const insights = await this.tools.executeTool('get_customer_insights', { shopperId: context.shopperId });

      return {
        message: `Customer insights for this shopper: Lifetime value: $${insights.lifetimeValue.toFixed(2)}. Average order: $${insights.averageOrderValue.toFixed(2)}. Purchase frequency: ${insights.purchaseFrequency} orders. Last purchase: ${insights.daysSinceLastPurchase} days ago. Churn risk: ${insights.churnRisk}. Recommended actions: ${insights.recommendedActions.join(', ')}.`,
        actions: ['get_customer_insights'],
        data: insights,
        confidence: 0.90,
      };
    }

    return {
      message: 'Please provide a customer ID to get their profile information.',
      actions: [],
      data: null,
      confidence: 0.5,
    };
  }

  private async handleLoyalty(message: string, context?: any): Promise<AgentResponse> {
    const lower = message.toLowerCase();

    if (context?.shopperId) {
      if (lower.includes('status') || lower.includes('info')) {
        const loyalty = await this.tools.executeTool('get_loyalty_status', { shopperId: context.shopperId });
        return {
          message: `Loyalty status: ${loyalty.tier} tier with ${loyalty.points.toLocaleString()} points (worth $${loyalty.pointsValue.toFixed(2)}). Benefits: ${loyalty.benefits.join(', ')}.`,
          actions: ['get_loyalty_status'],
          data: loyalty,
          confidence: 0.95,
        };
      }

      const awardMatch = message.match(/(\d+)\s*points?/i);
      if (awardMatch && (lower.includes('award') || lower.includes('give') || lower.includes('add'))) {
        const points = parseInt(awardMatch[1]);
        const updated = await this.tools.executeTool('award_loyalty_points', { shopperId: context.shopperId, points });
        return {
          message: `Successfully awarded ${points} loyalty points. New balance: ${updated.loyaltyPoints} points.`,
          actions: ['award_loyalty_points'],
          data: updated,
          confidence: 0.95,
        };
      }
    }

    const metrics = await this.tools.executeTool('get_crm_metrics', {});
    return {
      message: `I can help with loyalty management. Your customers have an average retention rate of ${metrics.averageRetentionRate}%. Would you like me to check a specific customer's loyalty status or award points?`,
      actions: ['get_loyalty_status', 'award_loyalty_points'],
      data: null,
      confidence: 0.85,
    };
  }

  private async handleSegmentation(message: string): Promise<AgentResponse> {
    const segments = await this.tools.executeTool('identify_customer_segments', {});

    const segmentSummary = segments.map((s: any) =>
      `${s.name}: ${s.customerCount} customers, avg order $${s.averageOrderValue.toFixed(2)}, $${s.totalRevenue.toLocaleString()} revenue`
    ).join('. ');

    return {
      message: `I identified ${segments.length} customer segments: ${segmentSummary}`,
      actions: ['identify_customer_segments'],
      data: segments,
      confidence: 0.88,
    };
  }

  private async handleCampaign(message: string, context?: any): Promise<AgentResponse> {
    const lower = message.toLowerCase();

    if (context?.campaignId && (lower.includes('performance') || lower.includes('analyze'))) {
      const analysis = await this.tools.executeTool('analyze_campaign_performance', { campaignId: context.campaignId });
      return {
        message: `Campaign performance: ${analysis.reach.toLocaleString()} reached, ${analysis.engagement.toLocaleString()} engaged, ${analysis.conversions.toLocaleString()} conversions. Revenue: $${analysis.revenue.toLocaleString()}. ROI: ${analysis.roi}%.`,
        actions: ['analyze_campaign_performance'],
        data: analysis,
        confidence: 0.90,
      };
    }

    if (lower.includes('list') || lower.includes('show') || lower.includes('all')) {
      const campaigns = await this.tools.executeTool('get_campaigns', {});
      return {
        message: `You have ${campaigns.length} campaigns. ${campaigns.map((c: any) => `"${c.name}" (${c.status}): ${c.sentCount} sent`).join('. ')}`,
        actions: ['get_campaigns'],
        data: campaigns,
        confidence: 0.95,
      };
    }

    return {
      message: 'I can help you manage campaigns. I can create new campaigns, list existing ones, or analyze campaign performance.',
      actions: ['create_campaign', 'get_campaigns', 'analyze_campaign_performance'],
      data: null,
      confidence: 0.85,
    };
  }

  private async handleAbandonedCart(message: string, context?: any): Promise<AgentResponse> {
    const lower = message.toLowerCase();

    if (context?.shopperId && context?.basketId && lower.includes('send')) {
      const result = await this.tools.executeTool('send_abandoned_cart_recovery', {
        shopperId: context.shopperId,
        basketId: context.basketId,
      });
      return {
        message: `Abandoned cart recovery sent. Email: ${result.emailSent ? 'sent' : 'not sent'}. SMS: ${result.smsSent ? 'sent' : 'not sent'}. Recovery link: ${result.recoveryLink}`,
        actions: ['send_abandoned_cart_recovery'],
        data: result,
        confidence: 0.90,
      };
    }

    const abandonedCarts = await this.tools.executeTool('identify_abandoned_carts', {});
    return {
      message: `Found ${abandonedCarts.length} abandoned carts. These represent potential revenue if recovered.`,
      actions: ['identify_abandoned_carts', 'send_abandoned_cart_recovery'],
      data: abandonedCarts,
      confidence: 0.88,
    };
  }

  private async handleChurn(message: string, context?: any): Promise<AgentResponse> {
    if (!context?.shopperId) {
      return {
        message: 'Please provide a customer ID to analyze churn risk.',
        actions: [],
        data: null,
        confidence: 0.5,
      };
    }

    const churnAnalysis = await this.tools.executeTool('predict_churn_risk', { shopperId: context.shopperId });

    return {
      message: `Churn analysis: Risk level is ${churnAnalysis.riskLevel} (score: ${churnAnalysis.riskScore}/100). Key factors: ${churnAnalysis.factors.join(', ')}. Recommended actions: ${churnAnalysis.recommendedActions.join(', ')}.`,
      actions: ['predict_churn_risk'],
      data: churnAnalysis,
      confidence: 0.86,
    };
  }

  private async handleMetrics(message: string): Promise<AgentResponse> {
    const metrics = await this.tools.executeTool('get_crm_metrics', {});

    return {
      message: `CRM Metrics: ${metrics.totalCustomers.toLocaleString()} total customers, ${metrics.activeCustomers.toLocaleString()} active. Average lifetime value: $${metrics.averageLifetimeValue.toFixed(2)}. Retention rate: ${metrics.averageRetentionRate}%. NPS: ${metrics.netPromoterScore}. Email open rate: ${metrics.emailOpenRate}%, click rate: ${metrics.emailClickRate}%. Abandoned cart recovery: ${metrics.abandonedCartRecoveryRate}%.`,
      actions: ['get_crm_metrics'],
      data: metrics,
      confidence: 0.95,
    };
  }

  private async handleGeneralQuery(message: string): Promise<AgentResponse> {
    const lower = message.toLowerCase();

    if (lower.includes('help') || lower.includes('what can you do')) {
      return {
        message: `I'm a CRM assistant. Here's what I can help you with:\n${Object.entries(skillDescriptions).map(([skill, desc]) => `- ${desc}`).join('\n')}`,
        actions: [],
        data: crmSkills,
        confidence: 1.0,
      };
    }

    return {
      message: "I'm a CRM assistant. I can help you manage customer relationships, loyalty programs, marketing campaigns, abandoned cart recovery, and churn prediction. How can I help you today?",
      actions: [],
      data: null,
      confidence: 0.7,
    };
  }

  getSkills() {
    return crmSkills;
  }

  getTools() {
    return this.tools.getToolDefinitions();
  }

  getConversationHistory() {
    return this.conversationHistory;
  }
}
