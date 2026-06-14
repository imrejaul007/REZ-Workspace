/**
 * Agent Orchestrator Service
 * Connects Do App to REZ Agent OS
 */

import axios, { AxiosInstance } from 'axios';

const AGENT_ORCHESTRATOR_URL = process.env.EXPO_PUBLIC_REZ_AGENT_ORCHESTRATOR_URL || 'https://rez-agent-orchestrator.onrender.com';

const API_KEY = process.env.REZ_API_KEY || '';

// ============================================
// Types
// ============================================

export interface AgentTask {
  task_id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  subtasks: SubTask[];
  assigned_agents: string[];
  required_tools: string[];
  requires_approval: boolean;
  status: 'pending' | 'decomposing' | 'running' | 'waiting_approval' | 'completed' | 'failed';
  results: AgentResult[];
  consensus_reached: boolean;
  context: Record<string, unknown>;
}

export interface SubTask {
  subtask_id: string;
  description: string;
  agent_type: string;
  depends_on: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: unknown;
}

export interface AgentResult {
  agent_id: string;
  agent_type: string;
  output: unknown;
  confidence: number;
  reasoning: string;
  tools_used: string[];
  execution_time_ms: number;
}

export interface AgentInsight {
  type: 'dormancy_alert' | 'trend_alert' | 'personalization' | 'recommendation' | 'churn_risk';
  source: string;
  confidence: number;
  reasoning: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface DormancyAlert {
  userId: string;
  daysSinceActive: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendedChannel: 'push' | 'sms' | 'whatsapp' | 'email';
  offer?: { coins?: number; discountPercent?: number };
  message?: string;
}

export interface TrendAlert {
  category: string;
  trend: string;
  score: number;
  venues: string[];
  expiresAt: string;
}

// ============================================
// Client
// ============================================

const createClient = (): AxiosInstance => {
  return axios.create({
    baseURL: AGENT_ORCHESTRATOR_URL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
  });
};

// ============================================
// Agent Orchestrator Service
// ============================================

class AgentOrchestratorService {
  private client: AxiosInstance;
  private insights: AgentInsight[] = [];
  private listeners: ((insight: AgentInsight) => void)[] = [];

  constructor() {
    this.client = createClient();
  }

  // ============================================
  // TASK MANAGEMENT
  // ============================================

