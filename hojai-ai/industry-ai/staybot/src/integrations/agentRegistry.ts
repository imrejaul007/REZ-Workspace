/**
 * STAYBOT - Agent Registry Integration
 * Registers StayBot AI agents with HOJAI Agent Registry (Port 4142)
 * Part of the RTNM Economic Network
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

const AGENT_REGISTRY_URL = process.env.HOJAI_AGENT_REGISTRY_URL || 'http://localhost:4142';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'hojai-dev-token';

export interface RegisteredAgent {
  agentId: string;
  agentName: string;
  agentType: string;
  capabilities: string[];
  status: 'active' | 'idle' | 'error';
  endpoints: string[];
  metadata: Record<string, any>;
  registeredAt: Date;
  lastHeartbeat: Date;
}

export interface AgentCapability {
  name: string;
  description: string;
  parameters?: Record<string, any>;
  returns: string;
}

export class AgentRegistry {
  private registeredAgents: Map<string, RegisteredAgent> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
  private httpClient: axios.AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      baseURL: AGENT_REGISTRY_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
    });
  }

  /**
   * Register a new agent with the registry
   */
  async registerAgent(agent: {
    agentId: string;
    agentName: string;
    agentType: string;
    capabilities: AgentCapability[];
    endpoints: string[];
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; agent?: RegisteredAgent; error?: string }> {
    try {
      const registeredAgent: RegisteredAgent = {
        agentId: agent.agentId,
        agentName: agent.agentName,
        agentType: agent.agentType,
        capabilities: agent.capabilities.map((c) => c.name),
        status: 'active',
        endpoints: agent.endpoints,
        metadata: agent.metadata || {},
        registeredAt: new Date(),
        lastHeartbeat: new Date(),
      };

      // Try to register with external registry
      try {
        await this.httpClient.post('/api/agents/register', {
          agentId: agent.agentId,
          agentName: agent.agentName,
          agentType: agent.agentType,
          capabilities: agent.capabilities,
          endpoints: agent.endpoints,
          metadata: agent.metadata,
          source: 'staybot',
        });
        logger.info(`Agent registered with HOJAI Registry: ${agent.agentId}`);
      } catch (externalError: any) {
        // If external registry is not available, use local registry
        logger.warn(`External registry unavailable, using local registry: ${externalError.message}`);
      }

      // Store locally
      this.registeredAgents.set(agent.agentId, registeredAgent);

      // Start heartbeat
      this.startHeartbeat(agent.agentId);

      logger.info(`Agent registered: ${agent.agentId}`, {
        agentId: agent.agentId,
        agentName: agent.agentName,
        capabilities: registeredAgent.capabilities,
      });

      return { success: true, agent: registeredAgent };
    } catch (error: any) {
      logger.error(`Agent registration failed: ${error.message}`, {
        agentId: agent.agentId,
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Stop heartbeat
      this.stopHeartbeat(agentId);

      // Try to unregister from external registry
      try {
        await this.httpClient.delete(`/api/agents/${agentId}`);
      } catch (externalError: any) {
        logger.warn(`External unregister failed: ${externalError.message}`);
      }

      // Remove from local registry
      this.registeredAgents.delete(agentId);

      logger.info(`Agent unregistered: ${agentId}`);
      return { success: true };
    } catch (error: any) {
      logger.error(`Agent unregistration failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(
    agentId: string,
    status: 'active' | 'idle' | 'error'
  ): Promise<{ success: boolean; error?: string }> {
    const agent = this.registeredAgents.get(agentId);
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    agent.status = status;
    agent.lastHeartbeat = new Date();
    this.registeredAgents.set(agentId, agent);

    // Try to update external registry
    try {
      await this.httpClient.patch(`/api/agents/${agentId}/status`, { status });
    } catch (externalError: any) {
      logger.warn(`External status update failed: ${externalError.message}`);
    }

    logger.info(`Agent status updated: ${agentId}`, { agentId, status });
    return { success: true };
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): RegisteredAgent | null {
    return this.registeredAgents.get(agentId) || null;
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): RegisteredAgent[] {
    return Array.from(this.registeredAgents.values());
  }

  /**
   * Find agents by capability
   */
  findAgentsByCapability(capability: string): RegisteredAgent[] {
    return Array.from(this.registeredAgents.values()).filter((agent) =>
      agent.capabilities.includes(capability)
    );
  }

  /**
   * Find agents by type
   */
  findAgentsByType(agentType: string): RegisteredAgent[] {
    return Array.from(this.registeredAgents.values()).filter(
      (agent) => agent.agentType === agentType
    );
  }

  /**
   * Send heartbeat to agent
   */
  private async sendHeartbeat(agentId: string): Promise<void> {
    const agent = this.registeredAgents.get(agentId);
    if (!agent) {
      this.stopHeartbeat(agentId);
      return;
    }

    agent.lastHeartbeat = new Date();

    try {
      await this.httpClient.post(`/api/agents/${agentId}/heartbeat`, {
        timestamp: new Date().toISOString(),
        status: agent.status,
      });
    } catch (error: any) {
      // If heartbeat fails, mark agent as potentially offline
      if (error.response?.status === 404) {
        // Agent not found in registry, re-register
        logger.warn(`Agent heartbeat failed, may need re-registration: ${agentId}`);
      }
    }
  }

  /**
   * Start heartbeat for agent
   */
  private startHeartbeat(agentId: string): void {
    // Stop existing heartbeat if any
    this.stopHeartbeat(agentId);

    // Send heartbeat every 30 seconds
    const interval = setInterval(() => {
      this.sendHeartbeat(agentId);
    }, 30000);

    this.heartbeatIntervals.set(agentId, interval);
  }

  /**
   * Stop heartbeat for agent
   */
  private stopHeartbeat(agentId: string): void {
    const interval = this.heartbeatIntervals.get(agentId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(agentId);
    }
  }

  /**
   * Shutdown all agents
   */
  async shutdown(): Promise<void> {
    for (const agentId of this.registeredAgents.keys()) {
      await this.unregisterAgent(agentId);
    }
    logger.info('All agents unregistered');
  }

  /**
   * Register all StayBot agents
   */
  async registerAllStayBotAgents(hotelId: string): Promise<void> {
    const agents = [
      {
        agentId: `staybot-frontdesk-${hotelId}`,
        agentName: 'AI Front Desk',
        agentType: 'front-desk',
        capabilities: [
          { name: 'check-in', description: 'Handle guest check-in', returns: 'Guest' },
          { name: 'check-out', description: 'Handle guest check-out', returns: 'Bill' },
          { name: 'complaint', description: 'Handle guest complaints', returns: 'Complaint' },
          { name: 'room-change', description: 'Handle room change requests', returns: 'Room' },
        ],
        endpoints: [`http://localhost:4840/api/ai/frontdesk`],
      },
      {
        agentId: `staybot-concierge-${hotelId}`,
        agentName: 'AI Concierge',
        agentType: 'concierge',
        capabilities: [
          { name: 'recommend', description: 'Get personalized recommendations', returns: 'Recommendation[]' },
          { name: 'book', description: 'Book external services', returns: 'Booking' },
          { name: 'info', description: 'Get local information', returns: 'string' },
        ],
        endpoints: [`http://localhost:4840/api/ai/concierge`],
      },
      {
        agentId: `staybot-housekeeping-${hotelId}`,
        agentName: 'AI Housekeeping',
        agentType: 'housekeeping',
        capabilities: [
          { name: 'schedule-clean', description: 'Schedule room cleaning', returns: 'Task' },
          { name: 'request-item', description: 'Request amenities', returns: 'Task' },
          { name: 'report-issue', description: 'Report maintenance issues', returns: 'Issue' },
        ],
        endpoints: [`http://localhost:4840/api/ai/housekeeping`],
      },
      {
        agentId: `staybot-roomservice-${hotelId}`,
        agentName: 'AI Room Service',
        agentType: 'room-service',
        capabilities: [
          { name: 'order-food', description: 'Order food to room', returns: 'Order' },
          { name: 'order-amenity', description: 'Order amenities', returns: 'Order' },
        ],
        endpoints: [`http://localhost:4840/api/ai/roomservice`],
      },
      {
        agentId: `staybot-revenue-${hotelId}`,
        agentName: 'AI Revenue Manager',
        agentType: 'revenue-manager',
        capabilities: [
          { name: 'price-room', description: 'Get dynamic room price', returns: 'Price' },
          { name: 'forecast', description: 'Forecast revenue', returns: 'Forecast' },
          { name: 'optimize', description: 'Optimize pricing', returns: 'PricingDecision' },
        ],
        endpoints: [`http://localhost:4840/api/ai/revenue`],
      },
      {
        agentId: `staybot-bellhop-${hotelId}`,
        agentName: 'AI Bellhop',
        agentType: 'bellhop',
        capabilities: [
          { name: 'deliver', description: 'Deliver items to room', returns: 'Delivery' },
          { name: 'pickup', description: 'Pickup items from room', returns: 'Pickup' },
          { name: 'luggage', description: 'Handle luggage', returns: 'LuggageRequest' },
        ],
        endpoints: [`http://localhost:4840/api/ai/bellhop`],
      },
    ];

    for (const agent of agents) {
      await this.registerAgent(agent);
    }

    logger.info(`All StayBot agents registered for hotel: ${hotelId}`);
  }
}

export const agentRegistry = new AgentRegistry();
export default AgentRegistry;