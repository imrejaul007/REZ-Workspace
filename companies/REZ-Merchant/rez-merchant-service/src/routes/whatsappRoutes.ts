/**
 * WhatsApp Business API Routes
 *
 * Provides REST API endpoints for WhatsApp Business integration:
 * - POST /send - Send single message
 * - POST /send-bulk - Send to multiple recipients
 * - POST /webhook - Receive WhatsApp webhooks (status updates)
 * - GET /templates - List available templates
 * - POST /templates/register - Register new template
 * - GET /messages/:id/status - Get message delivery status
 * - GET /conversations - List conversations
 * - GET /stats - Delivery statistics
 *
 * Authentication: merchantAuth for admin routes
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { merchantAuth } from '../middleware/auth';
import { errorResponse, errors, successResponse } from '../utils/response';
import { logger } from '../config/logger';
import {
  WhatsAppService,
  WhatsAppMessageType,
  WhatsAppMessageStatus,
  getWhatsAppService,
} from '../services/whatsappService';
import {
  WhatsAppTemplate,
  listTemplates,
  getTemplateConfig,
  validateTemplateParams,
  formatAmount,
  formatDate,
} from '../services/whatsappTemplates';
import { Supplier } from '../models/Supplier';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { getWhatsAppQueue, WhatsAppJobTypes } from '../jobs/whatsappJobs';

const router = Router();

// Instantiate service
const whatsappService = getWhatsAppService();

/**
 * Validation schemas
 */
const sendMessageSchema = z.object({
  to: z.string().min(10).max(15),
  template: z.nativeEnum(WhatsAppTemplate).optional(),
  params: z.array(z.string()).optional(),
  message: z.string().optional(),
  type: z.enum(['template', 'text', 'image', 'document', 'interactive']).optional(),
  referenceId: z.string().optional(),
});

const sendBulkSchema = z.object({
  messages: z.array(
    z.object({
      to: z.string().min(10).max(15),
      template: z.nativeEnum(WhatsAppTemplate).optional(),
      params: z.array(z.string()).optional(),
      message: z.string().optional(),
    })
  ).min(1).max(100),
});

const registerTemplateSchema = z.object({
  name: z.string().min(1).max(512),
  category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']),
  language: z.string().min(2).max(10),
  components: z.array(z.object({
    type: z.enum(['HEADER', 'BODY', 'FOOTER', 'BUTTONS']),
    format: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']).optional(),
    text: z.string().optional(),
    buttons: z.array(z.object({
      type: z.enum(['QUICK_REPLY', 'URL', 'PHONE_NUMBER']),
      text: z.string().max(25),
      url: z.string().optional(),
      phone_number: z.string().optional(),
    })).optional(),
  })),
});

/**
 * POST /webhook
 * WhatsApp webhook verification and status updates
 */
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  // Verify webhook
  if (mode === 'subscribe') {
    if (whatsappService.verifyWebhookToken(token)) {
      logger.info('[WhatsApp] Webhook verified successfully');
      res.status(200).send(challenge);
      return;
    }
    logger.warn('[WhatsApp] Webhook verification failed - invalid token');
    res.status(403).send('Forbidden');
    return;
  }

  res.status(400).send('Bad Request');
});

/**
 * POST /webhook
 * Receive WhatsApp webhook updates
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-hub-signature-256'] as string;
    if (signature) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.WHATSAPP_WEBHOOK_SECRET || '')
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== `sha256=${expectedSignature}`) {
        logger.warn('[WhatsApp] Invalid webhook signature');
        res.status(401).send('Unauthorized');
        return;
      }
    }

    const { entry } = req.body;

    if (!entry || !entry[0]?.changes) {
      res.status(200).send('OK');
      return;
    }

    for (const entryData of entry) {
      for (const change of entryData.changes) {
        if (change.value?.messages) {
          // Incoming messages (not processed in this route)
          for (const message of change.value.messages) {
            logger.info('[WhatsApp] Incoming message', {
              from: message.from,
              type: message.type,
            });
          }
        }

        if (change.value?.statuses) {
          // Message status updates
          for (const status of change.value.statuses) {
            await whatsappService.processWebhookUpdate(
              status.id,
              status.status,
              status.timestamp
            );

            logger.info('[WhatsApp] Status update', {
              messageId: status.id,
              status: status.status,
              recipient: status.recipient_id,
            });

            // Update message status in database if reference exists
            const messageKey = `whatsapp:message:${status.id}`;
            const { redis } = await import('../config/redis');
            const messageData = await redis.hgetall(messageKey);

            if (messageData?.merchantId) {
              // Emit event for job processor
              const queue = getWhatsAppQueue();
              await queue.add(WhatsAppJobTypes.STATUS_UPDATE, {
                messageId: status.id,
                merchantId: messageData.merchantId,
                status: status.status,
                timestamp: status.timestamp,
              });
            }
          }
        }
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    logger.error('[WhatsApp] Webhook processing error', { error: err });
    res.status(200).send('OK'); // Always return 200 to WhatsApp
  }
});

/**
 * POST /send
 * Send a single WhatsApp message
 */
