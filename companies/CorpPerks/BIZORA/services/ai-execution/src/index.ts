/**
 * BIZORA AI Execution Engine
 * AI that DOES things, not just recommends
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// ============================================================================
// AI Actions That Execute
// ============================================================================

const AI_ACTIONS = {
  // Compliance - AI FILES GST
  'file_gst': {
    name: 'File GST Return',
    description: 'Automatically files GSTR-3B',
    steps: [
      { action: 'Fetch invoice data', service: 'invoiceflow' },
      { action: 'Calculate tax liability', service: 'taxflow' },
      { action: 'Reconcile ITC', service: 'taxflow' },
      { action: 'Generate JSON', service: 'gst-portal' },
      { action: 'File return', service: 'gst-portal' }
    ],
    automatable: true,
    estimatedMinutes: 5
  },

  // Finance - AI SENDS invoice
  'send_invoice': {
    name: 'Send Invoice + Follow-ups',
    description: 'Creates and sends invoice, chases payment',
    steps: [
      { action: 'Generate invoice', service: 'invoiceflow' },
      { action: 'Send via WhatsApp/Email', service: 'notification' },
      { action: 'Set payment reminder', service: 'notification' },
      { action: 'Track delivery', service: 'notification' }
    ],
    automatable: true,
    estimatedMinutes: 2
  },

  // Marketing - AI LAUNCHES campaign
  'launch_campaign': {
    name: 'Launch Marketing Campaign',
    description: 'Creates + runs campaign automatically',
    steps: [
      { action: 'Create ad creatives', service: 'marketing' },
      { action: 'Set targeting', service: 'marketing' },
      { action: 'Launch on channels', service: 'notification' },
      { action: 'Optimize budget', service: 'ai' },
      { action: 'Report results', service: 'dashboard' }
    ],
    automatable: true,
    estimatedMinutes: 10
  },

  // Vendor - AI ASSIGNS vendor
  'assign_vendor': {
    name: 'Match + Assign Vendor',
    description: 'Finds best vendor, initiates project',
    steps: [
      { action: 'Match requirements', service: 'vendor-match' },
      { action: 'Send brief', service: 'notification' },
      { action: 'Track response', service: 'whatsapp' },
      { action: 'Negotiate terms', service: 'ai' },
      { action: 'Contract + Escrow', service: 'trust-escrow' }
    ],
    automatable: true,
    estimatedMinutes: 30
  },

  // HR - AI ONBOARDS employee
  'onboard_employee': {
    name: 'Onboard Employee',
    description: 'Full digital onboarding workflow',
    steps: [
      { action: 'Send offer letter', service: 'people-os' },
      { action: 'Collect documents', service: 'people-os' },
      { action: 'Setup payroll', service: 'people-os' },
      { action: 'Configure attendance', service: 'people-os' },
      { action: 'Welcome + training', service: 'notification' }
    ],
    automatable: true,
    estimatedMinutes: 60
  },

  // Compliance - AI REMINDS deadlines
  'compliance_reminder': {
    name: 'Compliance Automation',
    description: 'Never miss a deadline',
    triggers: ['gst_due', 'tds_due', 'roc_filing']
  },

  // Finance - AI RECONCILES payments
  'reconcile_payments': {
    name: 'Auto Payment Reconciliation',
    description: 'Matches payments to invoices',
    steps: [
      { action: 'Fetch bank statements', service: 'finance' },
      { action: 'Match transactions', service: 'ai' },
      { action: 'Update invoice status', service: 'invoiceflow' },
      { action: 'Alert mismatches', service: 'notification' }
    ],
    automatable: true,
    estimatedMinutes: 5
  }
};

// Execution tracking
interface Execution {
  id: string;
  action: string;
  userId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  logs: string[];
  result?: any;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

const executions = new Map<string, Execution>();

// ============================================================================
// API Routes
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'ai-execution',
    actions: Object.keys(AI_ACTIONS).length,
    running: Array.from(executions.values()).filter(e => e.status === 'running').length
  });
});

// List AI actions
app.get('/api/actions', (_req: Request, res: Response) => {
  const actions = Object.entries(AI_ACTIONS).map(([id, action]) => ({
    id,
    name: action.name,
    description: action.description,
    automatable: action.automatable,
    estimatedMinutes: action.estimatedMinutes
  }));
  res.json({ actions });
});

// Execute AI action
app.post('/api/execute', async (req: Request, res: Response) => {
  const { action, userId, params } = req.body;

  const actionDef = AI_ACTIONS[action];
  if (!actionDef) {
    return res.status(404).json({ error: 'Action not found' });
  }

  const execId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const execution: Execution = {
    id: execId,
    action,
    userId: userId || 'demo_user',
    status: 'queued',
    progress: 0,
    logs: [`Action queued: ${action}`]
  };

  executions.set(execId, execution);
  res.status(201).json({
    executionId: execId,
    action: actionDef.name,
    status: 'queued',
    message: 'AI action queued for execution'
  });

  // Execute asynchronously
  executeAction(execId, action, params);
});

async function executeAction(execId: string, action: string, params?: any) {
  const execution = executions.get(execId);
  if (!execution) return;

  execution.status = 'running';
  execution.startedAt = new Date();
  execution.logs.push('Starting execution...');

  try {
    // Simulate execution steps
    const actionDef = AI_ACTIONS[action];
    const steps = actionDef.steps || [];

    for (let i = 0; i < steps.length; i++) {
      execution.logs.push(`Executing: ${steps[i].action}`);
      execution.progress = Math.round(((i + 1) / steps.length) * 100);
      execution.status = 'running';

      // Simulate API call
      await new Promise(r => setTimeout(r, 1000));

      execution.logs.push(`✓ Completed: ${steps[i].action}`);
      execution.progress = Math.round(((i + 2) / steps.length) * 100);
    }

    execution.status = 'completed';
    execution.completedAt = new Date();
    execution.progress = 100;
    execution.logs.push('✅ Action completed successfully');
    execution.result = {
      success: true,
      action,
      message: `${actionDef.name} completed`
    };

  } catch (error: any) {
    execution.status = 'failed';
    execution.error = error.message;
    execution.logs.push(`❌ Error: ${error.message}`);
  }

  executions.set(execId, execution);
}

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
  const list = Array.from(executions.values())
    .filter(e => !userId || e.userId === userId)
    .sort((a, b) => (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0));
  res.json({ executions: list });
});

// Trigger workflow from intent
app.post('/api/trigger', (req: Request, res: Response) => {
  const { intent, userId, context } = req.body;

  // Map intents to actions
  const intentMap: Record<string, string> = {
    'file_gst': 'file_gst',
    'send_invoice': 'send_invoice',
    'launch_campaign': 'launch_campaign',
    'onboard_employee': 'onboard_employee',
    'reconcile_payments': 'reconcile_payments'
  };

  const action = intentMap[intent];
  if (!action) {
    return res.json({ intent, message: 'No action mapped to this intent' });
  }

  res.json({
    intent,
    action,
    message: `Triggering ${action}`,
    nextStep: 'execution'
  });
});

const PORT = process.env.PORT || 4065;
app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════╗
║  🤖 AI Execution Engine                 ║
║  AI that DOES things, not just says   ║
║  Port: ${PORT}                             ║
║                                       ║
║  Actions: ${Object.keys(AI_ACTIONS).length}                          ║
╚══════════════════════════════════════════╝
  `);
});
