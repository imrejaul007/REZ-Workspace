/**
 * Prescription Routes - Healthcare Prescription Management
 * Route: /api/v1/merchant/prescriptions
 *
 * All routes require merchant authentication and ownership verification
 */

import { Router, Request, Response } from 'express';
import { merchantAuth } from '../middleware/auth';
import { prescriptionService } from '../services/prescriptionService';
import { errorResponse, errors } from '../utils/response';
import { createRateLimiter } from '@rez/shared';

const router = Router();

// Rate limiter for sensitive endpoints
const prescriptionLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});

// All routes require merchant authentication
router.use(merchantAuth);
router.use(prescriptionLimiter.middleware());

// Error handler - sanitizes error messages in production
function handleError(res: Response, error: unknown, action: string): void {
  const message = process.env.NODE_ENV === 'production'
    ? `Failed to ${action}`
    : error instanceof Error ? error.message : 'Unknown error';

  console.error(`[Prescription] ${action} error:`, error);
  res.status(500).json({ success: false, message });
}

/**
 * POST /prescriptions - Create a new prescription
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      doctorId,
      doctorName,
      storeId,
      medicines,
      diagnosis,
      validUntil,
      notes,
    } = req.body;

    // Validate required fields
    if (!patientId || !doctorId || !doctorName || !storeId || !medicines?.length || !diagnosis || !validUntil) {
      return errorResponse(res, errors.badRequest('Missing required fields'));
    }

    // Validate validUntil is a future date
    const expiryDate = new Date(validUntil);
    if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      return errorResponse(res, errors.badRequest('validUntil must be a future date'));
    }

    const input = {
      patientId,
      doctorId,
      doctorName,
      storeId,
      merchantId: (req as unknown).merchantId,
      medicines,
      diagnosis,
      validUntil: expiryDate,
      notes,
    };

    const prescription = await prescriptionService.createPrescription(input);

    res.status(201).json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    handleError(res, error, 'create prescription');
  }
});

/**
 * GET /prescriptions/:id - Get prescription by ID
 * Ownership verified via prescriptionService
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const prescription = await prescriptionService.getPrescription(req.params.id, merchantId);

    if (!prescription) {
      return errorResponse(res, errors.notFound('Prescription'));
    }

    res.json({ success: true, data: prescription });
  } catch (error) {
    handleError(res, error, 'fetch prescription');
  }
});

/**
 * GET /prescriptions/patient/:patientId - Get patient prescriptions
 */
router.get('/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const { status, limit, page } = req.query;

    let prescriptions = await prescriptionService.getPatientPrescriptions(req.params.patientId, merchantId);

    // Filter by status if provided
    if (status) {
      prescriptions = prescriptions.filter((p) => p.status === status);
    }

    // Pagination with limits
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit as string) || 20), 100);
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = prescriptions.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: prescriptions.length,
        pages: Math.ceil(prescriptions.length / limitNum),
      },
    });
  } catch (error) {
    handleError(res, error, 'fetch prescriptions');
  }
});

/**
 * GET /prescriptions/verify/:id - Verify prescription validity (public)
 */
router.get('/verify/:id', async (req: Request, res: Response) => {
  try {
    const result = await prescriptionService.verifyPrescription(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    handleError(res, error, 'verify prescription');
  }
});

/**
 * PATCH /prescriptions/:id - Update prescription
 * Ownership verified via prescriptionService
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const prescription = await prescriptionService.updatePrescription(req.params.id, merchantId, req.body);

    if (!prescription) {
      return errorResponse(res, errors.notFound('Prescription'));
    }

    res.json({ success: true, data: prescription });
  } catch (error) {
    handleError(res, error, 'update prescription');
  }
});

/**
 * DELETE /prescriptions/:id - Delete prescription
 * Ownership verified via prescriptionService
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    await prescriptionService.deletePrescription(req.params.id, merchantId);
    res.json({ success: true, message: 'Prescription deleted' });
  } catch (error) {
    handleError(res, error, 'delete prescription');
  }
});

export default router;