router.post('/send', merchantAuth, async (req: Request, res: Response) => {
  try {
    const validation = sendMessageSchema.safeParse(req.body);
    if (!validation.success) {
      errorResponse(res, errors.badRequest(validation.error.message));
      return;
    }

    const { to, template, params, message, type = 'text', referenceId } = validation.data;

    // Validate template if provided
    if (template) {
      const paramValidation = validateTemplateParams(template, params || []);
      if (!paramValidation.valid) {
        errorResponse(res, errors.badRequest(paramValidation.error));
        return;
      }
    }

    let result;
    let usedTemplate: WhatsAppTemplate | undefined;

    if (template) {
      usedTemplate = template;
      result = await whatsappService.sendMessage(to, template, params || []);
    } else if (message) {
      // Custom message - send as template with single parameter
      result = await whatsappService.sendTextMessage(to, message, {
        merchantId: req.merchantId,
        referenceId,
      });
    } else {
      errorResponse(res, errors.badRequest('Either template or message must be provided'));
      return;
    }

    if (!result.success) {
      // Check if it's a business hours issue
      if (result.error?.includes('Outside business hours')) {
        // Queue for next business hour
        const queue = getWhatsAppQueue();
        await queue.add(WhatsAppJobTypes.SEND_QUEUED, {
          to,
          template: usedTemplate,
          params: params || [],
          message,
          merchantId: req.merchantId,
          referenceId,
          queuedAt: Date.now(),
        });

        res.status(202).json({
          success: true,
          message: 'Message queued for next business hours',
          queued: true,
        });
        return;
      }

      errorResponse(res, errors.badRequest(result.error));
      return;
    }

    // Log message for merchant
    if (result.messageId) {
      await whatsappService.logMessage(
        result.messageId,
        req.merchantId!,
        to,
        usedTemplate,
        WhatsAppMessageStatus.QUEUED
      );
    }

    logger.info('[WhatsApp] Message sent', {
      messageId: result.messageId,
      merchantId: req.merchantId,
      to,
      template: usedTemplate,
    });

    res.status(201).json({
      success: true,
      data: {
        messageId: result.messageId,
        status: WhatsAppMessageStatus.QUEUED,
        queued: false,
      },
    });
  } catch (err) {
    logger.error('[WhatsApp] Send error', { error: err });
    errorResponse(res, errors.internalError());
  }
});

/**
 * POST /send-bulk
 * Send messages to multiple recipients
 */
router.post('/send-bulk', merchantAuth, async (req: Request, res: Response) => {
  try {
    const validation = sendBulkSchema.safeParse(req.body);
    if (!validation.success) {
      errorResponse(res, errors.badRequest(validation.error.message));
      return;
    }

    const { messages } = validation.data;
    const results: Array<{
      to: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }> = [];

    // Process messages with rate limiting
    const queue = getWhatsAppQueue();
    const batchSize = 10; // Process 10 messages at a time

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (msg) => {
          let result;

          if (msg.template) {
            const paramValidation = validateTemplateParams(msg.template, msg.params || []);
            if (!paramValidation.valid) {
              return { to: msg.to, success: false, error: paramValidation.error };
            }
            result = await whatsappService.sendMessage(msg.to, msg.template, msg.params || []);
          } else if (msg.message) {
            result = await whatsappService.sendTextMessage(msg.to, msg.message, {
              merchantId: req.merchantId,
            });
          } else {
            return { to: msg.to, success: false, error: 'Either template or message required' };
          }

          return {
            to: msg.to,
            success: result.success,
            messageId: result.messageId,
            error: result.error,
          };
        })
      );

      results.push(...batchResults);

      // Small delay between batches to respect rate limits
      if (i + batchSize < messages.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    logger.info('[WhatsApp] Bulk send completed', {
      merchantId: req.merchantId,
      total: messages.length,
      success: successCount,
      failed: failedCount,
    });

    res.status(200).json({
      success: true,
      data: {
        total: messages.length,
        sent: successCount,
        failed: failedCount,
        results,
      },
    });
  } catch (err) {
    logger.error('[WhatsApp] Bulk send error', { error: err });
    errorResponse(res, errors.internalError());
  }
});

