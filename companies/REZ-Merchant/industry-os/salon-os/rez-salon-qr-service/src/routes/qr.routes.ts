import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { qrService } from '../services/QRService';
import { checkInService, CheckInResult } from '../services/CheckInService';

const router = Router();

// Validation schemas
const GenerateQRSchema = z.object({
  salonId: z.string().min(1, 'Salon ID is required'),
  locationId: z.string().min(1, 'Location ID is required'),
});

const CheckInSchema = z.object({
  qrData: z.string().min(1, 'QR data is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(10, 'Valid phone number is required'),
  salonId: z.string().min(1, 'Salon ID is required'),
});

const BulkGenerateQRSchema = z.object({
  salonId: z.string().min(1, 'Salon ID is required'),
  locations: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
    })
  ).min(1, 'At least one location is required'),
});

// Validation middleware
const validate = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }
    next(error);
  }
};

/**
 * POST /api/qr/generate
 * Generate a single QR code for a salon location
 */
router.post('/generate', validate(GenerateQRSchema), async (req: Request, res: Response) => {
  try {
    const { salonId, locationId } = req.body;

    const qrDataUrl = await qrService.generateQRDataURL(salonId, locationId);

    res.json({
      success: true,
      data: {
        salonId,
        locationId,
        qrDataUrl,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating QR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code',
    });
  }
});

/**
 * POST /api/qr/generate/bulk
 * Generate multiple QR codes for a salon
 */
router.post('/generate/bulk', validate(BulkGenerateQRSchema), async (req: Request, res: Response) => {
  try {
    const { salonId, locations } = req.body;

    const qrCodes = await qrService.generateSalonQRCodes(salonId, locations);

    res.json({
      success: true,
      data: {
        salonId,
        qrCodes,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating bulk QR codes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR codes',
    });
  }
});

/**
 * POST /api/qr/check-in
 * Process customer check-in via QR scan
 */
router.post('/check-in', validate(CheckInSchema), async (req: Request, res: Response) => {
  try {
    const { qrData, customerId, customerName, customerPhone, salonId } = req.body;

    const result: CheckInResult = await checkInService.processCheckIn(
      qrData,
      customerId,
      customerName,
      customerPhone,
      salonId
    );

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
        data: result,
      });
      return;
    }

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    console.error('Error processing check-in:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process check-in',
    });
  }
});

/**
 * GET /api/qr/verify/:qrData
 * Verify a QR code is valid
 */
router.get('/verify/:qrData', async (req: Request, res: Response) => {
  try {
    const { qrData } = req.params;

    const payload = checkInService.verifyQRCode(qrData);

    if (!payload) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired QR code',
        valid: false,
      });
      return;
    }

    res.json({
      success: true,
      valid: true,
      data: {
        salonId: payload.salonId,
        locationId: payload.locationId,
        generatedAt: new Date(payload.timestamp).toISOString(),
      },
    });
  } catch (error) {
    console.error('Error verifying QR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify QR code',
    });
  }
});

/**
 * GET /api/qr/queue/:salonId
 * Get current queue for a salon
 */
router.get('/queue/:salonId', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;

    const queue = await checkInService.getSalonQueue(salonId);

    res.json({
      success: true,
      data: {
        queueSize: queue.length,
        queue: queue.map((c) => ({
          checkInId: c.checkInId,
          customerName: c.customerName,
          checkInTime: c.timestamp,
          waitTimeMinutes: c.waitTimeMinutes,
        })),
      },
    });
  } catch (error) {
    console.error('Error getting queue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get queue',
    });
  }
});

/**
 * GET /api/qr/wait-time/:salonId
 * Get wait time estimate for a salon
 */
router.get('/wait-time/:salonId', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;

    const waitTime = await checkInService.estimateWaitTime(salonId);

    res.json({
      success: true,
      data: waitTime,
    });
  } catch (error) {
    console.error('Error estimating wait time:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to estimate wait time',
    });
  }
});

/**
 * PATCH /api/qr/check-in/:checkInId/complete
 * Complete a check-in
 */
router.patch('/check-in/:checkInId/complete', async (req: Request, res: Response) => {
  try {
    const { checkInId } = req.params;

    const checkIn = await checkInService.completeCheckIn(checkInId);

    if (!checkIn) {
      res.status(404).json({
        success: false,
        message: 'Check-in not found or already completed',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Check-in completed',
      data: checkIn,
    });
  } catch (error) {
    console.error('Error completing check-in:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete check-in',
    });
  }
});

/**
 * DELETE /api/qr/check-in/:checkInId
 * Cancel a check-in
 */
router.delete('/check-in/:checkInId', async (req: Request, res: Response) => {
  try {
    const { checkInId } = req.params;

    const checkIn = await checkInService.cancelCheckIn(checkInId);

    if (!checkIn) {
      res.status(404).json({
        success: false,
        message: 'Check-in not found or already cancelled',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Check-in cancelled',
      data: checkIn,
    });
  } catch (error) {
    console.error('Error cancelling check-in:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel check-in',
    });
  }
});

/**
 * GET /api/qr/history/:customerId
 * Get check-in history for a customer
 */
router.get('/history/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const { checkIns, total } = await checkInService.getCheckInHistory(customerId, limit, offset);

    res.json({
      success: true,
      data: {
        checkIns,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + checkIns.length < total,
        },
      },
    });
  } catch (error) {
    console.error('Error getting check-in history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get check-in history',
    });
  }
});

export default router;
