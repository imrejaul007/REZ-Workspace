/**
 * REZ Revenue AI - Revenue Agent
 * Autonomous AI Agent for Revenue Optimization
 *
 * Connects REZ Revenue AI to Hojai Agent Platform patterns
 * Enables autonomous pricing, campaigns, and recommendations
 *
 * Port: 4330
 */

import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import axios from 'axios';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })],
});

// ================== SERVICE URLs ==================

const SERVICES = {
  pricing: process.env.PRICING_URL || 'http://localhost:4301',
  forecast: process.env.DEMAND_FORECAST_URL || 'http://localhost:4302',
  offers: process.env.OFFER_URL || 'http://localhost:4303',
  cashback: process.env.CASHBACK_URL || 'http://localhost:4304',
  copilot: process.env.COPILOT_URL || 'http://localhost:4307',
  simulation: process.env.SIMULATION_URL || 'http://localhost:4308',
  benchmark: process.env.BENCHMARK_URL || 'http://localhost:4309',
  segments: process.env.SEGMENTS_URL || 'http://localhost:4310',
  campaigns: process.env.CAMPAIGNS_URL || 'http://localhost:4311',
  gpt: process.env.GPT_URL || 'http://localhost:4312',
};

// ================== TYPES ==================

interface AgentTask {
  id: string;
  type: 'pricing' | 'campaign' | 'forecast' | 'recommendation' | 'alert';
  status: 'pending' | 'running' | 'completed' | 'failed';
  merchantId: string;
  params: Record<string, unknown>;
  result?: unknown;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

interface AutonomousConfig {
  merchantId: string;
  enabled: boolean;
  actions: {
    autoPricing: boolean;
    autoCampaigns: boolean;
    autoCashback: boolean;
    autoRecommendations: boolean;
  };
  constraints: {
    maxPriceChange: number;
    maxDiscount: number;
    maxCashback: number;
    maxCampaignCost: number;
  };
  schedule: {
    checkIntervalMinutes: number;
    autoAct: boolean;
  };
}

// ================== AGENT STORAGE ==================

const agentTasks = new Map<string, AgentTask>();
const merchantConfigs = new Map<string, AutonomousConfig>();
const agentMemory = new Map<string, Array<{ role: string; content: string; timestamp: string }>>();

// ================== REVENUE AGENT CLASS ==================

class RevenueAgent {
  /**
   * Process task autonomously
   */
  async processTask(task: AgentTask): Promise<void> {
    task.status = 'running';
    agentTasks.set(task.id, task);

    try {
      switch (task.type) {
        case 'pricing':
          task.result = await this.executePricingTask(task);
          break;
        case 'campaign':
          task.result = await this.executeCampaignTask(task);
          break;
        case 'forecast':
          task.result = await this.executeForecastTask(task);
          break;
        case 'recommendation':
          task.result = await this.executeRecommendationTask(task);
          break;
        case 'alert':
          task.result = await this.executeAlertTask(task);
          break;
      }

      task.status = 'completed';
      task.completedAt = new Date().toISOString();
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Task failed', { taskId: task.id, error });
    }

    agentTasks.set(task.id, task);
  }

