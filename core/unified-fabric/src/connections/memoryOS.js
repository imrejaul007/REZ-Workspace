/**
 * MemoryOS Connection - Personal AI Memory for RTMN
 * Connects MemoryOS service to the Unified Fabric
 */

import { EventEmitter } from 'events';

export class MemoryOSConnection extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      apiUrl: config.apiUrl || process.env.MEMORY_OS_URL || 'http://localhost:4703',
      timeout: config.timeout || 5000
    };
    this.cache = new Map();
  }

  // Memory types
  static MEMORY_TYPES = {
    EPISODIC: 'episodic',    // Experiences, events
    SEMANTIC: 'semantic',    // Facts, knowledge
    PROCEDURAL: 'procedural', // Skills, how-tos
    RELATIONAL: 'relational'  // Connections, relationships
  };

  /**
   * Store memory
   */
  async store(corpId, type, content, metadata = {}) {
    const endpoint = `${this.config.apiUrl}/api/memories`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ corpId, type, content, metadata })
      });
      this.emit('memory:stored', { corpId, type, memoryId: response.id });
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get memories for entity
   */
  async getMemories(corpId, type = null, limit = 50) {
    const endpoint = `${this.config.apiUrl}/api/memories/entity/${corpId}`;
    try {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      params.set('limit', limit.toString());

      const response = await this.fetch(`${endpoint}?${params}`);
      return response.memories || [];
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Search memories
   */
  async search(corpId, query, type = null) {
    const endpoint = `${this.config.apiUrl}/api/memories/search`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ corpId, query, type })
      });
      return response.results || [];
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get context for AI
   */
  async getContext(corpId, query = null) {
    const endpoint = `${this.config.apiUrl}/api/context/get`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ corpId, query })
      });
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Store conversation
   */
  async storeConversation(corpId, role, content, metadata = {}) {
    const endpoint = `${this.config.apiUrl}/api/context/conversation`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ corpId, role, content, metadata })
      });
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  async getHistory(corpId, limit = 20) {
    const endpoint = `${this.config.apiUrl}/api/context/history/${corpId}`;
    try {
      const response = await this.fetch(`${endpoint}?limit=${limit}`);
      return response.conversations || [];
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Store preference
   */
  async storePreference(corpId, key, value, category = 'general') {
    const endpoint = `${this.config.apiUrl}/api/context/preferences`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ corpId, key, value, category })
      });
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Internal fetch helper
   */
  async fetch(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    const endpoint = `${this.config.apiUrl}/health`;
    try {
      const response = await this.fetch(endpoint);
      return { status: 'healthy', ...response };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

export default MemoryOSConnection;
