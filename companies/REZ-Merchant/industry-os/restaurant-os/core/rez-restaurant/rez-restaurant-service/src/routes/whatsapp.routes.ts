/**
 * WhatsApp Notifications Routes
 *
 * API endpoints for restaurant WhatsApp notifications
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { restaurantWhatsAppService } from '../services/RestaurantWhatsAppService';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const sendOrderNotificationSchema = z.object({
  orderId: z.string(),
  orderNumber: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  restaurantName: z.string(),
  orderType: z.enum(['dine_in', 'takeaway', 'delivery']),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    customizations: z.array(z.string()).optional(),
  })),
  itemCount: z.number(),
  totalAmount: z.number(),
  currency: z.string().optional(),
  status: z.string(),
});

const sendReservationReminderSchema = z.object({
  reservationId: z.string(),
  confirmationNumber: z.string(),
  guestName: z.string(),
  guestPhone: z.string(),
  restaurantName: z.string(),
  date: z.string(),
  time: z.string(),
  guestCount: z.number(),
  reminderType: z.enum(['2_hours', '30_minutes']),
});

const sendBirthdayOfferSchema = z.object({
  customerId: z.string(),
  name: z.string(),
  phone: z.string(),
  offerCode: z.string(),
  discountPercent: z.number().optional(),
  discountAmount: z.number().optional(),
  freeItem: z.string().optional(),
  validDays: z.number().optional(),
  favoriteCuisines: z.array(z.string()).optional(),
});

const sendReengagementSchema = z.object({
  customerId: z.string(),
  name: z.string(),
  phone: z.string(),
  daysSinceLastVisit: z.number(),
  offerCode: z.string().optional(),
  favoriteCuisines: z.array(z.string()).optional(),
});

const sendSpecialDealSchema = z.object({
  customerId: z.string(),
  name: z.string(),
  phone: z.string(),
  deal: z.object({
    title: z.string(),
    description: z.string(),
    offerCode: z.string(),
    validUntil: z.string().or(z.date()),
    minOrder: z.number().optional(),
  }),
});

const staffAlertSchema = z.object({
  staffPhone: z.string(),
  type: z.enum(['new_order', 'low_stock', 'review_received']),
  metadata: z.record(z.unknown()).optional(),
});

// Middleware for validation
function validate<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  };
}

// ============================================================================
// Order Notifications
// ============================================================================

/**
 * POST /api/whatsapp/orders/confirmation
 * Send order confirmation WhatsApp
 */
