/**
 * CorpID Connection - Universal Identity for RTMN
 * Connects CorpID services to the Unified Fabric
 */

import { EventEmitter } from 'events';

export class CorpIDConnection extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      apiGateway: config.apiGateway || process.env.CORPID_API_URL || 'http://localhost:4702',
      internalToken: config.internalToken || process.env.CORPID_INTERNAL_TOKEN || 'corpid-internal-token',
      timeout: config.timeout || 5000
    };
    this.cache = new Map();
  }

  // Entity types supported by CorpID
  static ENTITY_TYPES = {
    INDIVIDUAL: 'IND',
    BUSINESS: 'BIZ',
    SUPPLIER: 'SUP',
    MERCHANT: 'MER',
    DRIVER: 'DRV',
    FRANCHISE: 'FRN',
    AGENT: 'AGT'
  };

  /**
   * Create a new CorpID entity
   */
  async createEntity(type, data) {
    const endpoint = `${this.config.apiGateway}/api/identity/create`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ entityType: type, ...data })
      });
      this.cache.set(response.corpId, response);
      return response;
    } catch (error) {
      console.error('[CorpID] Create entity failed:', error.message);
      throw error;
    }
  }

  /**
   * Get entity by CorpID
   */
  async getEntity(corpId) {
    // Check cache first
    if (this.cache.has(corpId)) {
      return this.cache.get(corpId);
    }

    const endpoint = `${this.config.apiGateway}/api/identity/${corpId}`;
    try {
      const response = await this.fetch(endpoint);
      this.cache.set(corpId, response);
      return response;
    } catch (error) {
      console.error('[CorpID] Get entity failed:', error.message);
      throw error;
    }
  }

  /**
   * Verify entity identity
   */
  async verifyEntity(corpId, verificationType = 'basic') {
    const endpoint = `${this.config.apiGateway}/api/verification/verify`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ corpId, verificationType })
      });
      this.emit('entity:verified', { corpId, verification: response });
      return response;
    } catch (error) {
      console.error('[CorpID] Verification failed:', error.message);
      throw error;
    }
  }

  /**
   * Get trust score for entity
   */
  async getTrustScore(corpId) {
    const endpoint = `${this.config.apiGateway}/api/trust/score/${corpId}`;
    try {
      return await this.fetch(endpoint);
    } catch (error) {
      console.error('[CorpID] Trust score failed:', error.message);
      throw error;
    }
  }

  /**
   * Get entity relationships
   */
  async getRelationships(corpId) {
    const endpoint = `${this.config.apiGateway}/api/relationships/${corpId}`;
    try {
      return await this.fetch(endpoint);
    } catch (error) {
      console.error('[CorpID] Get relationships failed:', error.message);
      throw error;
    }
  }

  /**
   * Create relationship between entities
   */
  async createRelationship(fromCorpId, toCorpId, relationshipType, properties = {}) {
    const endpoint = `${this.config.apiGateway}/api/relationships`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ fromCorpId, toCorpId, relationshipType, properties })
      });
      this.emit('relationship:created', { fromCorpId, toCorpId, relationshipType });
      return response;
    } catch (error) {
      console.error('[CorpID] Create relationship failed:', error.message);
      throw error;
    }
  }

  /**
   * Register AI Agent
   */
  async registerAgent(agentData) {
    const endpoint = `${this.config.apiGateway}/api/agents/register`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          ...agentData,
          entityType: 'AGT'
        })
      });
      this.emit('agent:registered', { agentId: response.corpId });
      return response;
    } catch (error) {
      console.error('[CorpID] Agent registration failed:', error.message);
      throw error;
    }
  }

  /**
   * Resolve identity across systems
   */
  async resolveIdentity(identifiers) {
    const endpoint = `${this.config.apiGateway}/api/identity/resolve`;
    try {
      return await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ identifiers })
      });
    } catch (error) {
      console.error('[CorpID] Identity resolution failed:', error.message);
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
          'Authorization': `Bearer ${this.config.internalToken}`,
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
    const endpoint = `${this.config.apiGateway}/health`;
    try {
      const response = await this.fetch(endpoint);
      return { status: 'healthy', ...response };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

// Default export
export default CorpIDConnection;