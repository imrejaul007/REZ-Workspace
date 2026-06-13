import express from 'express';
import { pricingSkills, skillDescriptions } from './skills/pricing.skills';
import { PricingTools, pricingTools } from './tools/pricing.tools';
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
  };
}

export interface AgentResponse {
  message: string;
  actions?: string[];
  data?: any;
  confidence: number;
}

export class PricingAgent {
  private tools: PricingTools;
  private conversationHistory: AgentMessage[] = [];

  constructor() {
    this.tools = new PricingTools();
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
      case 'price_optimization':
        response = await this.handlePriceOptimization(message, context);
        break;
      case 'promotion':
        response = await this.handlePromotion(message, context);
        break;
      case 'markdown':
        response = await this.handleMarkdown(message, context);
        break;
      case 'competitive':
        response = await this.handleCompetitivePricing(message, context);
        break;
      case 'margin':
        response = await this.handleMarginAnalysis(message);
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

    if (lower.includes('price') && (lower.includes('optimize') || lower.includes('change') || lower.includes('adjust'))) {
      return 'price_optimization';
    }
    if (lower.includes('promotion') || lower.includes('sale') || lower.includes('discount') || lower.includes('deal')) {
      return 'promotion';
    }
    if (lower.includes('markdown') || lower.includes('mark down') || lower.includes('clearance')) {
      return 'markdown';
    }
    if (lower.includes('competitor') || lower.includes('competition')) {
      return 'competitive';
    }
    if (lower.includes('margin') || lower.includes('profit')) {
      return 'margin';
    }
    return 'general';
  }

  private async handlePriceOptimization(message: string, context?: any): Promise<AgentResponse> {
    if (context?.productId) {
      const recommendation = await this.tools.executeTool('calculate_optimal_price', {
        productId: context.productId,
      });

      return {
        message: `Based on my analysis, I recommend changing the price from $${recommendation.currentPrice} to $${recommendation.recommendedPrice} (${recommendation.priceChangePercent > 0 ? '+' : ''}${recommendation.priceChangePercent}%). This should ${recommendation.priceChange > 0 ? 'improve margins' : 'increase competitiveness'}. Expected revenue impact: $${recommendation.expectedImpact.revenueChange.toFixed(2)}.`,
        actions: ['calculate_optimal_price'],
        data: recommendation,
        confidence: recommendation.confidence,
      };
    }

    const metrics = await this.tools.executeTool('get_pricing_metrics', {});
    return {
      message: `Here are your current pricing metrics: ${metrics.totalProducts} products, ${metrics.productsAboveTarget} above margin target, ${metrics.productsBelowTarget} below target. Average margin: ${metrics.averageMargin.toFixed(1)}%.`,
      actions: ['get_pricing_metrics'],
      data: metrics,
      confidence: 0.90,
    };
  }

  private async handlePromotion(message: string, context?: any): Promise<AgentResponse> {
    const lower = message.toLowerCase();

    if (lower.includes('create') || lower.includes('new')) {
      return {
        message: 'I can help you create a new promotion. Please provide the promotion details including name, type (percentage, fixed, bogo, or bundle), value, start date, and end date.',
        actions: [],
        data: null,
        confidence: 0.5,
      };
    }

    if (lower.includes('active')) {
      const promotions = await this.tools.executeTool('get_active_promotions', {});
      return {
        message: `You have ${promotions.length} active promotions. ${promotions.map((p: any) => `${p.name}: ${p.value}% off`).join('. ')}`,
        actions: ['get_active_promotions'],
        data: promotions,
        confidence: 0.95,
      };
    }

    if (lower.includes('performance') || lower.includes('analyze')) {
      const promotions = await this.tools.executeTool('get_active_promotions', {});
      if (promotions.length > 0) {
        const analysis = await this.tools.executeTool('analyze_promotion_performance', { promotionId: promotions[0].id });
        return {
          message: `Promotion "${promotions[0].name}" performance: $${analysis.revenueGenerated.toLocaleString()} revenue, ${analysis.unitsSold} units sold, ${analysis.conversionLift}% conversion lift.`,
          actions: ['analyze_promotion_performance'],
          data: analysis,
          confidence: 0.90,
        };
      }
    }

    const promotions = await this.tools.executeTool('get_active_promotions', {});
    return {
      message: `I can help you manage promotions. You have ${promotions.length} active promotions. Would you like to create a new promotion, check active promotions, or analyze performance?`,
      actions: ['get_active_promotions'],
      data: promotions,
      confidence: 0.85,
    };
  }

