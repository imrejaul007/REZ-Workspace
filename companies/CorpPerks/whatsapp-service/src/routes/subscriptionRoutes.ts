import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { whatsAppService } from '../services/whatsappService';
import { logger } from '../utils/logger';
import { SubscribeEmployeeSchema, UpdateSubscriptionSchema } from '../utils/validators';
import { ZodError } from 'zod';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * POST /api/whatsapp/subscribe
 * Subscribe an employee to WhatsApp notifications
 */
router.post('/subscribe', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validatedData = SubscribeEmployeeSchema.parse(req.body);

    const result = await whatsAppService.subscribeEmployee({
      employeeId: validatedData.employeeId,
      employeeName: validatedData.employeeName,
      phoneNumber: validatedData.phoneNumber,
      language: validatedData.language,
      notificationPreferences: validatedData.notificationPreferences,
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SUBSCRIBE_FAILED',
          message: result.error,
        },
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: result.subscription,
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
    logger.error('Subscribe error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to subscribe employee',
      },
    });
  }
});

/**
 * DELETE /api/whatsapp/subscribe/:employeeId
 * Unsubscribe an employee from WhatsApp notifications
 */
router.delete('/subscribe/:employeeId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await whatsAppService.unsubscribeEmployee(req.params.employeeId);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'UNSUBSCRIBE_FAILED',
          message: result.error,
        },
      });
      return;
    }

    res.json({
      success: true,
      message: 'Successfully unsubscribed',
    });
  } catch (error) {
    logger.error('Unsubscribe error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to unsubscribe',
      },
    });
  }
});

/**
 * PATCH /api/whatsapp/subscribe/:employeeId
 * Update subscription preferences
 */
router.patch('/subscribe/:employeeId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validatedData = UpdateSubscriptionSchema.parse(req.body);

    const result = await whatsAppService.updateSubscription(
      req.params.employeeId,
      validatedData
    );

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: result.error,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: result.subscription,
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
    logger.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update subscription',
      },
    });
  }
});

/**
 * GET /api/whatsapp/subscriptions
 * List all subscriptions
 */
router.get('/subscriptions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, employeeId } = req.query;

    const subscriptions = await whatsAppService.listSubscriptions({
      status: status as string,
      employeeId: employeeId as string,
    });

    res.json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    logger.error('List subscriptions error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list subscriptions',
      },
    });
  }
});

/**
 * GET /api/whatsapp/subscribe/:employeeId
 * Get subscription for an employee
 */
router.get('/subscribe/:employeeId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const subscriptions = await whatsAppService.listSubscriptions({
      employeeId: req.params.employeeId,
    });

    if (subscriptions.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Subscription not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: subscriptions[0],
    });
  } catch (error) {
    logger.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get subscription',
      },
    });
  }
});

export default router;
