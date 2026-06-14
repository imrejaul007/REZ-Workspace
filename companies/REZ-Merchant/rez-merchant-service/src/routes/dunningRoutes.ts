/**
 * Dunning Routes
 *
 * API endpoints for managing dunning configurations and sequences.
 */

import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { merchantAuth } from '../middleware/auth';
import { DunningConfig, IDunningConfig } from '../models/DunningConfig';
import { DunningSequence, IDunningSequence } from '../models/DunningSequence';
import { ReminderTemplate } from '../models/ReminderTemplate';
import { DunningService } from '../services/dunningService';
import { TemplateRenderer } from '../services/templateRenderer';
import { sendEmail, sendSms } from '../services/notificationService';
import { logger } from '../config/logger';

const router = Router();

// Apply merchant auth to all routes
router.use(merchantAuth);

// ── Validation Schemas ───────────────────────────────────────────────────────

const DunningRuleSchema = z.object({
  sequence: z.number().min(1),
  trigger: z.enum(['due_date', 'days_overdue', 'amount_threshold']),
  triggerDays: z.number(),
  triggerAmount: z.number().optional(),
  channel: z.enum(['whatsapp', 'sms', 'email', 'all']),
  template: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  ccEmails: z.array(z.string().email()).optional(),
  bccEmails: z.array(z.string().email()).optional(),
  requiresApproval: z.boolean().default(false),
  approverEmail: z.string().email().optional(),
  isActive: z.boolean().default(true),
});

const CreateConfigSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isDefault: z.boolean().default(false),
  rules: z.array(DunningRuleSchema).min(1),
  businessHours: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
    timezone: z.string().default('Asia/Kolkata'),
    excludeDays: z.array(z.string()).default([]),
  }).optional(),
  escalationContacts: z.array(z.object({
    level: z.number().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    name: z.string().optional(),
  })).optional(),
  minOverdueAmount: z.number().min(0).default(100),
  maxDunningDays: z.number().min(1).default(90),
});

const UpdateConfigSchema = CreateConfigSchema.partial();

const InitSequenceSchema = z.object({
  supplierId: z.string().min(1),
  configId: z.string().min(1),
  poId: z.string().optional(),
});

const PauseSchema = z.object({
  reason: z.string().min(1).max(500),
});

const SendTestSchema = z.object({
  templateId: z.string().min(1),
  channel: z.enum(['whatsapp', 'sms', 'email']),
  supplierId: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

// ── Helper Functions ────────────────────────────────────────────────────────

function handleError(res: Response, error: unknown, context: string): void {
  const requestId = (res as unknown as { locals?: { requestId?: string } }).locals?.requestId;
  const message = error instanceof Error ? error.message : 'Unknown error';
  const errorId = requestId || `dunning-${Date.now()}`;

  logger.error(`${context} failed`, { error: message, errorId, stack: error instanceof Error ? error.stack : undefined });

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
// DUNNING CONFIG ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// GET /dunning/configs - List all dunning configs
router.get('/configs', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const includeInactive = req.query.includeInactive === 'true';

    const query: Record<string, unknown> = { merchantId };
    if (!includeInactive) {
      query.isActive = true;
    }

    const [configs, total] = await Promise.all([
      DunningConfig.find(query)
        .sort({ isDefault: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      DunningConfig.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        configs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    handleError(res, error, 'List dunning configs');
  }
});

// POST /dunning/configs - Create a new dunning config
router.post('/configs', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);
    const userId = toObjectId(req.merchantUserId!);

    const validation = CreateConfigSchema.safeParse(req.body);
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
    const existing = await DunningConfig.findOne({ merchantId, name: data.name });
    if (existing) {
      res.status(409).json({
        success: false,
        message: `A config with name "${data.name}" already exists`,
      });
      return;
    }

    // If setting as default, unset existing default
    if (data.isDefault) {
      await DunningConfig.updateMany({ merchantId, isDefault: true }, { isDefault: false });
    }

    const config = new DunningConfig({
      merchantId,
      ...data,
    });

    await config.save();

    logger.info('Dunning config created', { configId: config._id, name: config.name, merchantId });

    res.status(201).json({
      success: true,
      message: 'Dunning config created successfully',
      data: { config },
    });
  } catch (error) {
    handleError(res, error, 'Create dunning config');
  }
});

// GET /dunning/configs/:id - Get a specific config
router.get('/configs/:id', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);
    const configId = toObjectId(req.params.id);

    const config = await DunningConfig.findOne({ _id: configId, merchantId });
    if (!config) {
      res.status(404).json({
        success: false,
        message: 'Dunning config not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { config },
    });
  } catch (error) {
    handleError(res, error, 'Get dunning config');
  }
});

