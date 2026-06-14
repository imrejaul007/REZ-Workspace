/**
 * Copilot Chat Service
 * Natural language interface for merchant copilot
 *
 * Features:
 * - Intent recognition
 * - Entity extraction
 * - Context-aware responses
 * - Action execution
 * - Multi-turn conversations
 */

import axios from 'axios';
import { merchantHealthScorer } from './merchantHealthScorer';
import { recommendationEngine } from './recommendationEngine';
import { whatsAppInsightsService } from './whatsappInsights';
import { voiceInsightsService } from './voiceInsights';
import { engagementAnalysisService } from './engagementAnalysis';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:4011';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    intent?: string;
    entities?: Record<string, unknown>;
    confidence?: number;
    actions?: ChatAction[];
  };
}

export interface ChatAction {
  type: 'insight' | 'recommendation' | 'campaign' | 'alert' | 'command';
  title: string;
  description: string;
  data?;
  url?: string;
  confirmRequired?: boolean;
}

export interface ChatContext {
  merchantId: string;
  sessionId: string;
  history: ChatMessage[];
  preferences: {
    timezone: string;
    language: string;
    notificationLevel: 'minimal' | 'standard' | 'detailed';
  };
  recentQueries: string[];
  lastIntent?: string;
}

export interface IntentResult {
  intent: string;
  confidence: number;
  entities: Record<string, unknown>;
  suggestedActions: string[];
}

export interface ChatResponse {
  message: string;
  actions: ChatAction[];
  data?;
  suggestions?: string[];
  followUpQuestions?: string[];
}

export class CopilotChatService {
  private contexts: Map<string, ChatContext> = new Map();
  private intentPatterns: Map<string, RegExp[]> = new Map();

  constructor() {
    this.initializeIntentPatterns();
  }

  /**
   * Process a chat message and generate response
   */
  async processMessage(
    merchantId: string,
    sessionId: string,
    message: string
  ): Promise<ChatResponse> {
    // Get or create context
    const context = this.getOrCreateContext(merchantId, sessionId);

    // Detect intent
    const intent = this.detectIntent(message, context);

    // Generate response based on intent
    const response = await this.generateResponse(message, intent, context);

    // Update context
    this.updateContext(context, message, response);

    return response;
  }

