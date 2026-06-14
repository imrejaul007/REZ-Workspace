// ============================================================================
// SUTAR Memory Bridge - Twin OS Integration Service
// ============================================================================

import http from 'http';
import https from 'https';
import { TwinOSConfig, TwinOSMessage, Memory } from '../types/index';

interface TwinOSResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface MemorySyncMessage {
  action: 'create' | 'update' | 'delete' | 'share' | 'expire';
  memory: Memory;
  timestamp: string;
}

class TwinOSService {
  private config: TwinOSConfig = {
    host: process.env.TWIN_OS_HOST || 'localhost',
    port: parseInt(process.env.TWIN_OS_PORT || '4142'),
    apiKey: process.env.TWIN_OS_API_KEY,
    timeout: 5000,
    retries: 3,
  };

  private connected: boolean = false;
  private lastHeartbeat: string | null = null;
  private messageQueue: TwinOSMessage[] = [];
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Update Twin OS configuration
   */
  configure(config: Partial<TwinOSConfig>): void {
    this.config = { ...this.config, ...config };
    console.log(`[TWIN] Configuration updated: ${this.config.host}:${this.config.port}`);
  }

  /**
   * Check if Twin OS is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.request('/health', 'GET');
      this.connected = response.success;
      this.lastHeartbeat = new Date().toISOString();
      return response.success;
    } catch {
      this.connected = false;
      return false;
    }
  }

  /**
   * Send a message to Twin OS
   */
  async sendMessage(message: TwinOSMessage): Promise<TwinOSResponse> {
    const response = await this.request('/api/v1/messages', 'POST', message);

    if (response.success) {
      console.log(`[TWIN] Message sent: ${message.action}`);
    }

    return response;
  }

  /**
   * Sync a memory operation to Twin OS
   */
  async syncMemory(memory: Memory, action: 'create' | 'update' | 'delete'): Promise<TwinOSResponse> {
    const message: TwinOSMessage = {
      action: 'memory_sync',
      payload: {
        action,
        memory,
        service: 'sutar-memory-bridge',
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendMessage(message);
  }

  /**
   * Sync memory sharing to Twin OS
   */
  async syncShare(memory: Memory, toEntityId: string, permission: string): Promise<TwinOSResponse> {
    const message: TwinOSMessage = {
      action: 'memory_share',
      payload: {
        memory,
        toEntityId,
        permission,
        service: 'sutar-memory-bridge',
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendMessage(message);
  }

  /**
   * Sync memory expiration to Twin OS
   */
  async syncExpiration(memoryId: string, entityId: string): Promise<TwinOSResponse> {
    const message: TwinOSMessage = {
      action: 'memory_expired',
      payload: {
        memoryId,
        entityId,
        service: 'sutar-memory-bridge',
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendMessage(message);
  }

  /**
   * Request memory data from Twin OS
   */
  async fetchMemories(entityId: string): Promise<TwinOSResponse> {
    return this.request(`/api/v1/entities/${entityId}/memories`, 'GET');
  }

  /**
   * Request semantic search through Twin OS
   */
  async remoteSearch(query: string, entityId?: string): Promise<TwinOSResponse> {
    const params = new URLSearchParams({ query });
    if (entityId) params.append('entityId', entityId);

    return this.request(`/api/v1/search?${params}`, 'GET');
  }

  /**
   * Send heartbeat to Twin OS
   */
  async heartbeat(): Promise<TwinOSResponse> {
    const response = await this.request('/api/v1/heartbeat', 'POST', {
      service: 'sutar-memory-bridge',
      timestamp: new Date().toISOString(),
      status: 'active',
    });

    if (response.success) {
      this.lastHeartbeat = new Date().toISOString();
    }

    return response;
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean; lastHeartbeat: string | null; queuedMessages: number } {
    return {
      connected: this.connected,
      lastHeartbeat: this.lastHeartbeat,
      queuedMessages: this.messageQueue.length,
    };
  }

  /**
   * Queue a message for later delivery
   */
  queueMessage(message: TwinOSMessage): void {
    this.messageQueue.push(message);
    console.log(`[TWIN] Message queued: ${message.action} (queue size: ${this.messageQueue.length})`);
  }

  /**
   * Process queued messages
   */
  async processQueue(): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;
    const remaining: TwinOSMessage[] = [];

    for (const message of this.messageQueue) {
      const response = await this.sendMessage(message);
      if (response.success) {
        sent++;
      } else {
        remaining.push(message);
        failed++;
      }
    }

    this.messageQueue = remaining;
    console.log(`[TWIN] Queue processed: ${sent} sent, ${failed} failed, ${remaining.length} remaining`);

    return { sent, failed };
  }

  /**
   * Request wrapper with retries
   */
  private async request(path: string, method: string, body?: unknown): Promise<TwinOSResponse> {
    const url = new URL(path, `http://${this.config.host}:${this.config.port}`);
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const response = await this.makeRequest(url.toString(), method, body);

        if (response.success) {
          return response;
        }

        // Non-retryable error
        if (response.error && !response.error.includes('ECONNREFUSED') && !response.error.includes('ETIMEDOUT')) {
          return response;
        }

        lastError = new Error(response.error || 'Request failed');
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
      }

      // Wait before retry (exponential backoff)
      if (attempt < this.config.retries) {
        await this.delay(1000 * Math.pow(2, attempt - 1));
      }
    }

    this.connected = false;
    console.error(`[TWIN] Request failed after ${this.config.retries} attempts: ${lastError?.message}`);

    return {
      success: false,
      error: lastError?.message || 'Request failed',
    };
  }

  /**
   * Make HTTP request
   */
  private makeRequest(url: string, method: string, body?: unknown): Promise<TwinOSResponse> {
    return new Promise((resolve) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;

      const options: http.RequestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SUTAR-Memory-Bridge/1.0',
          'X-Service': 'sutar-memory-bridge',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        timeout: this.config.timeout,
      };

      const req = client.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({
              success: res.statusCode && res.statusCode >= 200 && res.statusCode < 300,
              data: parsed,
              error: res.statusCode && res.statusCode >= 400 ? `HTTP ${res.statusCode}` : undefined,
            });
          } catch {
            resolve({
              success: false,
              error: 'Invalid JSON response',
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          error: 'Request timeout',
        });
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Convert memory to Twin OS format
   */
  static toTwinOSFormat(memory: Memory): Record<string, unknown> {
    return {
      id: memory.id,
      entityId: memory.entityId,
      type: memory.type,
      content: memory.content,
      metadata: memory.metadata,
      tags: memory.tags,
      createdAt: memory.createdAt,
      updatedAt: memory.updatedAt,
      expiresAt: memory.expiresAt,
    };
  }

  /**
   * Convert Twin OS format to memory
   */
  static fromTwinOSFormat(data: Record<string, unknown>): Partial<Memory> {
    return {
      id: data.id as string,
      entityId: data.entityId as string,
      type: data.type as Memory['type'],
      content: data.content as string,
      metadata: data.metadata as Record<string, unknown>,
      tags: data.tags as string[],
      createdAt: data.createdAt as string,
      updatedAt: data.updatedAt as string,
      expiresAt: data.expiresAt as string | undefined,
    };
  }
}

// Export singleton instance
export const twinOSService = new TwinOSService();
export { TwinOSService };
