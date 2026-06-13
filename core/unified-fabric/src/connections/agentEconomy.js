/**
 * Agent Economy Connection - Karma Points and Payments
 * Connects Agent Economy service to the Unified Fabric
 */

import { EventEmitter } from 'events';

export class AgentEconomyConnection extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      apiUrl: config.apiUrl || process.env.AGENT_ECONOMY_URL || 'http://localhost:4251',
      timeout: config.timeout || 5000
    };
  }

  // Currencies
  static CURRENCY = {
    KARMA: 'karma',
    SLB: 'slb',
    REZ: 'rez'
  };

  /**
   * Get balance
   */
  async getBalance(corpId) {
    const endpoint = `${this.config.apiUrl}/api/economy/balance/${corpId}`;
    try {
      return await this.fetch(endpoint);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Award karma
   */
  async awardKarma(corpId, amount, reason, sourceCorpId = null) {
    const endpoint = `${this.config.apiUrl}/api/economy/karma/award`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ corpId, amount, reason, sourceCorpId })
      });
      this.emit('karma:awarded', { corpId, amount, reason });
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Burn karma (penalty)
   */
  async burnKarma(corpId, amount, reason) {
    const endpoint = `${this.config.apiUrl}/api/economy/karma/burn`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ corpId, amount, reason })
      });
      this.emit('karma:burned', { corpId, amount, reason });
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stake SLB
   */
  async stakeSLB(corpId, amount, taskId) {
    const endpoint = `${this.config.apiUrl}/api/economy/slb/stake`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ corpId, amount, taskId })
      });
      this.emit('slb:staked', { corpId, amount, taskId });
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Slash SLB (penalty)
   */
  async slashSLB(corpId, amount, reason, taskId = null) {
    const endpoint = `${this.config.apiUrl}/api/economy/slb/slash`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ corpId, amount, reason, taskId })
      });
      this.emit('slb:slashed', { corpId, amount, reason });
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactions(corpId, type = null, limit = 50) {
    const endpoint = `${this.config.apiUrl}/api/economy/txs/${corpId}`;
    try {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      params.set('limit', limit.toString());

      const response = await this.fetch(`${endpoint}?${params}`);
      return response.transactions || [];
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(currency = 'karma', limit = 20) {
    const endpoint = `${this.config.apiUrl}/api/economy/leaderboard`;
    try {
      const response = await this.fetch(`${endpoint}?currency=${currency}&limit=${limit}`);
      return response.leaderboard || [];
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Create payment
   */
  async createPayment({ fromCorpId, toCorpId, amount, currency = 'rez', description, taskId }) {
    const endpoint = `${this.config.apiUrl}/api/payments`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ fromCorpId, toCorpId, amount, currency, description, taskId })
      });
      this.emit('payment:created', response);
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Create escrow
   */
  async createEscrow({ fromCorpId, toCorpId, amount, currency = 'rez', taskId, releaseConditions }) {
    const endpoint = `${this.config.apiUrl}/api/payments/escrow`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ fromCorpId, toCorpId, amount, currency, taskId, releaseConditions })
      });
      this.emit('escrow:created', response);
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Release escrow
   */
  async releaseEscrow(escrowId) {
    const endpoint = `${this.config.apiUrl}/api/payments/escrow/${escrowId}/release`;
    try {
      const response = await this.fetch(endpoint, { method: 'POST' });
      this.emit('escrow:released', { escrowId });
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Refund escrow
   */
  async refundEscrow(escrowId) {
    const endpoint = `${this.config.apiUrl}/api/payments/escrow/${escrowId}/refund`;
    try {
      const response = await this.fetch(endpoint, { method: 'POST' });
      this.emit('escrow:refunded', { escrowId });
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

export default AgentEconomyConnection;