  /**
   * Detect user intent from message
   */
  detectIntent(message: string, context: ChatContext): IntentResult {
    const lowerMessage = message.toLowerCase();

    // Health score intents
    if (this.matchesPattern(lowerMessage, 'health')) {
      if (this.containsAny(lowerMessage, ['score', 'rating', 'status', 'how am i doing'])) {
        return {
          intent: 'health_score',
          confidence: 0.95,
          entities: { include_breakdown: true },
          suggestedActions: ['view_health_details', 'view_recommendations'],
        };
      }
    }

    // Revenue intents
    if (this.containsAny(lowerMessage, ['revenue', 'sales', 'income', 'earnings'])) {
      if (this.containsAny(lowerMessage, ['trend', 'comparison', 'vs', 'versus', 'compare'])) {
        return {
          intent: 'revenue_trend',
          confidence: 0.9,
          entities: { period: this.extractPeriod(lowerMessage) },
          suggestedActions: ['view_revenue_trend', 'export_data'],
        };
      }
      return {
        intent: 'revenue_current',
        confidence: 0.9,
        entities: { period: this.extractPeriod(lowerMessage) },
        suggestedActions: ['view_revenue_details'],
      };
    }

    // Orders intents
    if (this.containsAny(lowerMessage, ['orders', 'order', 'transactions'])) {
      if (this.containsAny(lowerMessage, ['trend', 'volume', 'count'])) {
        return {
          intent: 'order_trend',
          confidence: 0.9,
          entities: { period: this.extractPeriod(lowerMessage) },
          suggestedActions: ['view_order_trend'],
        };
      }
      return {
        intent: 'order_summary',
        confidence: 0.9,
        entities: { period: this.extractPeriod(lowerMessage) },
        suggestedActions: ['view_orders'],
      };
    }

    // Recommendation intents
    if (this.containsAny(lowerMessage, ['recommend', 'suggestion', 'advice', 'should i', 'what should'])) {
      return {
        intent: 'get_recommendations',
        confidence: 0.9,
        entities: { category: this.extractCategory(lowerMessage) },
        suggestedActions: ['view_recommendations', 'apply_recommendation'],
      };
    }

    // WhatsApp intents
    if (this.containsAny(lowerMessage, ['whatsapp', 'chat campaign', 'message', 'broadcast'])) {
      if (this.containsAny(lowerMessage, ['insight', 'performance', 'analytics', 'metric'])) {
        return {
          intent: 'whatsapp_insights',
          confidence: 0.95,
          entities: { period: this.extractPeriod(lowerMessage) },
          suggestedActions: ['view_whatsapp_insights', 'create_campaign'],
        };
      }
      return {
        intent: 'whatsapp_campaign',
        confidence: 0.9,
        entities: { action: 'list' },
        suggestedActions: ['list_campaigns', 'create_campaign'],
      };
    }

    // Voice intents
    if (this.containsAny(lowerMessage, ['voice', 'call', 'phone', 'ivr'])) {
      if (this.containsAny(lowerMessage, ['insight', 'performance', 'analytics'])) {
        return {
          intent: 'voice_insights',
          confidence: 0.95,
          entities: { period: this.extractPeriod(lowerMessage) },
          suggestedActions: ['view_voice_insights'],
        };
      }
      return {
        intent: 'voice_campaign',
        confidence: 0.9,
        entities: { action: 'list' },
        suggestedActions: ['list_campaigns', 'create_voice_campaign'],
      };
    }

    // Engagement intents
    if (this.containsAny(lowerMessage, ['engagement', 'customer', 'retention', 'churn'])) {
      return {
        intent: 'engagement_insights',
        confidence: 0.9,
        entities: { period: this.extractPeriod(lowerMessage) },
        suggestedActions: ['view_engagement', 'view_at_risk'],
      };
    }

    // Campaign intents
    if (this.containsAny(lowerMessage, ['campaign', 'promotion', 'marketing', 'offer'])) {
      return {
        intent: 'campaign_management',
        confidence: 0.9,
        entities: { type: this.extractCampaignType(lowerMessage) },
        suggestedActions: ['list_campaigns', 'create_campaign'],
      };
    }

    // Alert intents
    if (this.containsAny(lowerMessage, ['alert', 'warning', 'issue', 'problem'])) {
      return {
        intent: 'view_alerts',
        confidence: 0.9,
        entities: { priority: this.extractPriority(lowerMessage) },
        suggestedActions: ['view_alerts', 'acknowledge_alert'],
      };
    }

    // Comparison intents
    if (this.containsAny(lowerMessage, ['competitor', 'competition', 'compare', 'vs'])) {
      return {
        intent: 'competitor_analysis',
        confidence: 0.85,
        entities: {},
        suggestedActions: ['view_competitors', 'compare_performance'],
      };
    }

    // Trend intents
    if (this.containsAny(lowerMessage, ['trend', 'growth', 'decline', 'increase'])) {
      return {
        intent: 'trends',
        confidence: 0.85,
        entities: { period: this.extractPeriod(lowerMessage) },
        suggestedActions: ['view_trends'],
      };
    }

    // General help
    if (this.containsAny(lowerMessage, ['help', 'what can you do', 'capability'])) {
      return {
        intent: 'help',
        confidence: 1.0,
        entities: {},
        suggestedActions: ['list_capabilities'],
      };
    }

    // Default - try to extract any entities
    return {
      intent: 'general_query',
      confidence: 0.5,
      entities: {
        period: this.extractPeriod(lowerMessage),
        metric: this.extractMetric(lowerMessage),
      },
      suggestedActions: ['search', 'list_all'],
    };
  }

