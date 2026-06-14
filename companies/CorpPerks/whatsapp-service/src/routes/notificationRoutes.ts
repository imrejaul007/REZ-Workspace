import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { whatsAppService } from '../services/whatsappService';
import { logger } from '../utils/logger';
import {
  LeaveApprovalNotificationSchema,
  AttendanceNotificationSchema,
  PayrollNotificationSchema,
} from '../utils/validators';
import { ZodError } from 'zod';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * POST /api/whatsapp/notifications/leave
 * Send leave approval notification
 */
router.post('/notifications/leave', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validatedData = LeaveApprovalNotificationSchema.parse(req.body);

    const result = await whatsAppService.sendLeaveNotification({
      employeeId: validatedData.employeeId,
      employeeName: validatedData.employeeName,
      leaveType: validatedData.leaveType,
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      status: validatedData.status,
      approvedBy: validatedData.approvedBy,
      rejectionReason: validatedData.rejectionReason,
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NOTIFICATION_FAILED',
          message: result.error,
        },
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        messageId: result.messageId,
        type: 'leave_notification',
        status: validatedData.status,
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
    logger.error('Leave notification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send leave notification',
      },
    });
  }
});

/**
 * POST /api/whatsapp/notifications/attendance
 * Send attendance notification
 */
router.post('/notifications/attendance', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validatedData = AttendanceNotificationSchema.parse(req.body);

    const result = await whatsAppService.sendAttendanceNotification({
      employeeId: validatedData.employeeId,
      employeeName: validatedData.employeeName,
      type: validatedData.type,
      date: validatedData.date,
      time: validatedData.time,
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NOTIFICATION_FAILED',
          message: result.error,
        },
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        messageId: result.messageId,
        type: 'attendance_notification',
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
    logger.error('Attendance notification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send attendance notification',
      },
    });
  }
});

/**
 * POST /api/whatsapp/notifications/payroll
 * Send payroll notification
 */
router.post('/notifications/payroll', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validatedData = PayrollNotificationSchema.parse(req.body);

    const result = await whatsAppService.sendPayrollNotification({
      employeeId: validatedData.employeeId,
      employeeName: validatedData.employeeName,
      amount: validatedData.amount,
      type: validatedData.type,
      transactionId: validatedData.transactionId,
      description: validatedData.description,
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NOTIFICATION_FAILED',
          message: result.error,
        },
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        messageId: result.messageId,
        type: 'payroll_notification',
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
    logger.error('Payroll notification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send payroll notification',
      },
    });
  }
});

/**
 * POST /api/whatsapp/notifications/bulk-leave
 * Send bulk leave notifications
 */
router.post('/notifications/bulk-leave', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { notifications } = req.body;

    if (!Array.isArray(notifications)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Notifications must be an array',
        },
      });
      return;
    }

    const results = [];
    for (const notification of notifications) {
      const validatedData = LeaveApprovalNotificationSchema.parse(notification);
      const result = await whatsAppService.sendLeaveNotification({
        employeeId: validatedData.employeeId,
        employeeName: validatedData.employeeName,
        leaveType: validatedData.leaveType,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        status: validatedData.status,
        approvedBy: validatedData.approvedBy,
        rejectionReason: validatedData.rejectionReason,
      });
      results.push({
        employeeId: validatedData.employeeId,
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
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
    logger.error('Bulk leave notification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send bulk leave notifications',
      },
    });
  }
});

/**
 * POST /api/whatsapp/notifications/bulk-attendance
 * Send bulk attendance notifications
 */
router.post('/notifications/bulk-attendance', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { notifications } = req.body;

    if (!Array.isArray(notifications)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Notifications must be an array',
        },
      });
      return;
    }

    const results = [];
    for (const notification of notifications) {
      const validatedData = AttendanceNotificationSchema.parse(notification);
      const result = await whatsAppService.sendAttendanceNotification({
        employeeId: validatedData.employeeId,
        employeeName: validatedData.employeeName,
        type: validatedData.type,
        date: validatedData.date,
        time: validatedData.time,
      });
      results.push({
        employeeId: validatedData.employeeId,
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
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
    logger.error('Bulk attendance notification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send bulk attendance notifications',
      },
    });
  }
});

export default router;