// PUT /dunning/configs/:id - Update a config
router.put('/configs/:id', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);
    const configId = toObjectId(req.params.id);

    const validation = UpdateConfigSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
      return;
    }

    const config = await DunningConfig.findOne({ _id: configId, merchantId });
    if (!config) {
      res.status(404).json({
        success: false,
        message: 'Dunning config not found',
      });
      return;
    }

    const data = validation.data;

    // If setting as default, unset existing default
    if (data.isDefault && !config.isDefault) {
      await DunningConfig.updateMany({ merchantId, isDefault: true, _id: { $ne: configId } }, { isDefault: false });
    }

    // Check name uniqueness if changing
    if (data.name && data.name !== config.name) {
      const existing = await DunningConfig.findOne({ merchantId, name: data.name, _id: { $ne: configId } });
      if (existing) {
        res.status(409).json({
          success: false,
          message: `A config with name "${data.name}" already exists`,
        });
        return;
      }
    }

    Object.assign(config, data);
    await config.save();

    logger.info('Dunning config updated', { configId: config._id, merchantId });

    res.json({
      success: true,
      message: 'Dunning config updated successfully',
      data: { config },
    });
  } catch (error) {
    handleError(res, error, 'Update dunning config');
  }
});

// DELETE /dunning/configs/:id - Soft delete a config
router.delete('/configs/:id', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);
    const configId = toObjectId(req.params.id);

    const config = await DunningConfig.findOne({ _id: configId, merchantId });
    if (!config) {
      res.status(404).json({
        success: false,
        message: 'Dunning config not found',
      });
      return;
    }

    // Check if config has active sequences
    const activeSequences = await DunningSequence.countDocuments({
      configId,
      status: 'active',
    });

    if (activeSequences > 0) {
      res.status(409).json({
        success: false,
        message: `Cannot delete config with ${activeSequences} active sequences. Pause or cancel sequences first.`,
      });
      return;
    }

    config.isActive = false;
    config.isDefault = false; // Also unset default
    await config.save();

    logger.info('Dunning config deleted', { configId: config._id, merchantId });

    res.json({
      success: true,
      message: 'Dunning config deleted successfully',
    });
  } catch (error) {
    handleError(res, error, 'Delete dunning config');
  }
});

// POST /dunning/configs/:id/activate - Set config as default
router.post('/configs/:id/activate', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);
    const configId = toObjectId(req.params.id);

    const config = await DunningConfig.findOne({ _id: configId, merchantId });
    if (!config) {
      res.status(404).json({
        success: false,
        message: 'Dunning config not found',
      });
      return;
    }

    if (!config.isActive) {
      res.status(400).json({
        success: false,
        message: 'Cannot activate an inactive config. Update the config first.',
      });
      return;
    }

    // Unset existing default and set this as default
    await DunningConfig.updateMany({ merchantId, isDefault: true }, { isDefault: false });
    config.isDefault = true;
    await config.save();

    logger.info('Dunning config set as default', { configId: config._id, merchantId });

    res.json({
      success: true,
      message: 'Config set as default successfully',
      data: { config },
    });
  } catch (error) {
    handleError(res, error, 'Activate dunning config');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DUNNING SEQUENCE ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// GET /dunning/sequences - List active sequences
router.get('/sequences', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const status = req.query.status as string;
    const supplierId = req.query.supplierId as string;

    const query: Record<string, unknown> = { merchantId };
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['active', 'paused'] };
    }
    if (supplierId) {
      query.supplierId = toObjectId(supplierId);
    }

    const [sequences, total] = await Promise.all([
      DunningSequence.find(query)
        .populate('supplierId', 'name email phone')
        .populate('configId', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      DunningSequence.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        sequences,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    handleError(res, error, 'List sequences');
  }
});

