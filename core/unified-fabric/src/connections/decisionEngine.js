/**
 * Decision Engine Connection - Policy and Authorization
 * Connects Decision Engine service to the Unified Fabric
 */

import { EventEmitter } from 'events';

export class DecisionEngineConnection extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      apiUrl: config.apiUrl || process.env.DECISION_ENGINE_URL || 'http://localhost:4240',
      timeout: config.timeout || 5000
    };
  }

  // Decision outcomes
  static DECISION = {
    PROCEED: 'proceed',
    HOLD: 'hold',
    REJECT: 'reject',
    ESCALATE: 'escalate'
  };

  static RISK = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  };

  /**
   * Make decision
   */
  async decide({ corpId, action, resource, amount, context = {} }) {
    const endpoint = `${this.config.apiUrl}/api/decisions/decide`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ corpId, action, resource, amount, context })
      });
      this.emit('decision:made', response);
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get decision
   */
  async getDecision(decisionId) {
    const endpoint = `${this.config.apiUrl}/api/decisions/${decisionId}`;
    try {
      return await this.fetch(endpoint);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get decisions for entity
   */
  async getDecisions(corpId, limit = 20) {
    const endpoint = `${this.config.apiUrl}/api/decisions/entity/${corpId}`;
    try {
      const response = await this.fetch(`${endpoint}?limit=${limit}`);
      return response.decisions || [];
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Appeal decision
   */
  async appeal(decisionId, reason, supportingDocs = []) {
    const endpoint = `${this.config.apiUrl}/api/decisions/${decisionId}/appeal`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ reason, supportingDocs })
      });
      this.emit('decision:appealed', { decisionId, appealId: response.id });
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Create policy
   */
  async createPolicy({ name, description, action, resource, conditions, entityIds }) {
    const endpoint = `${this.config.apiUrl}/api/policies`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ name, description, action, resource, conditions, entityIds })
      });
      this.emit('policy:created', response);
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get policies
   */
  async getPolicies(action = null, status = null) {
    const endpoint = `${this.config.apiUrl}/api/policies`;
    try {
      const params = new URLSearchParams();
      if (action) params.set('action', action);
      if (status) params.set('status', status);

      const response = await this.fetch(`${endpoint}?${params}`);
      return response.policies || [];
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Create hold
   */
  async createHold({ corpId, type, reason, expiresAt }) {
    const endpoint = `${this.config.apiUrl}/api/policies/holds`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ corpId, type, reason, expiresAt })
      });
      this.emit('hold:created', response);
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Release hold
   */
  async releaseHold(holdId) {
    const endpoint = `${this.config.apiUrl}/api/policies/holds/${holdId}`;
    try {
      const response = await this.fetch(endpoint, { method: 'DELETE' });
      this.emit('hold:released', { holdId });
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

export default DecisionEngineConnection;