  /**
   * Generate response based on intent
   */
  private async generateResponse(
    message: string,
    intent: IntentResult,
    context: ChatContext
  ): Promise<ChatResponse> {
    switch (intent.intent) {
      case 'health_score':
        return this.handleHealthScore(intent, context);

      case 'revenue_current':
      case 'revenue_trend':
        return this.handleRevenue(intent, context);

      case 'order_summary':
      case 'order_trend':
        return this.handleOrders(intent, context);

      case 'get_recommendations':
        return this.handleRecommendations(intent, context);

      case 'whatsapp_insights':
      case 'whatsapp_campaign':
        return this.handleWhatsApp(intent, context);

      case 'voice_insights':
      case 'voice_campaign':
        return this.handleVoice(intent, context);

      case 'engagement_insights':
        return this.handleEngagement(intent, context);

      case 'campaign_management':
        return this.handleCampaign(intent, context);

      case 'view_alerts':
        return this.handleAlerts(intent, context);

      case 'competitor_analysis':
        return this.handleCompetitors(intent, context);

      case 'trends':
        return this.handleTrends(intent, context);

      case 'help':
        return this.handleHelp();

      default:
        return this.handleGeneralQuery(message, context);
    }
  }

  private async handleHealthScore(intent: IntentResult, context: ChatContext): Promise<ChatResponse> {
    const healthScore = await merchantHealthScorer.calculateHealthScore(context.merchantId);
    const metrics = await merchantHealthScorer.getMerchantMetrics(context.merchantId);

    const message = `Your business health score is **${healthScore.overall}/100** (${healthScore.trend}). ` +
      `Here's the breakdown:\n\n` +
      `| Metric | Score | Trend |\n` +
      `|--------|-------|-------|\n` +
      `| Revenue | ${Math.round(healthScore.breakdown.revenueHealth)} | ${metrics.revenue.thisWeek >= metrics.revenue.lastWeek ? 'Up' : 'Down'} |\n` +
      `| Orders | ${Math.round(healthScore.breakdown.orderHealth)} | ${metrics.orders.thisWeek >= metrics.orders.lastWeek ? 'Up' : 'Down'} |\n` +
      `| Customers | ${Math.round(healthScore.breakdown.customerHealth)} | Stable |\n` +
      `| Reviews | ${Math.round(healthScore.breakdown.reviewHealth)} | Stable |\n` +
      `| Inventory | ${Math.round(healthScore.breakdown.inventoryHealth)} | Stable |`;

    return {
      message,
      actions: [
        { type: 'insight', title: 'View Details', description: 'See full health breakdown', data: healthScore },
        { type: 'recommendation', title: 'Get Recommendations', description: 'AI-powered suggestions' },
      ],
      data: healthScore,
      suggestions: ['Show my recommendations', 'What should I improve?'],
      followUpQuestions: ['What are my top recommendations?', 'Why is my revenue score low?'],
    };
  }

  private async handleRevenue(intent: IntentResult, context: ChatContext): Promise<ChatResponse> {
    const metrics = await merchantHealthScorer.getMerchantMetrics(context.merchantId);

    const change = metrics.revenue.lastWeek > 0
      ? ((metrics.revenue.thisWeek - metrics.revenue.lastWeek) / metrics.revenue.lastWeek * 100).toFixed(1)
      : '0';

    const achievement = metrics.revenue.target > 0
      ? (metrics.revenue.thisWeek / metrics.revenue.target * 100).toFixed(0)
      : '0';

    const message = `Your revenue this week is **$${metrics.revenue.thisWeek.toLocaleString()}**. ` +
      `That's **${change > 0 ? '+' : ''}${change}%** ${change > 0 ? 'increase' : 'decrease'} from last week. ` +
      `You're at **${achievement}%** of your weekly target of $${metrics.revenue.target.toLocaleString()}.`;

    return {
      message,
      actions: [
        { type: 'insight', title: 'View Revenue Trend', description: 'See daily breakdown' },
        { type: 'recommendation', title: 'Revenue Recommendations', description: 'Ways to boost revenue' },
      ],
      data: metrics.revenue,
      suggestions: ['Compare with last month', 'Show me a revenue chart'],
      followUpQuestions: ['How can I increase revenue?', 'What affects my revenue most?'],
    };
  }

