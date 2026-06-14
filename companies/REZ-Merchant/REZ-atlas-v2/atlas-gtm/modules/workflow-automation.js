/**
 * Workflow Automation
 *
 * Visual workflow builder with:
 * - Triggers (event-based, schedule-based)
 * - Actions (send email, update CRM, add tag, etc.)
 * - Conditions (if/else branching)
 * - Loops (for each)
 * - Delays
 */

const { v4: uuidv4 } = require('uuid');

// Workflow storage
const workflows = new Map();
const executions = new Map();
const tasks = new Map();

// ============================================
// WORKFLOW DEFINITION
// ============================================

/**
 * Create a workflow
 */
function createWorkflow(data) {
  const workflow = {
    id: uuidv4(),
    name: data.name,
    description: data.description || '',
    status: 'draft', // draft, active, paused, archived
    trigger: data.trigger,
    steps: data.steps || [],
    variables: data.variables || {},
    settings: {
      concurrency: data.settings?.concurrency || 10,
      retryOnError: data.settings?.retryOnError ?? true,
      maxRetries: data.settings?.maxRetries || 3
    },
    stats: {
      executions: 0,
      successes: 0,
      failures: 0
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  workflows.set(workflow.id, workflow);
  return workflow;
}

/**
 * Update workflow
 */
function updateWorkflow(id, updates) {
  const workflow = workflows.get(id);
  if (!workflow) return null;

  const updated = {
    ...workflow,
    ...updates,
    id,
    updatedAt: new Date().toISOString()
  };

  workflows.set(id, updated);
  return updated;
}

/**
 * Delete workflow
 */
function deleteWorkflow(id) {
  return workflows.delete(id);
}

/**
 * Get workflow
 */
function getWorkflow(id) {
  return workflows.get(id) || null;
}

/**
 * List all workflows
 */
function listWorkflows(filters = {}) {
  let results = Array.from(workflows.values());

  if (filters.status) {
    results = results.filter(w => w.status === filters.status);
  }

  return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// ============================================
// WORKFLOW STEPS
// ============================================

/**
 * Add step to workflow
 */
function addStep(workflowId, step) {
  const workflow = workflows.get(workflowId);
  if (!workflow) return null;

  const newStep = {
    id: uuidv4(),
    type: step.type, // trigger, action, condition, delay, loop
    ...step,
    order: workflow.steps.length
  };

  workflow.steps.push(newStep);
  workflow.updatedAt = new Date().toISOString();

  return newStep;
}

/**
 * Step types and their configurations
 */
const STEP_TYPES = {
  // Triggers
  trigger: {
    label: 'Trigger',
    icon: '⚡',
    config: {
      type: { type: 'select', options: ['event', 'schedule', 'webhook', 'manual'] },
      event: { type: 'string' },
      schedule: { type: 'cron' }
    }
  },

  // Actions
  send_email: {
    label: 'Send Email',
    icon: '📧',
    config: {
      template: { type: 'select' },
      to: { type: 'string' },
      subject: { type: 'string' }
    }
  },
  send_sms: {
    label: 'Send SMS',
    icon: '💬',
    config: {
      template: { type: 'select' },
      to: { type: 'string' }
    }
  },
  send_whatsapp: {
    label: 'Send WhatsApp',
    icon: '📱',
    config: {
      template: { type: 'select' },
      to: { type: 'string' }
    }
  },
  add_tag: {
    label: 'Add Tag',
    icon: '🏷️',
    config: {
      tag: { type: 'string' }
    }
  },
  remove_tag: {
    label: 'Remove Tag',
    icon: '❌',
    config: {
      tag: { type: 'string' }
    }
  },
  update_status: {
    label: 'Update Status',
    icon: '📊',
    config: {
      status: { type: 'select', options: ['new', 'contacted', 'qualified', 'engaged', 'customer'] }
    }
  },
  create_crm_deal: {
    label: 'Create CRM Deal',
    icon: '💼',
    config: {
      dealName: { type: 'string' },
      value: { type: 'number' },
      stage: { type: 'select' }
    }
  },
  schedule_meeting: {
    label: 'Schedule Meeting',
    icon: '📅',
    config: {
      duration: { type: 'number' },
      title: { type: 'string' }
    }
  },
  webhook: {
    label: 'Webhook',
    icon: '🔗',
    config: {
      url: { type: 'string' },
      method: { type: 'select', options: ['GET', 'POST', 'PUT'] },
      body: { type: 'json' }
    }
  },
  ai_analyze: {
    label: 'AI Analysis',
    icon: '🤖',
    config: {
      prompt: { type: 'text' },
      model: { type: 'select', options: ['gpt-4', 'gpt-3.5-turbo'] }
    }
  },

  // Logic
  condition: {
    label: 'If/Else',
    icon: '🔀',
    config: {
      field: { type: 'string' },
      operator: { type: 'select', options: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than'] },
      value: { type: 'string' }
    },
    branches: ['true', 'false']
  },
  delay: {
    label: 'Delay',
    icon: '⏱️',
    config: {
      duration: { type: 'number' },
      unit: { type: 'select', options: ['minutes', 'hours', 'days'] }
    }
  },
  wait_until: {
    label: 'Wait Until',
    icon: '⏰',
    config: {
      field: { type: 'string' },
      condition: { type: 'string' }
    }
  },
  loop: {
    label: 'For Each',
    icon: '🔁',
    config: {
      items: { type: 'string' }
    }
  },

  // End
  end: {
    label: 'End',
    icon: '🏁',
    config: {}
  }
};

/**
 * Get available step types
 */
function getStepTypes() {
  return STEP_TYPES;
}

// ============================================
// WORKFLOW EXECUTION
// ============================================

/**
 * Execute a workflow
 */
async function executeWorkflow(workflowId, context = {}) {
  const workflow = workflows.get(workflowId);
  if (!workflow) throw new Error('Workflow not found');
  if (workflow.status !== 'active') throw new Error('Workflow is not active');

  const execution = {
    id: uuidv4(),
    workflowId,
    status: 'running',
    context,
    currentStep: 0,
    results: [],
    startedAt: new Date().toISOString(),
    completedAt: null
  };

  executions.set(execution.id, execution);
  workflow.stats.executions++;

  try {
    // Check trigger
    if (!await evaluateTrigger(workflow.trigger, context)) {
      execution.status = 'skipped';
      execution.completedAt = new Date().toISOString();
      return execution;
    }

    // Execute steps
    let stepIndex = 0;
    while (stepIndex < workflow.steps.length) {
      const step = workflow.steps[stepIndex];
      execution.currentStep = stepIndex;

      const result = await executeStep(step, context, execution);
      execution.results.push({ stepId: step.id, result });

      if (result.action === 'continue') {
        stepIndex++;
      } else if (result.action === 'jump') {
        stepIndex = result.targetIndex;
      } else if (result.action === 'stop') {
        break;
      } else {
        stepIndex++;
      }
    }

    execution.status = 'completed';
    workflow.stats.successes++;
  } catch (error) {
    execution.status = 'failed';
    execution.error = error.message;
    workflow.stats.failures++;
  }

  execution.completedAt = new Date().toISOString();
  return execution;
}

/**
 * Evaluate trigger
 */
async function evaluateTrigger(trigger, context) {
  if (!trigger) return true;

  switch (trigger.type) {
    case 'event':
      return context.event === trigger.event;

    case 'schedule':
      // Would check cron expression
      return true;

    case 'webhook':
      // Handled by webhook route
      return true;

    case 'manual':
      return true;

    default:
      return true;
  }
}

/**
 * Execute a single step
 */
async function executeStep(step, context, execution) {
  switch (step.type) {
    case 'trigger':
      return { action: 'continue' };

    case 'send_email':
      return await executeSendEmail(step.config, context);

    case 'send_sms':
      return await executeSendSMS(step.config, context);

    case 'send_whatsapp':
      return await executeSendWhatsApp(step.config, context);

    case 'add_tag':
      return await executeAddTag(step.config, context);

    case 'remove_tag':
      return await executeRemoveTag(step.config, context);

    case 'update_status':
      return await executeUpdateStatus(step.config, context);

    case 'create_crm_deal':
      return await executeCreateCRMDeal(step.config, context);

    case 'schedule_meeting':
      return await executeScheduleMeeting(step.config, context);

    case 'webhook':
      return await executeWebhook(step.config, context);

    case 'ai_analyze':
      return await executeAIAnalyze(step.config, context);

    case 'condition':
      return await executeCondition(step.config, step.branches, context, execution);

    case 'delay':
      return await executeDelay(step.config);

    case 'end':
      return { action: 'stop' };

    default:
      return { action: 'continue' };
  }
}

// ============================================
// STEP EXECUTORS
// ============================================

async function executeSendEmail(config, context) {
  const emailModule = require('./email-sender');
  const { to, subject, template } = config;

  // Resolve variables
  const resolvedTo = resolveVariable(to, context);
  const resolvedSubject = resolveVariable(subject, context);

  try {
    const result = await emailModule.sendEmail({
      to: resolvedTo,
      subject: resolvedSubject,
      html: template ? getTemplate(template) : ''
    });
    return { action: 'continue', result };
  } catch (error) {
    return { action: 'continue', result: { error: error.message } };
  }
}

async function executeSendSMS(config, context) {
  const smsModule = require('./sms-integration');
  const { to, template } = config;

  const resolvedTo = resolveVariable(to, context);
  const message = template || 'Message from workflow';

  try {
    const result = await smsModule.sendSMS({ to: resolvedTo, message });
    return { action: 'continue', result };
  } catch (error) {
    return { action: 'continue', result: { error: error.message } };
  }
}

async function executeSendWhatsApp(config, context) {
  const whatsappModule = require('./whatsapp-integration');
  const { to, templateId } = config;

  const resolvedTo = resolveVariable(to, context);

  try {
    const result = await whatsappModule.sendTemplate(resolvedTo, templateId, {});
    return { action: 'continue', result };
  } catch (error) {
    return { action: 'continue', result: { error: error.message } };
  }
}

async function executeAddTag(config, context) {
  const db = require('./prospect-database');
  const { tag } = config;
  const prospectId = context.prospectId;

  if (prospectId) {
    db.addTag(prospectId, tag);
  }

  return { action: 'continue' };
}

async function executeRemoveTag(config, context) {
  const db = require('./prospect-database');
  const { tag } = config;
  const prospectId = context.prospectId;

  if (prospectId) {
    db.removeTag(prospectId, tag);
  }

  return { action: 'continue' };
}

async function executeUpdateStatus(config, context) {
  const db = require('./prospect-database');
  const { status } = config;
  const prospectId = context.prospectId;

  if (prospectId) {
    db.update(prospectId, { status });
  }

  return { action: 'continue' };
}

async function executeCreateCRMDeal(config, context) {
  const crmModule = require('./crm-integration');
  const { dealName, value, stage } = config;
  const prospectId = context.prospectId;

  if (prospectId) {
    const db = require('./prospect-database');
    const prospect = db.get(prospectId);
    if (prospect) {
      await crmModule.createCRMDeal(prospect, { title: dealName, value, stage });
    }
  }

  return { action: 'continue' };
}

async function executeScheduleMeeting(config, context) {
  const calendarModule = require('./calendar-integration');
  const { duration, title } = config;

  // Schedule meeting for prospect
  // Implementation would book the meeting

  return { action: 'continue' };
}

async function executeWebhook(config, context) {
  const axios = require('axios');
  const { url, method, body } = config;

  try {
    const resolvedBody = resolveVariable(body, context);
    const response = await axios({
      method: method.toLowerCase(),
      url: resolveVariable(url, context),
      data: resolvedBody
    });
    return { action: 'continue', result: { status: response.status } };
  } catch (error) {
    return { action: 'continue', result: { error: error.message } };
  }
}

async function executeAIAnalyze(config, context) {
  const OpenAI = require('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'sk-demo' });

  const { prompt, model } = config;
  const resolvedPrompt = resolveVariable(prompt, context);

  try {
    const response = await openai.chat.completions.create({
      model: model || 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: resolvedPrompt }]
    });

    const analysis = response.choices[0].message.content;

    // Store in context for downstream steps
    context.aiAnalysis = analysis;

    return { action: 'continue', result: { analysis } };
  } catch (error) {
    return { action: 'continue', result: { error: error.message } };
  }
}

async function executeCondition(config, branches, context, execution) {
  const { field, operator, value } = config;

  const fieldValue = resolveVariable(field, context);
  const targetValue = resolveVariable(value, context);

  let result;
  switch (operator) {
    case 'equals':
      result = fieldValue === targetValue;
      break;
    case 'not_equals':
      result = fieldValue !== targetValue;
      break;
    case 'contains':
      result = String(fieldValue).includes(targetValue);
      break;
    case 'greater_than':
      result = Number(fieldValue) > Number(targetValue);
      break;
    case 'less_than':
      result = Number(fieldValue) < Number(targetValue);
      break;
    default:
      result = false;
  }

  return { action: 'jump', targetBranch: result ? 'true' : 'false' };
}

async function executeDelay(config) {
  const { duration, unit } = config;
  const ms = {
    minutes: duration * 60 * 1000,
    hours: duration * 60 * 60 * 1000,
    days: duration * 24 * 60 * 60 * 1000
  };

  await new Promise(r => setTimeout(r, ms[unit] || duration));

  return { action: 'continue' };
}

// ============================================
// TASKS
// ============================================

/**
 * Create task for rep
 */
function createTask(data) {
  const task = {
    id: uuidv4(),
    prospectId: data.prospectId,
    title: data.title,
    description: data.description || '',
    type: data.type || 'follow_up', // follow_up, call, email, meeting, custom
    priority: data.priority || 'medium', // low, medium, high, urgent
    dueDate: data.dueDate,
    assignee: data.assignee,
    status: 'pending',
    createdAt: new Date().toISOString(),
    completedAt: null
  };

  tasks.set(task.id, task);
  return task;
}

/**
 * Complete task
 */
function completeTask(taskId) {
  const task = tasks.get(taskId);
  if (!task) return null;

  task.status = 'completed';
  task.completedAt = new Date().toISOString();

  return task;
}

/**
 * Get tasks
 */
function getTasks(filters = {}) {
  let results = Array.from(tasks.values());

  if (filters.prospectId) {
    results = results.filter(t => t.prospectId === filters.prospectId);
  }
  if (filters.assignee) {
    results = results.filter(t => t.assignee === filters.assignee);
  }
  if (filters.status) {
    results = results.filter(t => t.status === filters.status);
  }
  if (filters.priority) {
    results = results.filter(t => t.priority === filters.priority);
  }

  return results.sort((a, b) => {
    // Sort by due date, then priority
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    return 0;
  });
}

/**
 * Get task stats
 */
function getTaskStats() {
  const allTasks = Array.from(tasks.values());

  return {
    total: allTasks.length,
    pending: allTasks.filter(t => t.status === 'pending').length,
    completed: allTasks.filter(t => t.status === 'completed').length,
    overdue: allTasks.filter(t =>
      t.status === 'pending' && t.dueDate && new Date(t.dueDate) < new Date()
    ).length,
    byPriority: {
      urgent: allTasks.filter(t => t.priority === 'urgent' && t.status === 'pending').length,
      high: allTasks.filter(t => t.priority === 'high' && t.status === 'pending').length,
      medium: allTasks.filter(t => t.priority === 'medium' && t.status === 'pending').length,
      low: allTasks.filter(t => t.priority === 'low' && t.status === 'pending').length
    }
  };
}

// ============================================
// UTILITIES
// ============================================

function resolveVariable(template, context) {
  if (typeof template !== 'string') return template;

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const keys = key.split('.');
    let value = context;
    for (const k of keys) {
      value = value?.[k];
    }
    return value ?? match;
  });
}

function getTemplate(templateId) {
  // Would retrieve from template storage
  return '';
}

module.exports = {
  // Workflow CRUD
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  getWorkflow,
  listWorkflows,

  // Steps
  addStep,
  getStepTypes,

  // Execution
  executeWorkflow,

  // Tasks
  createTask,
  completeTask,
  getTasks,
  getTaskStats,

  // Storage
  workflows,
  executions,
  tasks
};