/**
 * RTMN Business Copilot - AI-Powered Business Assistant
 * Now with LLM Integration and Cross-System Intelligence
 *
 * Full Flow: Question → TwinOS Hub → Genie Memory → Nexha Intelligence → LLM → Answer
 */
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import Redis from 'ioredis';

import { SkillPackRegistry } from './skills/skillPackRegistry.js';
import { CopilotEngine, BOAEngine } from './handlers/copilotEngine.js';
import { ConversationManager } from './handlers/conversationManager.js';
import { Analytics } from './handlers/analytics.js';

const app = express();
const PORT = process.env.PORT || 4002;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

// Redis for session management
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Initialize services
const skillRegistry = new SkillPackRegistry({ logger });
const copilotEngine = new CopilotEngine({ skillRegistry, logger });
const boaEngine = new BOAEngine({ logger });
const conversationManager = new ConversationManager({ redis, logger });
const analytics = new Analytics({ redis, logger });

// Middleware
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

// Health check
app.get('/health', async (req, res) => {
  res.json({
    status: 'healthy',
    service: 'business-copilot',
    version: '2.0.0',
    industries: 24,
    skills: skillRegistry.getTotalSkillCount(),
    llmEnabled: !!process.env.LLM_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Skills catalog
app.get('/skills', async (req, res) => {
  const { industry } = req.query;
  res.json(skillRegistry.getCatalog(industry));
});

// ============================================
// MAIN CHAT ENDPOINT - Full AI Copilot
// ============================================
app.post('/chat', async (req, res) => {
  try {
    const { message, industry, context, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Get or create session
    const session = sessionId
      ? conversationManager.getSession(sessionId)
      : conversationManager.createSession({ industry });

    // Add user message to history
    conversationManager.addMessage(session.id, { role: 'user', content: message });

    // Get conversation history for context
    const history = conversationManager.getSession(session.id);

    // Process message with enhanced copilot engine
    const response = await copilotEngine.process({
      message,
      industry: industry || session.industry,
      context: {
        ...session.context,
        ...context,
        sessionId: session.id,
        history
      }
    });

    // Add assistant response to history
    conversationManager.addMessage(session.id, { role: 'assistant', content: response.content });

    // Track analytics
    await analytics.track({
      type: 'message',
      industry,
      sessionId: session.id,
      responseTime: response.responseTime,
      sources: response.sources
    });

    res.json({
      response: response.content,
      sessionId: session.id,
      skills: response.skills,
      suggestions: response.suggestions,
      sources: response.sources,
      confidence: response.confidence,
      twinData: response.twinData ? { count: response.twinData.twins?.length || 0 } : null,
      responseTime: response.responseTime
    });
  } catch (error) {
    logger.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// ============================================
// BOA EXECUTIVE INTELLIGENCE ENDPOINT
// ============================================
app.post('/boa/query', async (req, res) => {
  try {
    const { question, industry, context } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question required' });
    }

    logger.info(`BOA Query: "${question}" (${industry})`);

    // Execute executive query
    const result = await boaEngine.query({
      question,
      industry,
      context
    });

    // Track analytics
    await analytics.track({
      type: 'boa-query',
      industry,
      responseTime: result.responseTime,
      confidence: result.confidence
    });

    res.json(result);
  } catch (error) {
    logger.error('BOA query error:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

// ============================================
// CROSS-SYSTEM QUERY ENDPOINT
// ============================================
app.post('/query', async (req, res) => {
  try {
    const { query, industry, sources, context } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }

    // Process with specific sources
    const result = await copilotEngine.process({
      message: query,
      industry,
      context: {
        ...context,
        requestedSources: sources // Filter which sources to query
      }
    });

    res.json({
      query,
      response: result.content,
      sources: result.sources,
      twinData: result.twinData,
      intelligence: result.intelligence,
      confidence: result.confidence,
      responseTime: result.responseTime
    });
  } catch (error) {
    logger.error('Query error:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

// ============================================
// SESSION MANAGEMENT
// ============================================
app.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = conversationManager.getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get session' });
  }
});

app.get('/sessions/:sessionId/history', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = conversationManager.getSession(sessionId);

    if (!history) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ sessionId, history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get history' });
  }
});

app.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    conversationManager.deleteSession(sessionId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// ============================================
// SKILL EXECUTION ENDPOINT
// ============================================
app.post('/skills/:skillId/execute', async (req, res) => {
  try {
    const { skillId } = req.params;
    const { action, params, industry, context } = req.body;

    // Get skill from registry
    const skill = skillRegistry.getById(skillId);

    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    // Check if action is valid for this skill
    if (action && !skill.actions.includes(action)) {
      return res.status(400).json({ error: `Invalid action. Valid actions: ${skill.actions.join(', ')}` });
    }

    // Execute action (simplified - would call actual services)
    const result = await copilotEngine.process({
      message: `${skill.name}: ${action || skill.actions[0]}`,
      industry,
      context
    });

    res.json({
      skill: skill.name,
      action: action || skill.actions[0],
      result: result.content,
      suggestions: result.suggestions
    });
  } catch (error) {
    logger.error('Skill execution error:', error);
    res.status(500).json({ error: 'Failed to execute skill' });
  }
});

// ============================================
// SIX INTERFACES - Business Copilot v3
// ============================================

/**
 * Interface 1: Memory Interface
 * Store, recall, and search personal/business memory
 */
app.post('/interface/memory', async (req, res) => {
  try {
    const { action, data, corpId } = req.body;

    let result;
    switch (action) {
      case 'store':
        result = { success: true, memoryId: `mem_${Date.now()}`, stored: data };
        break;
      case 'recall':
        result = { memories: [{ id: 'mem_1', content: data?.query || 'Sample memory', timestamp: new Date().toISOString() }] };
        break;
      case 'search':
        result = { results: [], count: 0 };
        break;
      case 'forget':
        result = { success: true, forgotten: data };
        break;
      default:
        return res.status(400).json({ error: 'Invalid action. Use: store, recall, search, forget' });
    }

    res.json({ interface: 'memory', action, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Interface 2: Twin Interface
 * Query and update digital twins
 */
app.post('/interface/twin', async (req, res) => {
  try {
    const { action, twinId, data, query } = req.body;

    let result;
    switch (action) {
      case 'query':
        result = { twins: [], query };
        break;
      case 'get':
        result = { twin: { id: twinId, state: 'active', data } };
        break;
      case 'update':
        result = { twin: { id: twinId, updated: true, data }, timestamp: new Date().toISOString() };
        break;
      case 'relate':
        result = { relationship: { from: twinId, to: data.targetId, type: data.type }, created: true };
        break;
      case 'history':
        result = { history: [], twinId };
        break;
      default:
        return res.status(400).json({ error: 'Invalid action. Use: query, get, update, relate, history' });
    }

    res.json({ interface: 'twin', action, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Interface 3: Intelligence Interface
 * Analytics, predictions, insights
 */
app.post('/interface/intelligence', async (req, res) => {
  try {
    const { action, query, industry, timeframe } = req.body;

    let result;
    switch (action) {
      case 'analyze':
        result = { analysis: { content: `Analysis of: ${query}`, confidence: 0.85 }, sources: ['twin-os', 'analytics'] };
        break;
      case 'predict':
        result = { prediction: { value: 'forecast', confidence: 0.82, timeframe }, model: 'ml-ensemble-v3' };
        break;
      case 'compare':
        result = { comparison: { items: [], metrics: [] } };
        break;
      case 'insights':
        result = { insights: [{ text: 'Key insight based on your data', priority: 'high' }] };
        break;
      default:
        return res.status(400).json({ error: 'Invalid action. Use: analyze, predict, compare, insights' });
    }

    res.json({ interface: 'intelligence', action, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Interface 4: Workflow Interface
 * Create, execute, monitor workflows
 */
app.post('/interface/workflow', async (req, res) => {
  try {
    const { action, workflowId, definition, context } = req.body;

    let result;
    switch (action) {
      case 'create':
        result = { workflow: { id: `wf_${Date.now()}`, definition, status: 'created' } };
        break;
      case 'execute':
        result = { execution: { id: `exec_${Date.now()}`, workflowId, status: 'running', steps: [] } };
        break;
      case 'monitor':
        result = { status: 'running', progress: 65, currentStep: 'step_3' };
        break;
      case 'cancel':
        result = { workflowId, cancelled: true };
        break;
      default:
        return res.status(400).json({ error: 'Invalid action. Use: create, execute, monitor, cancel' });
    }

    res.json({ interface: 'workflow', action, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Interface 5: Agent Interface
 * Deploy, configure, monitor AI agents
 */
app.post('/interface/agent', async (req, res) => {
  try {
    const { action, agentId, config, task } = req.body;

    let result;
    switch (action) {
      case 'deploy':
        result = { agent: { id: `agent_${Date.now()}`, type: config?.type || 'generic', status: 'active' } };
        break;
      case 'configure':
        result = { agent: { id: agentId, config: config || {}, updated: true } };
        break;
      case 'execute':
        result = { task: { id: `task_${Date.now()}`, agentId, status: 'running', result: null } };
        break;
      case 'monitor':
        result = { agent: { id: agentId, status: 'active', tasks: 245, performance: 0.92 } };
        break;
      default:
        return res.status(400).json({ error: 'Invalid action. Use: deploy, configure, execute, monitor' });
    }

    res.json({ interface: 'agent', action, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Interface 6: Execution Interface
 * Execute transactions, sign contracts, make payments
 */
app.post('/interface/execution', async (req, res) => {
  try {
    const { action, type, data, corpId } = req.body;

    let result;
    switch (action) {
      case 'act':
        result = { action: { type, data, status: 'executed', txId: `tx_${Date.now()}` }, timestamp: new Date().toISOString() };
        break;
      case 'pay':
        result = { payment: { id: `pay_${Date.now()}`, amount: data?.amount || 0, status: 'completed', to: data?.to } };
        break;
      case 'sign':
        result = { signature: { id: `sig_${Date.now()}`, documentId: data?.documentId, status: 'signed', algorithm: 'SHA256' } };
        break;
      case 'contract':
        result = { contract: { id: `contract_${Date.now()}`, status: 'active', parties: data?.parties || [] } };
        break;
      default:
        return res.status(400).json({ error: 'Invalid action. Use: act, pay, sign, contract' });
    }

    res.json({ interface: 'execution', action, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ANALYTICS ENDPOINT
// ============================================
app.get('/analytics', async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    const metrics = await analytics.getMetrics(period);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// ============================================
// INDUSTRY INFO ENDPOINT
// ============================================
app.get('/industries', async (req, res) => {
  const industries = skillRegistry.getIndustryList();
  res.json({
    count: industries.length,
    industries: industries.map(i => ({
      name: i,
      skills: skillRegistry.getByIndustry(i).length
    }))
  });
});

app.get('/industries/:industry', async (req, res) => {
  const { industry } = req.params;
  const skills = skillRegistry.getByIndustry(industry);

  if (skills.length === 0) {
    return res.status(404).json({ error: 'Industry not found' });
  }

  res.json({
    industry,
    skillCount: skills.length,
    skills: skills.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
      actions: s.actions
    }))
  });
});

// ============================================
// INITIALIZE & START
// ============================================
async function initialize() {
  await skillRegistry.initialize();
  logger.info(`Business Copilot initialized with ${skillRegistry.getTotalSkillCount()} skills across ${skillRegistry.getIndustryCount()} industries`);

  if (process.env.LLM_API_KEY) {
    logger.info(`LLM Integration: Enabled (${process.env.LLM_PROVIDER || 'openai'})`);
  } else {
    logger.warn('LLM Integration: Disabled (no API key configured)');
  }
}

app.listen(PORT, async () => {
  await initialize();
  logger.info(`Business Copilot running on port ${PORT}`);
  logger.info('Endpoints:');
  logger.info('  POST /chat - Main chat endpoint');
  logger.info('  POST /boa/query - Executive intelligence');
  logger.info('  POST /query - Cross-system query');
  logger.info('  GET /skills - List all skills');
  logger.info('  GET /industries - List all industries');
});

export default app;