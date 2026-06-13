/**
 * GoalOS Connection - Autonomous Goal Decomposition
 * Connects GoalOS service to the Unified Fabric
 */

import { EventEmitter } from 'events';

export class GoalOSConnection extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      apiUrl: config.apiUrl || process.env.GOAL_OS_URL || 'http://localhost:4242',
      timeout: config.timeout || 5000
    };
  }

  // Goal statuses
  static STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    BLOCKED: 'blocked',
    CANCELLED: 'cancelled'
  };

  static PRIORITY = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4
  };

  /**
   * Create goal
   */
  async createGoal({ title, description, ownerCorpId, parentGoalId, priority, deadline, metrics }) {
    const endpoint = `${this.config.apiUrl}/api/goals`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          ownerCorpId,
          parentGoalId,
          priority,
          deadline,
          metrics
        })
      });
      this.emit('goal:created', response);
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Decompose goal into sub-goals
   */
  async decompose(goalId, subGoals, strategy = 'sequential') {
    const endpoint = `${this.config.apiUrl}/api/goals/${goalId}/decompose`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ subGoals, strategy })
      });
      this.emit('goal:decomposed', { parentGoalId: goalId, subGoals: response.subGoals });
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get goal with children
   */
  async getGoal(goalId) {
    const endpoint = `${this.config.apiUrl}/api/goals/${goalId}`;
    try {
      return await this.fetch(endpoint);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Update goal progress
   */
  async updateProgress(goalId, progress, status = null, notes = null) {
    const endpoint = `${this.config.apiUrl}/api/goals/${goalId}/progress`;
    try {
      const response = await this.fetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ progress, status, notes })
      });
      this.emit('goal:progress', { goalId, progress: response.progress });
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get goals for owner
   */
  async getGoals(ownerCorpId, status = null, limit = 50) {
    const endpoint = `${this.config.apiUrl}/api/goals/owner/${ownerCorpId}`;
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      params.set('limit', limit.toString());

      const response = await this.fetch(`${endpoint}?${params}`);
      return response.goals || [];
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get active goals
   */
  async getActiveGoals(limit = 50) {
    const endpoint = `${this.config.apiUrl}/api/goals/status/active`;
    try {
      const response = await this.fetch(`${endpoint}?limit=${limit}`);
      return response.goals || [];
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

export default GoalOSConnection;