  /**
   * Create a new agent task
   */
  async createTask(task: Partial<AgentTask>): Promise<{ success: boolean; taskId?: string }> {
    try {
      const response = await this.client.post('/api/tasks', {
        ...task,
        context: {
          appType: 'do-app',
          timestamp: new Date().toISOString(),
          ...task.context,
        },
      });
      return { success: true, taskId: response.data.task_id };
    } catch (error) {
      logger.warn('Create task failed:', error.message);
      return { success: false };
    }
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<AgentTask | null> {
    try {
      const response = await this.client.get(`/api/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      logger.warn('Get task status failed:', error.message);
      return null;
    }
  }

  // ============================================
  // DORMANCY & CHURN
  // ============================================

  /**
   * Check for dormancy alerts
   */
  async checkDormancyAlerts(userId: string): Promise<DormancyAlert | null> {
    try {
      const response = await this.client.get(`/api/alerts/dormancy/${userId}`);
      const alert = response.data;

      if (alert && alert.daysSinceActive > 7) {
        const insight: AgentInsight = {
          type: 'dormancy_alert',
          source: 'ChurnRiskAgent',
          confidence: alert.confidence || 0.8,
          reasoning: `User inactive for ${alert.daysSinceActive} days`,
          payload: alert,
          timestamp: new Date().toISOString(),
        };
        this.emitInsight(insight);
        return alert;
      }
      return null;
    } catch (error) {
      logger.warn('Dormancy check failed:', error.message);
      return null;
    }
  }

  /**
   * Trigger dormancy revival
   */
  async triggerRevival(alert: DormancyAlert): Promise<{ success: boolean; campaignId?: string }> {
    try {
      const response = await this.client.post('/api/revival/trigger', {
        userId: alert.userId,
        channel: alert.recommendedChannel,
        offer: alert.offer,
        alert,
      });
      return { success: true, campaignId: response.data.campaignId };
    } catch (error) {
      logger.warn('Revival trigger failed:', error.message);
      return { success: false };
    }
  }

  // ============================================
  // TRENDS
  // ============================================

  /**
   * Get trend alerts
   */
  async getTrendAlerts(location?: { lat: number; lng: number }): Promise<TrendAlert[]> {
    try {
      const response = await this.client.get('/api/alerts/trends', {
        params: location,
      });
      const alerts: TrendAlert[] = response.data?.alerts || [];

      alerts.forEach((alert) => {
        const insight: AgentInsight = {
          type: 'trend_alert',
          source: 'TrendDetectorAgent',
          confidence: alert.score,
          reasoning: `${alert.trend} trending in ${alert.category}`,
          payload: alert,
          timestamp: new Date().toISOString(),
        };
        this.emitInsight(insight);
      });

      return alerts;
    } catch (error) {
      logger.warn('Trend alerts failed:', error.message);
      return [];
    }
  }

  // ============================================
  // PERSONALIZATION
  // ============================================

  /**
   * Get personalization insights
   */
  async getPersonalizationInsights(userId: string): Promise<{
    personality: string;
    preferredChannels: string[];
    bestOfferTimes: string[];
  } | null> {
    try {
      const response = await this.client.get(`/api/insights/personalization/${userId}`);
      return response.data;
    } catch (error) {
      logger.warn('Personalization insights failed:', error.message);
      return null;
    }
  }

  // ============================================
  // REAL-TIME INSIGHTS
  // ============================================

  /**
   * Subscribe to insights
   */
  subscribe(callback: (insight: AgentInsight) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Emit insight to listeners
   */
  private emitInsight(insight: AgentInsight): void {
    this.insights.unshift(insight);
    if (this.insights.length > 100) {
      this.insights.pop();
    }
    this.listeners.forEach((callback) => callback(insight));
  }

  /**
   * Get recent insights
   */
  getRecentInsights(limit = 10): AgentInsight[] {
    return this.insights.slice(0, limit);
  }

  // ============================================
  // PREDICTIVE SCORING
  // ============================================

  /**
   * Get booking probability
   */
  async getBookingProbability(
    userId: string,
    entityId: string
  ): Promise<{ probability: number; factors: string[] }> {
    try {
      const response = await this.client.post('/api/predict/booking', {
        userId,
        entityId,
        appType: 'do-app',
      });
      return response.data;
    } catch (error) {
      logger.warn('Booking probability failed:', error.message);
      return { probability: 0.5, factors: ['default'] };
    }
  }

  /**
   * Get churn risk score
   */
  async getChurnRiskScore(userId: string): Promise<{
    score: number;
    level: 'low' | 'medium' | 'high';
    factors: string[];
  }> {
    try {
      const response = await this.client.get(`/api/predict/churn/${userId}`);
      return response.data;
    } catch (error) {
      logger.warn('Churn risk failed:', error.message);
      return { score: 0.3, level: 'low', factors: ['insufficient_data'] };
    }
  }

  /**
   * Get LTV prediction
   */
  async getLTVPrediction(userId: string): Promise<{
    ltv: number;
    tier: 'standard' | 'premium' | 'vip';
    confidence: number;
  }> {
    try {
      const response = await this.client.get(`/api/predict/ltv/${userId}`);
      return response.data;
    } catch (error) {
      logger.warn('LTV prediction failed:', error.message);
      return { ltv: 0, tier: 'standard', confidence: 0 };
    }
  }
}

// ============================================
// Export
// ============================================

export const agentOrchestrator = new AgentOrchestratorService();
export default agentOrchestrator;
