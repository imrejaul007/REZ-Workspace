import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { folioService } from '../services/FolioService';
import { FolioStatus } from '../models/Folio';
import { logger } from '../config/logger';

const router = Router();

/**
 * Validation schemas
 */
const CreateFolioSchema = z.object({
  guestId: z.string().min(1),
  guestName: z.string().min(1),
  propertyId: z.string().min(1),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  roomNumber: z.string().optional(),
  reservationId: z.string().optional(),
  checkInDate: z.string().datetime().optional(),
  checkOutDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const AddChargeSchema = z.object({
  folioId: z.string().min(1),
  transactionId: z.string().min(1),
  amount: z.number().positive(),
  taxAmount: z.number().min(0).optional(),
});

const ApplyDiscountSchema = z.object({
  folioId: z.string().min(1),
  discountAmount: z.number().positive(),
  reason: z.string().optional(),
});

const CloseFolioSchema = z.object({
  folioId: z.string().min(1),
  closedBy: z.string().min(1),
  paymentMethod: z.string().min(1),
});

const EnableSplitSchema = z.object({
  folioId: z.string().min(1),
  members: z.array(
    z.object({
      guestId: z.string().min(1),
      guestName: z.string().min(1),
      sharePercentage: z.number().min(0).max(100),
      shareAmount: z.number().optional(),
      settled: z.boolean().optional(),
    })
  ),
});

/**
 * Create a new folio
 * POST /api/folio
 */
router.post('/', async (req: Request, res: Response) => {
  const data = CreateFolioSchema.parse(req.body);
  const folio = await folioService.createFolio({
    ...data,
    checkInDate: data.checkInDate ? new Date(data.checkInDate) : undefined,
    checkOutDate: data.checkOutDate ? new Date(data.checkOutDate) : undefined,
  });

  logger.info('Folio created via API', { folioId: folio.folioId, guestId: data.guestId });

  res.status(201).json({
    success: true,
    data: folio,
  });
});

/**
 * Get folio by ID
 * GET /api/folio/:folioId
 */
router.get('/:folioId', async (req: Request, res: Response) => {
  const { folioId } = req.params;
  const folio = await folioService.getFolioById(folioId);

  if (!folio) {
    res.status(404).json({
      success: false,
      message: 'Folio not found',
    });
    return;
  }

  res.json({
    success: true,
    data: folio,
  });
});

/**
 * Get folio summary with transactions
 * GET /api/folio/:folioId/summary
 */
router.get('/:folioId/summary', async (req: Request, res: Response) => {
  const { folioId } = req.params;
  const summary = await folioService.getFolioSummary(folioId);

  if (!summary) {
    res.status(404).json({
      success: false,
      message: 'Folio not found',
    });
    return;
  }

  res.json({
    success: true,
    data: summary,
  });
});

/**
 * Get folios by guest ID
 * GET /api/folio/guest/:guestId
 */
router.get('/guest/:guestId', async (req: Request, res: Response) => {
  const { guestId } = req.params;
  const { status } = req.query;

  const folios = await folioService.getFolioByGuestId(
    guestId,
    status as FolioStatus | undefined
  );

  res.json({
    success: true,
    data: folios,
    count: folios.length,
  });
});

/**
 * Get folios by property
 * GET /api/folio/property/:propertyId
 */
router.get('/property/:propertyId', async (req: Request, res: Response) => {
  const { propertyId } = req.params;
  const { status } = req.query;

  const folios = await folioService.getFolioByProperty(
    propertyId,
    status as FolioStatus | undefined
  );

  res.json({
    success: true,
    data: folios,
    count: folios.length,
  });
});

/**
 * Add charge to folio
 * POST /api/folio/charge
 */
router.post('/charge', async (req: Request, res: Response) => {
  const data = AddChargeSchema.parse(req.body);
  const folio = await folioService.addChargeToFolio(
    data.folioId,
    data.transactionId,
    data.amount,
    data.taxAmount
  );

  res.json({
    success: true,
    data: folio,
  });
});

/**
 * Apply discount to folio
 * POST /api/folio/discount
 */
router.post('/discount', async (req: Request, res: Response) => {
  const data = ApplyDiscountSchema.parse(req.body);
  const folio = await folioService.applyDiscount(data.folioId, data.discountAmount, data.reason);

  res.json({
    success: true,
    data: folio,
  });
});

/**
 * Close folio
 * POST /api/folio/close
 */
router.post('/close', async (req: Request, res: Response) => {
  const data = CloseFolioSchema.parse(req.body);
  const folio = await folioService.closeFolio(data.folioId, data.closedBy, data.paymentMethod);

  res.json({
    success: true,
    data: folio,
  });
});

/**
 * Post folio to PMS
 * POST /api/folio/:folioId/post-to-pms
 */
router.post('/:folioId/post-to-pms', async (req: Request, res: Response) => {
  const { folioId } = req.params;
  const result = await folioService.postToPms(folioId);

  res.json({
    success: result.success,
    data: result,
    error: result.error,
  });
});

/**
 * Enable split bill
 * POST /api/folio/split/enable
 */
router.post('/split/enable', async (req: Request, res: Response) => {
  const data = EnableSplitSchema.parse(req.body);
  const result = await folioService.enableSplitBill(data.folioId, data.members as unknown);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Settle split member
 * POST /api/folio/split/settle
 */
router.post('/split/settle', async (req: Request, res: Response) => {
  const schema = z.object({
    folioId: z.string().min(1),
    guestId: z.string().min(1),
    settledAmount: z.number().positive(),
  });

  const data = schema.parse(req.body);
  const folio = await folioService.settleSplitMember(data.folioId, data.guestId, data.settledAmount);

  res.json({
    success: true,
    data: folio,
  });
});

/**
 * Get folio by PMS ID
 * GET /api/folio/pms/:pmsFolioId
 */
router.get('/pms/:pmsFolioId', async (req: Request, res: Response) => {
  const { pmsFolioId } = req.params;
  const folio = await folioService.getFolioByPmsId(pmsFolioId);

  if (!folio) {
    res.status(404).json({
      success: false,
      message: 'Folio not found',
    });
    return;
  }

  res.json({
    success: true,
    data: folio,
  });
});

export default router;
