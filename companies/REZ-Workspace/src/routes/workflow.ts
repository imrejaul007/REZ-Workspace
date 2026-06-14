/**
 * REZ Workspace Workflow Routes
 * Automation and workflow management
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Workflow } from '../models';
import { rezWorkspaceHub } from '../hub-client';

const router = Router();

// In-memory workflow store (for demo)
const workflows = new Map<string, any>();
const workflowRuns = new Map<string, any[]>();

// Seed demo workflows
const demoWorkflows = [
  {
    id: 'wf-1',
    name: 'New Lead Notification',
    description: 'Notify sales team when new lead is created',
    trigger: { type: 'event', event: 'lead.created' },
    actions: [
      { type: 'notify', config: { channel: 'sales-leads', message: 'New lead: {{lead.name}}' } },
      { type: 'assign', config: { to: 'sales-manager', task: 'Follow up with new lead' } },
    ],
    workspaceId: 'ws-1',
    createdBy: 'user-1',
    isActive: true,
    lastRun: new Date().toISOString(),
    runCount: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wf-2',
    name: 'Weekly Report',
    description: 'Send weekly summary to team',
    trigger: { type: 'schedule', schedule: '0 9 * * 1' },
    actions: [
      { type: 'email', config: { to: 'team@company.com', subject: 'Weekly Report' } },
    ],
    workspaceId: 'ws-1',
    createdBy: 'user-1',
    isActive: true,
    lastRun: new Date().toISOString(),
    runCount: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

demoWorkflows.forEach(w => {
  workflows.set(w.id, w);
  workflowRuns.set(w.id, []);
});

// ============================================
// WORKFLOW ROUTES
// ============================================

// List workflows
router.get('/', async (req: Request, res: Response) => {
  try {
    const { workspaceId, status } = req.query;

    let result = Array.from(workflows.values());

    if (workspaceId) {
      result = result.filter(w => w.workspaceId === workspaceId);
    }

    if (status === 'active') {
      result = result.filter(w => w.isActive);
    } else if (status === 'inactive') {
      result = result.filter(w => !w.isActive);
    }

    res.json({
      success: true,
      workflows: result,
      count: result.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get workflow by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const workflow = workflows.get(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
      });
    }

    const runs = workflowRuns.get(req.params.id) || [];

    res.json({
      success: true,
      workflow,
      runs: runs.slice(-10), // Last 10 runs
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Create workflow
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, trigger, actions, workspaceId } = req.body;
    const userId = req.headers['x-user-id'] as string;

    if (!name || !trigger || !actions || actions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name, trigger, and at least one action are required',
      });
    }

    const workflow = {
      id: `wf-${uuidv4().slice(0, 8)}`,
      name,
      description: description || '',
      trigger,
      actions,
      workspaceId: workspaceId || 'ws-1',
      createdBy: userId || 'user-1',
      isActive: true,
      lastRun: null,
      runCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    workflows.set(workflow.id, workflow);
    workflowRuns.set(workflow.id, []);

    // Create in HOJAI Workflows
    await rezWorkspaceHub.createWorkflow({
      name,
      trigger,
      actions,
      workspace_id: workspaceId,
    });

    // Track event
    await rezWorkspaceHub.trackEvent(userId, 'workflow.created', {
      workflow_id: workflow.id,
    });

    res.status(201).json({
      success: true,
      workflow,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Update workflow
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const workflow = workflows.get(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
      });
    }

    const { name, description, trigger, actions, isActive } = req.body;

    if (name) workflow.name = name;
    if (description !== undefined) workflow.description = description;
    if (trigger) workflow.trigger = trigger;
    if (actions) workflow.actions = actions;
    if (isActive !== undefined) workflow.isActive = isActive;
    workflow.updatedAt = new Date().toISOString();

    workflows.set(req.params.id, workflow);

    res.json({
      success: true,
      workflow,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Delete workflow
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const workflow = workflows.get(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
      });
    }

    workflows.delete(req.params.id);
    workflowRuns.delete(req.params.id);

    res.json({
      success: true,
      message: 'Workflow deleted',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Toggle workflow active status
router.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const workflow = workflows.get(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
      });
    }

    workflow.isActive = !workflow.isActive;
    workflow.updatedAt = new Date().toISOString();

    workflows.set(req.params.id, workflow);

    res.json({
      success: true,
      isActive: workflow.isActive,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Trigger workflow manually
router.post('/:id/trigger', async (req: Request, res: Response) => {
  try {
    const workflow = workflows.get(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
      });
    }

    const { data } = req.body;
    const userId = req.headers['x-user-id'] as string;

    // Create run record
    const run = {
      id: `run-${uuidv4().slice(0, 8)}`,
      workflowId: req.params.id,
      triggeredAt: new Date().toISOString(),
      status: 'running',
      data,
    };

    const runs = workflowRuns.get(req.params.id) || [];
    runs.push(run);
    workflowRuns.set(req.params.id, runs);

    // Execute workflow via HOJAI
    const result = await rezWorkspaceHub.executeWorkflow(req.params.id, data || {});

    // Update run status
    run.completedAt = new Date().toISOString();
    run.status = 'success';

    // Update workflow stats
    workflow.lastRun = new Date().toISOString();
    workflow.runCount++;
    workflows.set(req.params.id, workflow);

    // Track event
    await rezWorkspaceHub.trackEvent(userId, 'workflow.triggered', {
      workflow_id: workflow.id,
    });

    res.json({
      success: true,
      run,
      result,
    });
  } catch (error) {
    // Update run status on error
    const runs = workflowRuns.get(req.params.id) || [];
    const run = runs[runs.length - 1];
    if (run) {
      run.status = 'failed';
      run.error = (error as Error).message;
      run.completedAt = new Date().toISOString();
    }

    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// Get workflow runs
router.get('/:id/runs', async (req: Request, res: Response) => {
  try {
    const workflow = workflows.get(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const runs = workflowRuns.get(req.params.id) || [];

    // Sort by most recent
    runs.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());

    // Paginate
    const start = (parseInt(page as string) - 1) * parseInt(limit as string);
    const paginatedRuns = runs.slice(start, start + parseInt(limit as string));

    res.json({
      success: true,
      runs: paginatedRuns,
      count: runs.length,
      totalPages: Math.ceil(runs.length / parseInt(limit as string)),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get workflow run by ID
router.get('/:id/runs/:runId', async (req: Request, res: Response) => {
  try {
    const workflow = workflows.get(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
      });
    }

    const runs = workflowRuns.get(req.params.id) || [];
    const run = runs.find(r => r.id === req.params.runId);

    if (!run) {
      return res.status(404).json({
        success: false,
        error: 'Run not found',
      });
    }

    res.json({
      success: true,
      run,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get workflow templates
router.get('/templates/list', async (req: Request, res: Response) => {
  try {
    const templates = [
      {
        id: 'lead-notification',
        name: 'Lead Notification',
        description: 'Notify team when new lead is created',
        trigger: { type: 'event', event: 'lead.created' },
        actions: [{ type: 'notify', config: { channel: 'sales', message: 'New lead: {{lead.name}}' } }],
      },
      {
        id: 'welcome-email',
        name: 'Welcome Email',
        description: 'Send welcome email to new users',
        trigger: { type: 'event', event: 'user.created' },
        actions: [{ type: 'email', config: { to: '{{user.email}}', subject: 'Welcome!' } }],
      },
      {
        id: 'meeting-reminder',
        name: 'Meeting Reminder',
        description: 'Send reminder 15 minutes before meeting',
        trigger: { type: 'schedule', schedule: '*/15 * * * *' },
        actions: [{ type: 'notify', config: { message: 'Meeting starts in 15 minutes' } }],
      },
      {
        id: 'weekly-report',
        name: 'Weekly Report',
        description: 'Generate and send weekly report',
        trigger: { type: 'schedule', schedule: '0 9 * * 1' },
        actions: [{ type: 'email', config: { to: 'team@company.com', subject: 'Weekly Report' } }],
      },
      {
        id: 'task-assignment',
        name: 'Task Assignment',
        description: 'Auto-assign tasks based on rules',
        trigger: { type: 'event', event: 'task.created' },
        actions: [{ type: 'assign', config: { to: '{{task.department}}', task: '{{task.title}}' } }],
      },
    ];

    res.json({
      success: true,
      templates,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get available triggers
router.get('/triggers/list', async (req: Request, res: Response) => {
  try {
    const triggers = [
      { type: 'event', name: 'Event', description: 'Trigger on specific event', events: ['lead.created', 'lead.updated', 'user.created', 'task.completed', 'meeting.started'] },
      { type: 'schedule', name: 'Schedule', description: 'Trigger on schedule', schedules: ['hourly', 'daily', 'weekly', 'monthly'] },
      { type: 'manual', name: 'Manual', description: 'Trigger manually' },
    ];

    res.json({
      success: true,
      triggers,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get available actions
router.get('/actions/list', async (req: Request, res: Response) => {
  try {
    const actions = [
      { type: 'notify', name: 'Send Notification', description: 'Send in-app notification', fields: ['channel', 'message'] },
      { type: 'email', name: 'Send Email', description: 'Send email', fields: ['to', 'subject', 'body'] },
      { type: 'assign', name: 'Assign Task', description: 'Assign task to user', fields: ['to', 'task'] },
      { type: 'webhook', name: 'Call Webhook', description: 'Call external webhook', fields: ['url', 'method', 'body'] },
      { type: 'delay', name: 'Delay', description: 'Wait before next action', fields: ['duration'] },
      { type: 'condition', name: 'Condition', description: 'Branch based on condition', fields: ['field', 'operator', 'value'] },
    ];

    res.json({
      success: true,
      actions,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// CORPPERKS INTEGRATION
// ============================================

// Get HR workflows
router.get('/corpperks/hr-workflows', async (req: Request, res: Response) => {
  try {
    const hrWorkflows = [
      {
        id: 'hr-onboarding',
        name: 'New Employee Onboarding',
        description: 'Automated onboarding sequence',
        trigger: { type: 'event', event: 'employee.created' },
        actions: [
          { type: 'notify', config: { channel: 'hr', message: 'New employee: {{employee.name}}' } },
          { type: 'assign', config: { to: 'hr-manager', task: 'Complete onboarding for {{employee.name}}' } },
          { type: 'email', config: { to: '{{employee.email}}', subject: 'Welcome to the team!' } },
        ],
      },
      {
        id: 'hr-leave-approval',
        name: 'Leave Request Approval',
        description: 'Route leave requests to manager',
        trigger: { type: 'event', event: 'leave.requested' },
        actions: [
          { type: 'notify', config: { channel: 'manager', message: 'Leave request from {{employee.name}}' } },
          { type: 'email', config: { to: '{{manager.email}}', subject: 'Leave Request Approval' } },
        ],
      },
      {
        id: 'hr-anniversary',
        name: 'Work Anniversary',
        description: 'Celebrate work anniversaries',
        trigger: { type: 'schedule', schedule: '0 9 * * *' },
        actions: [
          { type: 'notify', config: { channel: 'general', message: '🎉 Happy anniversary to {{employee.name}}!' } },
        ],
      },
    ];

    res.json({
      success: true,
      workflows: hrWorkflows,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Create HR workflow
router.post('/corpperks/hr-workflows', async (req: Request, res: Response) => {
  try {
    const { name, description, trigger, actions, employeeId } = req.body;

    const workflow = {
      id: `wf-hr-${uuidv4().slice(0, 8)}`,
      name,
      description: description || '',
      trigger,
      actions,
      workspaceId: 'hr-workspace',
      createdBy: req.headers['x-user-id'] as string || 'system',
      isActive: true,
      lastRun: null,
      runCount: 0,
      type: 'hr-workflow',
      employeeId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    workflows.set(workflow.id, workflow);
    workflowRuns.set(workflow.id, []);

    res.status(201).json({
      success: true,
      workflow,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Sync workflows with CorpPerks
router.post('/corpperks/sync', async (req: Request, res: Response) => {
  try {
    // Sync workflow data with CorpPerks
    const syncData = {
      workflows: Array.from(workflows.values()),
      lastSynced: new Date().toISOString(),
    };

    res.json({
      success: true,
      message: 'Workflows synced with CorpPerks',
      synced: syncData,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;