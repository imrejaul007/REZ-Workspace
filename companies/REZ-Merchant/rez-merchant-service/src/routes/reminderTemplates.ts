/**
 * Reminder Templates Routes
 *
 * API endpoints for managing dunning reminder templates.
 */

import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { merchantAuth } from '../middleware/auth';
import { ReminderTemplate, TemplateType, TemplateChannel, DEFAULT_TEMPLATES } from '../models/ReminderTemplate';
import { TemplateRenderer, DEFAULT_TEMPLATES as RENDERER_DEFAULTS } from '../services/templateRenderer';
import { logger } from '../config/logger';

const router = Router();

// Apply merchant auth to all routes
router.use(merchantAuth);

// ── Validation Schemas ───────────────────────────────────────────────────────

const WhatsAppButtonSchema = z.object({
  type: z.enum(['quick_reply', 'url', 'phone']),
  text: z.string().min(1).max(25),
  url: z.string().url().optional(),
  phone: z.string().optional(),
});

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/, 'Name must be lowercase alphanumeric with underscores'),
  type: z.enum([
    'due_soon',
    'due_today',
    'overdue_1',
    'overdue_3',
    'overdue_7',
    'overdue_14',
    'overdue_30',
    'final_notice',
    'payment_confirmation',
    'custom',
  ]),
  channel: z.enum(['whatsapp', 'sms', 'email', 'all']).default('all'),
  subject: z.string().max(200).optional(),
  whatsappTemplate: z.string().max(4096).optional(),
  smsTemplate: z.string().max(1600).optional(),
  emailHtml: z.string().max(50000).optional(),
  emailText: z.string().max(5000).optional(),
  variables: z.array(z.string()).optional(),
  isDefault: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  autoApprove: z.boolean().default(false),
  whatsappTemplateId: z.string().optional(),
  whatsappHeaderType: z.enum(['text', 'image', 'video']).optional(),
  whatsappHeaderContent: z.string().max(60).optional(),
  whatsappFooter: z.string().max(60).optional(),
  whatsappButtons: z.array(WhatsAppButtonSchema).max(3).optional(),
});

const UpdateTemplateSchema = CreateTemplateSchema.partial().extend({
  name: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/).optional(),
});

const PreviewSchema = z.object({
  sampleData: z.record(z.union([z.string(), z.number()])).optional(),
});

// ── Helper Functions ────────────────────────────────────────────────────────

function handleError(res: Response, error: unknown, context: string): void {
  const requestId = (res as unknown as { locals?: { requestId?: string } }).locals?.requestId;
  const message = error instanceof Error ? error.message : 'Unknown error';
  const errorId = requestId || `template-${Date.now()}`;

  logger.error(`${context} failed`, { error: message, errorId });

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? `An error occurred. Reference: ${errorId}` : message,
    errorId,
  });
}

function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE CRUD ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// GET /templates - List all templates
router.get('/', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const type = req.query.type as TemplateType | undefined;
    const channel = req.query.channel as TemplateChannel | undefined;
    const includeInactive = req.query.includeInactive === 'true';
    const search = req.query.search as string | undefined;

    const query: Record<string, unknown> = { merchantId };
    if (!includeInactive) {
      query.isActive = true;
    }
    if (type) {
      query.type = type;
    }
    if (channel) {
      query.channel = channel;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const [templates, total] = await Promise.all([
      ReminderTemplate.find(query)
        .select('-emailHtml') // Exclude large content from list
        .sort({ isDefault: -1, type: 1, channel: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ReminderTemplate.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        templates,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    handleError(res, error, 'List templates');
  }
});

// GET /templates/:id - Get a specific template
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);
    const templateId = toObjectId(req.params.id);

    const template = await ReminderTemplate.findOne({ _id: templateId, merchantId });
    if (!template) {
      res.status(404).json({
        success: false,
        message: 'Template not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { template },
    });
  } catch (error) {
    handleError(res, error, 'Get template');
  }
});

