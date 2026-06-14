import { Router, Request, Response, NextFunction } from 'express';
import { swapService } from '../services';
import {
  createSwapRequestSchema,
  approveSwapSchema,
} from '../types/schemas';
import { ZodError } from 'zod';
import { SwapStatus } from '../types';

const router = Router();

/**
 * POST /api/shifts/swap
 * Create a swap request
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createSwapRequestSchema.parse(req.body);
    const swapRequest = await swapService.createSwapRequest(validated);

    res.status(201).json({
      success: true,
      data: swapRequest,
      message: 'Swap request created successfully',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }
    if (error instanceof Error) {
      if (error.message === 'Shift not found') {
        res.status(404).json({
          success: false,
          error: 'Shift not found',
        });
        return;
      }
      if (error.message === 'Requester is not assigned to this shift') {
        res.status(400).json({
          success: false,
          error: 'Requester is not assigned to this shift',
        });
        return;
      }
      if (error.message.includes('pending swap request')) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }
    }
    next(error);
  }
});

/**
 * GET /api/shifts/swap
 * Get all swap requests (with optional filters)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, startDate, endDate, requesterId, targetId } = req.query;

    let swaps;

    if (startDate && endDate) {
      swaps = await swapService.getSwapRequestsByDateRange(
        startDate as string,
        endDate as string,
        status as SwapStatus | undefined
      );
    } else if (requesterId) {
      swaps = await swapService.getSwapRequestsByRequester(
        requesterId as string,
        status as SwapStatus | undefined
      );
    } else {
      // Get all pending swaps for a target (if targetId provided)
      if (targetId && status === SwapStatus.PENDING) {
        swaps = await swapService.getPendingSwapRequestsForTarget(targetId as string);
      } else {
        // Return empty if no filters provided
        res.json({
          success: true,
          data: [],
          message: 'Provide requesterId, targetId, or date range for filtering',
        });
        return;
      }
    }

    res.json({
      success: true,
      data: swaps,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/shifts/swap/approve
 * Approve or reject a swap request
 */
router.post('/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = approveSwapSchema.parse(req.body);
    const swapRequest = await swapService.processSwapRequest(
      validated.swapId,
      validated.action,
      validated.approvedBy
    );

    if (!swapRequest) {
      res.status(404).json({
        success: false,
        error: 'Swap request not found',
      });
      return;
    }

    res.json({
      success: true,
      data: swapRequest,
      message: `Swap request ${validated.action}d successfully`,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }
    if (error instanceof Error && error.message === 'Swap request is not pending') {
      res.status(400).json({
        success: false,
        error: 'Swap request is not pending',
      });
      return;
    }
    next(error);
  }
});

/**
 * GET /api/shifts/swap/:id
 * Get swap request by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const swapRequest = await swapService.getSwapRequestById(req.params.id);

    if (!swapRequest) {
      res.status(404).json({
        success: false,
        error: 'Swap request not found',
      });
      return;
    }

    res.json({
      success: true,
      data: swapRequest,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/shifts/swap/:id/cancel
 * Cancel a swap request
 */
router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
      return;
    }

    const swapRequest = await swapService.cancelSwapRequest(req.params.id, userId);

    if (!swapRequest) {
      res.status(404).json({
        success: false,
        error: 'Swap request not found',
      });
      return;
    }

    res.json({
      success: true,
      data: swapRequest,
      message: 'Swap request cancelled successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Only the requester')) {
        res.status(403).json({
          success: false,
          error: error.message,
        });
        return;
      }
      if (error.message.includes('pending')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }
    }
    next(error);
  }
});

/**
 * GET /api/shifts/swap/pending/:targetId
 * Get pending swap requests for a target employee
 */
router.get('/pending/:targetId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const swaps = await swapService.getPendingSwapRequestsForTarget(req.params.targetId);

    res.json({
      success: true,
      data: swaps,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
