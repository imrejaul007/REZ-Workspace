/**
 * Workflow Routes
 * Proxy to hojai-workflow service
 */
import { Router } from 'express';
import { tenantMiddleware } from '../middleware/tenant.js';
import { createResponse, createErrorResponse } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
const router = Router();
// In-memory workflow store
const workflowStore = new Map();
/**
 * POST /api/workflows
 * Create a workflow
 */
router.post('/', tenantMiddleware(), (req, res) => {
    const ctx = req.tenantContext;
    const { name, description, definition } = req.body;
    if (!name || !definition) {
        return res.status(400).json(createErrorResponse('INVALID_REQUEST', 'name and definition are required'));
    }
    const workflow = {
        id: uuidv4(),
        tenantId: ctx.tenant_id,
        name,
        description,
        definition,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    const tenantWorkflows = workflowStore.get(ctx.tenant_id) || [];
    tenantWorkflows.push(workflow);
    workflowStore.set(ctx.tenant_id, tenantWorkflows);
    res.status(201).json(createResponse({ workflow }, { tenantId: ctx.tenant_id }));
});
/**
 * GET /api/workflows
 * List workflows
 */
router.get('/', tenantMiddleware(), (req, res) => {
    const ctx = req.tenantContext;
    const { status, limit = 50 } = req.query;
    let tenantWorkflows = workflowStore.get(ctx.tenant_id) || [];
    if (status) {
        tenantWorkflows = tenantWorkflows.filter(w => w.status === status);
    }
    tenantWorkflows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(createResponse({
        workflows: tenantWorkflows.slice(0, Number(limit)),
        total: tenantWorkflows.length
    }, { tenantId: ctx.tenant_id }));
});
/**
 * GET /api/workflows/:id
 * Get workflow by ID
 */
router.get('/:id', tenantMiddleware(), (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const tenantWorkflows = workflowStore.get(ctx.tenant_id) || [];
    const workflow = tenantWorkflows.find(w => w.id === id);
    if (!workflow) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Workflow ${id} not found`));
    }
    res.json(createResponse({ workflow }, { tenantId: ctx.tenant_id }));
});
/**
 * PUT /api/workflows/:id
 * Update workflow
 */
router.put('/:id', tenantMiddleware(), (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const { name, description, definition, status } = req.body;
    const tenantWorkflows = workflowStore.get(ctx.tenant_id) || [];
    const workflow = tenantWorkflows.find(w => w.id === id);
    if (!workflow) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Workflow ${id} not found`));
    }
    if (name)
        workflow.name = name;
    if (description !== undefined)
        workflow.description = description;
    if (definition)
        workflow.definition = definition;
    if (status)
        workflow.status = status;
    workflow.updatedAt = new Date().toISOString();
    res.json(createResponse({ workflow }, { tenantId: ctx.tenant_id }));
});
/**
 * POST /api/workflows/:id/activate
 * Activate a workflow
 */
router.post('/:id/activate', tenantMiddleware(), (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const tenantWorkflows = workflowStore.get(ctx.tenant_id) || [];
    const workflow = tenantWorkflows.find(w => w.id === id);
    if (!workflow) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Workflow ${id} not found`));
    }
    if (workflow.status !== 'draft' && workflow.status !== 'paused') {
        return res.status(400).json(createErrorResponse('INVALID_STATE', 'Only draft or paused workflows can be activated'));
    }
    workflow.status = 'active';
    workflow.updatedAt = new Date().toISOString();
    res.json(createResponse({ workflow }, { tenantId: ctx.tenant_id }));
});
/**
 * POST /api/workflows/:id/trigger
 * Trigger workflow execution
 */
router.post('/:id/trigger', tenantMiddleware(), (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const { input } = req.body;
    const tenantWorkflows = workflowStore.get(ctx.tenant_id) || [];
    const workflow = tenantWorkflows.find(w => w.id === id);
    if (!workflow) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Workflow ${id} not found`));
    }
    if (workflow.status !== 'active') {
        return res.status(400).json(createErrorResponse('INVALID_STATE', 'Workflow must be active to trigger'));
    }
    const execution = {
        id: uuidv4(),
        workflowId: id,
        tenantId: ctx.tenant_id,
        input: input || {},
        status: 'pending',
        startedAt: new Date().toISOString()
    };
    res.status(201).json(createResponse({ execution }, { tenantId: ctx.tenant_id }));
});
/**
 * DELETE /api/workflows/:id
 * Delete a workflow
 */
router.delete('/:id', tenantMiddleware(), (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const tenantWorkflows = workflowStore.get(ctx.tenant_id) || [];
    const index = tenantWorkflows.findIndex(w => w.id === id);
    if (index === -1) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Workflow ${id} not found`));
    }
    tenantWorkflows.splice(index, 1);
    workflowStore.set(ctx.tenant_id, tenantWorkflows);
    res.json(createResponse({ deleted: true }));
});
export { router as workflowRoutes };
//# sourceMappingURL=workflows.js.map