// POST /templates - Create a new template
router.post('/', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);
    const userId = toObjectId(req.merchantUserId!);

    const validation = CreateTemplateSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
      return;
    }

    const data = validation.data;

    // Check if name already exists
    const exists = await ReminderTemplate.nameExists(merchantId, data.name);
    if (exists) {
      res.status(409).json({
        success: false,
        message: `A template with name "${data.name}" already exists`,
      });
      return;
    }

    // Validate at least one channel content is provided
    const hasWhatsApp = Boolean(data.whatsappTemplate || data.whatsappTemplateId);
    const hasSMS = Boolean(data.smsTemplate);
    const hasEmail = Boolean(data.emailHtml || data.emailText);

    if (data.channel === 'whatsapp' && !hasWhatsApp) {
      res.status(400).json({
        success: false,
        message: 'WhatsApp template content is required for WhatsApp channel',
      });
      return;
    }
    if (data.channel === 'sms' && !hasSMS) {
      res.status(400).json({
        success: false,
        message: 'SMS template content is required for SMS channel',
      });
      return;
    }
    if (data.channel === 'email' && !hasEmail) {
      res.status(400).json({
        success: false,
        message: 'Email content is required for Email channel',
      });
      return;
    }
    if (data.channel === 'all' && !hasWhatsApp && !hasSMS && !hasEmail) {
      res.status(400).json({
        success: false,
        message: 'At least one channel content must be provided',
      });
      return;
    }

    // Extract variables from templates
    const extractedVariables: string[] = [];
    if (data.whatsappTemplate) {
      extractedVariables.push(...TemplateRenderer.extractVariables(data.whatsappTemplate));
    }
    if (data.smsTemplate) {
      extractedVariables.push(...TemplateRenderer.extractVariables(data.smsTemplate));
    }
    if (data.emailHtml) {
      extractedVariables.push(...TemplateRenderer.extractVariables(data.emailHtml));
    }

    // If setting as default, unset existing default
    if (data.isDefault) {
      await ReminderTemplate.updateMany(
        { merchantId, type: data.type, isDefault: true },
        { isDefault: false }
      );
    }

    const template = new ReminderTemplate({
      merchantId,
      ...data,
      variables: [...new Set(extractedVariables)],
    });

    await template.save();

    logger.info('Reminder template created', { templateId: template._id, name: template.name, merchantId });

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: { template },
    });
  } catch (error) {
    handleError(res, error, 'Create template');
  }
});

// PUT /templates/:id - Update a template
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);
    const templateId = toObjectId(req.params.id);

    const validation = UpdateTemplateSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
      return;
    }

    const template = await ReminderTemplate.findOne({ _id: templateId, merchantId });
    if (!template) {
      res.status(404).json({
        success: false,
        message: 'Template not found',
      });
      return;
    }

    const data = validation.data;

    // Check name uniqueness if changing
    if (data.name && data.name !== template.name) {
      const exists = await ReminderTemplate.nameExists(merchantId, data.name, template._id as Types.ObjectId);
      if (exists) {
        res.status(409).json({
          success: false,
          message: `A template with name "${data.name}" already exists`,
        });
        return;
      }
    }

    // If setting as default, unset existing default
    if (data.isDefault && !template.isDefault) {
      await ReminderTemplate.updateMany(
        { merchantId, type: template.type, isDefault: true, _id: { $ne: templateId } },
        { isDefault: false }
      );
    }

    // Re-extract variables if templates changed
    const whatsappTemplate = data.whatsappTemplate ?? template.whatsappTemplate;
    const smsTemplate = data.smsTemplate ?? template.smsTemplate;
    const emailHtml = data.emailHtml ?? template.emailHtml;

    const extractedVariables: string[] = [];
    if (whatsappTemplate) {
      extractedVariables.push(...TemplateRenderer.extractVariables(whatsappTemplate));
    }
    if (smsTemplate) {
      extractedVariables.push(...TemplateRenderer.extractVariables(smsTemplate));
    }
    if (emailHtml) {
      extractedVariables.push(...TemplateRenderer.extractVariables(emailHtml));
    }

    Object.assign(template, data, {
      variables: data.whatsappTemplate || data.smsTemplate || data.emailHtml
        ? [...new Set(extractedVariables)]
        : template.variables,
    });

    await template.save();

    logger.info('Reminder template updated', { templateId: template._id, merchantId });

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: { template },
    });
  } catch (error) {
    handleError(res, error, 'Update template');
  }
});

