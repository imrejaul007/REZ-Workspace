/**
 * Agent Routes
 * Proxy to hojai-agents service
 */

import { Router, Request, Response } from 'express';
import { tenantMiddleware } from '../middleware/tenant.js';
import { createResponse, createErrorResponse, Agent, AgentExecution } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// In-memory stores
const agentStore: Map<string, Agent[]> = new Map();
const executionStore: Map<string, AgentExecution[]> = new Map();

/**
 * POST /api/agents
 * Register a new agent
 */
router.post('/', tenantMiddleware(), (req: Request, res: Response) => {
  const ctx = req.tenantContext!;
  const { name, type, description, capabilities, config } = req.body;

  if (!name || !type || !capabilities) {
    return res.status(400).json(
      createErrorResponse('INVALID_REQUEST', 'name, type, and capabilities are required')
    );
  }

  const agent: Agent = {
    id: uuidv4(),
    tenantId: ctx.tenant_id,
    name,
    type,
    description,
    capabilities,
    config: config || {},
    status: 'active',
    createdAt: new Date().toISOString()
  };

  const tenantAgents = agentStore.get(ctx.tenant_id) || [];
  tenantAgents.push(agent);
  agentStore.set(ctx.tenant_id, tenantAgents);

  res.status(201).json(createResponse({ agent }, { tenantId: ctx.tenant_id }));
});

/**
 * GET /api/agents
 * List agents
 */
router.get('/', tenantMiddleware(), (req: Request, res: Response) => {
  const ctx = req.tenantContext!;
  const { type, status, limit = 50 } = req.query;

  let tenantAgents = agentStore.get(ctx.tenant_id) || [];

  if (type) {
    tenantAgents = tenantAgents.filter(a => a.type === type);
  }

  if (status) {
    tenantAgents = tenantAgents.filter(a => a.status === status);
  }

  tenantAgents.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  res.json(createResponse({
    agents: tenantAgents.slice(0, Number(limit)),
    total: tenantAgents.length
  }, { tenantId: ctx.tenant_id }));
});

/**
 * GET /api/agents/:id
 * Get agent by ID
 */
router.get('/:id', tenantMiddleware(), (req: Request, res: Response) => {
  const ctx = req.tenantContext!;
  const { id } = req.params;

  const tenantAgents = agentStore.get(ctx.tenant_id) || [];
  const agent = tenantAgents.find(a => a.id === id);

  if (!agent) {
    return res.status(404).json(
      createErrorResponse('NOT_FOUND', `Agent ${id} not found`)
    );
  }

  res.json(createResponse({ agent }, { tenantId: ctx.tenant_id }));
});

/**
 * POST /api/agents/:id/execute
 * Execute an agent
 */
router.post('/:id/execute', tenantMiddleware(), async (req: Request, res: Response) => {
  const ctx = req.tenantContext!;
  const { id } = req.params;
  const { input } = req.body;

  const tenantAgents = agentStore.get(ctx.tenant_id) || [];
  const agent = tenantAgents.find(a => a.id === id);

  if (!agent) {
    return res.status(404).json(
      createErrorResponse('NOT_FOUND', `Agent ${id} not found`)
    );
  }

  const execution: AgentExecution = {
    id: uuidv4(),
    agentId: id,
    tenantId: ctx.tenant_id,
    input: input || {},
    status: 'running',
    startedAt: new Date().toISOString()
  };

  const tenantExecutions = executionStore.get(ctx.tenant_id) || [];
  tenantExecutions.push(execution);
  executionStore.set(ctx.tenant_id, tenantExecutions);

  // Simulate async execution
  setTimeout(() => {
    execution.status = 'completed';
    execution.output = {
      result: `Agent ${agent.name} processed input`,
      timestamp: new Date().toISOString()
    };
    execution.completedAt = new Date().toISOString();
  }, 100);

  res.status(201).json(createResponse({ execution }, { tenantId: ctx.tenant_id }));
});

/**
 * GET /api/agents/:id/executions
 * Get agent execution history
 */
router.get('/:id/executions', tenantMiddleware(), (req: Request, res: Response) => {
  const ctx = req.tenantContext!;
  const { id } = req.params;
  const { limit = 20 } = req.query;

  const tenantExecutions = executionStore.get(ctx.tenant_id) || [];
  const executions = tenantExecutions
    .filter(e => e.agentId === id)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, Number(limit));

  res.json(createResponse({
    executions,
    total: executions.length
  }, { tenantId: ctx.tenant_id }));
});

/**
 * GET /api/agents/executions/:execId
 * Get execution by ID
 */
router.get('/executions/:execId', tenantMiddleware(), (req: Request, res: Response) => {
  const ctx = req.tenantContext!;
  const { execId } = req.params;

  const tenantExecutions = executionStore.get(ctx.tenant_id) || [];
  const execution = tenantExecutions.find(e => e.id === execId);

  if (!execution) {
    return res.status(404).json(
      createErrorResponse('NOT_FOUND', `Execution ${execId} not found`)
    );
  }

  res.json(createResponse({ execution }, { tenantId: ctx.tenant_id }));
});

/**
 * PUT /api/agents/:id
 * Update agent
 */
router.put('/:id', tenantMiddleware(), (req: Request, res: Response) => {
  const ctx = req.tenantContext!;
  const { id } = req.params;
  const { name, description, capabilities, config, status } = req.body;

  const tenantAgents = agentStore.get(ctx.tenant_id) || [];
  const agent = tenantAgents.find(a => a.id === id);

  if (!agent) {
    return res.status(404).json(
      createErrorResponse('NOT_FOUND', `Agent ${id} not found`)
    );
  }

  if (name) agent.name = name;
  if (description !== undefined) agent.description = description;
  if (capabilities) agent.capabilities = capabilities;
  if (config) agent.config = { ...agent.config, ...config };
  if (status) agent.status = status;

  res.json(createResponse({ agent }, { tenantId: ctx.tenant_id }));
});

/**
 * DELETE /api/agents/:id
 * Delete agent
 */
router.delete('/:id', tenantMiddleware(), (req: Request, res: Response) => {
  const ctx = req.tenantContext!;
  const { id } = req.params;

  const tenantAgents = agentStore.get(ctx.tenant_id) || [];
  const index = tenantAgents.findIndex(a => a.id === id);

  if (index === -1) {
    return res.status(404).json(
      createErrorResponse('NOT_FOUND', `Agent ${id} not found`)
    );
  }

  tenantAgents.splice(index, 1);
  agentStore.set(ctx.tenant_id, tenantAgents);

  res.json(createResponse({ deleted: true }));
});

/**
 * GET /api/agents/types
 * Get available agent types
 */
router.get('/meta/types', tenantMiddleware(), (req: Request, res: Response) => {
  const agentTypes = [
    { type: 'support', name: 'Support Agent', description: 'Handles customer support requests' },
    { type: 'sales', name: 'Sales Agent', description: 'Assists with sales and recommendations' },
    { type: 'orchestrator', name: 'Orchestrator', description: 'Coordinates other agents' },
    { type: 'data', name: 'Data Agent', description: 'Processes and analyzes data' },
    { type: 'workflow', name: 'Workflow Agent', description: 'Executes automated workflows' },
    { type: 'communication', name: 'Communication Agent', description: 'Handles messaging channels' }
  ];

  res.json(createResponse({ agentTypes }));
});

export { router as agentRoutes };
