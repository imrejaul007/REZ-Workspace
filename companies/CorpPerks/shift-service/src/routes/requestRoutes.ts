import { Router, Request, Response, NextFunction } from 'express';
import { shiftRequestService } from '../services';
import {
  createShiftRequestSchema,
  reviewShiftRequestSchema,
} from '../types/schemas';
import { ZodError } from 'zod';
import { ShiftRequestStatus } from '../types';

const router = Router();

/**
 * POST /api/shifts/requests
 * Create a new shift request
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createShiftRequestSchema.parse(req.body);
    const request = await shiftRequestService.createRequest(validated);

    res.status(201).json({
      success: true,
      data: request,
      message: 'Shift request created successfully',
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
    next(error);
  }
});

/**
 * GET /api/shifts/requests/:employeeId
 * Get requests for an employee
 */
router.get('/:employeeId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const requests = await shiftRequestService.getRequestsByEmployee(
      req.params.employeeId,
      status as ShiftRequestStatus | undefined
    );

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/shifts/requests/stats/:employeeId
 * Get request statistics for an employee
 */
router.get('/stats/:employeeId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await shiftRequestService.getRequestStats(req.params.employeeId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/shifts/requests/pending
 * Get all pending requests (for managers)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const { requests, total } = await shiftRequestService.getPendingRequests(page, limit);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/shifts/requests/id/:id
 * Get request by ID
 */
router.get('/id/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await shiftRequestService.getRequestById(req.params.id);

    if (!request) {
      res.status(404).json({
        success: false,
        error: 'Request not found',
      });
      return;
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/shifts/requests/review
 * Review a shift request (approve/reject)
 */
router.post('/review', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = reviewShiftRequestSchema.parse(req.body);
    const request = await shiftRequestService.reviewRequest(
      validated.requestId,
      validated.action,
      validated.reviewedBy
    );

    if (!request) {
      res.status(404).json({
        success: false,
        error: 'Request not found',
      });
      return;
    }

    res.json({
      success: true,
      data: request,
      message: `Request ${validated.action}d successfully`,
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
    if (error instanceof Error && error.message === 'Request is not pending') {
      res.status(400).json({
        success: false,
        error: 'Request is not pending',
      });
      return;
    }
    next(error);
  }
});

/**
 * POST /api/shifts/requests/:id/cancel
 * Cancel a shift request
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

    const request = await shiftRequestService.cancelRequest(req.params.id, userId);

    if (!request) {
      res.status(404).json({
        success: false,
        error: 'Request not found',
      });
      return;
    }

    res.json({
      success: true,
      data: request,
      message: 'Request cancelled successfully',
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
 * GET /api/shifts/requests/range
 * Get requests by date range
 */
router.get('/range/:startDate/:endDate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const requests = await shiftRequestService.getRequestsByDateRange(
      req.params.startDate,
      req.params.endDate,
      status as ShiftRequestStatus | undefined
    );

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
