/**
 * WAITRON - AXP Protocol Client
 * Agent-to-Agent Communication via AXP Protocol
 *
 * AXP (Agent eXchange Protocol) enables AI agents to communicate,
 * negotiate, and transact with each other using structured JSON messages.
 */

import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { createAgentLogger } from '../utils/logger';
import type {
  AXPMessage,
  AXPHeader,
  AXPBody,
  AXPAction,
  AXPTerms,
  AXPConversation,
} from '../types';

// Service URLs
const AGENT_REGISTRY_URL = process.env.AGENT_REGISTRY_URL || 'http://localhost:4142';
const AGENT_COMMUNICATION_URL = process.env.AGENT_COMMUNICATION_URL || 'http://localhost:4155';
const HOJAI_CORE_URL = process.env.HOJAI_CORE_URL || 'http://localhost:4800';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'hojai-dev-token';

export interface AXPClientConfig {
  agentId: string;
  agentType: string;
  capabilities: string[];
}

export class AXPClient {
  private agentId: string;
  private agentType: string;
  private capabilities: string[];
  private http: AxiosInstance;
  private logger: ReturnType<typeof createAgentLogger>;
  private conversationCache: Map<string, AXPConversation> = new Map();
  private messageHandlers: Map<string, (message: AXPMessage) => Promise<void>> = new Map();
  private pollingInterval?: NodeJS.Timeout;

  constructor(config: AXPClientConfig) {
    this.agentId = config.agentId;
    this.agentType = config.agentType;
    this.capabilities = config.capabilities;
    this.logger = createAgentLogger(config.agentId, config.agentType);

    this.http = axios.create({
      baseURL: AGENT_COMMUNICATION_URL,
      timeout: 30000,
      headers: {
        'X-Internal-Token': INTERNAL_TOKEN,
        'Content-Type': 'application/json',
      },
    });
  }

  // ============================================
  // CORE AXP MESSAGE METHODS
  // ============================================

  /**
   * Create an AXP message header
   */
  private createHeader(
    action: AXPAction,
    receiver: string,
    replyTo?: string,
    conversationId?: string
  ): AXPHeader {
    return {
      messageId: `axp_${uuidv4()}`,
      timestamp: new Date().toISOString(),
      sender: this.agentId,
      receiver,
      action,
      replyTo,
      conversationId: conversationId || `conv_${uuidv4()}`,
    };
  }