router.post(
  '/orders/confirmation',
  validate(sendOrderNotificationSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const order = req.body;
      const result = await restaurantWhatsAppService.sendOrderConfirmation(order);

      if (result.success) {
        res.json({
          success: true,
          message: 'Order confirmation WhatsApp sent',
          messageId: result.messageId,
          recipientPhone: result.recipientPhone,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      logger.error('[WhatsApp] Failed to send order confirmation', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to send notification',
      });
    }
  }
);

/**
 * POST /api/whatsapp/orders/status
 * Send order status update WhatsApp
 */
router.post(
  '/orders/status',
  validate(sendOrderNotificationSchema.extend({
    previousStatus: z.string().optional(),
    newStatus: z.string(),
  })),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { previousStatus, newStatus, ...order } = req.body;
      const result = await restaurantWhatsAppService.sendOrderStatusUpdate(
        order,
        (previousStatus || 'pending') as any,
        newStatus as any
      );

      if (result.success) {
        res.json({
          success: true,
          message: 'Order status WhatsApp sent',
          messageId: result.messageId,
          recipientPhone: result.recipientPhone,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      logger.error('[WhatsApp] Failed to send order status update', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to send notification',
      });
    }
  }
);

// ============================================================================
// Reservation Reminders
// ============================================================================

/**
 * POST /api/whatsapp/reservations/reminder
 * Send reservation reminder WhatsApp
 */
router.post(
  '/reservations/reminder',
  validate(sendReservationReminderSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { reminderType, ...reservation } = req.body;
      const result = await restaurantWhatsAppService.sendReservationReminder(
        reservation,
        reminderType
      );

      if (result.success) {
        res.json({
          success: true,
          message: 'Reservation reminder WhatsApp sent',
          messageId: result.messageId,
          recipientPhone: result.recipientPhone,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      logger.error('[WhatsApp] Failed to send reservation reminder', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to send notification',
      });
    }
  }
);

/**
 * POST /api/whatsapp/reservations/confirmation
 * Send reservation confirmation WhatsApp
 */
router.post(
  '/reservations/confirmation',
  validate(sendReservationReminderSchema.omit({ reminderType: true })),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await restaurantWhatsAppService.sendReservationConfirmation(req.body);

      if (result.success) {
        res.json({
          success: true,
          message: 'Reservation confirmation WhatsApp sent',
          messageId: result.messageId,
          recipientPhone: result.recipientPhone,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      logger.error('[WhatsApp] Failed to send reservation confirmation', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to send notification',
      });
    }
  }
);

// ============================================================================
// Marketing Notifications
// ============================================================================

/**
 * POST /api/whatsapp/marketing/birthday
 * Send birthday offer WhatsApp
 */
router.post(
  '/marketing/birthday',
  validate(sendBirthdayOfferSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { offerCode, discountPercent, discountAmount, freeItem, validDays, favoriteCuisines, ...customer } = req.body;

      const result = await restaurantWhatsAppService.sendBirthdayOffer(
        { ...customer, preferences: { favoriteCuisines } },
        offerCode,
        { discountPercent, discountAmount, freeItem, validDays }
      );

      if (result.success) {
        res.json({
          success: true,
          message: 'Birthday offer WhatsApp sent',
          messageId: result.messageId,
          recipientPhone: result.recipientPhone,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      logger.error('[WhatsApp] Failed to send birthday offer', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to send notification',
      });
    }
  }
);

/**
 * POST /api/whatsapp/marketing/reengagement
 * Send re-engagement WhatsApp
 */
router.post(
  '/marketing/reengagement',
  validate(sendReengagementSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { daysSinceLastVisit, offerCode, favoriteCuisines, ...customer } = req.body;

      const result = await restaurantWhatsAppService.sendReengagement(
        { ...customer, preferences: { favoriteCuisines } },
        daysSinceLastVisit,
        offerCode
      );

      if (result.success) {
        res.json({
          success: true,
          message: 'Re-engagement WhatsApp sent',
          messageId: result.messageId,
          recipientPhone: result.recipientPhone,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      logger.error('[WhatsApp] Failed to send re-engagement', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to send notification',
      });
    }
  }
);

/**
 * POST /api/whatsapp/marketing/special-deal
 * Send special deal WhatsApp
 */
router.post(
  '/marketing/special-deal',
  validate(sendSpecialDealSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { deal, ...customer } = req.body;

      const result = await restaurantWhatsAppService.sendSpecialDeal(
        customer,
        {
          ...deal,
          validUntil: typeof deal.validUntil === 'string' ? new Date(deal.validUntil) : deal.validUntil,
        }
      );

      if (result.success) {
        res.json({
          success: true,
          message: 'Special deal WhatsApp sent',
          messageId: result.messageId,
          recipientPhone: result.recipientPhone,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      logger.error('[WhatsApp] Failed to send special deal', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to send notification',
      });
    }
  }
);

// ============================================================================
// Staff Notifications
// ============================================================================

/**
 * POST /api/whatsapp/staff/alert
 * Send staff alert WhatsApp
 */
router.post(
  '/staff/alert',
  validate(staffAlertSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { staffPhone, type, metadata } = req.body;

      let result;

      switch (type) {
        case 'low_stock':
          result = await restaurantWhatsAppService.sendLowStockAlert(staffPhone, {
            itemName: (metadata?.itemName as string) || 'Unknown Item',
            currentStock: (metadata?.currentStock as number) || 0,
            threshold: (metadata?.threshold as number) || 5,
            branchName: (metadata?.branchName as string) || 'Unknown Branch',
          });
          break;

        default:
          res.status(400).json({
            success: false,
            error: `Unknown alert type: ${type}`,
          });
          return;
      }

      if (result.success) {
        res.json({
          success: true,
          message: 'Staff alert WhatsApp sent',
          messageId: result.messageId,
          recipientPhone: result.recipientPhone,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      logger.error('[WhatsApp] Failed to send staff alert', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to send notification',
      });
    }
  }
);

// ============================================================================
// Utility Endpoints
// ============================================================================

/**
 * GET /api/whatsapp/history/:phone
 * Get WhatsApp message history for a phone number
 */
router.get('/history/:phone', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const history = await restaurantWhatsAppService.getMessageHistory(phone, limit);

    res.json({
      success: true,
      phone,
      count: history.length,
      messages: history,
    });
  } catch (error) {
    logger.error('[WhatsApp] Failed to get message history', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get message history',
    });
  }
});

/**
 * GET /api/whatsapp/stats
 * Get WhatsApp notification statistics
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const templateType = req.query.templateType as string | undefined;
    const stats = await restaurantWhatsAppService.getStats(templateType as any);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('[WhatsApp] Failed to get stats', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
    });
  }
});

/**
 * GET /api/whatsapp/templates
 * List available WhatsApp templates
 */
router.get('/templates', (_req: Request, res: Response): void => {
  const { getTemplateList } = require('../services/whatsapp-templates');
  const templates = getTemplateList();

  res.json({
    success: true,
    count: templates.length,
    templates,
  });
});

export default router;