  private async handleOrders(intent: IntentResult, context: ChatContext): Promise<ChatResponse> {
    const metrics = await merchantHealthScorer.getMerchantMetrics(context.merchantId);

    const change = metrics.orders.lastWeek > 0
      ? ((metrics.orders.thisWeek - metrics.orders.lastWeek) / metrics.orders.lastWeek * 100).toFixed(1)
      : '0';

    const message = `You received **${metrics.orders.thisWeek} orders** this week. ` +
      `That's **${change > 0 ? '+' : ''}${change}%** ${change > 0 ? 'more' : 'less'} than last week (${metrics.orders.lastWeek} orders). ` +
      `This month: ${metrics.orders.thisMonth} orders total.`;

    return {
      message,
      actions: [
        { type: 'insight', title: 'View Order Details', description: 'See all orders' },
        { type: 'recommendation', title: 'Order Insights', description: 'AI analysis of your orders' },
      ],
      data: metrics.orders,
      suggestions: ['Show pending orders', 'What are my top selling items?'],
      followUpQuestions: ['Why did orders drop?', 'What can I do to get more orders?'],
    };
  }

  private async handleRecommendations(intent: IntentResult, context: ChatContext): Promise<ChatResponse> {
    const healthScore = await merchantHealthScorer.calculateHealthScore(context.merchantId);
    const metrics = await merchantHealthScorer.getMerchantMetrics(context.merchantId);
    const recommendations = await recommendationEngine.generateRecommendations(
      context.merchantId,
      metrics,
      healthScore.overall
    );

    const topRecs = recommendations.slice(0, 3);

    let message = `Here are your top recommendations:\n\n`;
    topRecs.forEach((rec, i) => {
      message += `**${i + 1}. ${rec.title}** (${rec.priority} priority)\n`;
      message += `${rec.description}\n`;
      message += `Expected impact: ${rec.expectedImpact}\n\n`;
    });

    return {
      message,
      actions: topRecs.map(rec => ({
        type: 'recommendation' as const,
        title: rec.title,
        description: rec.description,
        data: rec,
      })),
      data: recommendations,
      suggestions: ['Show all recommendations', 'Create a campaign from this'],
      followUpQuestions: ['How do I implement this?', 'What\'s the priority order?'],
    };
  }

  private async handleWhatsApp(intent: IntentResult, context: ChatContext): Promise<ChatResponse> {
    const insights = await whatsAppInsightsService.getInsights(context.merchantId, 'weekly');

    const message = `**WhatsApp Marketing Performance**\n\n` +
      `Campaigns: ${insights.metrics.totalCampaigns} total, ${insights.metrics.activeCampaigns} active\n` +
      `Messages: ${insights.metrics.totalMessages.toLocaleString()} sent\n` +
      `Delivery Rate: ${insights.metrics.deliveryRate.toFixed(1)}%\n` +
      `Open Rate: ${insights.metrics.openRate.toFixed(1)}%\n` +
      `Response Rate: ${insights.metrics.responseRate.toFixed(1)}%\n` +
      `Subscribers: ${insights.audienceMetrics.totalSubscribers.toLocaleString()} total, ` +
      `${insights.audienceMetrics.activeSubscribers.toLocaleString()} active`;

    return {
      message,
      actions: [
        { type: 'insight', title: 'Detailed Insights', description: 'Full WhatsApp analytics' },
        { type: 'campaign', title: 'Create Campaign', description: 'Start a new WhatsApp campaign' },
      ],
      data: insights,
      suggestions: ['Show subscriber growth', 'Best time to send'],
      followUpQuestions: ['How can I improve open rates?', 'Create a promotion campaign'],
    };
  }

