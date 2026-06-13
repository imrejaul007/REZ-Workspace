/**
 * RTMN Unified Fabric
 * Central orchestration layer connecting all RTMN services
 *
 * This module provides:
 * 1. Event Bus integration (Redis-based pub/sub)
 * 2. Schema Registry for cross-system events
 * 3. Service Registry for all services
 * 4. Cross-system flow orchestration
 * 5. Health monitoring for all services
 */

import express from 'express';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const app = express();
const PORT = process.env.PORT || 4500;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// ============================================
// SCHEMA REGISTRY
// ============================================
const SchemaRegistry = {
  // Event schemas for cross-system communication
  schemas: {
    'twin.updated': {
      type: 'object',
      required: ['twinId', 'industry', 'changes', 'timestamp'],
      properties: {
        twinId: { type: 'string' },
        industry: { type: 'string' },
        changes: { type: 'object' },
        timestamp: { type: 'string' }
      }
    },
    'agent.executed': {
      type: 'object',
      required: ['agentId', 'task', 'result', 'timestamp'],
      properties: {
        agentId: { type: 'string' },
        task: { type: 'string' },
        result: { type: 'object' },
        timestamp: { type: 'string' }
      }
    },
    'intent.detected': {
      type: 'object',
      required: ['userId', 'intent', 'confidence', 'timestamp'],
      properties: {
        userId: { type: 'string' },
        intent: { type: 'string' },
        confidence: { type: 'number' },
        timestamp: { type: 'string' }
      }
    },
    'copilot.query': {
      type: 'object',
      required: ['query', 'industry', 'sessionId', 'timestamp'],
      properties: {
        query: { type: 'string' },
        industry: { type: 'string' },
        sessionId: { type: 'string' },
        timestamp: { type: 'string' }
      }
    },
    'copilot.response': {
      type: 'object',
      required: ['sessionId', 'response', 'sources', 'timestamp'],
      properties: {
        sessionId: { type: 'string' },
        response: { type: 'string' },
        sources: { type: 'array' },
        timestamp: { type: 'string' }
      }
    },
    'sutar.contract': {
      type: 'object',
      required: ['contractId', 'parties', 'terms', 'timestamp'],
      properties: {
        contractId: { type: 'string' },
        parties: { type: 'array' },
        terms: { type: 'object' },
        timestamp: { type: 'string' }
      }
    },
    'nexha.order': {
      type: 'object',
      required: ['orderId', 'type', 'amount', 'timestamp'],
      properties: {
        orderId: { type: 'string' },
        type: { type: 'string' },
        amount: { type: 'number' },
        timestamp: { type: 'string' }
      }
    }
  },

  validate(eventType, data) {
    const schema = this.schemas[eventType];
    if (!schema) {
      logger.warn(`Unknown event type: ${eventType}`);
      return { valid: true }; // Allow unknown events
    }

    // Basic validation
    for (const field of schema.required || []) {
      if (!data[field]) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    return { valid: true };
  },

  getSchema(eventType) {
    return this.schemas[eventType] || null;
  },

  getAllSchemas() {
    return this.schemas;
  }
};

// ============================================
// SERVICE REGISTRY
// ============================================
const ServiceRegistry = {
  services: new Map(),

  register(service) {
    this.services.set(service.id, {
      ...service,
      registeredAt: new Date().toISOString(),
      status: 'healthy'
    });
    logger.info(`Service registered: ${service.id}`);
  },

  unregister(serviceId) {
    this.services.delete(serviceId);
    logger.info(`Service unregistered: ${serviceId}`);
  },

  get(serviceId) {
    return this.services.get(serviceId);
  },

  getAll() {
    return Array.from(this.services.values());
  },

  getByCategory(category) {
    return Array.from(this.services.values()).filter(s => s.category === category);
  },

  getStatus() {
    return {
      total: this.services.size,
      healthy: Array.from(this.services.values()).filter(s => s.status === 'healthy').length,
      unhealthy: Array.from(this.services.values()).filter(s => s.status === 'unhealthy').length
    };
  },

  // Pre-register known RTMN services
  initialize() {
    // Core Platform
    this.register({ id: 'api-gateway', name: 'API Gateway', port: 3000, category: 'core', url: 'http://localhost:3000' });
    this.register({ id: 'twinos-hub', name: 'TwinOS Hub', port: 4000, category: 'core', url: 'http://localhost:4000' });
    this.register({ id: 'agentos-hub', name: 'AgentOS Hub', port: 4001, category: 'core', url: 'http://localhost:4001' });
    this.register({ id: 'business-copilot', name: 'Business Copilot', port: 4002, category: 'core', url: 'http://localhost:4002' });

    // Foundation Services (NEW)
    this.register({ id: 'corpId-service', name: 'CorpID Service', port: 4702, category: 'foundation', url: 'http://localhost:4702' });
    this.register({ id: 'memory-os', name: 'MemoryOS', port: 4703, category: 'foundation', url: 'http://localhost:4703' });

    // SUTAR OS
    this.register({ id: 'sutar-gateway', name: 'SUTAR Gateway', port: 4140, category: 'sutar', url: 'http://localhost:4140' });
    this.register({ id: 'sutar-trust-engine', name: 'Trust Engine', port: 4180, category: 'sutar', url: 'http://localhost:4180' });
    this.register({ id: 'sutar-contract-os', name: 'Contract OS', port: 4190, category: 'sutar', url: 'http://localhost:4190' });
    this.register({ id: 'sutar-negotiation-engine', name: 'Negotiation Engine', port: 4191, category: 'sutar', url: 'http://localhost:4191' });
    this.register({ id: 'sutar-twin-os', name: 'Twin OS', port: 4142, category: 'sutar', url: 'http://localhost:4142' });
    this.register({ id: 'sutar-memory-bridge', name: 'Memory Bridge', port: 4143, category: 'sutar', url: 'http://localhost:4143' });
    this.register({ id: 'sutar-intent-bus', name: 'Intent Bus', port: 4154, category: 'sutar', url: 'http://localhost:4154' });
    this.register({ id: 'sutar-agent-network', name: 'Agent Network', port: 4155, category: 'sutar', url: 'http://localhost:4155' });
    this.register({ id: 'sutar-decision-engine', name: 'Decision Engine', port: 4240, category: 'sutar', url: 'http://localhost:4240' });
    this.register({ id: 'sutar-simulation-os', name: 'Simulation OS', port: 4241, category: 'sutar', url: 'http://localhost:4241' });
    this.register({ id: 'sutar-goal-os', name: 'Goal OS', port: 4242, category: 'sutar', url: 'http://localhost:4242' });
    this.register({ id: 'sutar-marketplace', name: 'Marketplace', port: 4250, category: 'sutar', url: 'http://localhost:4250' });
    this.register({ id: 'agent-economy', name: 'Agent Economy', port: 4251, category: 'sutar', url: 'http://localhost:4251' });
    this.register({ id: 'sutar-monitoring', name: 'Monitoring', port: 3100, category: 'sutar', url: 'http://localhost:3100' });

    // Genie OS
    this.register({ id: 'genie-personal-os-gateway', name: 'Genie Gateway', port: 5000, category: 'genie', url: 'http://localhost:5000' });
    this.register({ id: 'genie-memory-service', name: 'Memory Service', port: 5001, category: 'genie', url: 'http://localhost:5001' });
    this.register({ id: 'genie-briefing-service', name: 'Briefing Service', port: 5002, category: 'genie', url: 'http://localhost:5002' });
    this.register({ id: 'genie-business-intelligence', name: 'Business Intelligence', port: 5003, category: 'genie', url: 'http://localhost:5003' });

    // RABTUL
    this.register({ id: 'rez-auth', name: 'RABTUL Auth', port: 4002, category: 'rabtul', url: 'http://localhost:4002' });
    this.register({ id: 'rez-payment', name: 'RABTUL Payment', port: 4001, category: 'rabtul', url: 'http://localhost:4001' });
    this.register({ id: 'rez-wallet', name: 'RABTUL Wallet', port: 4004, category: 'rabtul', url: 'http://localhost:4004' });
    this.register({ id: 'rez-profile', name: 'REZ Profile', port: 4005, category: 'rabtul', url: 'http://localhost:4005' });
    this.register({ id: 'rez-merchant', name: 'REZ Merchant', port: 4003, category: 'rabtul', url: 'http://localhost:4003' });

    // Nexha Commerce
    this.register({ id: 'nexha-gateway', name: 'Nexha Gateway', port: 5002, category: 'nexha', url: 'http://localhost:5002' });
    this.register({ id: 'nexha-distribution', name: 'DistributionOS', port: 4300, category: 'nexha', url: 'http://localhost:4300' });
    this.register({ id: 'nexha-franchise', name: 'FranchiseOS', port: 4310, category: 'nexha', url: 'http://localhost:4310' });
    this.register({ id: 'nexha-procurement', name: 'ProcurementOS', port: 4320, category: 'nexha', url: 'http://localhost:4320' });
    this.register({ id: 'nexha-manufacturing', name: 'ManufacturingOS', port: 4330, category: 'nexha', url: 'http://localhost:4330' });
    this.register({ id: 'nexha-trade-finance', name: 'TradeFinance', port: 4340, category: 'nexha', url: 'http://localhost:4340' });
    this.register({ id: 'nexha-intelligence', name: 'Intelligence', port: 4350, category: 'nexha', url: 'http://localhost:4350' });
    this.register({ id: 'nexha-connector', name: 'Ecosystem Connector', port: 4399, category: 'nexha', url: 'http://localhost:4399' });

    // REE Services
    this.register({ id: 'ree-ops-center', name: 'Ops Center', port: 3000, category: 'ree', url: 'http://localhost:3000' });
    this.register({ id: 'ree-trust-platform', name: 'Trust Platform', port: 3001, category: 'ree', url: 'http://localhost:3001' });
    this.register({ id: 'ree-growth-engine', name: 'Growth Engine', port: 3002, category: 'ree', url: 'http://localhost:3002' });
    this.register({ id: 'ree-logistics-engine', name: 'Logistics Engine', port: 3003, category: 'ree', url: 'http://localhost:3003' });
    this.register({ id: 'ree-attribution-engine', name: 'Attribution Engine', port: 3004, category: 'ree', url: 'http://localhost:3004' });

    // AdBazaar Media
    this.register({ id: 'adbazaar-backend', name: 'AdBazaar Backend', port: 4085, category: 'media', url: 'http://localhost:4085' });
    this.register({ id: 'rez-ads', name: 'REZ Ads', port: 3005, category: 'media', url: 'http://localhost:3005' });
    this.register({ id: 'rez-dooh-intelligence', name: 'DOOH Intelligence', port: 4080, category: 'media', url: 'http://localhost:4080' });
    this.register({ id: 'rez-dooh-attribution', name: 'DOOH Attribution', port: 4081, category: 'media', url: 'http://localhost:4081' });
    this.register({ id: 'rez-pricing-engine', name: 'Pricing Engine', port: 4016, category: 'media', url: 'http://localhost:4016' });

    logger.info(`Service Registry initialized with ${this.services.size} services`);
  }
};

// ============================================
// EVENT BUS
// ============================================
const EventBus = {
  subscribers: new Map(),

  async publish(topic, event) {
    const id = `evt_${Date.now()}_${uuidv4().slice(0, 8)}`;
    const fullEvent = {
      ...event,
      id,
      topic,
      timestamp: new Date().toISOString()
    };

    // Validate schema
    const validation = SchemaRegistry.validate(topic, fullEvent);
    if (!validation.valid) {
      throw new Error(`Schema validation failed: ${validation.error}`);
    }

    // Store in Redis
    await redis.lpush(`fabric:topic:${topic}`, JSON.stringify(fullEvent));
    await redis.expire(`fabric:topic:${topic}`, 86400);

    // Notify subscribers
    const subs = this.subscribers.get(topic) || [];
    for (const callback of subs) {
      try {
        await callback(fullEvent);
      } catch (err) {
        logger.error(`Subscriber error for ${topic}:`, err);
      }
    }

    logger.info(`Event published: ${topic}`, { id: fullEvent.id });
    return id;
  },

  subscribe(topic, callback) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);
    }
    this.subscribers.get(topic).push(callback);
    logger.info(`Subscribed to topic: ${topic}`);
  },

  async getEvents(topic, limit = 100) {
    const raw = await redis.lrange(`fabric:topic:${topic}`, 0, limit - 1);
    return raw.map(e => JSON.parse(e));
  }
};

