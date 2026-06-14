/**
 * REZ Forms - Workflow Routes
 * Manage form workflows and automations
 */

import { Router } from 'express';
import { z } from 'zod';
import { addWorkflow, getForm } from '../services/formService';

export const workflowRoutes = Router();

// Validation schema
const createWorkflowSchema = z.object({
  formId: z.string(),
  name: z.string().min(1).max(100),
  enabled: z.boolean().optional().default(true),
  type: z.enum(['on_submission', 'on_condition', 'on_schedule', 'on_payment']),
  config: z.object({
    conditions: z.array(z.any()).optional(),
    actions: z.array(z.object({
      type: z.enum([
        'create_lead',
        'add_to_list',
        'send_email',
        'send_sms',
        'send_webhook',
        'trigger_genie',
        'create_safe_qr',
        'add_to_crm',
      ]),
      config: z.record(z.any()),
    })),
    integrationType: z.enum(['lead', 'crm', 'notification', 'webhook', 'ai_agent', 'safe_qr']).optional(),
  }),
});

/**
 * Create a workflow for a form
 * POST /api/workflows
 */
workflowRoutes.post('/', async (req, res) => {
  try {
    const data = createWorkflowSchema.parse(req.body);
    const { v4: uuidv4 } = require('uuid');

    const workflow = {
      id: uuidv4(),
      name: data.name,
      enabled: data.enabled,
      type: data.type,
      config: data.config,
    };

    const form = await addWorkflow(data.formId, workflow);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.status(201).json(workflow);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      console.error('Create workflow error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * Get workflow templates
 * GET /api/workflows/templates
 */
workflowRoutes.get('/templates', async (req, res) => {
  const templates = [
    {
      id: 'lead-capture',
      name: 'Lead Capture',
      description: 'Auto-create a lead in Merchant OS when form is submitted',
      type: 'on_submission',
      actions: [{ type: 'create_lead', config: {} }],
    },
    {
      id: 'email-confirmation',
      name: 'Email Confirmation',
      description: 'Send confirmation email to submitter',
      type: 'on_submission',
      actions: [{ type: 'send_email', config: { template: 'confirmation' } }],
    },
    {
      id: 'sms-notification',
      name: 'SMS Notification',
      description: 'Send SMS notification to admin when form is submitted',
      type: 'on_submission',
      actions: [{ type: 'send_sms', config: { toAdmin: true } }],
    },
    {
      id: 'webhook-sync',
      name: 'Webhook Sync',
      description: 'Send submission data to external system via webhook',
      type: 'on_submission',
      actions: [{ type: 'send_webhook', config: { url: '' } }],
    },
    {
      id: 'genie-trigger',
      name: 'Genie AI Agent',
      description: 'Trigger a Genie AI agent to process the submission',
      type: 'on_submission',
      actions: [{ type: 'trigger_genie', config: { agentId: '' } }],
    },
    {
      id: 'safe-qr-generator',
      name: 'SafeQR Generator',
      description: 'Generate emergency SafeQR from submission',
      type: 'on_submission',
      actions: [{ type: 'create_safe_qr', config: { qrType: 'emergency' } }],
    },
    {
      id: 'crm-sync',
      name: 'CRM Sync',
      description: 'Add contact to CorpID CRM',
      type: 'on_submission',
      actions: [{ type: 'add_to_crm', config: { tags: [] } }],
    },
    {
      id: 'conditional-lead',
      name: 'Conditional Lead',
      description: 'Create lead only when specific conditions are met',
      type: 'on_condition',
      conditions: [{ fieldId: '', operator: 'equals', value: '' }],
      actions: [{ type: 'create_lead', config: {} }],
    },
  ];

  res.json({ templates });
});

/**
 * Test workflow action
 * POST /api/workflows/test
 */
workflowRoutes.post('/test', async (req, res) => {
  try {
    const { actionType, config, testData } = z.object({
      actionType: z.string(),
      config: z.record(z.any()),
      testData: z.record(z.any()).optional(),
    }).parse(req.body);

    // Simulate workflow action
    const result = {
      actionType,
      config,
      simulated: true,
      result: `Would ${actionType.replace(/_/g, ' ')} with config: ${JSON.stringify(config)}`,
      testData,
    };

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      console.error('Test workflow error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * Get available integrations
 * GET /api/workflows/integrations
 */
workflowRoutes.get('/integrations', async (req, res) => {
  const integrations = [
    {
      id: 'rez-merchant',
      name: 'REZ Merchant OS',
      type: 'lead',
      description: 'Create leads in REZ Merchant',
      fields: [],
    },
    {
      id: 'corpid',
      name: 'CorpID CRM',
      type: 'crm',
      description: 'Add contacts to CorpID',
      fields: ['tags'],
    },
    {
      id: 'notification',
      name: 'REZ Notifications',
      type: 'notification',
      description: 'Send emails and SMS',
      fields: ['template', 'subject', 'message'],
    },
    {
      id: 'genie',
      name: 'HOJAI Genie AI',
      type: 'ai_agent',
      description: 'Trigger Genie AI agents',
      fields: ['agentId'],
    },
    {
      id: 'safe-qr',
      name: 'SafeQR',
      type: 'safe_qr',
      description: 'Create emergency QR codes',
      fields: ['qrType'],
    },
    {
      id: 'webhook',
      name: 'Custom Webhook',
      type: 'webhook',
      description: 'Send data to external URL',
      fields: ['url', 'secret'],
    },
  ];

  res.json({ integrations });
});