  /**
   * Execute pricing task
   */
  private async executePricingTask(task: AgentTask): Promise<unknown> {
    const { merchantId, params } = task;

    // Get current benchmark
    const benchmark = await this.callService('benchmark', `/api/v1/benchmarks/${merchantId}`);

    // Get segments
    const segments = await this.callService('segments', `/api/v1/segments/${merchantId}/summary`);

    // Generate pricing recommendations
    const recommendations = await this.callService('copilot', '/api/v1/copilot/revenue-plan', {
      merchantId,
      goal: { type: 'revenue', target: 50000, timeframe: 'month' },
    });

    return {
      benchmark,
      segments,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Execute campaign task
   */
  private async executeCampaignTask(task: AgentTask): Promise<unknown> {
    const { merchantId, params } = task;

    const campaign = await this.callService('campaigns', '/api/v1/campaigns/generate', {
      merchantId,
      objective: params.objective || 'retention',
      target: params.target || 'existing',
      offer: params.offer || { type: 'discount', value: 15 },
      channels: params.channels || ['whatsapp', 'sms'],
    });

    return { campaign, generatedAt: new Date().toISOString() };
  }

  /**
   * Execute forecast task
   */
  private async executeForecastTask(task: AgentTask): Promise<unknown> {
    const { merchantId, params } = task;

    const forecast = await this.callService('forecast', '/api/v1/forecast', {
      merchantId,
      vertical: params.vertical || 'restaurant',
      category: params.category || 'general',
      location: params.location || { city: 'Bangalore', tier: 1 },
      horizon: params.horizon || 'week',
    });

    return { forecast, generatedAt: new Date().toISOString() };
  }

  /**
   * Execute recommendation task
   */
  private async executeRecommendationTask(task: AgentTask): Promise<unknown> {
    const { merchantId, params } = task;

    // Get MerchantGPT recommendation
    const response = await this.callService('gpt', '/api/v1/chat', {
      merchantId,
      message: params.question || 'What should I do to increase revenue?',
    });

    // Simulate impact
    const simulation = await this.callService('simulation', '/api/v1/simulation/run', {
      merchantId,
      scenario: {
        type: 'pricing',
        changes: { priceChange: 10 },
        description: '10% price increase',
      },
    });

    return { response, simulation, generatedAt: new Date().toISOString() };
  }

  /**
   * Execute alert task
   */
  private async executeAlertTask(task: AgentTask): Promise<unknown> {
    const { merchantId, params } = task;

    // Check benchmark score
    const benchmark = await this.callService('benchmark', `/api/v1/benchmarks/${merchantId}`);

    // Get segments for churn risk
    const segments = await this.callService('segments', `/api/v1/segments/${merchantId}`);

    const alerts: Array<{ type: string; severity: string; message: string }> = [];

    // Check score
    if (benchmark?.overallScore < 60) {
      alerts.push({
        type: 'score',
        severity: 'high',
        message: `Revenue score is ${benchmark.overallScore} - below average`,
      });
    }

    // Check churn risk
    const churnSegment = segments?.segments?.find((s: any) => s.id === 'churn_risks');
    if (churnSegment && churnSegment.percentage > 15) {
      alerts.push({
        type: 'churn',
        severity: 'high',
        message: `${churnSegment.percentage}% customers at risk of churning`,
      });
    }

    return { alerts, benchmark, generatedAt: new Date().toISOString() };
  }

  /**
   * Call REZ Revenue AI service
   */
  private async callService(service: keyof typeof SERVICES, path: string, body?: unknown): Promise<unknown> {
    try {
      const response = await axios.post(`${SERVICES[service]}${path}`, body || {}, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      return response.data.success ? response.data.data : null;
    } catch (error) {
      logger.error(`Service ${service} call failed`, { path, error });
      return null;
    }
  }

  /**
   * Chat with agent memory
   */
  async chat(merchantId: string, message: string): Promise<{ response: string; actions?: unknown[] }> {
    // Get or create memory
    if (!agentMemory.has(merchantId)) {
      agentMemory.set(merchantId, []);
    }
    const memory = agentMemory.get(merchantId)!;

    // Add user message
    memory.push({ role: 'user', content: message, timestamp: new Date().toISOString() });

    // Call MerchantGPT
    const gptResponse = await this.callService('gpt', '/api/v1/chat', {
      merchantId,
      message,
    });

    // Add to memory
    if (gptResponse) {
      memory.push({
        role: 'assistant',
        content: (gptResponse as any).response || '',
        timestamp: new Date().toISOString(),
      });

      // Keep last 20 messages
      if (memory.length > 20) {
        memory.shift();
      }
    }

    return {
      response: (gptResponse as any)?.response || 'I apologize, I had trouble processing that.',
      actions: (gptResponse as any)?.actions,
    };
  }

  /**
   * Get autonomous actions
   */
  async getAutonomousActions(merchantId: string): Promise<unknown[]> {
    const actions: unknown[] = [];

    // Get current state
    const benchmark = await this.callService('benchmark', `/api/v1/benchmarks/${merchantId}`);
    const segments = await this.callService('segments', `/api/v1/segments/${merchantId}/summary`);

    // Check for quick wins
    if ((benchmark as any)?.overallScore < 75) {
      actions.push({
        type: 'pricing',
        title: 'Optimize pricing',
        description: 'Your pricing score is below average. Consider dynamic pricing.',
        potential: 10000,
        effort: 'low',
      });
    }

    // Check churn
    const churnSegment = (segments as any)?.segments?.find((s: any) => s.name === 'Churn Risks');
    if (churnSegment && churnSegment.count > 20) {
      actions.push({
        type: 'campaign',
        title: 'Win-back campaign',
        description: `${churnSegment.count} customers at risk. Send win-back offers.`,
        potential: 15000,
        effort: 'medium',
      });
    }

    return actions;
  }
}

// ================== EXPRESS APP ==================

const app = express();
const agent = new RevenueAgent();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '5mb' }));

// Health
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-revenue-ai-revenue-agent',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ================== AGENT ENDPOINTS ==================

/**
 * POST /api/v1/agent/task
 * Create and execute autonomous task
 */
app.post('/api/v1/agent/task', async (req: Request, res: Response) => {
  const { merchantId, type, params } = req.body;

  if (!merchantId || !type) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'merchantId and type required' },
    });
  }

  const task: AgentTask = {
    id: uuidv4(),
    type,
    status: 'pending',
    merchantId,
    params: params || {},
    createdAt: new Date().toISOString(),
  };

  // Process task asynchronously
  agent.processTask(task);

  res.json({
    success: true,
    data: { taskId: task.id, status: task.status },
  });
});