// ============================================
// CROSS-SYSTEM FLOW ORCHESTRATOR
// ============================================
const FlowOrchestrator = {
  /**
   * Execute a cross-system flow
   * Example: Question → Twin → Memory → Intelligence → Answer
   */
  async executeFlow(flowId, context) {
    const flows = {
      'copilot-query': async (ctx) => {
        // 1. Query TwinOS Hub for relevant twins
        const twinResponse = await fetch('http://localhost:4000/twins/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: ctx.query, industry: ctx.industry })
        });
        const twins = await twinResponse.json();

        // 2. Query Genie Memory for context
        const memoryResponse = await fetch('http://localhost:5001/memory/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: ctx.query, userId: ctx.userId })
        });
        const memory = await memoryResponse.json();

        // 3. Query Nexha Intelligence if commerce context
        let intelligence = null;
        if (ctx.industry === 'retail' || ctx.industry === 'restaurant') {
          const intelResponse = await fetch('http://localhost:4350/api/insights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: ctx.query })
          });
          intelligence = await intelResponse.json();
        }

        // 4. Aggregate and return
        return {
          twins,
          memory,
          intelligence,
          sources: ['twinos-hub', 'genie-memory', 'nexha-intelligence'].filter(Boolean)
        };
      },

      'revenue-analysis': async (ctx) => {
        // 1. Get business twin data
        const businessTwin = await fetch('http://localhost:4000/twins/business', {
          headers: { 'X-Industry': ctx.industry }
        }).then(r => r.json());

        // 2. Get revenue data from Nexha
        const revenueData = await fetch('http://localhost:4300/api/analytics/revenue', {
          headers: { 'X-Industry': ctx.industry }
        }).then(r => r.json());

        // 3. Get market intelligence
        const marketIntel = await fetch('http://localhost:4350/api/analytics/market', {
          headers: { 'X-Industry': ctx.industry }
        }).then(r => r.json());

        // 4. Analyze with SUTAR Decision Engine
        const analysis = await fetch('http://localhost:4240/api/decide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context: { businessTwin, revenueData, marketIntel },
            question: ctx.question
          })
        }).then(r => r.json());

        return {
          analysis,
          revenueData,
          marketIntel,
          recommendations: analysis.recommendations
        };
      }
    };

    const flow = flows[flowId];
    if (!flow) {
      throw new Error(`Unknown flow: ${flowId}`);
    }

    return flow(context);
  }
};

