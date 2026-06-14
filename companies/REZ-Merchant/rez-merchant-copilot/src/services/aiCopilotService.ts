/**
 * AI Copilot Service with LLM Integration
 * Enhanced merchant AI assistant with RAG, context, and actions
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import mongoose, { Schema, Document } from 'mongoose';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  merchantId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  summary?: string; // For context window management
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
}

export interface Attachment {
  type: 'image' | 'document' | 'spreadsheet';
  url: string;
  name: string;
}

export interface AIInsight {
  id: string;
  merchantId: string;
  type: 'sales' | 'inventory' | 'customer' | 'staff' | 'general';
  title: string;
  description: string;
  suggestion: string;
  actionItems?: string[];
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  read: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolExecution {
  tool: string;
  input: Record<string, any>;
  output?: any;
  error?: string;
  duration: number;
}

// ── MongoDB Models ─────────────────────────────────────────────────────────────

const ConversationSchema = new Schema({
  merchantId: { type: String, required: true, index: true },
  messages: [{
    id: String,
    role: { type: String, enum: ['user', 'assistant', 'system'] },
    content: String,
    timestamp: Date,
    attachments: [{
      type: String,
      url: String,
      name: String,
    }],
  }],
  summary: String,
}, { timestamps: true });

const AIInsightSchema = new Schema({
  merchantId: { type: String, required: true, index: true },
  type: { type: String, enum: ['sales', 'inventory', 'customer', 'staff', 'general'] },
  title: { type: String, required: true },
  description: String,
  suggestion: String,
  actionItems: [String],
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  read: { type: Boolean, default: false },
}, { timestamps: true });

export const ConversationModel = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
export const AIInsightModel = mongoose.models.AIInsight || mongoose.model('AIInsight', AIInsightSchema);

// ── Tool Definitions ─────────────────────────────────────────────────────────────

const TOOLS: ToolDefinition[] = [
  {
    name: 'get_merchant_stats',
    description: 'Get merchant statistics including sales, orders, and customers',
    parameters: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['today', 'week', 'month', 'year'] },
        metric: { type: 'string', enum: ['sales', 'orders', 'customers', 'all'] },
      },
      required: ['period'],
    },
  },
  {
    name: 'get_top_products',
    description: 'Get top selling products for a period',
    parameters: {
      type: 'object',
      properties: {
        period: { type: 'string' },
        limit: { type: 'number', default: 10 },
        category: { type: 'string' },
      },
    },
  },
  {
    name: 'get_low_stock_items',
    description: 'Get inventory items that are running low',
    parameters: {
      type: 'object',
      properties: {
        storeId: { type: 'string' },
        threshold: { type: 'number' },
      },
    },
  },
  {
    name: 'search_customers',
    description: 'Search for customers by name, phone, or email',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number', default: 10 },
      },
      required: ['query'],
    },
  },
  {
    name: 'create_order',
    description: 'Create a new order for a customer',
    parameters: {
      type: 'object',
      properties: {
        customerId: { type: 'string' },
        storeId: { type: 'string' },
        items: { type: 'array' },
        paymentMethod: { type: 'string' },
      },
      required: ['customerId', 'storeId', 'items'],
    },
  },
  {
    name: 'send_notification',
    description: 'Send a notification to a customer',
    parameters: {
      type: 'object',
      properties: {
        customerId: { type: 'string' },
        channel: { type: 'string', enum: ['sms', 'whatsapp', 'email', 'push'] },
        message: { type: 'string' },
      },
      required: ['customerId', 'channel', 'message'],
    },
  },
  {
    name: 'get_ai_insights',
    description: 'Get AI-generated insights for the merchant',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['sales', 'inventory', 'customer', 'staff', 'all'] },
        limit: { type: 'number', default: 5 },
      },
    },
  },
];

// ── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are REZ Copilot, an AI business assistant for merchants using the REZ Merchant OS platform.

Your role is to help merchants:
1. Understand their business performance through analytics
2. Make data-driven decisions
3. Automate routine tasks
4. Improve customer experience
5. Optimize operations

You have access to tools that can:
- Query merchant statistics and analytics
- Search products and inventory
- Find customer information
- Create orders
- Send notifications
- Generate insights

Guidelines:
- Be helpful, concise, and actionable
- Present data in easy-to-understand formats
- Suggest specific next steps when possible
- Ask clarifying questions if needed
- Use Hindi/Hinglish when the user prefers

When using tools:
- Always explain what you're doing
- Format the results nicely
- Connect insights to business impact

Current date: ${new Date().toISOString().split('T')[0]}`;

// ── AI Copilot Service ─────────────────────────────────────────────────────

class AICopilotService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private model: 'openai' | 'anthropic' = 'openai';
  private readonly MAX_CONTEXT_MESSAGES = 20;
  private readonly CONTEXT_SUMMARY_THRESHOLD = 15;

  constructor() {
    this.initializeClients();
  }

  /**
   * Initialize LLM clients
   */
  private initializeClients(): void {
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    // Initialize Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    if (!this.openai && !this.anthropic) {
      console.warn('[AI Copilot] No LLM API keys configured - using mock responses');
    }
  }

  /**
   * Set preferred model
   */
  setModel(model: 'openai' | 'anthropic'): void {
    if (model === 'openai' && !this.openai) {
      throw new Error('OpenAI not configured');
    }
    if (model === 'anthropic' && !this.anthropic) {
      throw new Error('Anthropic not configured');
    }
    this.model = model;
  }

  /**
   * Start or continue a conversation
   */
  async chat(
    merchantId: string,
    message: string,
    conversationId?: string
  ): Promise<{ response: string; conversationId: string; toolCalls?: ToolExecution[] }> {
    // Get or create conversation
    let conversation = conversationId
      ? await ConversationModel.findOne({ _id: conversationId })
      : null;

    if (!conversation) {
      conversation = new ConversationModel({
        merchantId,
        messages: [],
      });
    }

    // Add user message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    conversation.messages.push(userMessage);

    // Summarize if context is too long
    if (conversation.messages.length > this.MAX_CONTEXT_MESSAGES) {
      conversation.summary = await this.summarizeConversation(conversation.messages.slice(0, -this.CONTEXT_SUMMARY_THRESHOLD));
      conversation.messages = conversation.messages.slice(-this.CONTEXT_SUMMARY_THRESHOLD);
    }

    // Build context with tools
    const context = await this.buildContext(merchantId, conversation);

    // Generate response
    const { response, toolCalls } = await this.generateResponse(
      context,
      conversation.summary ? [...conversation.messages, { role: 'system' as const, content: `Previous conversation summary: ${conversation.summary}` }] : conversation.messages
    );

    // Add assistant message
    const assistantMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };
    conversation.messages.push(assistantMessage);
    conversation.updatedAt = new Date();

    await conversation.save();

    return {
      response,
      conversationId: conversation._id.toString(),
      toolCalls,
    };
  }

  /**
   * Build context with merchant data
   */
  private async buildContext(merchantId: string, conversation: Conversation): Promise<string> {
    // Get recent stats
    const stats = await this.getMerchantStats(merchantId, 'week');

    // Get any pending insights
    const insights = await AIInsightModel.find({
      merchantId,
      read: false,
    }).limit(3).lean();

    let context = `\n\nCurrent Merchant Stats (Last 7 days):\n`;
    context += `- Total Sales: ₹${stats.totalSales.toLocaleString()}\n`;
    context += `- Total Orders: ${stats.totalOrders}\n`;
    context += `- Average Order Value: ₹${stats.avgOrderValue.toLocaleString()}\n`;
    context += `- New Customers: ${stats.newCustomers}\n`;

    if (insights.length > 0) {
      context += `\nActionable Insights:\n`;
      insights.forEach((insight: any) => {
        context += `- ${insight.title}: ${insight.suggestion}\n`;
      });
    }

    return context;
  }

  /**
   * Get merchant statistics
   */
  private async getMerchantStats(merchantId: string, period: string): Promise<{
    totalSales: number;
    totalOrders: number;
    avgOrderValue: number;
    newCustomers: number;
  }> {
    // This would query the merchant service
    // Mock implementation
    return {
      totalSales: 125000,
      totalOrders: 450,
      avgOrderValue: 277,
      newCustomers: 25,
    };
  }

  /**
   * Generate AI response
   */
  private async generateResponse(
    context: string,
    messages: Message[]
  ): Promise<{ response: string; toolCalls: ToolExecution[] }> {
    const fullSystemPrompt = SYSTEM_PROMPT + context;

    if (this.model === 'openai' && this.openai) {
      return this.generateOpenAIResponse(fullSystemPrompt, messages);
    } else if (this.anthropic) {
      return this.generateAnthropicResponse(fullSystemPrompt, messages);
    }

    // Fallback mock response
    return {
      response: this.generateMockResponse(messages[messages.length - 1]?.content || ''),
      toolCalls: [],
    };
  }

  /**
   * Generate OpenAI response
   */
  private async generateOpenAIResponse(
    systemPrompt: string,
    messages: Message[]
  ): Promise<{ response: string; toolCalls: ToolExecution[] }> {
    const toolCalls: ToolExecution[] = [];

    const response = await this.openai!.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        })),
      ],
      tools: TOOLS.map((tool) => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      })),
      tool_choice: 'auto',
      temperature: 0.7,
    });

    const message = response.choices[0]?.message;

    // Handle tool calls
    if (message?.tool_calls && message.tool_calls.length > 0) {
      for (const call of message.tool_calls) {
        const startTime = Date.now();
        try {
          const result = await this.executeTool(call.function.name, JSON.parse(call.function.arguments));
          toolCalls.push({
            tool: call.function.name,
            input: JSON.parse(call.function.arguments),
            output: result,
            duration: Date.now() - startTime,
          });
        } catch (error) {
          toolCalls.push({
            tool: call.function.name,
            input: JSON.parse(call.function.arguments),
            error: error instanceof Error ? error.message : 'Tool execution failed',
            duration: Date.now() - startTime,
          });
        }
      }

      // Continue with tool results
      const continuationResponse = await this.openai!.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content,
          })),
          message as any,
          ...toolCalls.map((tc) => ({
            role: 'tool' as const,
            tool_call_id: `call_${tc.tool}_${Date.now()}`,
            content: tc.output ? JSON.stringify(tc.output) : tc.error || 'Error',
          })),
        ],
        temperature: 0.7,
      });

      return {
        response: continuationResponse.choices[0]?.message?.content || 'I apologize, but I encountered an issue.',
        toolCalls,
      };
    }

    return {
      response: message?.content || 'I apologize, but I encountered an issue.',
      toolCalls,
    };
  }

  /**
   * Generate Anthropic response
   */
  private async generateAnthropicResponse(
    systemPrompt: string,
    messages: Message[]
  ): Promise<{ response: string; toolCalls: ToolExecution[] }> {
    const toolCalls: ToolExecution[] = [];

    const response = await this.anthropic!.messages.create({
      model: 'claude-sonnet-4-20250514',
      system: systemPrompt,
      max_tokens: 1024,
      messages: messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      tools: TOOLS.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters,
      })),
    });

    // Handle tool use
    const toolUseContent = response.content.find((block: any) => block.type === 'tool_use');
    if (toolUseContent) {
      const result = await this.executeTool(toolUseContent.name, toolUseContent.input);
      toolCalls.push({
        tool: toolUseContent.name,
        input: toolUseContent.input,
        output: result,
        duration: 0,
      });

      // Continue with result
      const continuationResponse = await this.anthropic!.messages.create({
        model: 'claude-sonnet-4-20250514',
        system: systemPrompt,
        max_tokens: 1024,
        messages: [
          ...messages.map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
          response.content[0] as any,
          {
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: toolUseContent.id,
              content: JSON.stringify(result),
            }],
          },
        ],
      });

      const textContent = continuationResponse.content.find((block: any) => block.type === 'text');
      return {
        response: textContent?.text || 'I encountered an issue processing your request.',
        toolCalls,
      };
    }

    const textContent = response.content.find((block: any) => block.type === 'text');
    return {
      response: textContent?.text || 'I encountered an issue.',
      toolCalls,
    };
  }

  /**
   * Execute a tool
   */
  private async executeTool(name: string, args: Record<string, any>): Promise<any> {
    switch (name) {
      case 'get_merchant_stats':
        return this.getMerchantStats(args.merchantId || '', args.period);
      case 'get_top_products':
        return this.getTopProducts(args.storeId, args.limit, args.category);
      case 'get_low_stock_items':
        return this.getLowStockItems(args.storeId, args.threshold);
      case 'search_customers':
        return this.searchCustomers(args.query, args.limit);
      case 'create_order':
        return { success: true, orderId: `ORD_${Date.now()}` };
      case 'send_notification':
        return { success: true, sent: true };
      case 'get_ai_insights':
        return this.getInsights(args.merchantId, args.type, args.limit);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * Get top products
   */
  private async getTopProducts(storeId?: string, limit = 10, category?: string): Promise<any[]> {
    // Mock implementation
    return [
      { name: 'Butter Chicken', quantity: 145, revenue: 14500 },
      { name: 'Naan', quantity: 230, revenue: 4600 },
      { name: 'Paneer Tikka', quantity: 98, revenue: 8820 },
      { name: 'Biryani', quantity: 87, revenue: 10440 },
      { name: 'Lassi', quantity: 156, revenue: 3120 },
    ].slice(0, limit);
  }

  /**
   * Get low stock items
   */
  private async getLowStockItems(storeId?: string, threshold = 10): Promise<any[]> {
    // Mock implementation
    return [
      { sku: 'CHK001', name: 'Chicken Breast', current: 5, reorderPoint: 15 },
      { sku: 'OIL001', name: 'Cooking Oil', current: 3, reorderPoint: 10 },
    ];
  }

  /**
   * Search customers
   */
  private async searchCustomers(query: string, limit = 10): Promise<any[]> {
    // Mock implementation
    return [
      { id: 'C001', name: 'Rahul Sharma', phone: '+919876543210', totalOrders: 15 },
      { id: 'C002', name: 'Priya Patel', phone: '+919876543211', totalOrders: 8 },
    ];
  }

  /**
   * Get AI insights
   */
  private async getInsights(merchantId: string, type?: string, limit = 5): Promise<any[]> {
    return AIInsightModel.find({
      merchantId,
      ...(type && type !== 'all' ? { type } : {}),
    }).limit(limit).lean();
  }

  /**
   * Summarize conversation for context window management
   */
  private async summarizeConversation(messages: Message[]): Promise<string> {
    if (this.model === 'openai' && this.openai) {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Summarize this conversation briefly in 2-3 sentences. Focus on key topics and any important decisions or actions.' },
          ...messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
        max_tokens: 100,
      });
      return response.choices[0]?.message?.content || '';
    }

    return `Conversation with ${messages.length} messages about merchant analytics and operations.`;
  }

  /**
   * Generate mock response
   */
  private generateMockResponse(input: string): string {
    const lower = input.toLowerCase();

    if (lower.includes('sales') || lower.includes('revenue')) {
      return 'Based on your recent data, your sales have increased by 12% compared to last week. Your top-selling items are Butter Chicken and Naan. Would you like me to show more detailed analytics?';
    }

    if (lower.includes('stock') || lower.includes('inventory')) {
      return 'I found 3 items that are running low:\n- Chicken Breast: 5 units left (Reorder at 15)\n- Cooking Oil: 3 units left (Reorder at 10)\n- Tomato Sauce: 8 units left (Reorder at 12)\n\nShould I create purchase orders for these items?';
    }

    if (lower.includes('customer')) {
      return 'You have 25 new customers this week! Your top customers by order count are Rahul Sharma (15 orders) and Priya Patel (8 orders). Shall I pull up their complete history?';
    }

    return `I've analyzed your request about "${input.substring(0, 50)}...". Here's what I found: Your business is performing well. Would you like specific recommendations for improving sales, managing inventory, or enhancing customer experience?`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INSIGHTS GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate periodic insights for a merchant
   */
  async generateInsights(merchantId: string): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Get stats
    const weeklyStats = await this.getMerchantStats(merchantId, 'week');
    const monthlyStats = await this.getMerchantStats(merchantId, 'month');

    // Sales insights
    if (weeklyStats.totalSales > monthlyStats.totalSales / 4) {
      insights.push({
        id: `ins_${Date.now()}`,
        merchantId,
        type: 'sales',
        title: 'Strong Sales Week',
        description: `Sales are up this week at ₹${weeklyStats.totalSales.toLocaleString()}`,
        suggestion: 'Consider staffing up for the next few days to handle increased demand.',
        actionItems: ['Review inventory levels', 'Alert staff about busy period'],
        priority: 'medium',
        createdAt: new Date(),
        read: false,
      });
    }

    // Low stock insight
    const lowStock = await this.getLowStockItems(undefined, 10);
    if (lowStock.length > 0) {
      insights.push({
        id: `ins_${Date.now() + 1}`,
        merchantId,
        type: 'inventory',
        title: 'Low Stock Alert',
        description: `${lowStock.length} items are running low`,
        suggestion: `Reorder ${lowStock.map((i: any) => i.name).join(', ')} soon to avoid stockouts.`,
        actionItems: lowStock.map((i: any) => `Reorder ${i.name} (${i.current} left)`),
        priority: 'high',
        createdAt: new Date(),
        read: false,
      });
    }

    // Save insights
    if (insights.length > 0) {
      await AIInsightModel.insertMany(insights);
    }

    return insights;
  }
}

export const aiCopilotService = new AICopilotService();
export default aiCopilotService;