// DELETE /templates/:id - Delete a template (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);
    const templateId = toObjectId(req.params.id);

    const template = await ReminderTemplate.findOne({ _id: templateId, merchantId });
    if (!template) {
      res.status(404).json({
        success: false,
        message: 'Template not found',
      });
      return;
    }

    // Check if it's a default template
    if (template.isDefault) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete a default template. Set another template as default first.',
      });
      return;
    }

    template.isActive = false;
    await template.save();

    logger.info('Reminder template deleted', { templateId: template._id, merchantId });

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    handleError(res, error, 'Delete template');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE ACTIONS
// ═══════════════════════════════════════════════════════════════════════════

// POST /templates/:id/preview - Preview template with sample data
router.post('/:id/preview', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);
    const templateId = toObjectId(req.params.id);

    const validation = PreviewSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
      return;
    }

    const template = await ReminderTemplate.findOne({ _id: templateId, merchantId });
    if (!template) {
      res.status(404).json({
        success: false,
        message: 'Template not found',
      });
      return;
    }

    const preview = TemplateRenderer.getPreview(template, validation.data.sampleData);

    // Validate template
    const validationResult = TemplateRenderer.validateTemplate(template, template.type);

    res.json({
      success: true,
      data: {
        preview,
        validation: validationResult,
        template: {
          _id: template._id,
          name: template.name,
          type: template.type,
          channel: template.channel,
        },
      },
    });
  } catch (error) {
    handleError(res, error, 'Preview template');
  }
});

// POST /templates/:id/duplicate - Duplicate a template
router.post('/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);
    const templateId = toObjectId(req.params.id);
    const { newName } = req.body;

    const template = await ReminderTemplate.findOne({ _id: templateId, merchantId });
    if (!template) {
      res.status(404).json({
        success: false,
        message: 'Template not found',
      });
      return;
    }

    // Generate new name
    const baseName = newName || `${template.name}_copy`;
    let finalName = baseName;
    let counter = 1;

    while (await ReminderTemplate.nameExists(merchantId, finalName)) {
      finalName = `${baseName}_${counter}`;
      counter++;
    }

    // Create duplicate
    const duplicate = new ReminderTemplate({
      ...template.toObject(),
      _id: undefined,
      name: finalName,
      isDefault: false,
      isActive: true,
      createdAt: undefined,
      updatedAt: undefined,
    });

    await duplicate.save();

    logger.info('Template duplicated', { originalId: templateId, newId: duplicate._id, merchantId });

    res.status(201).json({
      success: true,
      message: 'Template duplicated successfully',
      data: { template: duplicate },
    });
  } catch (error) {
    handleError(res, error, 'Duplicate template');
  }
});