// ============================================
// MIDDLEWARE
// ============================================
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.path,
      duration: Date.now() - start,
      status: res.statusCode
    });
  });
  next();
});

// ============================================
// HEALTH & STATUS
// ============================================
app.get('/health', async (req, res) => {
  const serviceStatus = ServiceRegistry.getStatus();

  res.json({
    status: 'healthy',
    service: 'unified-fabric',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: serviceStatus,
    schemas: Object.keys(SchemaRegistry.schemas).length
  });
});

// ============================================
// SCHEMA REGISTRY API
// ============================================
app.get('/schemas', (req, res) => {
  res.json(SchemaRegistry.getAllSchemas());
});

app.get('/schemas/:eventType', (req, res) => {
  const schema = SchemaRegistry.getSchema(req.params.eventType);
  if (!schema) {
    return res.status(404).json({ error: 'Schema not found' });
  }
  res.json(schema);
});

// ============================================
// SERVICE REGISTRY API
// ============================================
app.get('/services', (req, res) => {
  const { category } = req.query;
  if (category) {
    res.json(ServiceRegistry.getByCategory(category));
  } else {
    res.json(ServiceRegistry.getAll());
  }
});

app.get('/services/:serviceId', (req, res) => {
  const service = ServiceRegistry.get(req.params.serviceId);
  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }
  res.json(service);
});

