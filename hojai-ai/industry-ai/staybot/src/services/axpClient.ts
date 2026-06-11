/**
 * STAYBOT - AXP Protocol Client
 * Agent-to-Agent Communication using the AXP Protocol
 * Part of the RTNM Economic Network
 */

import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { AXPMessage, AXPHeader, AXPBody, AgentMessage } from '../types';

const AXP_PROTOCOL_VERSION = '1.0';

export class AXPClient {
  private httpClient: AxiosInstance;
  private agentId: string;
  private agentName: string;
  private messageQueue: Map<string, AXPMessage> = new Map();
  private pendingResponses: Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }> = new Map();
  private webhookUrl: string;

  constructor(agentId: string, agentName: string) {
    this.agentId = agentId;
    this.agentName = agentName;
    this.webhookUrl = process.env.HOJAI_WEBHOOK_URL || 'http://localhost:4090';

    this.httpClient = axios.create({
      baseURL: this.webhookUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-ID': this.agentId,
        'X-Agent-Name': this.agentName,
      },
    });
  }

  /**
   * Create an AXP message header
   */
  private createHeader(
    receiver: string,
    action: AXPHeader['action']
  ): AXPHeader {
    return {
      message_id: uuidv4(),
      timestamp: new Date().toISOString(),
      sender: this.agentId,
      receiver,
      action,
      protocol_version: AXP_PROTOCOL_VERSION,
    };
  }

  /**
   * Send a message to another agent
   */
  async sendMessage(
    receiver: string,
    intent: string,
    terms: Partial<AXPBody['terms']> = {},
    context: Record<string, any> = {},
    capabilities: string[] = []
  ): Promise<string> {
    const messageId = uuidv4();
    const header = this.createHeader(receiver, 'inform');

    const body: AXPBody = {
      intent,
      capabilities,
      constraints: {},
      terms,
      context: {
        ...context,
        senderName: this.agentName,
        messageId,
      },
    };

    const message: AXPMessage = { header, body };

    try {
      // Queue the message
      this.messageQueue.set(messageId, message);

      // Send via webhook
      await this.httpClient.post('/api/axp/messages', {
        ...message,
        sourceAgent: this.agentId,
      });

      logger.info(`AXP message sent to ${receiver}`, {
        messageId,
        intent,
        receiver,
      });

      return messageId;
    } catch (error: any) {
      logger.error(`Failed to send AXP message: ${error.message}`, {
        messageId,
        receiver,
        intent,
      });
      throw error;
    }
  }

  /**
   * Make a request to another agent and wait for response
   */
  async sendRequest<T = any>(
    receiver: string,
    intent: string,
    terms: Partial<AXPBody['terms']> = {},
    context: Record<string, any> = {},
    timeout: number = 30000
  ): Promise<T> {
    const messageId = uuidv4();
    const header = this.createHeader(receiver, 'request');

    const body: AXPBody = {
      intent,
      capabilities: [],
      constraints: {},
      terms,
      context: {
        ...context,
        senderName: this.agentName,
        messageId,
        expectsResponse: true,
      },
    };

    const message: AXPMessage = { header, body };

    return new Promise((resolve, reject) => {
      // Set timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingResponses.delete(messageId);
        reject(new Error(`AXP request timeout after ${timeout}ms`));
      }, timeout);

      // Store pending response
      this.pendingResponses.set(messageId, { resolve, reject, timeout: timeoutHandle });

      this.messageQueue.set(messageId, message);

      this.httpClient
        .post('/api/axp/messages', {
          ...message,
          sourceAgent: this.agentId,
        })
        .then(() => {
          logger.info(`AXP request sent to ${receiver}`, {
            messageId,
            intent,
            receiver,
          });
        })
        .catch((error) => {
          clearTimeout(timeoutHandle);
          this.pendingResponses.delete(messageId);
          reject(error);
        });
    });
  }

  /**
   * Handle incoming AXP message
   */
  async handleMessage(message: AXPMessage): Promise<AXPMessage | null> {
    const { header, body } = message;

    logger.info(`AXP message received from ${header.sender}`, {
      messageId: header.message_id,
      intent: body.intent,
      action: header.action,
    });

    // Check if this is a response to our request
    if (header.action === 'inform' && body.context?.responseTo) {
      const pending = this.pendingResponses.get(body.context.responseTo);
      if (pending) {
        clearTimeout(pending.timeout);
        pending.resolve(body);
        this.pendingResponses.delete(body.context.responseTo);
        return null;
      }
    }

    // Return message for processing
    return message;
  }

  /**
   * Create a proposal message
   */
  async sendProposal(
    receiver: string,
    intent: string,
    terms: AXPBody['terms'],
    context: Record<string, any> = {}
  ): Promise<string> {
    const messageId = uuidv4();
    const header = this.createHeader(receiver, 'propose');

    const body: AXPBody = {
      intent,
      capabilities: [],
      constraints: {},
      terms,
      context: {
        ...context,
        senderName: this.agentName,
        messageId,
      },
    };

    const message: AXPMessage = { header, body };
    this.messageQueue.set(messageId, message);

    await this.httpClient.post('/api/axp/messages', {
      ...message,
      sourceAgent: this.agentId,
    });

    logger.info(`AXP proposal sent to ${receiver}`, {
      messageId,
      intent,
      terms,
    });

    return messageId;
  }

  /**
   * Accept a proposal
   */
  async acceptProposal(
    receiver: string,
    originalMessageId: string,
    terms?: Partial<AXPBody['terms']>
  ): Promise<string> {
    const messageId = uuidv4();
    const header = this.createHeader(receiver, 'accept');

    const body: AXPBody = {
      intent: 'accept',
      capabilities: [],
      constraints: {},
      terms: terms || {},
      context: {
        responseTo: originalMessageId,
        senderName: this.agentName,
        messageId,
      },
    };

    const message: AXPMessage = { header, body };

    await this.httpClient.post('/api/axp/messages', {
      ...message,
      sourceAgent: this.agentId,
    });

    logger.info(`AXP proposal accepted: ${originalMessageId}`, {
      messageId,
      originalMessageId,
      receiver,
    });

    return messageId;
  }

  /**
   * Reject a proposal
   */
  async rejectProposal(
    receiver: string,
    originalMessageId: string,
    reason?: string
  ): Promise<string> {
    const messageId = uuidv4();
    const header = this.createHeader(receiver, 'reject');

    const body: AXPBody = {
      intent: 'reject',
      capabilities: [],
      constraints: {},
      terms: {},
      context: {
        responseTo: originalMessageId,
        senderName: this.agentName,
        messageId,
        reason,
      },
    };

    const message: AXPMessage = { header, body };

    await this.httpClient.post('/api/axp/messages', {
      ...message,
      sourceAgent: this.agentId,
    });

    logger.info(`AXP proposal rejected: ${originalMessageId}`, {
      messageId,
      originalMessageId,
      receiver,
      reason,
    });

    return messageId;
  }

  /**
   * Get queued messages
   */
  getQueuedMessages(): AXPMessage[] {
    return Array.from(this.messageQueue.values());
  }

  /**
   * Clear old messages from queue
   */
  clearOldMessages(maxAgeMs: number = 3600000): void {
    const now = Date.now();
    for (const [id, message] of this.messageQueue.entries()) {
      const messageTime = new Date(message.header.timestamp).getTime();
      if (now - messageTime > maxAgeMs) {
        this.messageQueue.delete(id);
      }
    }
  }

  /**
   * Get pending response count
   */
  getPendingCount(): number {
    return this.pendingResponses.size;
  }
}

/**
 * Factory function to create AXP client for specific agent
 */
export function createAXPClient(agentId: string, agentName: string): AXPClient {
  return new AXPClient(agentId, agentName);
}

export default AXPClient;