/**
 * GET /templates
 * List available WhatsApp message templates
 */
router.get('/templates', async (_req: Request, res: Response) => {
  try {
    const templates = listTemplates();

    res.json({
      success: true,
      data: {
        templates,
        count: templates.length,
      },
    });
  } catch (err) {
    logger.error('[WhatsApp] List templates error', { error: err });
    errorResponse(res, errors.internalError());
  }
});

/**
 * POST /templates/register
 * Register a new template with WhatsApp
 * Note: This is a placeholder - actual registration requires WhatsApp Business API
 */
router.post('/templates/register', merchantAuth, async (req: Request, res: Response) => {
  try {
    const validation = registerTemplateSchema.safeParse(req.body);
    if (!validation.success) {
      errorResponse(res, errors.badRequest(validation.error.message));
      return;
    }

    const { name, category, language, components } = validation.data;

    // In production, this would call WhatsApp Business API to register the template
    // For now, we log it and return a mock response
    logger.info('[WhatsApp] Template registration requested', {
      merchantId: req.merchantId,
      name,
      category,
      language,
    });

    // Store template request for admin approval
    const { redis } = await import('../config/redis');
    const templateRequest = {
      name,
      category,
      language,
      components,
      merchantId: req.merchantId,
      requestedAt: Date.now(),
      status: 'pending',
    };

    await redis.hset(
      `whatsapp:template:request:${name}`,
      {
        ...templateRequest,
        components: JSON.stringify(components),
      }
    );
    await redis.expire(`whatsapp:template:request:${name}`, 86400 * 7); // 7 days TTL

    res.status(202).json({
      success: true,
      message: 'Template registration request submitted for review',
      data: {
        name,
        status: 'pending',
        note: 'Template will be reviewed and registered with WhatsApp within 24-48 hours',
      },
    });
  } catch (err) {
    logger.error('[WhatsApp] Template registration error', { error: err });
    errorResponse(res, errors.internalError());
  }
});

/**
 * GET /messages/:id/status
 * Get message delivery status
 */
router.get('/messages/:id/status', merchantAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if this message belongs to this merchant
    const { redis } = await import('../config/redis');
    const messageData = await redis.hgetall(`whatsapp:merchant:${req.merchantId}:${id}`);

    if (!messageData || !messageData.messageId) {
      errorResponse(res, errors.notFound('Message'));
      return;
    }

    const statusResult = await whatsappService.getMessageStatus(id);

    if (!statusResult.status) {
      errorResponse(res, errors.notFound('Message status'));
      return;
    }

    res.json({
      success: true,
      data: {
        messageId: id,
        status: statusResult.status,
        timestamp: statusResult.timestamp,
        error: statusResult.error,
      },
    });
  } catch (err) {
    logger.error('[WhatsApp] Get status error', { error: err });
    errorResponse(res, errors.internalError());
  }
});

/**
 * GET /conversations
 * List WhatsApp conversations for the merchant
 */
router.get('/conversations', merchantAuth, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const { redis } = await import('../config/redis');
    const pattern = `whatsapp:merchant:${req.merchantId}:*`;
    const keys = await redis.keys(pattern);

    // Get unique phone numbers from conversations
    const conversationsMap = new Map<string, {
      phone: string;
      lastMessageId: string;
      lastMessageAt: number;
      messageCount: number;
    }>();

    for (const key of keys.slice(0, 100)) { // Limit for performance
      const data = await redis.hgetall(key);
      if (data?.recipientPhone) {
        const existing = conversationsMap.get(data.recipientPhone);
        const timestamp = parseInt(data.createdAt || '0', 10);

        if (!existing || timestamp > existing.lastMessageAt) {
          conversationsMap.set(data.recipientPhone, {
            phone: data.recipientPhone,
            lastMessageId: data.messageId,
            lastMessageAt: timestamp,
            messageCount: (existing?.messageCount || 0) + 1,
          });
        }
      }
    }

    const conversations = Array.from(conversationsMap.values())
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt)
      .slice((page - 1) * limit, page * limit)
      .map((conv) => ({
        phone: conv.phone,
        lastMessageAt: new Date(conv.lastMessageAt).toISOString(),
        messageCount: conv.messageCount,
      }));

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page,
          limit,
          total: conversationsMap.size,
          totalPages: Math.ceil(conversationsMap.size / limit),
        },
      },
    });
  } catch (err) {
    logger.error('[WhatsApp] List conversations error', { error: err });
    errorResponse(res, errors.internalError());
  }
});

