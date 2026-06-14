/**
 * Workflow Builder - API Routes
 * Integrated with REZ Flow Runtime for execution
 */

import { Router } from 'express';
import mongoose from 'mongoose';
import { Workflow, Template, Execution } from '../models';
import { workflowExecutor } from '../services/executor';
import { flowRuntimeClient, FlowRuntimeError } from '../services/flowRuntimeClient';
import { logger } from '../utils/logger';

const router = Router();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow-builder';
const USE_FLOW_RUNTIME = process.env.USE_FLOW_RUNTIME !== 'false'; // Default to true

// ============================================
// HEALTH
// ============================================

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'workflow-builder' });
});

// ============================================
// WORKFLOWS
// ============================================

/**
 * GET /api/workflows - List workflows
 */
router.get('/', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const { userId, status, limit = 50, skip = 0 } = req.query;

    const query: any = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;

    const [workflows, total] = await Promise.all([
      Workflow.find(query).sort({ updatedAt: -1 }).skip(Number(skip)).limit(Number(limit)),
      Workflow.countDocuments(query),
    ]);

    res.json({ workflows, total });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/workflows/:id - Get workflow
 */
router.get('/:id', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json({ workflow });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/workflows - Create workflow
 */
router.post('/', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const { name, description, userId, nodes, edges, trigger } = req.body;

    const workflow = await Workflow.create({
      name,
      description,
      userId,
      nodes: nodes || [],
      edges: edges || [],
      trigger: trigger || { type: 'manual' },
    });

    res.status(201).json({ workflow });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/workflows/:id - Update workflow
 */
router.put('/:id', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const { name, description, nodes, edges, trigger, status, settings } = req.body;

    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (name) workflow.name = name;
    if (description !== undefined) workflow.description = description;
    if (nodes) workflow.nodes = nodes;
    if (edges) workflow.edges = edges;
    if (trigger) workflow.trigger = trigger;
    if (settings) workflow.settings = { ...workflow.settings, ...settings };

    // Auto-increment version on changes
    workflow.version += 1;

    await workflow.save();

    res.json({ workflow });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/workflows/:id/publish - Publish workflow
 * Registers with Flow Runtime if USE_FLOW_RUNTIME is enabled
 */
router.post('/:id/publish', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Validate workflow has trigger and end node
    const hasTrigger = workflow.nodes.some((n: any) => n.type === 'trigger');
    const hasEnd = workflow.nodes.some((n: any) => n.type === 'end');

    if (!hasTrigger || !hasEnd) {
      return res.status(400).json({
        error: 'Workflow must have trigger and end nodes'
      });
    }

    // Save to MongoDB first
    workflow.status = 'active';
    workflow.publishedVersion = workflow.version;
    await workflow.save();

    let flowRuntimeRegistered = false;
    let flowRuntimeError: string | null = null;

    // Register with Flow Runtime if enabled
    if (USE_FLOW_RUNTIME) {
      try {
        logger.info(`Registering workflow ${workflow._id} with Flow Runtime`);
        await flowRuntimeClient.registerWorkflow({
          workflowId: workflow._id.toString(),
          name: workflow.name,
          description: workflow.description,
          nodes: workflow.nodes,
          edges: workflow.edges,
          trigger: workflow.trigger,
          settings: workflow.settings,
          version: workflow.version,
        });
        flowRuntimeRegistered = true;
        logger.info(`Workflow ${workflow._id} registered with Flow Runtime successfully`);
      } catch (error: any) {
        flowRuntimeError = error.message || 'Flow Runtime registration failed';
        logger.error(`Flow Runtime registration failed for workflow ${workflow._id}`, { error });

        // If Flow Runtime registration fails, still return success but with warning
        // The workflow is saved and can be re-registered later
      }
    }

    const response: any = {
      workflow,
      flowRuntime: {
        registered: flowRuntimeRegistered,
        error: flowRuntimeError,
      },
    };

    if (!flowRuntimeRegistered && flowRuntimeError) {
      response.warning = `Workflow published but Flow Runtime registration failed: ${flowRuntimeError}`;
    }

    res.json(response);
  } catch (error: any) {
    logger.error('Publish workflow error', { error, workflowId: req.params.id });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/workflows/:id/pause - Pause workflow
 */
router.post('/:id/pause', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    workflow.status = 'paused';
    await workflow.save();

    res.json({ workflow });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/workflows/:id/execute - Execute workflow manually
 * Uses Flow Runtime for execution if USE_FLOW_RUNTIME is enabled
 */
router.post('/:id/execute', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const { triggerData, userId, entityId, entityType } = req.body;

    // Verify workflow exists and is active
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (workflow.status !== 'active') {
      return res.status(400).json({ error: 'Workflow must be active to execute' });
    }

    // Try Flow Runtime first if enabled
    if (USE_FLOW_RUNTIME) {
      try {
        logger.info(`Executing workflow ${req.params.id} via Flow Runtime`);

        const flowResponse = await flowRuntimeClient.executeWorkflow({
          workflowId: req.params.id,
          workflowVersion: workflow.version,
          trigger: 'manual',
          triggerData: triggerData || {},
          context: { userId, entityId, entityType },
        });

        // Create local execution record for tracking
        const execution = await Execution.create({
          workflowId: workflow._id,
          workflowVersion: workflow.version,
          executionId: flowResponse.executionId,
          trigger: 'manual',
          triggerData: triggerData || {},
          userId,
          entityId,
          entityType,
          status: 'pending',
          startedAt: new Date(),
        });

        // Update workflow stats
        await Workflow.updateOne(
          { _id: req.params.id },
          { $inc: { 'stats.runs': 1 } }
        );

        logger.info(`Workflow execution started on Flow Runtime`, {
          workflowId: req.params.id,
          executionId: flowResponse.executionId,
        });

        return res.json({
          executionId: flowResponse.executionId,
          status: flowResponse.status,
          source: 'flow-runtime',
          execution: execution,
        });
      } catch (error: any) {
        // If Flow Runtime fails, log and fall back to local execution
        if (error instanceof FlowRuntimeError) {
          logger.warn(`Flow Runtime execution failed, falling back to local executor`, {
            workflowId: req.params.id,
            error: error.message,
          });
        } else {
          logger.error(`Flow Runtime execution error`, {
            workflowId: req.params.id,
            error,
          });
        }
        // Continue to local executor fallback
      }
    }

    // Fallback to local executor
    logger.info(`Executing workflow ${req.params.id} via local executor`);

    const result = await workflowExecutor.execute(
      req.params.id,
      'manual',
      triggerData || {},
      { userId, entityId, entityType }
    );

    res.json({
      ...result,
      source: 'local',
    });
  } catch (error: any) {
    logger.error('Execute workflow error', { error, workflowId: req.params.id });
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/workflows/:id - Delete workflow
 */
router.delete('/:id', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    await Workflow.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// TEMPLATES
// ============================================

/**
 * GET /api/templates - List templates
 */
router.get('/templates', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const { category, limit = 20 } = req.query;

    const query: any = { isPublic: true };
    if (category) query.category = category;

    const templates = await Template.find(query)
      .sort({ useCount: -1 })
      .limit(Number(limit));

    res.json({ templates });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/templates - Create template
 */
router.post('/templates', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const { name, description, category, nodes, edges, trigger, userId, tags } = req.body;

    const template = await Template.create({
      name,
      description,
      category,
      nodes,
      edges,
      trigger,
      tags,
      userId,
      isPublic: false,
    });

    res.status(201).json({ template });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/templates/:id/use - Use template
 */
router.post('/templates/:id/use', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const { userId } = req.body;

    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Create workflow from template
    const workflow = await Workflow.create({
      name: template.name,
      description: template.description,
      userId,
      nodes: template.nodes,
      edges: template.edges,
      trigger: template.trigger,
    });

    // Increment template use count
    await Template.updateOne(
      { _id: template._id },
      { $inc: { useCount: 1 } }
    );

    res.status(201).json({ workflow });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// EXECUTIONS
// ============================================

/**
 * GET /api/executions - List executions
 */
router.get('/executions', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const { workflowId, userId, status, limit = 50, skip = 0 } = req.query;

    const query: any = {};
    if (workflowId) query.workflowId = workflowId;
    if (userId) query.userId = userId;
    if (status) query.status = status;

    const executions = await Execution.find(query)
      .populate('workflowId', 'name')
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    res.json({ executions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/executions/:id - Get execution details
 */
router.get('/executions/:id', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const execution = await Execution.findById(req.params.id)
      .populate('workflowId', 'name nodes edges');

    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    res.json({ execution });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/webhook/:workflowId - Webhook trigger
 * Uses Flow Runtime for execution if enabled
 */
router.post('/webhook/:workflowId', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const { workflowId } = req.params;

    // Verify workflow exists and is active
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (workflow.status !== 'active') {
      return res.status(400).json({ error: 'Workflow is not active' });
    }

    // Try Flow Runtime first if enabled
    if (USE_FLOW_RUNTIME) {
      try {
        const flowResponse = await flowRuntimeClient.executeWorkflow({
          workflowId,
          workflowVersion: workflow.version,
          trigger: 'webhook',
          triggerData: req.body,
        });

        // Create local execution record
        const execution = await Execution.create({
          workflowId: workflow._id,
          workflowVersion: workflow.version,
          executionId: flowResponse.executionId,
          trigger: 'webhook',
          triggerData: req.body,
          status: 'pending',
          startedAt: new Date(),
        });

        return res.json({
          executionId: flowResponse.executionId,
          status: flowResponse.status,
          source: 'flow-runtime',
          execution: execution,
        });
      } catch (error: any) {
        logger.warn(`Webhook execution via Flow Runtime failed, falling back to local`, { error });
      }
    }

    // Fallback to local executor
    const result = await workflowExecutor.execute(
      workflowId,
      'webhook',
      req.body,
      {}
    );

    res.json({
      ...result,
      source: 'local',
    });
  } catch (error: any) {
    logger.error('Webhook trigger error', { error, workflowId: req.params.workflowId });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/executions/:id/status - Get execution status from Flow Runtime
 */
router.get('/executions/:id/status', async (req, res) => {
  try {
    // Try Flow Runtime first if enabled
    if (USE_FLOW_RUNTIME) {
      try {
        const status = await flowRuntimeClient.getExecutionStatus(req.params.id);
        return res.json({
          ...status,
          source: 'flow-runtime',
        });
      } catch (error: any) {
        logger.warn(`Failed to get status from Flow Runtime`, { error });
      }
    }

    // Fallback to local execution record
    const execution = await Execution.findOne({ executionId: req.params.id });
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    res.json({
      executionId: execution.executionId,
      status: execution.status,
      workflowId: execution.workflowId,
      workflowVersion: execution.workflowVersion,
      currentNodeId: execution.currentNodeId,
      nodeHistory: execution.nodeHistory,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      duration: execution.duration,
      error: execution.error,
      source: 'local',
    });
  } catch (error: any) {
    logger.error('Get execution status error', { error, executionId: req.params.id });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/executions/:id/cancel - Cancel execution
 */
router.post('/executions/:id/cancel', async (req, res) => {
  try {
    if (USE_FLOW_RUNTIME) {
      try {
        const result = await flowRuntimeClient.cancelExecution(req.params.id);

        // Update local execution record
        await Execution.updateOne(
          { executionId: req.params.id },
          { status: 'cancelled', completedAt: new Date() }
        );

        return res.json({
          ...result,
          source: 'flow-runtime',
        });
      } catch (error: any) {
        logger.warn(`Cancel via Flow Runtime failed`, { error });
      }
    }

    // Fallback to local
    const execution = await Execution.findOneAndUpdate(
      { executionId: req.params.id, status: { $in: ['pending', 'running'] } },
      { status: 'cancelled', completedAt: new Date() },
      { new: true }
    );

    if (!execution) {
      return res.status(404).json({ error: 'Execution not found or cannot be cancelled' });
    }

    res.json({
      success: true,
      message: 'Execution cancelled locally',
      source: 'local',
    });
  } catch (error: any) {
    logger.error('Cancel execution error', { error, executionId: req.params.id });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/flow-runtime/health - Check Flow Runtime health
 */
router.get('/flow-runtime/health', async (req, res) => {
  try {
    const health = await flowRuntimeClient.healthCheck();
    res.json({
      flowRuntime: health,
      useFlowRuntime: USE_FLOW_RUNTIME,
      flowRuntimeUrl: process.env.REZ_FLOW_RUNTIME_URL || 'http://localhost:4200',
    });
  } catch (error: any) {
    res.status(503).json({
      error: 'Flow Runtime health check failed',
      details: error.message,
    });
  }
});

export default router;
