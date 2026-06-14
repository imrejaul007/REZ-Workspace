/**
 * ReZ Agent - AI Agent Service
 */

import { Conversation, IConversation, Message, AgentKnowledge, IAgentKnowledge } from '../models/Conversation';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:4062';

export interface AgentConfig {
  shop: string;
  tenantId: string;
  brandId: string;
  greeting?: string;
  workingHours?: { start: string; end: string; timezone: string };
  escalationEmail?: string;
  quickReplies?: string[];
}

export class AgentService {
  /**
   * Start new conversation
   */
  static async startConversation(data: {
    shop: string;
    tenantId: string;
    brandId: string;
    customerId?: string;
    customerEmail?: string;
    platform?: 'web' | 'whatsapp' | 'instagram' | 'facebook';
    greeting?: string;
  }): Promise<IConversation> {
    const conversationId = `conv_${Date.now()}_${uuidv4().substr(0, 8)}`;

    const greeting = data.greeting || 'Hi! How can I help you today?';

    const conversation = await Conversation.create({
      conversationId,
      shop: data.shop.toLowerCase(),
      tenantId: data.tenantId,
      brandId: data.brandId,
      customerId: data.customerId,
      customerEmail: data.customerEmail,
      platform: data.platform || 'web',
      status: 'active',
      messages: [
        {
          id: uuidv4(),
          type: 'bot',
          content: greeting,
          timestamp: new Date(),
        },
      ],
    });

    return conversation;
  }

  /**
   * Process customer message
   */
  static async processMessage(data: {
    conversationId: string;
    message: string;
    attachments?: string[];
  }): Promise<{ response: string; quickReplies?: string[]; intent?: string; confidence?: number }> {
    const conversation = await Conversation.findOne({ conversationId: data.conversationId });
    if (!conversation) throw new Error('Conversation not found');

    // Add customer message
    const customerMessage: Message = {
      id: uuidv4(),
      type: 'customer',
      content: data.message,
      timestamp: new Date(),
      attachments: data.attachments,
    };
    conversation.messages.push(customerMessage);

    // Detect intent
    const intentResult = await this.detectIntent(data.message);

    // Get response
    let response: string;
    let quickReplies: string[] | undefined;

    if (intentResult.confidence > 0.7) {
      // High confidence - use knowledge base
      const knowledgeResponse = await this.getKnowledgeResponse(
        conversation.shop,
        intentResult.intent
      );

      if (knowledgeResponse) {
        response = knowledgeResponse.answer;
        conversation.context.intent = intentResult.intent;
      } else {
        // Use AI
        response = await this.getAIResponse(conversation, data.message);
      }
    } else if (intentResult.confidence > 0.4) {
      // Medium confidence - ask for clarification
      response = `I understand you need help with ${intentResult.intent}. Could you provide more details?`;
      quickReplies = ['Order status', 'Product inquiry', 'Return request', 'Talk to human'];
    } else {
      // Low confidence - escalate or generic response
      response = "I'm not sure I understand. Could you rephrase your question?";
      quickReplies = ['Track my order', 'Return an item', 'Change password', 'Talk to support'];
    }

    // Update conversation
    const botMessage: Message = {
      id: uuidv4(),
      type: 'bot',
      content: response,
      timestamp: new Date(),
      quickReplies,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
    };
    conversation.messages.push(botMessage);
    await conversation.save();

    return { response, quickReplies, intent: intentResult.intent, confidence: intentResult.confidence };
  }

