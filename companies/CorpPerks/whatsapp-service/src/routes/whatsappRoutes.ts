import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { whatsAppService } from '../services/whatsappService';
import { WhatsAppTemplate } from '../models';
import { logger } from '../utils/logger';
import {
  SendMessageSchema,
  SendBulkMessageSchema,
  WhatsAppWebhookSchema,
} from '../utils/validators';
import { ZodError } from 'zod';

const router = Router();

// Apply auth middleware to all routes except webhook
router.use(authMiddleware);

/**
 * POST /api/whatsapp/send
 * Send a WhatsApp message
 */
router.post('/send', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validatedData = SendMessageSchema.parse(req.body);

    const result = await whatsAppService.sendMessage({
      employeeId: validatedData.employeeId,
      type: validatedData.type,
      content: validatedData.content,
      templateName: validatedData.templateName,
      notificationCategory: validatedData.notificationCategory,
      metadata: validatedData.metadata,
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SEND_FAILED',
          message: result.error,
        },
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        messageId: result.messageId,
        status: 'queued',
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
      });
      return;
    }
    logger.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send message',
      },
    });
  }
});

/**
 * POST /api/whatsapp/send/bulk
 * Send bulk WhatsApp messages
 */
router.post('/send/bulk', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validatedData = SendBulkMessageSchema.parse(req.body);

    const result = await whatsAppService.sendBulkMessages({
      employeeIds: validatedData.employeeIds,
      type: validatedData.type,
      content: validatedData.content,
      templateName: validatedData.templateName,
      notificationCategory: validatedData.notificationCategory,
    });

    res.json({
      success: true,
      data: {
        total: validatedData.employeeIds.length,
        success: result.success,
        failed: result.failed,
        errors: result.errors,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
      });
      return;
    }
    logger.error('Bulk send error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send bulk messages',
      },
    });
  }
});

/**
 * POST /api/whatsapp/webhook
 * Webhook for incoming WhatsApp messages
 */
router.post('/webhook', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Verify webhook (Meta sends a GET request with hub.verify_token)
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'corpp_verify_token';

      if (mode === 'subscribe' && token === verifyToken) {
        logger.info('Webhook verified successfully');
        res.status(200).send(challenge);
        return;
      }

      res.status(403).json({
        success: false,
        error: 'Webhook verification failed',
      });
      return;
    }

    // Handle incoming messages (POST)
    const webhookData = WhatsAppWebhookSchema.parse(req.body);

    // Process each entry
    for (const entry of webhookData.entry) {
      for (const change of entry.changes) {
        if (change.value?.messages) {
          for (const message of change.value.messages) {
            const msg = message as { id: string; from: string; type: string; text?: { body: string }; timestamp: string };

            await whatsAppService.handleIncomingMessage({
              from: msg.from,
              messageId: msg.id,
              type: msg.type,
              text: msg.text,
              timestamp: msg.timestamp,
            });
          }
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn('Invalid webhook data:', error.errors);
      res.status(400).json({
        success: false,
        error: 'Invalid webhook data',
      });
      return;
    }
    logger.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
    });
  }
});

/**
 * GET /api/whatsapp/templates
 * List approved WhatsApp templates
 */
router.get('/templates', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const templates = await WhatsAppTemplate.find({ status: 'approved' })
      .select('name category type language components usageCount lastUsedAt')
      .sort({ usageCount: -1 })
      .lean();

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    logger.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch templates',
      },
    });
  }
});

/**
 * GET /api/whatsapp/templates/:name
 * Get a specific template by name
 */
router.get('/templates/:name', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const template = await WhatsAppTemplate.findOne({
      name: req.params.name,
    }).lean();

    if (!template) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    logger.error('Get template error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch template',
      },
    });
  }
});

/**
 * POST /api/whatsapp/templates
 * Create a new template (for admin use)
 */
router.post('/templates', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, category, type, language, components, variables } = req.body;

    const template = new WhatsAppTemplate({
      name,
      category,
      type,
      language: language || 'en',
      components,
      variables,
      status: 'pending',
    });

    await template.save();

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    logger.error('Create template error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create template',
      },
    });
  }
});

export default router;