  private async handleMarkdown(message: string, context?: any): Promise<AgentResponse> {
    if (context?.productId) {
      const markdown = await this.tools.executeTool('calculate_markdown_depth', {
        productId: context.productId,
        daysRemaining: 30,
      });

      return {
        message: `For this product, I recommend a ${markdown.recommendedMarkdown}% markdown. Here's the staged approach: ${markdown.stages.map((s: any) => `Day ${s.day}: ${s.discount}% off = $${s.price}`).join(', ')}. Projected sell-through: ${markdown.projectedSellThrough}%.`,
        actions: ['calculate_markdown_depth'],
        data: markdown,
        confidence: 0.85,
      };
    }

    const candidates = await this.tools.executeTool('identify_markdown_candidates', { threshold: 60 });
    return {
      message: `I identified ${candidates.length} products that may benefit from markdowns. These items have been in stock for extended periods. Would you like details on any specific product?`,
      actions: ['identify_markdown_candidates'],
      data: candidates,
      confidence: 0.85,
    };
  }

  private async handleCompetitivePricing(message: string, context?: any): Promise<AgentResponse> {
    if (context?.productId) {
      const prices = await this.tools.executeTool('track_competitor_prices', {
        productIds: [context.productId],
      });

      return {
        message: `Competitor analysis for this product: Market average is $${prices[0]?.marketAverage}. Your price: $${prices[0]?.yourPrice}. Competitor prices range from $${Math.min(...(prices[0]?.competitorPrices || []).map((c: any) => c.price))} to $${Math.max(...(prices[0]?.competitorPrices || []).map((c: any) => c.price))}.`,
        actions: ['track_competitor_prices'],
        data: prices[0],
        confidence: 0.82,
      };
    }

    return {
      message: 'I can help you track competitor prices. Please provide a product ID to analyze.',
      actions: [],
      data: null,
      confidence: 0.5,
    };
  }

  private async handleMarginAnalysis(message: string): Promise<AgentResponse> {
    const metrics = await this.tools.executeTool('get_pricing_metrics', {});

    return {
      message: `Margin analysis: Average margin across all products is ${metrics.averageMargin.toFixed(1)}%. ${metrics.productsAboveTarget} products are above your target margin, while ${metrics.productsBelowTarget} are below. Consider reviewing products below target for potential price increases or cost reductions.`,
      actions: ['get_pricing_metrics'],
      data: metrics,
      confidence: 0.90,
    };
  }

  private async handleGeneralQuery(message: string): Promise<AgentResponse> {
    const lower = message.toLowerCase();

    if (lower.includes('help') || lower.includes('what can you do')) {
      return {
        message: `I'm a pricing management assistant. Here's what I can help you with:\n${Object.entries(skillDescriptions).map(([skill, desc]) => `- ${desc}`).join('\n')}`,
        actions: [],
        data: pricingSkills,
        confidence: 1.0,
      };
    }

    return {
      message: "I'm a pricing management assistant. I can help you optimize prices, manage promotions, handle markdowns, track competitor prices, and analyze margins. How can I help you today?",
      actions: [],
      data: null,
      confidence: 0.7,
    };
  }

  getSkills() {
    return pricingSkills;
  }

  getTools() {
    return this.tools.getToolDefinitions();
  }

  getConversationHistory() {
    return this.conversationHistory;
  }
}