// POST /templates/:id/set-default - Set template as default for its type
router.post('/:id/set-default', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);
    const templateId = toObjectId(req.params.id);

    const template = await ReminderTemplate.findOne({ _id: templateId, merchantId });
    if (!template) {
      res.status(404).json({
        success: false,
        message: 'Template not found',
      });
      return;
    }

    // Unset existing default for this type
    await ReminderTemplate.updateMany(
      { merchantId, type: template.type, isDefault: true },
      { isDefault: false }
    );

    template.isDefault = true;
    await template.save();

    logger.info('Template set as default', { templateId: template._id, type: template.type, merchantId });

    res.json({
      success: true,
      message: 'Template set as default successfully',
      data: { template },
    });
  } catch (error) {
    handleError(res, error, 'Set template as default');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

// GET /templates/variables/:type - Get available variables for a template type
router.get('/variables/:type', async (req: Request, res: Response) => {
  try {
    const type = req.params.type as TemplateType;

    const availableVariables = TemplateRenderer.getAvailableVariables(type);
    const requiredVariables = TemplateRenderer['REQUIRED_VARIABLES_BY_TYPE']?.[type] || [];

    res.json({
      success: true,
      data: {
        type,
        availableVariables,
        requiredVariables,
      },
    });
  } catch (error) {
    handleError(res, error, 'Get template variables');
  }
});

// GET /templates/types - List all template types
router.get('/meta/types', async (req: Request, res: Response) => {
  const types = [
    { value: 'due_soon', label: 'Due Soon', description: 'Reminder sent before due date' },
    { value: 'due_today', label: 'Due Today', description: 'Sent on the due date' },
    { value: 'overdue_1', label: 'Overdue (1 Day)', description: 'First day overdue' },
    { value: 'overdue_3', label: 'Overdue (3 Days)', description: '3 days overdue' },
    { value: 'overdue_7', label: 'Overdue (1 Week)', description: '7 days overdue' },
    { value: 'overdue_14', label: 'Overdue (2 Weeks)', description: '14 days overdue' },
    { value: 'overdue_30', label: 'Overdue (1 Month)', description: '30 days overdue' },
    { value: 'final_notice', label: 'Final Notice', description: 'Final reminder before legal action' },
    { value: 'payment_confirmation', label: 'Payment Confirmation', description: 'Confirmation after payment received' },
    { value: 'custom', label: 'Custom', description: 'Custom template for unknown purpose' },
  ];

  res.json({
    success: true,
    data: { types },
  });
});

// GET /templates/channels - List all channels
router.get('/meta/channels', async (req: Request, res: Response) => {
  const channels = [
    { value: 'whatsapp', label: 'WhatsApp', description: 'WhatsApp Business API messages' },
    { value: 'sms', label: 'SMS', description: 'Text message to mobile number' },
    { value: 'email', label: 'Email', description: 'Email with HTML template' },
    { value: 'all', label: 'All Channels', description: 'Template for all notification channels' },
  ];

  res.json({
    success: true,
    data: { channels },
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

// GET /templates/defaults - Get default templates for setup
router.get('/defaults', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);

    // Check if merchant already has any templates
    const existingCount = await ReminderTemplate.countDocuments({ merchantId });

    if (existingCount > 0) {
      res.json({
        success: true,
        message: 'Merchant already has templates',
        data: { templates: [] },
      });
      return;
    }

    // Return default templates to create
    const defaults = [
      {
        name: 'friendly_reminder',
        type: 'due_soon' as TemplateType,
        channel: 'all' as TemplateChannel,
        subject: 'Payment Reminder - Due in {{days_until_due}} days',
        priority: 'low' as const,
        autoApprove: true,
      },
      {
        name: 'due_today',
        type: 'due_today' as TemplateType,
        channel: 'all' as TemplateChannel,
        subject: 'Payment Due Today',
        priority: 'medium' as const,
        autoApprove: true,
      },
      {
        name: 'overdue_1',
        type: 'overdue_1' as TemplateType,
        channel: 'all' as TemplateChannel,
        subject: 'Payment Overdue - 1 Day',
        priority: 'medium' as const,
        autoApprove: true,
      },
      {
        name: 'overdue_7',
        type: 'overdue_7' as TemplateType,
        channel: 'all' as TemplateChannel,
        subject: 'URGENT: Payment 7 Days Overdue',
        priority: 'high' as const,
        autoApprove: false,
      },
      {
        name: 'overdue_14',
        type: 'overdue_14' as TemplateType,
        channel: 'all' as TemplateChannel,
        subject: 'FINAL WARNING: Payment 14 Days Overdue',
        priority: 'critical' as const,
        autoApprove: false,
      },
      {
        name: 'final_notice',
        type: 'final_notice' as TemplateType,
        channel: 'all' as TemplateChannel,
        subject: 'FINAL NOTICE - Legal Action Pending',
        priority: 'critical' as const,
        autoApprove: false,
      },
      {
        name: 'payment_confirmation',
        type: 'payment_confirmation' as TemplateType,
        channel: 'all' as TemplateChannel,
        subject: 'Payment Received - Thank You',
        priority: 'low' as const,
        autoApprove: true,
        isDefault: true,
      },
    ];

    res.json({
      success: true,
      data: {
        templates: defaults,
        message: 'Create these templates to get started with dunning',
      },
    });
  } catch (error) {
    handleError(res, error, 'Get default templates');
  }
});

// POST /templates/defaults - Create default templates for merchant
router.post('/defaults', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);

    // Check if merchant already has any templates
    const existingCount = await ReminderTemplate.countDocuments({ merchantId });
    if (existingCount > 0) {
      res.status(409).json({
        success: false,
        message: 'Merchant already has templates. Delete existing templates first to create defaults.',
      });
      return;
    }

    // Create default templates
    const templatesToCreate = [
      {
        name: 'friendly_reminder',
        type: 'due_soon' as TemplateType,
        channel: 'all' as TemplateChannel,
        subject: 'Payment Reminder - Due in {{days_until_due}} days',
        priority: 'low' as const,
        autoApprove: true,
        whatsappTemplate: `Hello {{supplier_contact_name}},

This is a friendly reminder that payment for {{po_number}} is due in {{days_until_due}} days.

Amount Due: {{outstanding_amount}}
Due Date: {{due_date}}

You can make payment here: {{payment_link}}

Best regards,
{{merchant_name}}`,
        smsTemplate: `Hi {{supplier_name}}, payment of {{outstanding_amount}} for {{po_number}} is due on {{due_date}}. Pay now: {{payment_link}} - {{merchant_name}}`,
        emailHtml: `<h2>Payment Reminder</h2>
<p>Dear {{supplier_contact_name}},</p>
<p>This is a friendly reminder that the following payment is due:</p>
<ul>
<li><strong>Invoice:</strong> {{po_number}}</li>
<li><strong>Amount:</strong> {{outstanding_amount}}</li>
<li><strong>Due Date:</strong> {{due_date}}</li>
</ul>
<p><a href="{{payment_link}}">Click here to pay now</a></p>
<p>Best regards,<br>{{merchant_name}}</p>`,
      },
      {
        name: 'due_today',
        type: 'due_today' as TemplateType,
        channel: 'all' as TemplateChannel,
        subject: 'Payment Due Today',
        priority: 'medium' as const,
        autoApprove: true,
        whatsappTemplate: `Hello {{supplier_name}},

This is a reminder that payment of {{outstanding_amount}} for {{po_number}} is due today.

Please make payment at: {{payment_link}}

- {{merchant_name}}`,
        smsTemplate: `Reminder: {{outstanding_amount}} for {{po_number}} is due TODAY. Pay now: {{payment_link}} - {{merchant_name}}`,
        emailHtml: `<h2>Payment Due Today</h2>
<p>Dear {{supplier_name}},</p>
<p>Your payment of <strong>{{outstanding_amount}}</strong> for invoice <strong>{{po_number}}</strong> is due today.</p>
<p><a href="{{payment_link}}">Pay Now</a></p>
<p>- {{merchant_name}}</p>`,
      },
      {
        name: 'overdue_1',
        type: 'overdue_1' as TemplateType,
        channel: 'all' as TemplateChannel,
        subject: 'Payment Overdue - 1 Day',
        priority: 'medium' as const,
        autoApprove: true,
        whatsappTemplate: `Hello {{supplier_name}},

Your payment of {{outstanding_amount}} for {{po_number}} is now 1 day overdue.

Please arrange payment immediately at: {{payment_link}}

- {{merchant_name}}`,
        smsTemplate: `ALERT: {{outstanding_amount}} for {{po_number}} is 1 day overdue. Pay now: {{payment_link}} - {{merchant_name}}`,
        emailHtml: `<h2 style="color: #f0ad4e;">Payment Overdue</h2>
<p>Dear {{supplier_name}},</p>
<p>Your payment is <strong>1 day overdue</strong>.</p>
<ul>
<li><strong>Amount:</strong> {{outstanding_amount}}</li>
<li><strong>Invoice:</strong> {{po_number}}</li>
<li><strong>Due Date:</strong> {{due_date}}</li>
</ul>
<p>Please make payment immediately: <a href="{{payment_link}}">Pay Now</a></p>
<p>- {{merchant_name}}</p>`,
      },
      {
        name: 'overdue_7',
        type: 'overdue_7' as TemplateType,
        channel: 'all' as TemplateChannel,
        subject: 'URGENT: Payment 7 Days Overdue',
        priority: 'high' as const,
        autoApprove: false,
        whatsappTemplate: `URGENT: {{supplier_name}},

Your payment of {{outstanding_amount}} (PO: {{po_numbers}}) is 7 days overdue.

Please make immediate payment: {{payment_link}}

{{merchant_name}}`,
        smsTemplate: `URGENT: {{outstanding_amount}} overdue for 7 days. PO: {{po_numbers}}. Pay: {{payment_link}} - {{merchant_name}}`,
        emailHtml: `<h2 style="color: #d9534f;">URGENT: Payment Overdue</h2>
<p>Dear {{supplier_name}},</p>
<p>Your payment of <strong>{{outstanding_amount}}</strong> is <strong>7 days overdue</strong>.</p>
<p>Outstanding Invoices: {{po_numbers}}</p>
<p>Please make immediate payment to avoid service interruption.</p>
<p><a href="{{payment_link}}">Pay Now</a></p>`,
      },
      {
        name: 'final_notice',
        type: 'final_notice' as TemplateType,
        channel: 'all' as TemplateChannel,
        subject: 'FINAL NOTICE - Legal Action Pending',
        priority: 'critical' as const,
        autoApprove: false,
        whatsappTemplate: `FINAL NOTICE

{{supplier_name}},

Your outstanding balance of {{outstanding_amount}} is {{days_overdue}} days overdue.

{{legal_notice_text}}

Payment Link: {{payment_link}}

{{merchant_name}} Legal Team`,
        smsTemplate: `FINAL NOTICE: {{outstanding_amount}} overdue for {{days_overdue}} days. Legal action pending. Pay immediately: {{payment_link}}`,
        emailHtml: `<h2 style="color: #721c24; background: #f8d7da; padding: 20px; text-align: center;">FINAL NOTICE</h2>
<p>Dear {{supplier_name}},</p>
<p>{{legal_notice_text}}</p>
<p><strong>Outstanding Amount:</strong> {{outstanding_amount}}</p>
<p><strong>Overdue Since:</strong> {{days_overdue}} days</p>
<p>If payment is not received within 7 days, we will initiate legal proceedings.</p>
<p><strong>Make Payment:</strong> <a href="{{payment_link}}">{{payment_link}}</a></p>`,
      },
      {
        name: 'payment_confirmation',
        type: 'payment_confirmation' as TemplateType,
        channel: 'all' as TemplateChannel,
        subject: 'Payment Received - Thank You',
        priority: 'low' as const,
        autoApprove: true,
        isDefault: true,
        whatsappTemplate: `Thank you, {{supplier_name}}!

We have received your payment of {{amount}} for {{po_number}}.

Transaction Date: {{current_date}}

For unknown queries, contact us at {{merchant_email}}

- {{merchant_name}}`,
        smsTemplate: `Payment received: {{amount}} for {{po_number}}. Date: {{current_date}}. Thank you! - {{merchant_name}}`,
        emailHtml: `<h2>Payment Confirmation</h2>
<p>Dear {{supplier_name}},</p>
<p>Thank you for your payment. We have received:</p>
<ul>
<li><strong>Amount:</strong> {{amount}}</li>
<li><strong>Invoice:</strong> {{po_number}}</li>
<li><strong>Date:</strong> {{current_date}}</li>
</ul>
<p>We appreciate your business!</p>
<p>- {{merchant_name}}</p>`,
      },
    ];

    const createdTemplates = await ReminderTemplate.insertMany(
      templatesToCreate.map((t) => ({
        merchantId,
        ...t,
        variables: ['supplier_name', 'supplier_contact_name', 'po_number', 'po_numbers', 'amount', 'outstanding_amount', 'due_date', 'days_until_due', 'days_overdue', 'merchant_name', 'payment_link', 'merchant_email', 'current_date', 'legal_notice_text'],
      }))
    );

    logger.info('Default templates created', { merchantId, count: createdTemplates.length });

    res.status(201).json({
      success: true,
      message: `${createdTemplates.length} default templates created`,
      data: { templates: createdTemplates },
    });
  } catch (error) {
    handleError(res, error, 'Create default templates');
  }
});

export default router;
