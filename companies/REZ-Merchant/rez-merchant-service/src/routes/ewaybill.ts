/**
 * E-waybill Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import {
  generateEwaybill,
  cancelEwaybill,
  updateVehicle,
  extendValidity,
  getEwaybill,
  listEwaybills,
  generateFromPurchaseOrder,
} from '../services/ewaybillService';
import { merchantAuth } from '../middleware/auth';
import { errorResponse, errors } from '../utils/response';

const router = Router();
router.use(merchantAuth);

// ── Validation ─────────────────────────────────────────────────────────────────

const objectIdSchema = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: 'Invalid ObjectId' }
);

const ewaybillRequestSchema = z.object({
  purchaseOrderId: objectIdSchema,
  ewaybillType: z.enum(['outward', 'inward']),
  documentType: z.enum(['inv', 'crn', 'dn']).default('inv'),
  documentNumber: z.string().min(1),
  documentDate: z.string(),
  fromName: z.string().min(1),
  fromAddress: z.string(),
  fromPlace: z.string(),
  fromState: z.string().min(2),
  fromPincode: z.string().length(6),
  fromGstin: z.string().optional(),
  toName: z.string().min(1),
  toAddress: z.string(),
  toPlace: z.string(),
  toState: z.string().min(2),
  toPincode: z.string().length(6),
  toGstin: z.string().optional(),
  items: z.array(z.object({
    productName: z.string(),
    description: z.string().optional(),
    hsnCode: z.string(),
    quantity: z.number().positive(),
    unit: z.string(),
    taxableValue: z.number().nonnegative(),
    cgstRate: z.number().optional(),
    sgstRate: z.number().optional(),
    igstRate: z.number().optional(),
    cessRate: z.number().optional(),
  })),
  transporterMode: z.enum(['road', 'rail', 'air', 'ship']),
  vehicleNumber: z.string().optional(),
  transporterId: z.string().optional(),
  transporterName: z.string().optional(),
  distance: z.number().positive(),
});

// ── Routes ─────────────────────────────────────────────────────────────────────

/**
 * POST /ewaybill
 * Generate e-waybill
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const bodyResult = ewaybillRequestSchema.safeParse(req.body);
    if (!bodyResult.success) {
      errorResponse(res, errors.badRequest(bodyResult.error.errors[0].message));
      return;
    }

    const result = await generateEwaybill(req.merchantId, bodyResult.data);

    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }

    res.status(201).json({
      success: true,
      data: result,
      message: 'E-waybill generated successfully',
    });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to generate e-waybill'));
  }
});

/**
 * POST /ewaybill/from-po
 * Generate e-waybill from Purchase Order
 */
router.post('/from-po', async (req: Request, res: Response) => {
  try {
    const { purchaseOrderId, transporterMode, vehicleNumber, transporterId, transporterName, distance } = req.body;

    if (!purchaseOrderId || !transporterMode || !distance) {
      errorResponse(res, errors.badRequest('Missing required fields'));
      return;
    }

    const result = await generateFromPurchaseOrder(req.merchantId, purchaseOrderId, {
      transporterMode,
      vehicleNumber,
      transporterId,
      transporterName,
      distance,
    });

    if (!result.success) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }

    res.status(201).json({
      success: true,
      data: result,
      message: 'E-waybill generated from PO',
    });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to generate e-waybill from PO'));
  }
});

/**
 * GET /ewaybill
 * List e-waybills
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, fromDate, toDate, type } = req.query;

    const filters: unknown = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (fromDate) filters.fromDate = new Date(fromDate as string);
    if (toDate) filters.toDate = new Date(toDate as string);

    const ewaybills = await listEwaybills(req.merchantId, filters);

    res.json({ success: true, data: ewaybills });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to list e-waybills'));
  }
});

/**
 * GET /ewaybill/:number
 * Get single e-waybill
 */
router.get('/:number', async (req: Request, res: Response) => {
  try {
    const ewaybill = await getEwaybill(req.merchantId, req.params.number);

    if (!ewaybill) {
      errorResponse(res, errors.notFound('E-waybill'));
      return;
    }

    res.json({ success: true, data: ewaybill });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to get e-waybill'));
  }
});

/**
 * POST /ewaybill/:number/cancel
 * Cancel e-waybill
 */
router.post('/:number/cancel', async (req: Request, res: Response) => {
  try {
    const { reason, reasonCode } = req.body;

    if (!reason || !reasonCode) {
      errorResponse(res, errors.badRequest('Reason and reasonCode required'));
      return;
    }

    const result = await cancelEwaybill(req.merchantId, req.params.number, reason, reasonCode);

    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.json({ success: true, message: result.message });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to cancel e-waybill'));
  }
});

/**
 * POST /ewaybill/:number/vehicle
 * Update vehicle details
 */
router.post('/:number/vehicle', async (req: Request, res: Response) => {
  try {
    const { vehicleNumber, fromPlace, fromState, remainingDistance } = req.body;

    const result = await updateVehicle(
      req.merchantId,
      req.params.number,
      vehicleNumber,
      fromPlace,
      fromState,
      remainingDistance
    );

    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.json({ success: true, message: result.message });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to update vehicle'));
  }
});

/**
 * POST /ewaybill/:number/extend
 * Extend e-waybill validity
 */
router.post('/:number/extend', async (req: Request, res: Response) => {
  try {
    const { remainingDistance, vehicleBreakdown } = req.body;

    const result = await extendValidity(
      req.merchantId,
      req.params.number,
      remainingDistance,
      vehicleBreakdown || false
    );

    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.json({ success: true, ...result });
  } catch (err) {
    errorResponse(res, errors.internal('Failed to extend validity'));
  }
});

export default router;