// GET /dunning/sequences/:id - Get sequence detail
router.get('/sequences/:id', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);
    const sequenceId = toObjectId(req.params.id);

    const sequence = await DunningSequence.findOne({ _id: sequenceId, merchantId })
      .populate('supplierId')
      .populate('configId')
      .lean();

    if (!sequence) {
      res.status(404).json({
        success: false,
        message: 'Sequence not found',
      });
      return;
    }

    // Get summary statistics
    const stats = {
      totalSteps: sequence.steps.length,
      completedSteps: sequence.steps.filter((s) => s.status === 'sent').length,
      failedSteps: sequence.steps.filter((s) => s.status === 'failed').length,
      pendingSteps: sequence.steps.filter((s) => s.status === 'scheduled' || s.status === 'pending_approval').length,
    };

    res.json({
      success: true,
      data: { sequence, stats },
    });
  } catch (error) {
    handleError(res, error, 'Get sequence detail');
  }
});

// POST /dunning/sequences - Start a new dunning sequence
router.post('/sequences', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);
    const userId = toObjectId(req.merchantUserId!);

    const validation = InitSequenceSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
      return;
    }

    const { supplierId, configId, poId } = validation.data;

    const result = await DunningService.initSequence(
      merchantId,
      toObjectId(supplierId),
      toObjectId(configId),
      poId ? toObjectId(poId) : undefined,
      userId,
      req.merchantUserId
    );

    const statusCode = result.created ? 201 : 200;

    res.status(statusCode).json({
      success: true,
      message: result.message,
      data: { sequence: result.sequence },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    if (error instanceof Error && error.message.includes('already exists')) {
      res.status(409).json({ success: false, message: error.message });
      return;
    }
    handleError(res, error, 'Start dunning sequence');
  }
});

// POST /dunning/sequences/:id/pause - Pause a sequence
router.post('/sequences/:id/pause', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);
    const sequenceId = toObjectId(req.params.id);
    const userId = toObjectId(req.merchantUserId!);

    const validation = PauseSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
      return;
    }

    // Verify ownership
    const existing = await DunningSequence.findOne({ _id: sequenceId, merchantId });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Sequence not found' });
      return;
    }

    const sequence = await DunningService.pauseSequence(
      sequenceId,
      validation.data.reason,
      userId,
      req.merchantUserId
    );

    res.json({
      success: true,
      message: 'Sequence paused successfully',
      data: { sequence },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('cannot be paused')) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    handleError(res, error, 'Pause sequence');
  }
});

// POST /dunning/sequences/:id/resume - Resume a paused sequence
router.post('/sequences/:id/resume', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);
    const sequenceId = toObjectId(req.params.id);
    const userId = toObjectId(req.merchantUserId!);

    // Verify ownership
    const existing = await DunningSequence.findOne({ _id: sequenceId, merchantId });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Sequence not found' });
      return;
    }

    const sequence = await DunningService.resumeSequence(
      sequenceId,
      userId,
      req.merchantUserId
    );

    res.json({
      success: true,
      message: 'Sequence resumed successfully',
      data: { sequence },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('cannot be resumed')) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    handleError(res, error, 'Resume sequence');
  }
});

// POST /dunning/sequences/:id/cancel - Cancel a sequence
router.post('/sequences/:id/cancel', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);
    const sequenceId = toObjectId(req.params.id);
    const userId = toObjectId(req.merchantUserId!);

    const validation = PauseSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
      return;
    }

    // Verify ownership
    const existing = await DunningSequence.findOne({ _id: sequenceId, merchantId });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Sequence not found' });
      return;
    }

    const sequence = await DunningService.cancelSequence(
      sequenceId,
      validation.data.reason,
      userId,
      req.merchantUserId
    );

    res.json({
      success: true,
      message: 'Sequence cancelled successfully',
      data: { sequence },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already')) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    handleError(res, error, 'Cancel sequence');
  }
});

// GET /dunning/sequences/:id/step/:stepId/resend - Resend a failed step
router.post('/sequences/:id/step/:stepId/resend', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);
    const sequenceId = toObjectId(req.params.id);
    const stepId = req.params.stepId;
    const force = req.query.force === 'true';

    // Verify ownership
    const existing = await DunningSequence.findOne({ _id: sequenceId, merchantId });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Sequence not found' });
      return;
    }

    const step = await DunningService.resendStep(sequenceId, stepId, force);

    res.json({
      success: true,
      message: 'Step resent successfully',
      data: { step },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    if (error instanceof Error && error.message.includes('Maximum retries')) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    handleError(res, error, 'Resend step');
  }
});