  /**
   * Detect message intent
   */
  private static async detectIntent(message: string): Promise<{ intent: string; confidence: number }> {
    const intents = [
      { pattern: /order|track|delivery|shipping/i, intent: 'order_status', confidence: 0.9 },
      { pattern: /return|refund|exchange/i, intent: 'return_request', confidence: 0.9 },
      { pattern: /cancel|cancellation/i, intent: 'cancel_order', confidence: 0.9 },
      { pattern: /payment|pay|bill/i, intent: 'payment_issue', confidence: 0.8 },
      { pattern: /product|item|stock|availability/i, intent: 'product_inquiry', confidence: 0.8 },
      { pattern: /discount|coupon|offer|promo/i, intent: 'discount_query', confidence: 0.8 },
      { pattern: /account|login|password|forgot/i, intent: 'account_issue', confidence: 0.8 },
      { pattern: /hello|hi|hey|help/i, intent: 'greeting', confidence: 0.6 },
    ];

    for (const intent of intents) {
      if (intent.pattern.test(message)) {
        return { intent: intent.intent, confidence: intent.confidence };
      }
    }

    // Fallback to AI
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/classify`, {
        text: message,
        shop: 'default',
      });
      return { intent: response.data.intent, confidence: response.data.confidence };
    } catch {
      return { intent: 'unknown', confidence: 0.2 };
    }
  }

  /**
   * Get response from knowledge base
   */
  private static async getKnowledgeResponse(
    shop: string,
    intent: string
  ): Promise<IAgentKnowledge | null> {
    const knowledge = await AgentKnowledge.findOne({
      shop: shop.toLowerCase(),
      active: true,
      $or: [
        { keywords: intent },
        { question: { $regex: intent, $options: 'i' } },
      ],
    });

    return knowledge;
  }

  /**
   * Get AI response
   */
  private static async getAIResponse(
    conversation: IConversation,
    message: string
  ): Promise<string> {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/chat`, {
        messages: conversation.messages.map(m => ({
          role: m.type === 'bot' ? 'assistant' : 'user',
          content: m.content,
        })),
        context: {
          shop: conversation.shop,
          tenantId: conversation.tenantId,
          customerId: conversation.customerId,
        },
      });

      return response.data.message;
    } catch (error) {
      console.error('AI service error:', error);
      return "I'm having trouble processing that. Let me connect you with a support agent.";
    }
  }

  /**
   * Escalate to human agent
   */
  static async escalate(conversationId: string, reason?: string): Promise<void> {
    await Conversation.findOneAndUpdate(
      { conversationId },
      {
        status: 'escalated',
        'context.intent': reason,
      }
    );
    // In production, notify agents via email/Slack
  }

  /**
   * Resolve conversation
   */
  static async resolve(conversationId: string): Promise<void> {
    await Conversation.findOneAndUpdate(
      { conversationId },
      {
        status: 'resolved',
        resolvedAt: new Date(),
      }
    );
  }

  /**
   * Add knowledge base entry
   */
  static async addKnowledge(data: {
    shop: string;
    tenantId: string;
    category: 'faq' | 'product' | 'policy' | 'troubleshooting';
    question: string;
    answer: string;
    keywords?: string[];
  }): Promise<IAgentKnowledge> {
    const keywords = data.keywords || this.extractKeywords(data.question);

    return AgentKnowledge.create({
      ...data,
      shop: data.shop.toLowerCase(),
      keywords,
    });
  }

  /**
   * Extract keywords from text
   */
  private static extractKeywords(text: string): string[] {
    const stopWords = ['a', 'an', 'the', 'is', 'are', 'was', 'were', 'what', 'how', 'why', 'when'];
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(w => w.length > 3 && !stopWords.includes(w));
  }

  /**
   * Get conversation analytics
   */
  static async getAnalytics(shop: string): Promise<{
    totalConversations: number;
    activeConversations: number;
    resolvedConversations: number;
    escalatedConversations: number;
    avgResponseTime: number;
    topIntents: Record<string, number>;
  }> {
    const [conversations, active, resolved, escalated] = await Promise.all([
      Conversation.countDocuments({ shop: shop.toLowerCase() }),
      Conversation.countDocuments({ shop: shop.toLowerCase(), status: 'active' }),
      Conversation.countDocuments({ shop: shop.toLowerCase(), status: 'resolved' }),
      Conversation.countDocuments({ shop: shop.toLowerCase(), status: 'escalated' }),
    ]);

    const intents = await Conversation.aggregate([
      { $match: { shop: shop.toLowerCase() } },
      { $unwind: '$messages' },
      { $match: { 'messages.type': 'bot', 'messages.intent': { $exists: true } } },
      { $group: { _id: '$messages.intent', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const topIntents: Record<string, number> = {};
    intents.forEach(i => { topIntents[i._id] = i.count; });

    return {
      totalConversations: conversations,
      activeConversations: active,
      resolvedConversations: resolved,
      escalatedConversations: escalated,
      avgResponseTime: 45, // seconds
      topIntents,
    };
  }
}
