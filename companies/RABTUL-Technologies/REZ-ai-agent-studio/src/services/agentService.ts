/**
 * AI Agent Studio - Agent Service
 * Conversational AI with tools and knowledge
 */

import { Agent, Conversation, KnowledgeItem, AgentAnalytics } from '../models';
import { v4 as uuid } from 'uuid';
import { createLogger } from '../../shared/logger';
import { NotFoundError, AppError } from '../../../../shared/rez-errors/src';

const logger = createLogger('agent-studio');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface AgentContext {
  agentId: string;
  sessionId?: string;
  userId?: string;
  channel?: string;
  metadata?: Record<string, unknown>;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

class AgentService {
  /**
   * Send message to agent
   */
  async sendMessage(
    agentId: string,
    userMessage: string,
    context: AgentContext
  ): Promise<{ response: string; sessionId: string; intent?: string }> {
    // Get agent
    const agent = await Agent.findById(agentId);
    if (!agent) {
      throw new NotFoundError('Agent', agentId);
    }

    // Get or create conversation
    let conversation = await Conversation.findOne({
      agentId,
      sessionId: context.sessionId || uuid(),
    });

    if (!conversation) {
      conversation = await Conversation.create({
        agentId,
        sessionId: context.sessionId || uuid(),
        userId: context.userId,
        channel: context.channel || 'api',
        messages: [],
        context: { variables: {} },
      });
    }

    // Build messages
    const messages: Message[] = [
      { role: 'system', content: this.buildSystemPrompt(agent) },
    ];

    // Add knowledge context
    const knowledgeContext = await this.getKnowledgeContext(agentId, userMessage);
    if (knowledgeContext) {
      messages.push({
        role: 'system',
        content: `Knowledge Base:\n${knowledgeContext}`
      });
    }

    // Add conversation history
    const history = conversation.messages.slice(-10);
    for (const msg of history) {
      messages.push({ role: msg.role as unknown, content: msg.content });
    }

    // Add current message
    messages.push({ role: 'user', content: userMessage });

    // Call AI
    const response = await this.callAI(agent, messages);

    // Save messages
    conversation.messages.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: response.text }
    );
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Update stats
    await Agent.updateOne(
      { _id: agentId },
      { $inc: { 'stats.totalMessages': 2 } }
    );

    // Track analytics
    await this.trackAnalytics(agentId);

    return {
      response: response.text,
      sessionId: conversation.sessionId,
      intent: response.intent,
    };
  }

  /**
   * Build system prompt from agent config
   */
  private buildSystemPrompt(agent): string {
    let prompt = '';

    // Personality
    if (agent.personality) {
      prompt += `You are a ${agent.personality.tone} assistant. `;
      if (agent.personality.emoji) {
        prompt += 'You can use emojis. ';
      }
    }

    // System prompt
    if (agent.systemPrompt) {
      prompt += `\n\n${agent.systemPrompt}\n\n`;
    }

    // Context
    if (agent.context) {
      prompt += `\nContext:\n${agent.context}\n\n`;
    }

    // Capabilities
    if (agent.capabilities?.length > 0) {
      prompt += '\nCapabilities:\n';
      for (const cap of agent.capabilities) {
        if (cap.enabled) {
          prompt += `- ${cap.type.replace(/_/g, ' ')}\n`;
        }
      }
    }

    // Instructions
    prompt += '\nAlways be helpful, accurate, and concise.';

    return prompt;
  }

  /**
   * Get relevant knowledge for context
   */
  private async getKnowledgeContext(agentId: string, query: string): Promise<string | null> {
    const items = await KnowledgeItem.find({
      agentId,
      active: true,
    }).limit(5);

    if (items.length === 0) return null;

    // Simple keyword matching (in production, use vector search)
    const queryWords = query.toLowerCase().split(' ');
    const relevant = items.filter(item => {
      const text = `${item.question} ${item.answer}`.toLowerCase();
      return queryWords.some(word => text.includes(word));
    });

    if (relevant.length === 0) return null;

    return relevant
      .map(item => `Q: ${item.question}\nA: ${item.answer}`)
      .join('\n\n');
  }

  /**
   * Call AI model
   */
  private async callAI(agent, messages: Message[]): Promise<{ text: string; intent?: string }> {
    const { provider, model, temperature, maxTokens } = agent.model || {};

    try {
      if (provider === 'anthropic' || provider === 'claude') {
        return await this.callClaude(model || 'claude-3-opus-20240229', messages, temperature, maxTokens);
      }

      // Default to OpenAI
      return await this.callOpenAI(model || 'gpt-4', messages, temperature, maxTokens);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`AI call failed: ${message}`);
      return {
        text: 'I apologize, but I encountered an error. Please try again.',
        intent: 'error',
      };
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(
    model: string,
    messages: Message[],
    temperature = 0.7,
    maxTokens = 1000
  ): Promise<{ text: string; intent?: string }> {
    if (!OPENAI_API_KEY) {
      return { text: 'AI service not configured. Please set OPENAI_API_KEY.' };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      throw new AppError(`OpenAI error: ${response.status}`, 'OPENAI_ERROR', 502);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    // Extract intent from response
    const intent = this.extractIntent(text);

    return { text, intent };
  }

  /**
   * Call Claude API
   */
  private async callClaude(
    model: string,
    messages: Message[],
    temperature = 0.7,
    maxTokens = 1000
  ): Promise<{ text: string; intent?: string }> {
    if (!ANTHROPIC_API_KEY) {
      return { text: 'Claude service not configured. Please set ANTHROPIC_API_KEY.' };
    }

    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        system: systemMessage,
        messages: chatMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      throw new AppError(`Claude error: ${response.status}`, 'CLAUDE_ERROR', 502);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    return { text, intent: this.extractIntent(text) };
  }

  /**
   * Extract intent from response
   */
  private extractIntent(text: string): string {
    const lower = text.toLowerCase();

    if (lower.includes('order')) return 'order_inquiry';
    if (lower.includes('return') || lower.includes('refund')) return 'return_request';
    if (lower.includes('support') || lower.includes('help')) return 'support_request';
    if (lower.includes('product') || lower.includes('available')) return 'product_inquiry';

    return 'general';
  }

  /**
   * Track analytics
   */
  private async trackAnalytics(agentId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await AgentAnalytics.findOneAndUpdate(
      { agentId, date: today },
      { $inc: { messages: 2 } },
      { upsert: true }
    );
  }

  /**
   * Get conversation history
   */
  async getConversation(sessionId: string): Promise<unknown | null> {
    return Conversation.findOne({ sessionId }).populate('agentId', 'name type');
  }

  /**
   * End conversation
   */
  async endConversation(sessionId: string, rating?: number, feedback?: string): Promise<void> {
    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) return;

    conversation.status = rating ? 'resolved' : 'active';
    conversation.endedAt = new Date();
    conversation.duration = conversation.endedAt.getTime() - conversation.startedAt.getTime();

    if (rating) {
      conversation.rating = rating;
      conversation.feedback = feedback;
    }

    await conversation.save();

    // Update agent stats
    await Agent.updateOne(
      { _id: conversation.agentId },
      {
        $set: { 'stats.lastConversation': new Date() },
        $inc: { 'stats.totalConversations': 1 },
      }
    );
  }
}

export const agentService = new AgentService();