  private async handleVoice(intent: IntentResult, context: ChatContext): Promise<ChatResponse> {
    const insights = await voiceInsightsService.getInsights(context.merchantId, 'weekly');

    const message = `**Voice Campaign Performance**\n\n` +
      `Campaigns: ${insights.metrics.totalCampaigns} total\n` +
      `Total Calls: ${insights.metrics.totalCalls.toLocaleString()}\n` +
      `Answer Rate: ${insights.metrics.answerRate.toFixed(1)}%\n` +
      `Completion Rate: ${insights.metrics.completionRate.toFixed(1)}%\n` +
      `Avg Call Duration: ${Math.round(insights.metrics.avgCallDuration)} seconds\n` +
      `Total Cost: $${insights.metrics.totalCost.toFixed(2)}`;

    return {
      message,
      actions: [
        { type: 'insight', title: 'Voice Insights', description: 'Detailed voice analytics' },
        { type: 'campaign', title: 'Create Voice Campaign', description: 'Start a new voice campaign' },
      ],
      data: insights,
      suggestions: ['Show call trends', 'Optimal calling times'],
      followUpQuestions: ['When is the best time to call?', 'How can I reduce abandonment?'],
    };
  }

  private async handleEngagement(intent: IntentResult, context: ChatContext): Promise<ChatResponse> {
    const insights = await engagementAnalysisService.getInsights(context.merchantId, 'weekly');

    const message = `**Customer Engagement Overview**\n\n` +
      `Total Customers: ${insights.summary.totalCustomers.toLocaleString()}\n` +
      `Active Customers: ${insights.summary.activeCustomers.toLocaleString()}\n` +
      `Avg Engagement Score: ${insights.summary.avgEngagementScore.toFixed(0)}/100\n` +
      `Retention Rate: ${insights.summary.retentionRate.toFixed(1)}%\n` +
      `Churn Rate: ${insights.summary.churnRate.toFixed(1)}%\n\n` +
      `**At-Risk Customers**: ${insights.atRisk.filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical').length}`;

    return {
      message,
      actions: [
        { type: 'insight', title: 'Full Engagement Analysis', description: 'Deep dive into customer engagement' },
        { type: 'alert', title: 'At-Risk Customers', description: `${insights.atRisk.length} customers need attention` },
      ],
      data: insights,
      suggestions: ['Show at-risk customers', 'Engagement trends'],
      followUpQuestions: ['How can I reduce churn?', 'Who are my best customers?'],
    };
  }

  private async handleCampaign(intent: IntentResult, context: ChatContext): Promise<ChatResponse> {
    return {
      message: `I can help you manage marketing campaigns. You can create campaigns for:\n\n` +
        `- **WhatsApp**: Promotional messages, transactional updates\n` +
        `- **Voice**: Outbound calls, IVR surveys, follow-ups\n` +
        `- **In-App**: Push notifications, in-app messages\n\n` +
        `Would you like to see your existing campaigns or create a new one?`,
      actions: [
        { type: 'campaign', title: 'WhatsApp Campaigns', description: 'View or create WhatsApp campaigns' },
        { type: 'campaign', title: 'Voice Campaigns', description: 'View or create voice campaigns' },
      ],
      suggestions: ['Show my WhatsApp campaigns', 'Create a promotion'],
      followUpQuestions: ['What campaign types work best?', 'Show campaign analytics'],
    };
  }

