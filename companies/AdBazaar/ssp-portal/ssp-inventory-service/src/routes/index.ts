import { Router, Request, Response } from 'express';
import { inventoryService } from '../services/inventory.service.js';
import {
  asyncHandler,
  validateRequest,
  validateQuery,
  validateParams,
} from '../middleware/error.middleware.js';
import {
  CreateInventorySlotSchema,
  UpdateInventorySlotSchema,
  BookSlotSchema,
  AvailableSlotsQuerySchema,
  BatchCreateSchema,
  ReleaseSlotSchema,
  IdParamsSchema,
  ScreenIdParamsSchema,
  ScreenDateParamsSchema,
} from '../validators/inventory.validator.js';
import { logger } from '../utils/logger.js';

const router = Router();

// POST / - Create a new inventory slot
router.post(
  '/',
  validateRequest(CreateInventorySlotSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const slot = await inventoryService.createSlot(req.body);
    res.status(201).json({
      success: true,
      data: slot,
      message: 'Inventory slot created successfully',
    });
  })
);

// GET / - List all slots with pagination
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query['limit'] as string) || 100, 1000);
    const offset = parseInt(req.query['offset'] as string) || 0;

    const result = await inventoryService.getAllSlots(limit, offset);
    res.json({
      success: true,
      data: result.slots,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.offset + result.slots.length < result.total,
      },
    });
  })
);

// GET /:id - Get slot by ID
router.get(
  '/:id',
  validateParams(IdParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const slot = await inventoryService.getSlotById(req.params['id'] as string);

    if (!slot) {
      res.status(404).json({
        success: false,
        error: { message: 'Inventory slot not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: slot,
    });
  })
);

// GET /screen/:screenId - Get slots by screen ID
router.get(
  '/screen/:screenId',
  validateParams(ScreenIdParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query['limit'] as string) || 100, 1000);
    const offset = parseInt(req.query['offset'] as string) || 0;

    const result = await inventoryService.getSlotsByScreen(
      req.params['screenId'] as string,
      limit,
      offset
    );

    res.json({
      success: true,
      data: result.slots,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + result.slots.length < result.total,
      },
    });
  })
);

// GET /screen/:screenId/date/:date - Get slots for screen on specific date
router.get(
  '/screen/:screenId/date/:date',
  validateParams(ScreenDateParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const slots = await inventoryService.getSlotsByScreenAndDate(
      req.params['screenId'] as string,
      req.params['date'] as string
    );

    // Calculate availability summary
    const summary = {
      total: slots.length,
      available: slots.filter((s) => s.status === 'available').length,
      booked: slots.filter((s) => s.status === 'booked').length,
      reserved: slots.filter((s) => s.status === 'reserved').length,
      blocked: slots.filter((s) => s.status === 'blocked').length,
    };

    res.json({
      success: true,
      data: slots,
      summary,
    });
  })
);

// GET /available - Search available slots
router.get(
  '/available',
  validateQuery(AvailableSlotsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await inventoryService.getAvailableSlots(req.query as Parameters<typeof inventoryService.getAvailableSlots>[0]);

    res.json({
      success: true,
      data: result.slots,
      pagination: {
        total: result.total,
        limit: (req.query as { limit?: number })['limit'] || 100,
        offset: (req.query as { offset?: number })['offset'] || 0,
        hasMore:
          ((req.query as { offset?: number })['offset'] || 0) +
            result.slots.length <
          result.total,
      },
    });
  })
);

// GET /stats - Get inventory statistics
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const screenId = req.query['screenId'] as string | undefined;
    const stats = await inventoryService.getStats(screenId);

    res.json({
      success: true,
      data: stats,
    });
  })
);

// PATCH /:id - Update slot
router.patch(
  '/:id',
  validateParams(IdParamsSchema),
  validateRequest(UpdateInventorySlotSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const slot = await inventoryService.updateSlot(
      req.params['id'] as string,
      req.body
    );

    if (!slot) {
      res.status(404).json({
        success: false,
        error: { message: 'Inventory slot not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: slot,
      message: 'Inventory slot updated successfully',
    });
  })
);

// PATCH /:id/book - Book slot
router.patch(
  '/:id/book',
  validateParams(IdParamsSchema),
  validateRequest(BookSlotSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { bookingId, advertiserId } = req.body;

    const slot = await inventoryService.bookSlot(
      req.params['id'] as string,
      bookingId,
      advertiserId
    );

    if (!slot) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Slot is not available for booking. It may already be booked, reserved, or blocked.',
        },
      });
      return;
    }

    logger.info(`Slot ${slot.slotId} booked by advertiser ${advertiserId}`);

    res.json({
      success: true,
      data: slot,
      message: 'Slot booked successfully',
    });
  })
);

// PATCH /:id/release - Release slot
router.patch(
  '/:id/release',
  validateParams(IdParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const slot = await inventoryService.releaseSlot(req.params['id'] as string);

    if (!slot) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Slot cannot be released. It may not be booked or reserved.',
        },
      });
      return;
    }

    logger.info(`Slot ${slot.slotId} released`);

    res.json({
      success: true,
      data: slot,
      message: 'Slot released successfully',
    });
  })
);

// PATCH /:id/reserve - Reserve slot (temporary hold)
router.patch(
  '/:id/reserve',
  validateParams(IdParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const advertiserId = req.body['advertiserId'] as string;

    if (!advertiserId) {
      res.status(400).json({
        success: false,
        error: { message: 'advertiserId is required' },
      });
      return;
    }

    const slot = await inventoryService.reserveSlot(
      req.params['id'] as string,
      advertiserId
    );

    if (!slot) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Slot cannot be reserved. It may not be available.',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: slot,
      message: 'Slot reserved successfully',
    });
  })
);

// PATCH /:id/block - Block slot (administrative)
router.patch(
  '/:id/block',
  validateParams(IdParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const reason = req.body['reason'] as string | undefined;

    const slot = await inventoryService.blockSlot(
      req.params['id'] as string,
      reason
    );

    if (!slot) {
      res.status(404).json({
        success: false,
        error: { message: 'Inventory slot not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: slot,
      message: 'Slot blocked successfully',
    });
  })
);

// DELETE /:id - Delete slot
router.delete(
  '/:id',
  validateParams(IdParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const deleted = await inventoryService.deleteSlot(req.params['id'] as string);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: { message: 'Inventory slot not found' },
      });
      return;
    }

    res.json({
      success: true,
      message: 'Inventory slot deleted successfully',
    });
  })
);

// POST /batch - Batch create slots
router.post(
  '/batch',
  validateRequest(BatchCreateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { slots } = req.body;

    const result = await inventoryService.batchCreate(slots);

    res.status(result.failed.length > 0 ? 207 : 201).json({
      success: result.failed.length === 0,
      data: {
        created: result.created,
        failed: result.failed,
        summary: {
          total: slots.length,
          successful: result.created.length,
          failed: result.failed.length,
        },
      },
      message:
        result.failed.length === 0
          ? 'All slots created successfully'
          : `Created ${result.created.length}/${slots.length} slots. ${result.failed.length} failed.`,
    });
  })
);

export default router;