/**
 * GET /api/v1/agent/task/:id
 * Get task status/result
 */
app.get('/api/v1/agent/task/:id', (req: Request, res: Response) => {
  const task = agentTasks.get(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Task not found' },
    });
  }

  res.json({ success: true, data: task });
});

/**
 * POST /api/v1/agent/chat
 * Chat with Revenue Agent
 */
app.post('/api/v1/agent/chat', async (req: Request, res: Response) => {
  const { merchantId, message } = req.body;

  if (!merchantId || !message) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'merchantId and message required' },
    });
  }

  const response = await agent.chat(merchantId, message);

  res.json({ success: true, data: response });
});

/**
 * GET /api/v1/agent/actions/:merchantId
 * Get autonomous actions
 */
app.get('/api/v1/agent/actions/:merchantId', async (req: Request, res: Response) => {
  const actions = await agent.getAutonomousActions(req.params.merchantId);

  res.json({ success: true, data: { actions } });
});

/**
 * POST /api/v1/agent/autonomous/start
 * Start autonomous mode
 */
app.post('/api/v1/agent/autonomous/start', (req: Request, res: Response) => {
  const { merchantId, config } = req.body;

  merchantConfigs.set(merchantId, {
    merchantId,
    enabled: true,
    actions: config?.actions || {
      autoPricing: true,
      autoCampaigns: true,
      autoCashback: true,
      autoRecommendations: true,
    },
    constraints: config?.constraints || {
      maxPriceChange: 0.1,
      maxDiscount: 0.2,
      maxCashback: 0.15,
      maxCampaignCost: 10000,
    },
    schedule: config?.schedule || {
      checkIntervalMinutes: 60,
      autoAct: false,
    },
  });

  res.json({
    success: true,
    data: { merchantId, enabled: true, message: 'Autonomous mode started' },
  });
});

/**
 * POST /api/v1/agent/autonomous/stop
 * Stop autonomous mode
 */
app.post('/api/v1/agent/autonomous/stop', (req: Request, res: Response) => {
  const { merchantId } = req.body;

  const config = merchantConfigs.get(merchantId);
  if (config) {
    config.enabled = false;
    merchantConfigs.set(merchantId, config);
  }

  res.json({
    success: true,
    data: { merchantId, enabled: false, message: 'Autonomous mode stopped' },
  });
});

/**
 * GET /api/v1/agent/autonomous/:merchantId
 * Get autonomous config
 */
app.get('/api/v1/agent/autonomous/:merchantId', (req: Request, res: Response) => {
  const config = merchantConfigs.get(req.params.merchantId);

  res.json({
    success: true,
    data: config || { merchantId: req.params.merchantId, enabled: false },
  });
});

/**
 * GET /api/v1/agent/tasks/:merchantId
 * Get all tasks for merchant
 */
app.get('/api/v1/agent/tasks/:merchantId', (req: Request, res: Response) => {
  const tasks = Array.from(agentTasks.values())
    .filter(t => t.merchantId === req.params.merchantId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, data: { tasks } });
});

const PORT = process.env.PORT || 4330;

app.listen(PORT, () => {
  logger.info('REZ Revenue AI Revenue Agent started', { port: PORT });
});

export default app;
