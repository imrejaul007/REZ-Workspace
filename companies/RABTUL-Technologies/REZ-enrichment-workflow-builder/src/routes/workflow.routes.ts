/**
 * Workflow Builder Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { workflowService } from '../services/workflowService';

export const workflowRouter = Router();

// Validation schemas
const createWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  nodes: z.array(z.object({
    id: z.string(),
    type: z.string(),
    label: z.string(),
    position: z.object({ x: z.number(), y: z.number() }),
    config: z.record(z.any()),
  })).optional(),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    label: z.string().optional(),
  })).optional(),
  inputFields: z.array(z.string()).optional(),
  outputFields: z.array(z.string()).optional(),
});

const updateWorkflowSchema = createWorkflowSchema.partial();

const runWorkflowSchema = z.object({
  input: z.record(z.any()),
});

const createFromTemplateSchema = z.object({
  templateId: z.string(),
  name: z.string().min(1).max(100),
});

// POST /api/v1/workflows
workflowRouter.post('/', async (req: Request, res: Response) => {
  try {
    const params = createWorkflowSchema.parse(req.body);
    const workflow = workflowService.createWorkflow(params);
    res.status(201).json({ success: true, data: workflow });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create workflow' } });
    }
  }
});

// GET /api/v1/workflows
workflowRouter.get('/', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as any;
    const workflows = workflowService.listWorkflows(status ? { status } : undefined);
    res.json({ success: true, data: workflows });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list workflows' } });
  }
});

// GET /api/v1/workflows/:id
workflowRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const workflow = workflowService.getWorkflow(req.params.id);
    if (!workflow) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Workflow not found' } });
    } else {
      res.json({ success: true, data: workflow });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch workflow' } });
  }
});

// PUT /api/v1/workflows/:id
workflowRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const updates = updateWorkflowSchema.parse(req.body);
    const workflow = workflowService.updateWorkflow(req.params.id, updates);
    if (!workflow) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Workflow not found' } });
    } else {
      res.json({ success: true, data: workflow });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update workflow' } });
    }
  }
});

// DELETE /api/v1/workflows/:id
workflowRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = workflowService.deleteWorkflow(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Workflow not found' } });
    } else {
      res.json({ success: true, data: { deleted: true } });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete workflow' } });
  }
});

// POST /api/v1/workflows/:id/run
workflowRouter.post('/:id/run', async (req: Request, res: Response) => {
  try {
    const { input } = runWorkflowSchema.parse(req.body);
    const run = await workflowService.runWorkflow(req.params.id, input);
    res.json({ success: true, data: run });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      const message = error instanceof Error ? error.message : 'Failed to run workflow';
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }
});

// GET /api/v1/workflows/:id/runs
workflowRouter.get('/:id/runs', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const runs = workflowService.getWorkflowRuns(req.params.id, limit);
    res.json({ success: true, data: runs });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch runs' } });
  }
});

// GET /api/v1/templates
workflowRouter.get('/templates/list', async (_req: Request, res: Response) => {
  try {
    const templates = workflowService.getTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch templates' } });
  }
});

// POST /api/v1/templates/create
workflowRouter.post('/templates/create', async (req: Request, res: Response) => {
  try {
    const { templateId, name } = createFromTemplateSchema.parse(req.body);
    const workflow = workflowService.createFromTemplate(templateId, name);
    if (!workflow) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } });
    } else {
      res.status(201).json({ success: true, data: workflow });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } });
    } else {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create workflow' } });
    }
  }
});
