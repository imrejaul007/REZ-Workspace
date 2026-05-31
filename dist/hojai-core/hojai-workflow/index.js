/**
 * Hojai Workflow Platform - Enhanced
 *
 * PORT: 4560
 *
 * Enhanced with:
 * - Orchestration Engine (multi-step workflows)
 * - Action Engine (execute actions)
 * - Trigger System (event-driven)
 * - Workflow Versioning
 */
import express from 'express';
import { tenantMiddleware } from '../shared/middleware/tenant';
import { createLogger } from '../shared/utils/logger';
import { createResponse, createErrorResponse } from '../shared/types';
const logger = createLogger('hojai-workflow');
/**
 * Predefined actions
 */
export const PREDEFINED_ACTIONS = [
    {
        type: 'send_message',
        name: 'Send Message',
        description: 'Send a message to customer',
        parameters: [
            { name: 'channel', type: 'string', required: true, description: 'whatsapp, email, sms' },
            { name: 'template_id', type: 'string', required: true, description: 'Template ID' },
            { name: 'variables', type: 'object', required: false, description: 'Template variables' }
        ],
        returns: 'message_id',
        category: 'communication'
    },
    {
        type: 'add_tag',
        name: 'Add Tag',
        description: 'Add tag to customer',
        parameters: [
            { name: 'tag', type: 'string', required: true, description: 'Tag name' }
        ],
        returns: 'success',
        category: 'data'
    },
    {
        type: 'trigger_webhook',
        name: 'Trigger Webhook',
        description: 'Call external webhook',
        parameters: [
            { name: 'url', type: 'string', required: true, description: 'Webhook URL' },
            { name: 'method', type: 'string', required: true, description: 'GET, POST, PUT' },
            { name: 'headers', type: 'object', required: false, description: 'HTTP headers' },
            { name: 'body', type: 'object', required: false, description: 'Request body' }
        ],
        returns: 'response',
        category: 'automation'
    },
    {
        type: 'ai_action',
        name: 'AI Action',
        description: 'Execute AI task',
        parameters: [
            { name: 'prompt', type: 'string', required: true, description: 'AI prompt' },
            { name: 'model', type: 'string', required: false, description: 'AI model' }
        ],
        returns: 'ai_response',
        category: 'ai'
    }
];
// ============================================
// ACTION ENGINE
// ============================================
class ActionEngine {
    actions = new Map();
    constructor() {
        // Register predefined actions
        for (const action of PREDEFINED_ACTIONS) {
            this.actions.set(action.type, action);
        }
    }
    /**
     * Execute action
     */
    async execute(actionType, parameters, context) {
        const action = this.actions.get(actionType);
        if (!action) {
            return { success: false, error: `Unknown action: ${actionType}` };
        }
        // Validate parameters
        for (const param of action.parameters) {
            if (param.required && !parameters[param.name]) {
                return { success: false, error: `Missing required parameter: ${param.name}` };
            }
        }
        try {
            // Substitute context variables
            const resolvedParams = this.resolveVariables(parameters, context);
            // Execute based on action type
            const output = await this.executeAction(actionType, resolvedParams, context);
            logger.info('action_executed', { actionType, success: true });
            return { success: true, output };
        }
        catch (error) {
            logger.error('action_failed', { actionType, error: error.message });
            return { success: false, error: error.message };
        }
    }
    /**
     * Resolve {{variable}} placeholders in parameters
     */
    resolveVariables(params, context) {
        const resolved = {};
        for (const [key, value] of Object.entries(params)) {
            if (typeof value === 'string') {
                // Replace {{context.variable}} with context values
                resolved[key] = value.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
                    const keys = path.split('.');
                    let result = context;
                    for (const k of keys) {
                        result = result?.[k];
                    }
                    return result ?? match;
                });
            }
            else if (typeof value === 'object') {
                resolved[key] = this.resolveVariables(value, context);
            }
            else {
                resolved[key] = value;
            }
        }
        return resolved;
    }
    /**
     * Execute specific action
     */
    async executeAction(actionType, params, context) {
        switch (actionType) {
            case 'send_message':
                return { message_id: `msg_${Date.now()}`, status: 'sent' };
            case 'add_tag':
                return { success: true, tag: params.tag };
            case 'remove_tag':
                return { success: true, tag: params.tag };
            case 'trigger_webhook':
                return { status: 200, body: 'OK' };
            case 'ai_action':
                return { response: `AI processed: ${params.prompt?.substring(0, 50)}...` };
            case 'delay':
                await new Promise(resolve => setTimeout(resolve, (params.seconds || 0) * 1000));
                return { completed: true };
            default:
                return { executed: true };
        }
    }
    /**
     * Get action definition
     */
    getAction(type) {
        return this.actions.get(type);
    }
    /**
     * List all actions
     */
    listActions() {
        return Array.from(this.actions.values());
    }
}
// ============================================
// ORCHESTRATION ENGINE
// ============================================
class OrchestrationEngine {
    workflows = new Map();
    executions = new Map();
    actionEngine;
    constructor() {
        this.actionEngine = new ActionEngine();
    }
    // ========== WORKFLOW CRUD ==========
    /**
     * Create workflow
     */
    async createWorkflow(tenantId, createdBy, data) {
        const now = new Date().toISOString();
        const id = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const workflow = {
            id,
            tenant_id: tenantId,
            name: data.name,
            description: data.description,
            type: data.type,
            status: 'draft',
            trigger: data.trigger,
            steps: data.steps.map((s, i) => ({
                ...s,
                id: `step_${i}`
            })),
            version: 1,
            is_current_version: true,
            created_by: createdBy,
            stats: {
                total_executions: 0,
                successful_executions: 0,
                failed_executions: 0,
                avg_execution_time_seconds: 0
            },
            created_at: now,
            updated_at: now
        };
        this.workflows.set(id, workflow);
        logger.info('workflow_created', { tenantId, workflowId: id });
        return workflow;
    }
    /**
     * Update workflow (creates new version)
     */
    async updateWorkflow(tenantId, workflowId, data) {
        const existing = this.workflows.get(workflowId);
        if (!existing || existing.tenant_id !== tenantId)
            return null;
        // Mark existing as not current
        existing.is_current_version = false;
        // Create new version
        const now = new Date().toISOString();
        const newWorkflow = {
            ...existing,
            ...data,
            id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            version: existing.version + 1,
            is_current_version: true,
            previous_version_id: existing.id,
            updated_at: now
        };
        this.workflows.set(newWorkflow.id, newWorkflow);
        logger.info('workflow_versioned', {
            tenantId,
            oldId: workflowId,
            newId: newWorkflow.id,
            version: newWorkflow.version
        });
        return newWorkflow;
    }
    /**
     * Get workflow
     */
    async getWorkflow(tenantId, workflowId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow || workflow.tenant_id !== tenantId)
            return null;
        return workflow;
    }
    /**
     * List workflows
     */
    async listWorkflows(tenantId, options) {
        const results = [];
        for (const workflow of this.workflows.values()) {
            if (workflow.tenant_id !== tenantId)
                continue;
            if (workflow.is_current_version !== true)
                continue;
            if (options?.status && workflow.status !== options.status)
                continue;
            if (options?.type && workflow.type !== options.type)
                continue;
            results.push(workflow);
        }
        return results.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
    // ========== WORKFLOW EXECUTION ==========
    /**
     * Execute workflow
     */
    async execute(tenantId, workflowId, triggerData) {
        const workflow = await this.getWorkflow(tenantId, workflowId);
        if (!workflow)
            throw new Error('Workflow not found');
        if (workflow.status !== 'active')
            throw new Error('Workflow not active');
        const now = new Date().toISOString();
        const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const execution = {
            id: executionId,
            workflow_id: workflowId,
            workflow_version: workflow.version,
            tenant_id: tenantId,
            trigger_type: workflow.trigger.type,
            trigger_data: triggerData,
            context: { ...triggerData },
            status: 'running',
            step_results: workflow.steps.map(s => ({
                step_id: s.id,
                step_name: s.name,
                status: 'pending',
                retry_count: 0
            })),
            started_at: now
        };
        this.executions.set(executionId, execution);
        // Execute workflow asynchronously
        this.executeSteps(execution, workflow).catch(err => {
            logger.error('workflow_execution_failed', { executionId, error: err.message });
            execution.status = 'failed';
            execution.error = err.message;
            execution.completed_at = new Date().toISOString();
        });
        // Update stats
        workflow.stats.total_executions++;
        this.workflows.set(workflowId, workflow);
        logger.info('workflow_execution_started', { tenantId, workflowId, executionId });
        return execution;
    }
    /**
     * Execute workflow steps
     */
    async executeSteps(execution, workflow) {
        for (let i = 0; i < workflow.steps.length; i++) {
            const step = workflow.steps[i];
            const stepResult = execution.step_results.find(r => r.step_id === step.id);
            if (!stepResult)
                continue;
            execution.current_step_id = step.id;
            stepResult.status = 'running';
            stepResult.started_at = new Date().toISOString();
            try {
                const result = await this.executeStep(step, execution.context);
                stepResult.status = 'completed';
                stepResult.output = result;
                stepResult.completed_at = new Date().toISOString();
            }
            catch (error) {
                // Check if should retry
                if (step.retry && stepResult.retry_count < step.retry.max_attempts) {
                    stepResult.retry_count++;
                    i--; // Retry same step
                    await new Promise(r => setTimeout(r, step.retry.backoff_seconds * 1000));
                }
                else {
                    stepResult.status = 'failed';
                    stepResult.error = error.message;
                    stepResult.completed_at = new Date().toISOString();
                    execution.status = 'failed';
                    execution.error = error.message;
                    execution.completed_at = new Date().toISOString();
                    return;
                }
            }
        }
        execution.status = 'completed';
        execution.completed_at = new Date().toISOString();
    }
    /**
     * Execute single step
     */
    async executeStep(step, context) {
        switch (step.type) {
            case 'message':
                return this.actionEngine.execute('send_message', {
                    channel: step.config.channel,
                    template_id: step.config.template_id,
                    variables: step.config.variables
                }, context);
            case 'action':
                return this.actionEngine.execute(step.config.action_type, step.config.action_config || {}, context);
            case 'delay':
                const delayMs = (step.config.delay_seconds || step.config.delay_minutes * 60 || 0) * 1000;
                await new Promise(r => setTimeout(r, delayMs));
                return { delayed: true, duration_ms: delayMs };
            case 'condition':
                return this.evaluateConditions(step.config.conditions || [], context);
            case 'ai':
                return this.actionEngine.execute('ai_action', {
                    prompt: step.config.ai_prompt,
                    model: step.config.ai_model
                }, context);
            case 'wait':
                await new Promise(r => setTimeout(r, (step.config.wait_timeout || 30) * 1000));
                return { waited: true };
            default:
                return { executed: true };
        }
    }
    /**
     * Evaluate conditions
     */
    evaluateConditions(conditions, context) {
        if (conditions.length === 0)
            return true;
        for (const condition of conditions) {
            const value = this.getNestedValue(context, condition.field);
            let result = false;
            switch (condition.operator) {
                case 'eq':
                    result = value === condition.value;
                    break;
                case 'neq':
                    result = value !== condition.value;
                    break;
                case 'gt':
                    result = value > condition.value;
                    break;
                case 'lt':
                    result = value < condition.value;
                    break;
                case 'gte':
                    result = value >= condition.value;
                    break;
                case 'lte':
                    result = value <= condition.value;
                    break;
                case 'contains':
                    result = String(value).includes(String(condition.value));
                    break;
            }
            if (condition.logical === 'or' && result)
                return true;
            if (condition.logical !== 'or' && !result)
                return false;
        }
        return true;
    }
    getNestedValue(obj, path) {
        return path.split('.').reduce((o, k) => o?.[k], obj);
    }
    /**
     * Get execution
     */
    async getExecution(tenantId, executionId) {
        const execution = this.executions.get(executionId);
        if (!execution || execution.tenant_id !== tenantId)
            return null;
        return execution;
    }
    /**
     * List executions
     */
    async listExecutions(tenantId, workflowId) {
        const results = [];
        for (const execution of this.executions.values()) {
            if (execution.tenant_id !== tenantId)
                continue;
            if (workflowId && execution.workflow_id !== workflowId)
                continue;
            results.push(execution);
        }
        return results.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    }
    /**
     * Cancel execution
     */
    async cancelExecution(tenantId, executionId) {
        const execution = await this.getExecution(tenantId, executionId);
        if (!execution || execution.status !== 'running')
            return false;
        execution.status = 'cancelled';
        execution.completed_at = new Date().toISOString();
        return true;
    }
}
// ============================================
// MAIN PLATFORM
// ============================================
export class HojaiWorkflowPlatform {
    orchestrationEngine;
    actionEngine;
    constructor() {
        this.orchestrationEngine = new OrchestrationEngine();
        this.actionEngine = new ActionEngine();
    }
    // Workflow CRUD
    async createWorkflow(tenantId, createdBy, data) {
        return this.orchestrationEngine.createWorkflow(tenantId, createdBy, data);
    }
    async updateWorkflow(tenantId, workflowId, data) {
        return this.orchestrationEngine.updateWorkflow(tenantId, workflowId, data);
    }
    async getWorkflow(tenantId, workflowId) {
        return this.orchestrationEngine.getWorkflow(tenantId, workflowId);
    }
    async listWorkflows(tenantId, options) {
        return this.orchestrationEngine.listWorkflows(tenantId, options);
    }
    async activateWorkflow(tenantId, workflowId) {
        const workflow = await this.getWorkflow(tenantId, workflowId);
        if (!workflow)
            return null;
        workflow.status = 'active';
        workflow.updated_at = new Date().toISOString();
        return workflow;
    }
    async pauseWorkflow(tenantId, workflowId) {
        const workflow = await this.getWorkflow(tenantId, workflowId);
        if (!workflow)
            return null;
        workflow.status = 'paused';
        workflow.updated_at = new Date().toISOString();
        return workflow;
    }
    // Execution
    async execute(tenantId, workflowId, triggerData) {
        return this.orchestrationEngine.execute(tenantId, workflowId, triggerData);
    }
    async getExecution(tenantId, executionId) {
        return this.orchestrationEngine.getExecution(tenantId, executionId);
    }
    async listExecutions(tenantId, workflowId) {
        return this.orchestrationEngine.listExecutions(tenantId, workflowId);
    }
    async cancelExecution(tenantId, executionId) {
        return this.orchestrationEngine.cancelExecution(tenantId, executionId);
    }
    // Actions
    listActions() {
        return this.actionEngine.listActions();
    }
    getAction(type) {
        return this.actionEngine.getAction(type);
    }
}
// ============================================
// EXPRESS ROUTES
// ============================================
export function createWorkflowRoutes(platform) {
    const router = express.Router();
    // Workflow CRUD
    router.post('/', tenantMiddleware(), async (req, res) => {
        try {
            const tenantId = req.tenantContext.tenant_id;
            const workflow = await platform.createWorkflow(tenantId, req.body.userId, req.body);
            res.json(createResponse(workflow, { tenantId }));
        }
        catch (error) {
            res.status(500).json(createErrorResponse('CREATE_ERROR', error.message));
        }
    });
    router.get('/', tenantMiddleware(), async (req, res) => {
        try {
            const tenantId = req.tenantContext.tenant_id;
            const workflows = await platform.listWorkflows(tenantId, req.query);
            res.json(createResponse(workflows, { tenantId }));
        }
        catch (error) {
            res.status(500).json(createErrorResponse('LIST_ERROR', error.message));
        }
    });
    router.get('/:id', tenantMiddleware(), async (req, res) => {
        try {
            const tenantId = req.tenantContext.tenant_id;
            const workflow = await platform.getWorkflow(tenantId, req.params.id);
            if (!workflow)
                return res.status(404).json(createErrorResponse('NOT_FOUND', 'Workflow not found'));
            res.json(createResponse(workflow, { tenantId }));
        }
        catch (error) {
            res.status(500).json(createErrorResponse('GET_ERROR', error.message));
        }
    });
    router.put('/:id', tenantMiddleware(), async (req, res) => {
        try {
            const tenantId = req.tenantContext.tenant_id;
            const workflow = await platform.updateWorkflow(tenantId, req.params.id, req.body);
            if (!workflow)
                return res.status(404).json(createErrorResponse('NOT_FOUND', 'Workflow not found'));
            res.json(createResponse(workflow, { tenantId }));
        }
        catch (error) {
            res.status(500).json(createErrorResponse('UPDATE_ERROR', error.message));
        }
    });
    router.post('/:id/activate', tenantMiddleware(), async (req, res) => {
        try {
            const tenantId = req.tenantContext.tenant_id;
            const workflow = await platform.activateWorkflow(tenantId, req.params.id);
            if (!workflow)
                return res.status(404).json(createErrorResponse('NOT_FOUND', 'Workflow not found'));
            res.json(createResponse(workflow, { tenantId }));
        }
        catch (error) {
            res.status(500).json(createErrorResponse('ACTIVATE_ERROR', error.message));
        }
    });
    router.post('/:id/pause', tenantMiddleware(), async (req, res) => {
        try {
            const tenantId = req.tenantContext.tenant_id;
            const workflow = await platform.pauseWorkflow(tenantId, req.params.id);
            if (!workflow)
                return res.status(404).json(createErrorResponse('NOT_FOUND', 'Workflow not found'));
            res.json(createResponse(workflow, { tenantId }));
        }
        catch (error) {
            res.status(500).json(createErrorResponse('PAUSE_ERROR', error.message));
        }
    });
    // Execution
    router.post('/:id/execute', tenantMiddleware(), async (req, res) => {
        try {
            const tenantId = req.tenantContext.tenant_id;
            const execution = await platform.execute(tenantId, req.params.id, req.body);
            res.json(createResponse(execution, { tenantId }));
        }
        catch (error) {
            res.status(400).json(createErrorResponse('EXECUTE_ERROR', error.message));
        }
    });
    router.get('/:id/executions', tenantMiddleware(), async (req, res) => {
        try {
            const tenantId = req.tenantContext.tenant_id;
            const executions = await platform.listExecutions(tenantId, req.params.id);
            res.json(createResponse(executions, { tenantId }));
        }
        catch (error) {
            res.status(500).json(createErrorResponse('LIST_ERROR', error.message));
        }
    });
    router.get('/executions/:executionId', tenantMiddleware(), async (req, res) => {
        try {
            const tenantId = req.tenantContext.tenant_id;
            const execution = await platform.getExecution(tenantId, req.params.executionId);
            if (!execution)
                return res.status(404).json(createErrorResponse('NOT_FOUND', 'Execution not found'));
            res.json(createResponse(execution, { tenantId }));
        }
        catch (error) {
            res.status(500).json(createErrorResponse('GET_ERROR', error.message));
        }
    });
    router.post('/executions/:executionId/cancel', tenantMiddleware(), async (req, res) => {
        try {
            const tenantId = req.tenantContext.tenant_id;
            const cancelled = await platform.cancelExecution(tenantId, req.params.executionId);
            if (!cancelled)
                return res.status(400).json(createErrorResponse('CANCEL_ERROR', 'Cannot cancel execution'));
            res.json(createResponse({ cancelled: true }, { tenantId }));
        }
        catch (error) {
            res.status(500).json(createErrorResponse('CANCEL_ERROR', error.message));
        }
    });
    // Actions
    router.get('/actions', async (req, res) => {
        res.json(createResponse(platform.listActions()));
    });
    router.get('/actions/:type', async (req, res) => {
        const action = platform.getAction(req.params.type);
        if (!action)
            return res.status(404).json(createErrorResponse('NOT_FOUND', 'Action not found'));
        res.json(createResponse(action));
    });
    return router;
}
// ============================================
// BOOTSTRAP
// ============================================
export async function bootstrap(port = 4560) {
    const platform = new HojaiWorkflowPlatform();
    const app = express();
    app.use(express.json());
    app.get('/health', (req, res) => {
        res.json({ status: 'healthy', service: 'hojai-workflow', version: '2.0.0' });
    });
    app.use('/api/workflows', createWorkflowRoutes(platform));
    app.listen(port, () => {
        logger.info('hojai_workflow_platform_enhanced_started', { port });
    });
    return { platform, app };
}
export default { HojaiWorkflowPlatform, createWorkflowRoutes, bootstrap };
//# sourceMappingURL=index.js.map