  /**
   * Send an AXP message to another agent
   */
  async sendMessage(
    receiver: string,
    action: AXPAction,
    intent: string,
    terms: AXPTerms = {},
    data?: Record<string, any>,
    replyTo?: string,
    conversationId?: string
  ): Promise<AXPMessage> {
    const header = this.createHeader(action, receiver, replyTo, conversationId);
    const body: AXPBody = { intent, terms, capabilities: this.capabilities, data };

    const message: AXPMessage = { header, body };

    try {
      this.logger.logMessage(receiver, action, { intent, terms });

      const response = await this.http.post('/api/messages', message);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to send message to ${receiver}`, {
        error: error.message,
        action,
        intent,
      });
      throw error;
    }
  }

  /**
   * Send a proposal to another agent
   */
  async propose(
    receiver: string,
    intent: string,
    terms: AXPTerms,
    data?: Record<string, any>
  ): Promise<AXPMessage> {
    return this.sendMessage(receiver, 'propose', intent, terms, data);
  }

  /**
   * Send a counter-proposal
   */
  async counter(
    receiver: string,
    intent: string,
    terms: AXPTerms,
    data?: Record<string, any>,
    replyTo: string,
    conversationId: string
  ): Promise<AXPMessage> {
    return this.sendMessage(receiver, 'counter', intent, terms, data, replyTo, conversationId);
  }

  /**
   * Accept a proposal
   */
  async accept(
    receiver: string,
    intent: string,
    terms: AXPTerms,
    replyTo: string,
    conversationId: string
  ): Promise<AXPMessage> {
    return this.sendMessage(receiver, 'accept', intent, terms, {}, replyTo, conversationId);
  }

  /**
   * Reject a proposal
   */
  async reject(
    receiver: string,
    intent: string,
    reason: string,
    replyTo: string,
    conversationId: string
  ): Promise<AXPMessage> {
    return this.sendMessage(
      receiver,
      'reject',
      intent,
      { ...{}, reason },
      { reason },
      replyTo,
      conversationId
    );
  }

  /**
   * Request information from another agent
   */
  async request(
    receiver: string,
    intent: string,
    data?: Record<string, any>
  ): Promise<AXPMessage> {
    return this.sendMessage(receiver, 'request', intent, {}, data);
  }

  /**
   * Inform another agent about something
   */
  async inform(
    receiver: string,
    intent: string,
    data: Record<string, any>
  ): Promise<AXPMessage> {
    return this.sendMessage(receiver, 'inform', intent, {}, data);
  }

  /**
   * Broadcast a message to all agents
   */
  async broadcast(
    action: AXPAction,
    intent: string,
    terms: AXPTerms = {},
    data?: Record<string, any>
  ): Promise<AXPMessage> {
    return this.sendMessage('broadcast', action, intent, terms, data);
  }

  // ============================================
  // CONVERSATION MANAGEMENT
  // ============================================

  /**
   * Start a new conversation with a target agent
   */
  async startConversation(targetAgent: string, intent: string): Promise<string> {
    const conversationId = `conv_${uuidv4()}`;

    const conversation: AXPConversation = {
      conversationId,
      participants: [this.agentId, targetAgent],
      messages: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.conversationCache.set(conversationId, conversation);

    this.logger.info(`Started conversation ${conversationId} with ${targetAgent}`, { intent });

    return conversationId;
  }

  /**
   * Get conversation by ID
   */
  getConversation(conversationId: string): AXPConversation | undefined {
    return this.conversationCache.get(conversationId);
  }

  /**
   * Get all active conversations
   */
  getActiveConversations(): AXPConversation[] {
    return Array.from(this.conversationCache.values()).filter(c => c.status === 'active');
  }

  /**
   * End a conversation
   */
  async endConversation(conversationId: string, status: 'completed' | 'cancelled' = 'completed') {
    const conversation = this.conversationCache.get(conversationId);
    if (conversation) {
      conversation.status = status;
      conversation.updatedAt = new Date();
      this.logger.info(`Ended conversation ${conversationId}`, { status });
    }
  }

  // ============================================
  // MESSAGE HANDLING
  // ============================================

  /**
   * Register a handler for incoming messages
   */
  onMessage(intent: string, handler: (message: AXPMessage) => Promise<void>) {
    this.messageHandlers.set(intent, handler);
    this.logger.info(`Registered handler for intent: ${intent}`);
  }

  /**
   * Register a default handler for all messages
   */
  onAnyMessage(handler: (message: AXPMessage) => Promise<void>) {
    this.messageHandlers.set('*', handler);
  }

  /**
   * Start polling for incoming messages
   */
  startPolling(intervalMs: number = 5000) {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(async () => {
      try {
        await this.pollMessages();
      } catch (error: any) {
        this.logger.error('Polling error', { error: error.message });
      }
    }, intervalMs);

    this.logger.info(`Started polling for messages every ${intervalMs}ms`);
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
      this.logger.info('Stopped polling for messages');
    }
  }

  /**
   * Poll for new messages
   */
  private async pollMessages() {
    try {
      const response = await this.http.get('/api/messages/inbox', {
        params: { agentId: this.agentId, unread: true },
      });

      const messages: AXPMessage[] = response.data.messages || [];

      for (const message of messages) {
        await this.handleMessage(message);
      }
    } catch (error: any) {
      // Ignore 404 errors (service not running)
      if (!error.response || error.response.status !== 404) {
        throw error;
      }
    }
  }

  /**
   * Handle an incoming message
   */
  private async handleMessage(message: AXPMessage) {
    this.logger.info(`Received message: ${message.header.action} from ${message.header.sender}`, {
      messageId: message.header.messageId,
      intent: message.body.intent,
    });

    // Add to conversation if exists
    const conversationId = message.header.conversationId;
    if (conversationId) {
      let conversation = this.conversationCache.get(conversationId);
      if (!conversation) {
        conversation = {
          conversationId,
          participants: [message.header.sender, this.agentId],
          messages: [],
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.conversationCache.set(conversationId, conversation);
      }
      conversation.messages.push(message);
      conversation.updatedAt = new Date();
    }

    // Find and call handler
    const handler = this.messageHandlers.get(message.body.intent) || this.messageHandlers.get('*');
    if (handler) {
      try {
        await handler(message);
      } catch (error: any) {
        this.logger.error(`Handler error for ${message.body.intent}`, {
          error: error.message,
          messageId: message.header.messageId,
        });

        // Send error response
        await this.sendMessage(
          message.header.sender,
          'reject',
          message.body.intent,
          { error: error.message },
          { error: error.message },
          message.header.messageId,
          message.header.conversationId
        );
      }
    } else {
      this.logger.warn(`No handler for intent: ${message.body.intent}`);
    }
  }

  // ============================================
  // AGENT DISCOVERY & REGISTRY
  // ============================================

  /**
   * Find agents by capability
   */
  async findAgentsByCapability(capability: string): Promise<string[]> {
    try {
      const response = await axios.get(`${AGENT_REGISTRY_URL}/api/agents`, {
        params: { capability, status: 'active' },
        headers: { 'X-Internal-Token': INTERNAL_TOKEN },
      });

      return response.data.agents?.map((a: any) => a.agentId) || [];
    } catch (error: any) {
      this.logger.warn(`Could not find agents for ${capability}`, { error: error.message });
      return [];
    }
  }

  /**
   * Get agent info from registry
   */
  async getAgentInfo(agentId: string): Promise<any> {
    try {
      const response = await axios.get(`${AGENT_REGISTRY_URL}/api/agents/${agentId}`, {
        headers: { 'X-Internal-Token': INTERNAL_TOKEN },
      });
      return response.data;
    } catch (error: any) {
      this.logger.warn(`Agent ${agentId} not found in registry`);
      return null;
    }
  }

  /**
   * Update agent status in registry
   */
  async updateStatus(status: 'idle' | 'busy' | 'offline') {
    try {
      await axios.patch(
        `${AGENT_REGISTRY_URL}/api/agents/${this.agentId}/status`,
        { status },
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN } }
      );
      this.logger.debug(`Updated status to ${status}`);
    } catch (error: any) {
      this.logger.warn(`Could not update status`, { error: error.message });
    }
  }

  // ============================================
  // SYNC WITH HOJAI
  // ============================================

  /**
   * Sync data with HOJAI Core
   */
  async syncToHOJAI(entityType: string, action: string, data: any) {
    try {
      await axios.post(
        `${HOJAI_CORE_URL}/api/sync`,
        {
          entityType,
          action,
          source: this.agentId,
          data,
          timestamp: new Date().toISOString(),
        },
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN } }
      );
    } catch (error: any) {
      if (error.response?.status !== 404) {
        this.logger.error(`HOJAI sync failed`, { error: error.message });
      }
    }
  }

  // ============================================
  // LIFECYCLE
  // ============================================

  /**
   * Get client info
   */
  getInfo() {
    return {
      agentId: this.agentId,
      agentType: this.agentType,
      capabilities: this.capabilities,
      activeConversations: this.getActiveConversations().length,
    };
  }

  /**
   * Cleanup resources
   */
  async destroy() {
    this.stopPolling();
    await this.updateStatus('offline');
    this.conversationCache.clear();
    this.messageHandlers.clear();
    this.logger.info('AXP Client destroyed');
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

export function createAXPClient(config: AXPClientConfig): AXPClient {
  return new AXPClient(config);
}

export default AXPClient;