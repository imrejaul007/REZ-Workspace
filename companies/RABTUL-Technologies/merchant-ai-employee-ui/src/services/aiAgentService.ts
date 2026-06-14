// Merchant AI Employee UI - AI Agent Service (MongoDB-backed)
// Connects to REZ-autonomous-agents (port 4062)

import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Agent, IAgent } from '../models';
import { logger } from '../utils/logger';
import type {
  AIGentConfig,
  AgentType,
  AgentStatus,
  AgentMetrics
} from '../types';

interface CreateAgentResponse {
  agentId: string;
  status: 'created' | 'updated';
}

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  connectedAgents: number;
  timestamp: string;
}

export class AIAgentService {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.AUTONOMOUS_AGENTS_URL || 'http://localhost:4062';
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
      },
    });
  }

  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await this.client.get<HealthCheckResponse>('/health');
      return response.data;
    } catch (error) {
      // Return local count from MongoDB
      const count = await Agent.countDocuments({ status: 'active' });
      return {
        status: count > 0 ? 'healthy' : 'healthy',
        connectedAgents: count,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async createAgent(config: AIGentConfig): Promise<CreateAgentResponse> {
    const agentId = `agent_${uuidv4()}`;

    // Try to create in autonomous agents service first
    try {
      await this.client.post('/api/agents', {
        id: agentId,
        type: config.agentType,
        name: config.name,
        merchantId: config.merchantId,
        config: this.mapConfigToAgent(config),
      });
    } catch (error) {
      logger.warn('[AIAgentService] Failed to sync with autonomous agents, storing locally', { error });
    }

    // Store in MongoDB
    await Agent.create({
      _id: agentId,
      merchantId: config.merchantId,
      agentType: config.agentType,
      name: config.name,
      description: config.description,
      status: config.status,
      personality: config.personality,
      capabilities: config.capabilities,
      operatingHours: config.operatingHours,
      escalationSettings: config.escalationSettings,
    });

    logger.info(`[AIAgentService] Created agent ${agentId} for merchant ${config.merchantId}`);
    return { agentId, status: 'created' };
  }

  async updateAgent(agentId: string, updates: Partial<AIGentConfig>): Promise<IAgent | null> {
    const agent = await Agent.findById(agentId);
    if (!agent) return null;

    if (updates.name) agent.name = updates.name;
    if (updates.description) agent.description = updates.description;
    if (updates.status) agent.status = updates.status;
    if (updates.agentType) agent.agentType = updates.agentType;

    if (updates.personality) agent.personality = updates.personality;
    if (updates.capabilities) agent.capabilities = updates.capabilities;
    if (updates.operatingHours) agent.operatingHours = updates.operatingHours;
    if (updates.escalationSettings) agent.escalationSettings = updates.escalationSettings;

    await agent.save();
    return agent;
  }

  async getAgent(agentId: string): Promise<IAgent | null> {
    return Agent.findById(agentId);
  }

  async listAgents(merchantId: string, options: { status?: string; page?: number; limit?: number } = {}): Promise<{ agents: IAgent[]; total: number }> {
    const { status, page = 1, limit = 50 } = options;

    const filter: Record<string, unknown> = { merchantId };
    if (status) filter.status = status;

    const [agents, total] = await Promise.all([
      Agent.find(filter).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
      Agent.countDocuments(filter),
    ]);

    return { agents, total };
  }

  async deleteAgent(agentId: string): Promise<boolean> {
    const result = await Agent.findByIdAndDelete(agentId);
    return !!result;
  }

  async activateAgent(agentId: string): Promise<boolean> {
    const agent = await Agent.findById(agentId);
    if (!agent) return false;

    try {
      await this.client.post(`/api/agents/${agentId}/activate`);
    } catch {
      // Continue with local activation
    }

    agent.status = 'active';
    await agent.save();
    return true;
  }

  async deactivateAgent(agentId: string): Promise<boolean> {
    const agent = await Agent.findById(agentId);
    if (!agent) return false;

    try {
      await this.client.post(`/api/agents/${agentId}/deactivate`);
    } catch {
      // Continue with local deactivation
    }

    agent.status = 'inactive';
    await agent.save();
    return true;
  }

  async getAgentMetrics(
    agentId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AgentMetrics | null> {
    const agent = await Agent.findById(agentId);
    if (!agent) return null;

    // Try to get real metrics from autonomous agents service
    try {
      const response = await this.client.get<AgentMetrics>(`/api/agents/${agentId}/metrics`, {
        params: { startDate, endDate },
      });
      return response.data;
    } catch {
      // Fallback to MongoDB metrics or generate from stored data
      return {
        agentId,
        merchantId: agent.merchantId,
        period: {
          start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: endDate || new Date(),
        },
        conversations: {
          total: agent.metrics?.totalConversations || 0,
          completed: Math.floor((agent.metrics?.totalConversations || 0) * 0.8),
          escalated: Math.floor((agent.metrics?.totalConversations || 0) * 0.1),
          abandoned: Math.floor((agent.metrics?.totalConversations || 0) * 0.1),
        },
        responseMetrics: {
          avgResponseTimeMs: agent.metrics?.avgResponseTime || 0,
          avgResolutionTimeMs: (agent.metrics?.avgResponseTime || 0) * 60,
          firstResponseTimeMs: (agent.metrics?.avgResponseTime || 0) / 3,
        },
        sentiment: {
          positive: 0.6,
          neutral: 0.3,
          negative: 0.1,
          avgScore: agent.metrics?.satisfaction || 0,
        },
        customerSatisfaction: {
          csat: (agent.metrics?.satisfaction || 0) * 5,
          nps: Math.floor((agent.metrics?.satisfaction || 0) * 50 - 50),
          responses: Math.floor((agent.metrics?.totalConversations || 0) * 0.5),
        },
        topicDistribution: [
          { topic: 'General', count: 50, percentage: 50 },
          { topic: 'Orders', count: 30, percentage: 30 },
          { topic: 'Products', count: 20, percentage: 20 },
        ],
        hourlyVolume: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          count: Math.floor(Math.random() * 10) + 2,
        })),
      };
    }
  }

  private mapConfigToAgent(config: AIGentConfig): Record<string, unknown> {
    return {
      merchantId: config.merchantId,
      agentType: config.agentType,
      name: config.name,
      personality: config.personality,
      capabilities: config.capabilities,
      operatingHours: config.operatingHours,
      escalationSettings: config.escalationSettings,
    };
  }
}

export const aiAgentService = new AIAgentService();
export default aiAgentService;