app.post('/services', (req, res) => {
  ServiceRegistry.register(req.body);
  res.json({ success: true });
});

app.delete('/services/:serviceId', (req, res) => {
  ServiceRegistry.unregister(req.params.serviceId);
  res.json({ success: true });
});

// ============================================
// EVENT BUS API
// ============================================
app.post('/events/publish', async (req, res) => {
  try {
    const { topic, event } = req.body;
    const id = await EventBus.publish(topic, event);
    res.json({ success: true, eventId: id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/events/:topic', async (req, res) => {
  const { limit = 100 } = req.query;
  const events = await EventBus.getEvents(req.params.topic, parseInt(limit));
  res.json(events);
});

app.post('/events/subscribe', (req, res) => {
  const { topic, callback } = req.body;
  EventBus.subscribe(topic, callback);
  res.json({ success: true });
});

// ============================================
// FLOW ORCHESTRATION API
// ============================================
app.post('/flows/execute', async (req, res) => {
  try {
    const { flowId, context } = req.body;
    const result = await FlowOrchestrator.executeFlow(flowId, context);
    res.json(result);
  } catch (error) {
    logger.error('Flow execution error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/flows', (req, res) => {
  res.json({
    available: [
      { id: 'copilot-query', name: 'Copilot Query Flow', description: 'Question → Twin → Memory → Intelligence → Answer' },
      { id: 'revenue-analysis', name: 'Revenue Analysis', description: 'Analyze revenue with business twins and market intelligence' }
    ]
  });
});

// ============================================
// BOA EXECUTIVE INTELLIGENCE API
// ============================================
app.post('/boa/query', async (req, res) => {
  try {
    const { question, industry, context } = req.body;

    // Execute the copilot query flow
    const result = await FlowOrchestrator.executeFlow('copilot-query', {
      query: question,
      industry,
      userId: context?.userId
    });

    // Generate executive summary
    const executiveSummary = {
      question,
      answer: result.twins?.summary || result.memory?.insights || 'Analysis complete',
      data: result,
      timestamp: new Date().toISOString(),
      confidence: result.sources?.length > 0 ? 0.85 : 0.5
    };

    res.json(executiveSummary);
  } catch (error) {
    logger.error('BOA query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// INITIALIZE & START
// ============================================
ServiceRegistry.initialize();

app.listen(PORT, () => {
  logger.info(`RTMN Unified Fabric started on port ${PORT}`);
  logger.info(`Registered services: ${ServiceRegistry.getStatus().total}`);
  logger.info(`Event schemas: ${Object.keys(SchemaRegistry.schemas).length}`);
});

export { app, EventBus, ServiceRegistry, SchemaRegistry, FlowOrchestrator };