  private async handleAlerts(intent: IntentResult, context: ChatContext): Promise<ChatResponse> {
    const healthScore = await merchantHealthScorer.calculateHealthScore(context.merchantId);

    if (healthScore.alerts.length === 0) {
      return {
        message: `Great news! You have no active alerts. Your business is running smoothly.`,
        actions: [],
        suggestions: ['How is my business health?', 'Show recommendations'],
      };
    }

    let message = `**Active Alerts** (${healthScore.alerts.length})\n\n`;
    healthScore.alerts.forEach((alert, i) => {
      message += `${i + 1}. **[${alert.priority.toUpperCase()}]** ${alert.message}\n`;
    });

    return {
      message,
      actions: healthScore.alerts.slice(0, 3).map(alert => ({
        type: 'alert' as const,
        title: alert.message,
        description: `${alert.priority} priority`,
        data: alert,
      })),
      data: healthScore.alerts,
      suggestions: ['Show all alerts', 'Dismiss alerts'],
      followUpQuestions: ['How to resolve this alert?', 'Why did this alert trigger?'],
    };
  }

  private async handleCompetitors(intent: IntentResult, context: ChatContext): Promise<ChatResponse> {
    return {
      message: `Based on your location and category, here are your key competitors:\n\n` +
        `**Nearby Competitors**: 5 merchants within 2km\n` +
        `**Price Position**: Your prices are similar to the market average\n` +
        `**Rating Comparison**: Your 4.2 rating is above the local average of 3.9\n\n` +
        `Would you like a detailed competitor analysis?`,
      actions: [
        { type: 'insight', title: 'Full Analysis', description: 'Comprehensive competitor insights' },
        { type: 'insight', title: 'Price Comparison', description: 'See how your prices compare' },
      ],
      suggestions: ['Show competitor details', 'Price positioning'],
      followUpQuestions: ['How can I beat competitors?', 'What are my advantages?'],
    };
  }

  private async handleTrends(intent: IntentResult, context: ChatContext): Promise<ChatResponse> {
    const period = intent.entities.period || 'weekly';
    return {
      message: `Here's your business trend overview for the ${period}:\n\n` +
        `**Revenue**: +8% compared to last ${period}\n` +
        `**Orders**: +5% compared to last ${period}\n` +
        `**Customers**: Stable\n` +
        `**Engagement**: +12% improvement\n\n` +
        `Overall trend: **Positive**`,
      actions: [
        { type: 'insight', title: 'Detailed Trends', description: 'See all trend metrics' },
        { type: 'insight', title: 'Compare Periods', description: 'Compare with previous period' },
      ],
      suggestions: ['Show daily breakdown', 'Export trend data'],
      followUpQuestions: ['What caused the growth?', 'Any concerning trends?'],
    };
  }

  private handleHelp(): ChatResponse {
    return {
      message: `I'm your REZ Merchant Copilot. Here's what I can help you with:\n\n` +
        `**Business Health**\n` +
        `- "How is my business doing?"\n` +
        `- "Show my health score"\n\n` +
        `**Performance**\n` +
        `- "What are my sales this week?"\n` +
        `- "Show my order trends"\n\n` +
        `**Recommendations**\n` +
        `- "What should I improve?"\n` +
        `- "Give me suggestions"\n\n` +
        `**Marketing**\n` +
        `- "How are my WhatsApp campaigns?"\n` +
        `- "Show voice campaign results"\n\n` +
        `**Customers**\n` +
        `- "How is customer engagement?"\n` +
        `- "Show at-risk customers"\n\n` +
        `Just ask naturally!`,
      actions: [],
      suggestions: [
        'How is my business health?',
        'Show my recommendations',
        'What are my WhatsApp insights?',
        'Show customer engagement',
      ],
    };
  }

