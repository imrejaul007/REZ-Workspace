/**
 * BIZORA Workflow Orchestrator
 * Executes business workflows across services
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 4050;

// ============================================================================
// Types
// ============================================================================

interface WorkflowStep {
  id: string;
  name: string;
  service: string;
  action: string;
  params: Record<string, unknown>;
  dependsOn: string[];
  timeout: number;
  retry: number;
  onSuccess?: string;
  onFailure?: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  industry: string;
  steps: WorkflowStep[];
  estimatedTime: string;
  estimatedCost: number;
  outcomes: string[];
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  userId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  currentStep?: string;
  progress: number;
  steps: {
    stepId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startedAt?: Date;
    completedAt?: Date;
    result?: unknown;
    error?: string;
  }[];
  context: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Business Playbooks (Workflow Templates)
// ============================================================================

const PLAYBOOKS: Record<string, Workflow> = {
  launch_restaurant: {
    id: 'launch_restaurant',
    name: 'Launch My Restaurant',
    description: 'Complete restaurant launch from registration to opening day',
    industry: 'restaurant',
    estimatedTime: '2-4 weeks',
    estimatedCost: 50000,
    steps: [
      { id: 'step_1', name: 'Company Registration', service: 'taxflow', action: 'register_company', params: { type: 'proprietorship' }, dependsOn: [], timeout: 86400000, retry: 2 },
      { id: 'step_2', name: 'GST Registration', service: 'taxflow', action: 'file_gst', params: {}, dependsOn: ['step_1'], timeout: 86400000, retry: 2 },
      { id: 'step_3', name: 'FSSAI License', service: 'taxflow', action: 'file_fssai', params: {}, dependsOn: ['step_1'], timeout: 172800000, retry: 1 },
      { id: 'step_4', name: 'Bank Account Setup', service: 'finance', action: 'create_account', params: {}, dependsOn: ['step_1'], timeout: 172800000, retry: 1 },
      { id: 'step_5', name: 'POS System Setup', service: 'restaurant-os', action: 'setup', params: {}, dependsOn: ['step_4'], timeout: 3600000, retry: 3 },
      { id: 'step_6', name: 'QR Menu Setup', service: 'restaurant-os', action: 'setup_qr', params: {}, dependsOn: ['step_5'], timeout: 1800000, retry: 2 },
      { id: 'step_7', name: 'Delivery Integration', service: 'restaurant-os', action: 'setup_delivery', params: {}, dependsOn: ['step_5'], timeout: 3600000, retry: 2 },
      { id: 'step_8', name: 'Staff Hiring', service: 'people-os', action: 'create_positions', params: {}, dependsOn: [], timeout: 604800000, retry: 1 },
      { id: 'step_9', name: 'Marketing Setup', service: 'marketplace', action: 'setup_marketing', params: {}, dependsOn: ['step_4'], timeout: 1800000, retry: 2 },
      { id: 'step_10', name: 'Social Media Launch', service: 'marketplace', action: 'create_campaign', params: {}, dependsOn: ['step_9'], timeout: 3600000, retry: 2 },
    ],
    outcomes: ['Operational restaurant', 'Legal compliance', 'Active marketing', 'POS running'],
  },

  launch_salon: {
    id: 'launch_salon',
    name: 'Launch My Salon',
    description: 'Complete salon setup from registration to grand opening',
    industry: 'salon',
    estimatedTime: '1-3 weeks',
    estimatedCost: 30000,
    steps: [
      { id: 'step_1', name: 'Company Registration', service: 'taxflow', action: 'register_company', params: {}, dependsOn: [], timeout: 86400000, retry: 2 },
      { id: 'step_2', name: 'GST Registration', service: 'taxflow', action: 'file_gst', params: {}, dependsOn: ['step_1'], timeout: 86400000, retry: 2 },
      { id: 'step_3', name: 'SalonOS Setup', service: 'salon-os', action: 'setup', params: {}, dependsOn: ['step_2'], timeout: 3600000, retry: 3 },
      { id: 'step_4', name: 'Staff Management', service: 'people-os', action: 'create_positions', params: {}, dependsOn: ['step_1'], timeout: 604800000, retry: 1 },
      { id: 'step_5', name: 'Marketing Setup', service: 'marketplace', action: 'setup_marketing', params: {}, dependsOn: ['step_3'], timeout: 1800000, retry: 2 },
      { id: 'step_6', name: 'Loyalty Program', service: 'salon-os', action: 'setup_loyalty', params: {}, dependsOn: ['step_3'], timeout: 1800000, retry: 2 },
    ],
    outcomes: ['Operational salon', 'Loyalty program active', 'Staff hired'],
  },

  launch_hotel: {
    id: 'launch_hotel',
    name: 'Launch My Hotel/PG',
    description: 'Complete property launch from compliance to operations',
    industry: 'hotel',
    estimatedTime: '3-6 weeks',
    estimatedCost: 100000,
    steps: [
      { id: 'step_1', name: 'Company Registration', service: 'taxflow', action: 'register_company', params: {}, dependsOn: [], timeout: 86400000, retry: 2 },
      { id: 'step_2', name: 'GST Registration', service: 'taxflow', action: 'file_gst', params: {}, dependsOn: ['step_1'], timeout: 86400000, retry: 2 },
      { id: 'step_3', name: 'HotelOS Setup', service: 'hotel-os', action: 'setup_property', params: {}, dependsOn: ['step_1'], timeout: 3600000, retry: 3 },
      { id: 'step_4', name: 'Room Configuration', service: 'hotel-os', action: 'setup_rooms', params: {}, dependsOn: ['step_3'], timeout: 7200000, retry: 2 },
      { id: 'step_5', name: 'Channel Manager', service: 'hotel-os', action: 'setup_channels', params: {}, dependsOn: ['step_4'], timeout: 3600000, retry: 2 },
      { id: 'step_6', name: 'Staff Hiring', service: 'people-os', action: 'create_positions', params: {}, dependsOn: ['step_1'], timeout: 604800000, retry: 1 },
      { id: 'step_7', name: 'Housekeeping Setup', service: 'hotel-os', action: 'setup_housekeeping', params: {}, dependsOn: ['step_3'], timeout: 1800000, retry: 2 },
    ],
    outcomes: ['Property live', 'OTA connected', 'Staff trained'],
  },

  expand_gcc: {
    id: 'expand_gcc',
    name: 'Expand to UAE/GCC',
    description: 'Setup UAE company and India compliance bridge',
    industry: 'general',
    estimatedTime: '4-8 weeks',
    estimatedCost: 150000,
    steps: [
      { id: 'step_1', name: 'UAE Trade License', service: 'compliance', action: 'uae_trade_license', params: {}, dependsOn: [], timeout: 2592000000, retry: 1 },
      { id: 'step_2', name: 'VAT Registration', service: 'taxflow', action: 'vat_registration', params: {}, dependsOn: ['step_1'], timeout: 604800000, retry: 2 },
      { id: 'step_3', name: 'Corporate Bank Account', service: 'finance', action: 'open_corporate_account', params: {}, dependsOn: ['step_1'], timeout: 1209600000, retry: 1 },
      { id: 'step_4', name: 'India GST for Exports', service: 'taxflow', action: 'gst_export_registration', params: {}, dependsOn: ['step_1'], timeout: 604800000, retry: 2 },
      { id: 'step_5', name: 'Bilingual Invoicing', service: 'invoiceflow', action: 'setup_arabic', params: {}, dependsOn: ['step_1'], timeout: 1800000, retry: 2 },
      { id: 'step_6', name: 'WhatsApp Business', service: 'whatsapp', action: 'setup_arabic', params: {}, dependsOn: [], timeout: 3600000, retry: 2 },
    ],
    outcomes: ['UAE legal entity', 'VAT registered', 'Bilingual operations'],
  },

  compliance_automation: {
    id: 'compliance_automation',
    name: 'Automate Compliance',
    description: 'Set up automated compliance for the year',
    industry: 'general',
    estimatedTime: 'Setup once',
    estimatedCost: 9999,
    steps: [
      { id: 'step_1', name: 'GST Filing Automation', service: 'taxflow', action: 'setup_auto_filing', params: {}, dependsOn: [], timeout: 3600000, retry: 2 },
      { id: 'step_2', name: 'TDS Automation', service: 'taxflow', action: 'setup_tds_auto', params: {}, dependsOn: ['step_1'], timeout: 3600000, retry: 2 },
      { id: 'step_3', name: 'Calendar Integration', service: 'notification', action: 'setup_reminders', params: {}, dependsOn: ['step_1'], timeout: 1800000, retry: 2 },
      { id: 'step_4', name: 'Compliance Dashboard', service: 'advisor', action: 'setup_tracking', params: {}, dependsOn: ['step_1'], timeout: 1800000, retry: 2 },
    ],
    outcomes: ['Automated filings', 'Never miss deadlines', 'Peace of mind'],
  },

  marketing_automation: {
    id: 'marketing_automation',
    name: 'Marketing Automation Setup',
    description: 'Complete marketing machine for your business',
    industry: 'general',
    estimatedTime: '1 week',
    estimatedCost: 14999,
    steps: [
      { id: 'step_1', name: 'Social Media Strategy', service: 'marketplace', action: 'create_strategy', params: {}, dependsOn: [], timeout: 86400000, retry: 2 },
      { id: 'step_2', name: 'Content Calendar', service: 'marketplace', action: 'create_content_plan', params: {}, dependsOn: ['step_1'], timeout: 86400000, retry: 2 },
      { id: 'step_3', name: 'Ad Campaigns', service: 'marketplace', action: 'setup_ads', params: {}, dependsOn: ['step_1'], timeout: 3600000, retry: 2 },
      { id: 'step_4', name: 'Email Marketing', service: 'notification', action: 'setup_email_sequences', params: {}, dependsOn: ['step_1'], timeout: 3600000, retry: 2 },
      { id: 'step_5', name: 'WhatsApp Campaigns', service: 'whatsapp', action: 'setup_sequences', params: {}, dependsOn: ['step_1'], timeout: 3600000, retry: 2 },
      { id: 'step_6', name: 'Analytics Dashboard', service: 'advisor', action: 'setup_marketing_dashboard', params: {}, dependsOn: ['step_3'], timeout: 1800000, retry: 2 },
    ],
    outcomes: ['Active campaigns', 'Content calendar', 'Analytics dashboard'],
  },
};

// ============================================================================
// Store
// ============================================================================

const executions = new Map<string, WorkflowExecution>();

// ============================================================================
// API Routes
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'workflow-orchestrator',
    playbooks: Object.keys(PLAYBOOKS).length,
    activeExecutions: Array.from(executions.values()).filter(e => e.status === 'running').length,
    timestamp: new Date().toISOString(),
  });
});

// List all playbooks
app.get('/api/playbooks', (_req: Request, res: Response) => {
  const playbooks = Object.values(PLAYBOOKS).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    industry: p.industry,
    estimatedTime: p.estimatedTime,
    estimatedCost: p.estimatedCost,
    stepCount: p.steps.length,
    outcomes: p.outcomes,
  }));
  res.json({ playbooks });
});

// Get playbook details
app.get('/api/playbooks/:id', (req: Request, res: Response) => {
  const playbook = PLAYBOOKS[req.params.id];
  if (!playbook) {
    return res.status(404).json({ error: 'Playbook not found' });
  }
  res.json(playbook);
});

// Start playbook execution
app.post('/api/playbooks/:id/execute', (req: Request, res: Response) => {
  const playbook = PLAYBOOKS[req.params.id];
  if (!playbook) {
    return res.status(404).json({ error: 'Playbook not found' });
  }

  const userId = req.body.userId || 'demo-user';
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const execution: WorkflowExecution = {
    id: executionId,
    workflowId: playbook.id,
    workflowName: playbook.name,
    userId,
    status: 'pending',
    progress: 0,
    steps: playbook.steps.map(s => ({
      stepId: s.id,
      status: 'pending',
    })),
    context: req.body.context || {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  executions.set(executionId, execution);

  // Start execution asynchronously
  executeWorkflow(executionId, playbook);

  res.status(201).json({
    executionId,
    workflowName: playbook.name,
    status: 'started',
    message: 'Workflow execution started',
    estimatedTime: playbook.estimatedTime,
  });
});

// Get execution status
app.get('/api/executions/:id', (req: Request, res: Response) => {
  const execution = executions.get(req.params.id);
  if (!execution) {
    return res.status(404).json({ error: 'Execution not found' });
  }
  res.json(execution);
});

// List user executions
app.get('/api/executions', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const userExecutions = Array.from(executions.values())
    .filter(e => !userId || e.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  res.json({ executions: userExecutions });
});

// Pause execution
app.post('/api/executions/:id/pause', (req: Request, res: Response) => {
  const execution = executions.get(req.params.id);
  if (!execution) {
    return res.status(404).json({ error: 'Execution not found' });
  }
  execution.status = 'paused';
  execution.updatedAt = new Date();
  executions.set(execution.id, execution);
  res.json({ status: 'paused' });
});

// Resume execution
app.post('/api/executions/:id/resume', (req: Request, res: Response) => {
  const execution = executions.get(req.params.id);
  if (!execution) {
    return res.status(404).json({ error: 'Execution not found' });
  }
  execution.status = 'running';
  execution.updatedAt = new Date();
  executions.set(execution.id, execution);
  executeWorkflow(execution.id, PLAYBOOKS[execution.workflowId]);
  res.json({ status: 'resumed' });
});

// Cancel execution
app.post('/api/executions/:id/cancel', (req: Request, res: Response) => {
  const execution = executions.get(req.params.id);
  if (!execution) {
    return res.status(404).json({ error: 'Execution not found' });
  }
  execution.status = 'failed';
  execution.updatedAt = new Date();
  executions.set(execution.id, execution);
  res.json({ status: 'cancelled' });
});

// ============================================================================
// Workflow Execution Engine
// ============================================================================

async function executeWorkflow(executionId: string, playbook: Workflow) {
  const execution = executions.get(executionId);
  if (!execution) return;

  execution.status = 'running';
  executions.set(executionId, execution);

  // Simulate workflow steps
  for (let i = 0; i < playbook.steps.length; i++) {
    const step = playbook.steps[i];
    const stepStatus = execution.steps[i];

    // Check if paused
    const current = executions.get(executionId);
    if (current?.status === 'paused') {
      return;
    }

    // Wait for dependencies
    if (step.dependsOn.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Execute step
    stepStatus.status = 'running';
    execution.currentStep = step.name;
    execution.progress = Math.round((i / playbook.steps.length) * 100);
    execution.updatedAt = new Date();
    executions.set(executionId, execution);

    // Simulate step execution
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mark step complete
    stepStatus.status = 'completed';
    stepStatus.completedAt = new Date();
    stepStatus.result = { success: true, message: `${step.name} completed` };
    execution.progress = Math.round(((i + 1) / playbook.steps.length) * 100);
    execution.updatedAt = new Date();
    executions.set(executionId, execution);
  }

  // Mark execution complete
  execution.status = 'completed';
  execution.progress = 100;
  execution.updatedAt = new Date();
  executions.set(executionId, execution);

  logger.info(`[Workflow] Completed: ${executionId}`);
}

// ============================================================================
// Start Server
// ============================================================================

app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔄 BIZORA Workflow Orchestrator                      ║
║   Business Playbook Execution Engine                  ║
║                                                           ║
║   Port: ${PORT}                                             ║
║   Playbooks: ${Object.keys(PLAYBOOKS).length}                                        ║
║                                                           ║
║   Playbooks:                                              ║
║   • launch_restaurant - Complete restaurant setup         ║
║   • launch_salon - Complete salon setup                  ║
║   • launch_hotel - Complete hotel setup                  ║
║   • expand_gcc - UAE/GCC expansion                      ║
║   • compliance_automation - Auto compliance setup       ║
║   • marketing_automation - Marketing machine setup     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