// GET /dunning/sequences/:id/steps - Get steps for a sequence
router.get('/sequences/:id/steps', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);
    const sequenceId = toObjectId(req.params.id);

    const sequence = await DunningSequence.findOne({ _id: sequenceId, merchantId })
      .select('steps')
      .lean();

    if (!sequence) {
      res.status(404).json({ success: false, message: 'Sequence not found' });
      return;
    }

    // Group steps by sequence number
    const stepsByLevel = sequence.steps.reduce((acc, step) => {
      if (!acc[step.stepNumber]) {
        acc[step.stepNumber] = [];
      }
      acc[step.stepNumber].push(step);
      return acc;
    }, {} as Record<number, typeof sequence.steps>);

    res.json({
      success: true,
      data: {
        steps: sequence.steps,
        stepsByLevel,
        totalSteps: sequence.steps.length,
      },
    });
  } catch (error) {
    handleError(res, error, 'Get sequence steps');
  }
});

// POST /dunning/sequences/:id/approve/:stepId - Approve a pending step
router.post('/sequences/:id/approve/:stepId', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);
    const sequenceId = toObjectId(req.params.id);
    const stepId = req.params.stepId;
    const { notes } = req.body;

    const sequence = await DunningSequence.findOne({ _id: sequenceId, merchantId });
    if (!sequence) {
      res.status(404).json({ success: false, message: 'Sequence not found' });
      return;
    }

    const step = sequence.steps.id(stepId);
    if (!step) {
      res.status(404).json({ success: false, message: 'Step not found' });
      return;
    }

    if (step.status !== 'pending_approval') {
      res.status(400).json({ success: false, message: 'Step is not pending approval' });
      return;
    }

    // Update step
    step.status = 'approved';
    step.approvedBy = req.merchantUserId;
    step.approvedAt = new Date();
    if (notes) step.approvalNotes = notes;

    await sequence.save();

    // Execute the step
    const executedStep = await DunningService.executeStep(sequenceId, step.stepNumber, step.channel);

    res.json({
      success: true,
      message: 'Step approved and executed',
      data: { step: executedStep },
    });
  } catch (error) {
    handleError(res, error, 'Approve step');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DUNNING STATS & REPORTS
// ═══════════════════════════════════════════════════════════════════════════

// GET /dunning/stats - Get dunning statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);

    const [
      statusSummary,
      recentActivity,
      overdueBySupplier,
    ] = await Promise.all([
      DunningSequence.getStatusSummary(merchantId),
      DunningSequence.find({ merchantId })
        .sort({ updatedAt: -1 })
        .limit(10)
        .select('sequenceNumber supplierName currentOverdueAmount status currentStep updatedAt')
        .lean(),
      DunningSequence.aggregate([
        { $match: { merchantId: new Types.ObjectId(merchantId), status: 'active' } },
        { $group: { _id: '$supplierId', totalAmount: { $sum: '$currentOverdueAmount' }, sequenceCount: { $sum: 1 } } },
        { $sort: { totalAmount: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 'supplier' } },
        { $unwind: '$supplier' },
        { $project: { supplierId: '$_id', supplierName: '$supplier.name', totalAmount: 1, sequenceCount: 1, _id: 0 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        statusSummary: {
          active: statusSummary['active'] || 0,
          paused: statusSummary['paused'] || 0,
          completed: statusSummary['completed'] || 0,
          cancelled: statusSummary['cancelled'] || 0,
        },
        recentActivity,
        topOverdueSuppliers: overdueBySupplier,
      },
    });
  } catch (error) {
    handleError(res, error, 'Get dunning stats');
  }
});

// GET /dunning/supplier/:supplierId - Get dunning status for a supplier
router.get('/supplier/:supplierId', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);
    const supplierId = toObjectId(req.params.supplierId);

    const [status, sequences] = await Promise.all([
      DunningService.getSupplierDunningStatus(supplierId),
      DunningSequence.find({ merchantId, supplierId })
        .populate('configId', 'name')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        status,
        sequences,
      },
    });
  } catch (error) {
    handleError(res, error, 'Get supplier dunning status');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST MESSAGE ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// POST /dunning/send-test - Send a test message
router.post('/send-test', async (req: Request, res: Response) => {
  try {
    const merchantId = toObjectId(req.merchantId!);

    const validation = SendTestSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
      return;
    }

    const { templateId, channel, supplierId, email, phone } = validation.data;

    // Get template
    const template = await ReminderTemplate.findOne({
      _id: toObjectId(templateId),
      merchantId,
    });

    if (!template) {
      res.status(404).json({ success: false, message: 'Template not found' });
      return;
    }

    // Get preview with sample data
    const preview = TemplateRenderer.getPreview(template);

    // If test contact provided, send actual message
    const testResult = {
      preview,
      sent: false,
      messageId: undefined as string | undefined,
      error: undefined as string | undefined,
    };

    const testEmail = email || 'test@example.com';
    const testPhone = phone || '+919876543210';

    try {
      // Render message content based on channel
      const subject = channel === 'email' ? preview.email.subject : undefined;

      // Send via actual messaging service based on channel
      if (channel === 'email') {
        const result = await sendEmail(testEmail, subject || 'Test Message', preview.email.body);
        testResult.sent = result.success;
        testResult.messageId = result.messageId;
        testResult.error = result.error;
        logger.info('Test email sent', { templateId, testEmail, messageId: result.messageId });
      } else if (channel === 'sms') {
        const result = await sendSms(testPhone, preview.sms);
        testResult.sent = result.success;
        testResult.messageId = result.messageId;
        testResult.error = result.error;
        logger.info('Test SMS sent', { templateId, testPhone, messageId: result.messageId });
      } else if (channel === 'whatsapp') {
        // WhatsApp integration - use the same SMS endpoint with WhatsApp flag
        const result = await sendSms(testPhone, preview.whatsapp);
        testResult.sent = result.success;
        testResult.messageId = result.messageId;
        testResult.error = result.error;
        logger.info('Test WhatsApp message sent', { templateId, testPhone, messageId: result.messageId });
      }
    } catch (sendError) {
      testResult.error = sendError instanceof Error ? sendError.message : 'Send failed';
    }

    res.json({
      success: true,
      message: testResult.sent ? 'Test message sent' : 'Preview generated',
      data: { test: testResult },
    });
  } catch (error) {
    handleError(res, error, 'Send test message');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIG TEMPLATE
// ═══════════════════════════════════════════════════════════════════════════

// GET /dunning/default-config - Get the default dunning sequence template
router.get('/default-config-template', async (req: Request, res: Response) => {
  const defaultConfig = {
    name: 'Standard 30-day Dunning',
    description: 'Standard 7-step dunning sequence covering -7 to +30 days from due date',
    isDefault: true,
    rules: [
      {
        sequence: 1,
        trigger: 'due_date',
        triggerDays: -7,
        channel: 'whatsapp',
        template: 'friendly_reminder',
        priority: 'low',
        requiresApproval: false,
        isActive: true,
      },
      {
        sequence: 2,
        trigger: 'due_date',
        triggerDays: -3,
        channel: 'all',
        template: 'friendly_reminder',
        priority: 'medium',
        requiresApproval: false,
        isActive: true,
      },
      {
        sequence: 3,
        trigger: 'due_date',
        triggerDays: 0,
        channel: 'all',
        template: 'due_today',
        priority: 'medium',
        requiresApproval: false,
        isActive: true,
      },
      {
        sequence: 4,
        trigger: 'days_overdue',
        triggerDays: 1,
        channel: 'all',
        template: 'overdue_1',
        priority: 'high',
        requiresApproval: false,
        isActive: true,
      },
      {
        sequence: 5,
        trigger: 'days_overdue',
        triggerDays: 7,
        channel: 'all',
        template: 'overdue_7',
        priority: 'high',
        requiresApproval: true,
        approverEmail: '',
        isActive: true,
      },
      {
        sequence: 6,
        trigger: 'days_overdue',
        triggerDays: 14,
        channel: 'all',
        template: 'overdue_14',
        priority: 'critical',
        requiresApproval: true,
        approverEmail: '',
        ccEmails: [],
        isActive: true,
      },
      {
        sequence: 7,
        trigger: 'days_overdue',
        triggerDays: 30,
        channel: 'all',
        template: 'final_notice',
        priority: 'critical',
        requiresApproval: true,
        approverEmail: '',
        bccEmails: [],
        isActive: true,
      },
    ],
    businessHours: {
      start: '09:00',
      end: '20:00',
      timezone: 'Asia/Kolkata',
      excludeDays: ['Sunday'],
    },
    escalationContacts: [
      { level: 1, email: '', name: 'Account Manager' },
      { level: 2, email: '', name: 'Finance Head' },
      { level: 3, email: '', name: 'Legal Team' },
    ],
    minOverdueAmount: 100,
    maxDunningDays: 90,
  };

  res.json({
    success: true,
    data: { template: defaultConfig },
  });
});

export default router;