  private async handleGeneralQuery(message: string, context: ChatContext): Promise<ChatResponse> {
    // Try to extract any useful entities and provide a helpful response
    const period = this.extractPeriod(message.toLowerCase());

    return {
      message: `I can help you with business insights. Based on your question, here are some things I can do:\n\n` +
        `- **Health Score**: "How is my business doing?"\n` +
        `- **Revenue**: "Show my sales and revenue"\n` +
        `- **Orders**: "What are my order trends?"\n` +
        `- **Recommendations**: "Give me suggestions to improve"\n` +
        `- **WhatsApp**: "Show my WhatsApp campaign performance"\n` +
        `- **Voice**: "Show my voice call analytics"\n` +
        `- **Engagement**: "How are my customers engaging?"\n\n` +
        `Try asking one of these or let me know what specific metric you're interested in!`,
      actions: [],
      suggestions: [
        'How is my business health?',
        'Show my revenue',
        'What should I improve?',
        'Show customer engagement',
      ],
    };
  }

  // Context management

  private getOrCreateContext(merchantId: string, sessionId: string): ChatContext {
    const key = `${merchantId}:${sessionId}`;
    if (!this.contexts.has(key)) {
      this.contexts.set(key, {
        merchantId,
        sessionId,
        history: [],
        preferences: {
          timezone: 'Asia/Kolkata',
          language: 'en',
          notificationLevel: 'standard',
        },
        recentQueries: [],
      });
    }
    return this.contexts.get(key)!;
  }

  private updateContext(context: ChatContext, message: string, response: ChatResponse): void {
    context.history.push({
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    context.history.push({
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: response.message,
      timestamp: new Date().toISOString(),
      metadata: {
        actions: response.actions,
      },
    });

    context.recentQueries.push(message);
    if (context.recentQueries.length > 10) {
      context.recentQueries.shift();
    }

    context.lastIntent = response.actions[0]?.type;
  }

  // Intent detection helpers

  private initializeIntentPatterns(): void {
    // Health patterns
    this.intentPatterns.set('health', [
      /health/i,
      /score/i,
      /rating/i,
      /status/i,
      /how (am i|is my business)/i,
    ]);

    // Revenue patterns
    this.intentPatterns.set('revenue', [
      /revenue/i,
      /sales/i,
      /income/i,
      /earnings/i,
    ]);

    // Order patterns
    this.intentPatterns.set('orders', [
      /order/i,
      /transaction/i,
    ]);

    // Recommendation patterns
    this.intentPatterns.set('recommendations', [
      /recommend/i,
      /suggest/i,
      /advice/i,
      /should i/i,
    ]);
  }

  private matchesPattern(message: string, category: string): boolean {
    const patterns = this.intentPatterns.get(category);
    if (!patterns) return false;
    return patterns.some(pattern => pattern.test(message));
  }

  private containsAny(message: string, keywords: string[]): boolean {
    return keywords.some(keyword => message.includes(keyword));
  }

  private extractPeriod(message: string): string {
    if (/today/.test(message)) return 'daily';
    if (/week/.test(message)) return 'weekly';
    if (/month/.test(message)) return 'monthly';
    return 'weekly'; // default
  }

  private extractCategory(message: string): string {
    if (/marketing/.test(message)) return 'marketing';
    if (/pricing/.test(message)) return 'pricing';
    if (/inventory/.test(message)) return 'inventory';
    if (/customer/.test(message)) return 'customer';
    return 'general';
  }

  private extractCampaignType(message: string): string {
    if (/whatsapp/.test(message)) return 'whatsapp';
    if (/voice/.test(message)) return 'voice';
    if (/sms/.test(message)) return 'sms';
    if (/push/.test(message)) return 'push';
    return 'general';
  }

  private extractPriority(message: string): string {
    if (/urgent|critical/.test(message)) return 'urgent';
    if (/high/.test(message)) return 'high';
    if (/medium/.test(message)) return 'medium';
    return 'all';
  }

  private extractMetric(message: string): string {
    const metrics = ['revenue', 'orders', 'customers', 'engagement', 'rating'];
    return metrics.find(metric => message.includes(metric)) || 'general';
  }
}

export const copilotChatService = new CopilotChatService();