/**
 * GET /stats
 * Get WhatsApp delivery statistics
 */
router.get('/stats', merchantAuth, async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const stats = await whatsappService.getDeliveryStats(req.merchantId!, startDate, endDate);

    // Calculate rates
    const deliveryRate = stats.sent > 0
      ? ((stats.delivered / stats.sent) * 100).toFixed(2)
      : '0';

    const readRate = stats.delivered > 0
      ? ((stats.read / stats.delivered) * 100).toFixed(2)
      : '0';

    res.json({
      success: true,
      data: {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        stats: {
          sent: stats.sent,
          delivered: stats.delivered,
          read: stats.read,
          failed: stats.failed,
          pending: stats.pending,
        },
        rates: {
          deliveryRate: `${deliveryRate}%`,
          readRate: `${readRate}%`,
        },
      },
    });
  } catch (err) {
    logger.error('[WhatsApp] Stats error', { error: err });
    errorResponse(res, errors.internalError());
  }
});

/**
 * POST /send/po-created
 * Convenience endpoint to send PO created notification
 */
router.post('/send/po-created', merchantAuth, async (req: Request, res: Response) => {
  try {
    const { poId, supplierId } = req.body;

    if (!poId || !supplierId) {
      errorResponse(res, errors.badRequest('poId and supplierId are required'));
      return;
    }

    // Get PO and supplier details
    const po = await PurchaseOrder.findById(poId).lean();
    const supplier = await Supplier.findById(supplierId).lean();

    if (!po || !supplier) {
      errorResponse(res, errors.notFound('Purchase Order or Supplier'));
      return;
    }

    if (!supplier.phone) {
      errorResponse(res, errors.badRequest('Supplier has no phone number'));
      return;
    }

    // Send template message
    const result = await whatsappService.sendMessage(
      supplier.phone,
      WhatsAppTemplate.PO_CREATED,
      [
        po.poNumber,
        supplier.name,
        formatAmount(po.totalAmount),
        formatDate(po.dueDate || new Date()),
      ]
    );

    if (!result.success) {
      errorResponse(res, errors.badRequest(result.error));
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        messageId: result.messageId,
        supplierPhone: supplier.phone,
        poNumber: po.poNumber,
      },
    });
  } catch (err) {
    logger.error('[WhatsApp] PO created notification error', { error: err });
    errorResponse(res, errors.internalError());
  }
});

/**
 * POST /send/payment-reminder
 * Send payment reminder for a specific PO
 */
router.post('/send/payment-reminder', merchantAuth, async (req: Request, res: Response) => {
  try {
    const { poId, supplierId } = req.body;

    if (!poId || !supplierId) {
      errorResponse(res, errors.badRequest('poId and supplierId are required'));
      return;
    }

    const po = await PurchaseOrder.findById(poId).lean();
    const supplier = await Supplier.findById(supplierId).lean();

    if (!po || !supplier) {
      errorResponse(res, errors.notFound('Purchase Order or Supplier'));
      return;
    }

    if (!supplier.phone) {
      errorResponse(res, errors.badRequest('Supplier has no phone number'));
      return;
    }

    // Calculate days until due
    const daysUntilDue = po.dueDate
      ? Math.ceil((new Date(po.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;

    const result = await whatsappService.sendMessage(
      supplier.phone,
      WhatsAppTemplate.PAYMENT_REMINDER,
      [
        formatAmount(po.totalAmount - (po.paidAmount || 0)),
        po.poNumber,
        formatDate(po.dueDate || new Date()),
        'Your Supplier', // In production, get merchant name
      ]
    );

    if (!result.success) {
      errorResponse(res, errors.badRequest(result.error));
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        messageId: result.messageId,
        daysUntilDue,
      },
    });
  } catch (err) {
    logger.error('[WhatsApp] Payment reminder error', { error: err });
    errorResponse(res, errors.internalError());
  }
});

export default router;
