/**
 * REZ Copilot - Session Service
 * Manages chat sessions and conversation history
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ChatSession,
  CopilotMessage,
  ConversationContext,
  ChatRequest,
  ChatResponse,
} from '../types';
import { config } from '../config/services';
import { aiCoachingService } from './aiService';
import { logger } from '../middleware/logger';

export class SessionService {
  private sessions: Map<string, ChatSession> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();

  constructor() {
    // Cleanup old sessions periodically
    setInterval(() => this.cleanupOldSessions(), 15 * 60 * 1000);
  }

  /**
   * Create a new chat session
   */
  createSession(
    userId: string,
    dealId?: string,
    companyId?: string
  ): ChatSession {
    const sessionId = uuidv4();

    const session: ChatSession = {
      id: sessionId,
      dealId,
      companyId,
      messages: [],
      context: {
        deal: undefined,
        company: undefined,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
    };

    // Store session
    this.sessions.set(sessionId, session);

    // Track user's sessions
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(sessionId);

    logger.info(`Created session ${sessionId} for user ${userId}`);
    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Add message to session
   */
  async addMessage(
    sessionId: string,
    message: Omit<CopilotMessage, 'id' | 'timestamp'>
  ): Promise<ChatSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const newMessage: CopilotMessage = {
      ...message,
      id: uuidv4(),
      timestamp: new Date(),
    };

    session.messages.push(newMessage);
    session.updatedAt = new Date();

    // Trim history if too long
    if (session.messages.length > config.session.maxHistoryLength) {
      session.messages = session.messages.slice(-config.session.maxHistoryLength);
    }

    return session;
  }

  /**
   * Process user message and generate AI response
   */
  async processMessage(
    sessionId: string,
    request: ChatRequest
  ): Promise<ChatResponse> {
    let session = this.sessions.get(sessionId);

    // Create session if doesn't exist
    if (!session) {
      session = this.createSession(
        request.dealId ? 'anonymous' : 'system',
        request.dealId,
        request.companyId
      );
    }

    // Add user message
    const userMessage: CopilotMessage = {
      id: uuidv4(),
      role: 'user',
      content: request.message,
      timestamp: new Date(),
    };

    session.messages.push(userMessage);
    session.updatedAt = new Date();

    // Get context if deal/company specified
    let context: ConversationContext = {
      sessionId,
      recentMessages: session.messages.slice(-config.session.contextWindow),
    };

    if (request.dealId) {
      session.dealId = request.dealId;
      const { contextService } = await import('./contextService');
      const dealContext = await contextService.getDealContext(request.dealId);
      if (dealContext) {
        context.deal = dealContext.deal;
        context.company = dealContext.company;
        session.context = context;
      }
    }

    // Generate AI response
    const responseContent = await aiCoachingService.generateChatResponse(
      request.message,
      context.deal,
      context.company
    );

    // Add assistant message
    const assistantMessage: CopilotMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
    };

    session.messages.push(assistantMessage);

    // Generate suggested actions based on context
    const suggestedActions = context.deal
      ? await this.generateSuggestedActions(context.deal, context.company)
      : undefined;

    return {
      message: assistantMessage,
      suggestedActions,
      relatedDeals: context.deal ? [context.deal.dealId] : undefined,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate suggested actions for current context
   */
  private async generateSuggestedActions(
    deal: ConversationContext['deal'],
    company: ConversationContext['company']
  ) {
    if (!deal || !company) return undefined;

    return aiCoachingService
      .generateNextBestActions(deal, company, [], [])
      .slice(0, 3);
  }

  /**
   * Get user's sessions
   */
  getUserSessions(userId: string): ChatSession[] {
    const sessionIds = this.userSessions.get(userId);
    if (!sessionIds) return [];

    return Array.from(sessionIds)
      .map((id) => this.sessions.get(id))
      .filter((s): s is ChatSession => s !== undefined)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Delete session
   */
  deleteSession(sessionId: string, userId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    this.sessions.delete(sessionId);

    const userSessionSet = this.userSessions.get(userId);
    if (userSessionSet) {
      userSessionSet.delete(sessionId);
    }

    logger.info(`Deleted session ${sessionId}`);
    return true;
  }

  /**
   * Update session tags
   */
  updateSessionTags(sessionId: string, tags: string[]): ChatSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    session.tags = tags;
    session.updatedAt = new Date();
    return session;
  }

  /**
   * Cleanup old sessions
   */
  private cleanupOldSessions(): void {
    const now = Date.now();
    const timeout = config.session.inactivityTimeout;
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.updatedAt.getTime() > timeout) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} old sessions`);
    }
  }

  /**
   * Get session statistics
   */
  getStats(): {
    totalSessions: number;
    totalMessages: number;
    activeUsers: number;
    avgMessagesPerSession: number;
  } {
    let totalMessages = 0;
    for (const session of this.sessions.values()) {
      totalMessages += session.messages.length;
    }

    return {
      totalSessions: this.sessions.size,
      totalMessages,
      activeUsers: this.userSessions.size,
      avgMessagesPerSession:
        this.sessions.size > 0 ? totalMessages / this.sessions.size : 0,
    };
  }
}

export const sessionService = new SessionService();
